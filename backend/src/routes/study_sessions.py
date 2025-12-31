"""
Study session routes
Handles session tracking, analytics, and leaderboards
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime, date, timedelta

from ..database.database import get_db
from ..database.models import Users
from ..dependencies import get_current_user
from ..schemas.study_sessions import (
    StudySessionEnd, StudySessionUpdate, StudySessionResponse,
    StudySessionWithGroupInfo, DailyStudyStats, WeeklyStudyStats,
    MonthlyStudyStats, StudyAnalytics, GroupStudyStats,
    GroupLeaderboard, LeaderboardEntry
)
from ..services import study_session_service
from ..services.group_service import get_group_by_id, is_user_in_group

router = APIRouter(prefix="/study-sessions", tags=["study-sessions"])

# ============================================================================
# SESSION CRUD ENDPOINTS
# ============================================================================

@router.post("", response_model=StudySessionResponse, status_code=201)
async def create_study_session(
    session_data: StudySessionEnd,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create/log a completed study session
    
    Called when user stops the timer.
    
    **Effects**:
    - Creates session record
    - Updates user's total_study_time
    - Updates daily streak
    
    **Parameters**:
    - **duration_seconds**: Total time studied (required)
    - **group_id**: Optional group context
    - **session_notes**: Optional notes about what was studied
    """
    
    # Validate group if provided
    if session_data.group_id:
        group = await get_group_by_id(db, session_data.group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        # Check if user is a member
        if not await is_user_in_group(db, current_user.user_id, session_data.group_id):
            raise HTTPException(
                status_code=403,
                detail="You must be a member of this group to log sessions to it"
            )
    
    # Calculate timestamps
    ended_at = datetime.utcnow()
    started_at = ended_at - timedelta(seconds=session_data.duration_seconds)
    
    # Create session
    new_session = await study_session_service.create_study_session(
        session=db,
        user_id=current_user.user_id,
        duration_seconds=session_data.duration_seconds,
        started_at=started_at,
        ended_at=ended_at,
        group_id=session_data.group_id,
        session_notes=session_data.session_notes
    )
    
    await db.commit()
    
    # Return with computed fields
    return StudySessionResponse(
        **new_session.__dict__,
        duration_minutes=new_session.duration_seconds // 60,
        duration_hours=round(new_session.duration_seconds / 3600, 2)
    )

@router.get("", response_model=List[StudySessionWithGroupInfo])
async def get_study_sessions(
    group_id: Optional[int] = Query(None, description="Filter by group"),
    start_date: Optional[datetime] = Query(None, description="Filter from this date"),
    end_date: Optional[datetime] = Query(None, description="Filter until this date"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user's study sessions with optional filtering
    
    **Filters**:
    - **group_id**: Show only sessions from specific group
    - **start_date**: Show sessions after this date
    - **end_date**: Show sessions before this date
    
    **Pagination**: Use skip/limit for large result sets
    """
    
    sessions, total = await study_session_service.get_user_sessions(
        session=db,
        user_id=current_user.user_id,
        skip=skip,
        limit=limit,
        group_id=group_id,
        start_date=start_date,
        end_date=end_date
    )
    
    # Enrich with group names
    result = []
    for study_session in sessions:
        group_name = None
        if study_session.group_id:
            group = await get_group_by_id(db, study_session.group_id)
            group_name = group.group_name if group else None
        
        result.append(StudySessionWithGroupInfo(
            **study_session.__dict__,
            duration_minutes=study_session.duration_seconds // 60,
            duration_hours=round(study_session.duration_seconds / 3600, 2),
            group_name=group_name
        ))
    
    return result

@router.get("/{session_id}", response_model=StudySessionWithGroupInfo)
async def get_study_session(
    session_id: int,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific study session by ID
    
    Only returns sessions belonging to the current user.
    """
    
    study_session = await study_session_service.get_session_by_id(
        session=db,
        session_id=session_id,
        user_id=current_user.user_id
    )
    
    if not study_session:
        raise HTTPException(status_code=404, detail="Study session not found")
    
    # Get group name if applicable
    group_name = None
    if study_session.group_id:
        group = await get_group_by_id(db, study_session.group_id)
        group_name = group.group_name if group else None
    
    return StudySessionWithGroupInfo(
        **study_session.__dict__,
        duration_minutes=study_session.duration_seconds // 60,
        duration_hours=round(study_session.duration_seconds / 3600, 2),
        group_name=group_name
    )

@router.patch("/{session_id}", response_model=StudySessionResponse)
async def update_study_session(
    session_id: int,
    update_data: StudySessionUpdate,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a study session's notes
    
    Currently only supports updating session_notes.
    Cannot modify duration or timestamps after creation.
    """
    
    if update_data.session_notes is None:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    updated_session = await study_session_service.update_session_notes(
        session=db,
        session_id=session_id,
        user_id=current_user.user_id,
        notes=update_data.session_notes
    )
    
    if not updated_session:
        raise HTTPException(status_code=404, detail="Study session not found")
    
    await db.commit()
    
    return StudySessionResponse(
        **updated_session.__dict__,
        duration_minutes=updated_session.duration_seconds // 60,
        duration_hours=round(updated_session.duration_seconds / 3600, 2)
    )

@router.delete("/{session_id}", status_code=204)
async def delete_study_session(
    session_id: int,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a study session
    
    **Warning**: This will:
    - Remove the session record
    - Decrease user's total_study_time
    - Cannot be undone
    """
    
    success = await study_session_service.delete_session(
        session=db,
        session_id=session_id,
        user_id=current_user.user_id
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Study session not found")
    
    await db.commit()

# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================

@router.get("/analytics/daily", response_model=DailyStudyStats)
async def get_daily_analytics(
    target_date: Optional[date] = Query(None, description="Date to get stats for (default: today)"),
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get study statistics for a specific day
    
    **Default**: Today's stats if no date provided
    """
    
    if target_date is None:
        target_date = date.today()
    
    stats = await study_session_service.get_daily_stats(
        session=db,
        user_id=current_user.user_id,
        target_date=target_date
    )
    
    return DailyStudyStats(**stats)

@router.get("/analytics/weekly", response_model=WeeklyStudyStats)
async def get_weekly_analytics(
    week_start: Optional[date] = Query(None, description="Start of week (default: this week's Monday)"),
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get study statistics for a week
    
    **Default**: Current week (Monday to Sunday) if no date provided
    
    **Includes**: Daily breakdown for all 7 days
    """
    
    if week_start is None:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
    
    stats = await study_session_service.get_weekly_stats(
        session=db,
        user_id=current_user.user_id,
        start_date=week_start
    )
    
    return WeeklyStudyStats(
        **stats,
        daily_breakdown=[DailyStudyStats(**day) for day in stats['daily_breakdown']]
    )

@router.get("/analytics/monthly", response_model=MonthlyStudyStats)
async def get_monthly_analytics(
    year: Optional[int] = Query(None, ge=2020, le=2100),
    month: Optional[int] = Query(None, ge=1, le=12),
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get study statistics for a month
    
    **Default**: Current month if year/month not provided
    
    **Includes**: Daily breakdown for entire month
    """
    
    if year is None or month is None:
        today = date.today()
        year = today.year
        month = today.month
    
    stats = await study_session_service.get_monthly_stats(
        session=db,
        user_id=current_user.user_id,
        year=year,
        month=month
    )
    
    return MonthlyStudyStats(
        **stats,
        daily_breakdown=[DailyStudyStats(**day) for day in stats['daily_breakdown']]
    )

@router.get("/analytics/comprehensive", response_model=StudyAnalytics)
async def get_comprehensive_analytics(
    group_id: Optional[int] = Query(None, description="Filter by specific group"),
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive study analytics
    
    **Includes**:
    - Total study time and session count
    - Average, longest, shortest session durations
    - Most productive hour of day
    - Current streak
    - Recent activity (this week/month)
    
    **Optional**: Filter by group_id to see analytics for specific group
    """
    
    analytics = await study_session_service.get_comprehensive_analytics(
        session=db,
        user_id=current_user.user_id,
        group_id=group_id
    )
    
    return StudyAnalytics(**analytics)

@router.get("/analytics/by-group", response_model=List[GroupStudyStats])
async def get_group_breakdown_analytics(
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get study time breakdown by group
    
    Shows how much time you've spent studying in each group,
    including personal study (no group).
    
    **Useful for**:
    - Seeing which groups you study with most
    - Tracking time distribution across different subjects/groups
    """
    
    stats = await study_session_service.get_group_study_stats(
        session=db,
        user_id=current_user.user_id
    )
    
    return [GroupStudyStats(**s) for s in stats]

# ============================================================================
# LEADERBOARD ENDPOINTS
# ============================================================================

@router.get("/leaderboards/group/{group_id}", response_model=GroupLeaderboard)
async def get_group_leaderboard(
    group_id: int,
    period: str = Query("all_time", regex="^(all_time|monthly|weekly)$"),
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get leaderboard for a specific group
    
    **Period options**:
    - **all_time**: All-time rankings
    - **monthly**: Current month only
    - **weekly**: Current week only
    
    **Note**: Only members of the group can view its leaderboard
    """
    
    # Check if user is a member
    if not await is_user_in_group(db, current_user.user_id, group_id):
        raise HTTPException(
            status_code=403,
            detail="You must be a member of this group to view its leaderboard"
        )
    
    leaderboard = await study_session_service.get_group_leaderboard(
        session=db,
        group_id=group_id,
        period=period,
        current_user_id=current_user.user_id
    )
    
    return GroupLeaderboard(
        **leaderboard,
        entries=[LeaderboardEntry(**e) for e in leaderboard['entries']]
    )

@router.get("/leaderboards/global", response_model=GroupLeaderboard)
async def get_global_leaderboard(
    period: str = Query("all_time", regex="^(all_time|monthly|weekly)$"),
    limit: int = Query(50, ge=1, le=100, description="Number of top users to show"),
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get global leaderboard (all users)
    
    **Period options**:
    - **all_time**: All-time rankings
    - **monthly**: Current month only
    - **weekly**: Current week only
    
    **Limit**: How many top users to display (max 100)
    """
    
    leaderboard = await study_session_service.get_global_leaderboard(
        session=db,
        period=period,
        current_user_id=current_user.user_id,
        limit=limit
    )
    
    return GroupLeaderboard(
        **leaderboard,
        entries=[LeaderboardEntry(**e) for e in leaderboard['entries']]
    )

# ============================================================================
# SUMMARY ENDPOINTS
# ============================================================================

@router.get("/summary/today", response_model=dict)
async def get_today_summary(
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Quick summary of today's study activity
    
    **Returns**:
    - Total time studied today
    - Number of sessions today
    - Quick comparison to yesterday
    """
    
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    today_stats = await study_session_service.get_daily_stats(db, current_user.user_id, today)
    yesterday_stats = await study_session_service.get_daily_stats(db, current_user.user_id, yesterday)
    
    # Calculate change
    change_minutes = today_stats['total_minutes'] - yesterday_stats['total_minutes']
    change_percentage = 0
    if yesterday_stats['total_minutes'] > 0:
        change_percentage = round((change_minutes / yesterday_stats['total_minutes']) * 100, 1)
    
    return {
        "today": DailyStudyStats(**today_stats),
        "yesterday": DailyStudyStats(**yesterday_stats),
        "change_minutes": change_minutes,
        "change_percentage": change_percentage,
        "trend": "up" if change_minutes > 0 else "down" if change_minutes < 0 else "stable"
    }

@router.get("/summary/week", response_model=dict)
async def get_week_summary(
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Quick summary of this week's study activity
    
    **Returns**:
    - Total time studied this week
    - Number of sessions
    - Days studied this week
    - Average per day
    """
    
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    
    week_stats = await study_session_service.get_weekly_stats(db, current_user.user_id, week_start)
    
    # Calculate days studied (days with > 0 sessions)
    days_studied = sum(1 for day in week_stats['daily_breakdown'] if day['session_count'] > 0)
    avg_per_day = week_stats['total_minutes'] // 7 if week_stats['total_minutes'] > 0 else 0
    
    return {
        "week": WeeklyStudyStats(
            **week_stats,
            daily_breakdown=[DailyStudyStats(**day) for day in week_stats['daily_breakdown']]
        ),
        "days_studied": days_studied,
        "average_minutes_per_day": avg_per_day,
        "consistency_percentage": round((days_studied / 7) * 100, 1)
    }