"""Handles all study session-related database operations and analytics"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc, extract
from sqlalchemy.orm import selectinload
from ..database.models import StudySessions, Users, Groups, Streaks
from typing import Optional, List, Tuple
from datetime import datetime, timedelta, date
from collections import defaultdict

# ============================================================================
# STUDY SESSION CRUD OPERATIONS
# ============================================================================

async def create_study_session(
    session: AsyncSession,
    user_id: str,
    duration_seconds: int,
    started_at: datetime,
    ended_at: datetime,
    group_id: Optional[int] = None,
    session_notes: Optional[str] = None
) -> StudySessions:
    """
    Create a new study session
    
    Also updates:
    - User's total_study_time
    - User's streak (if applicable)
    """
    
    # Create session
    new_session = StudySessions(
        user_id=user_id,
        group_id=group_id,
        duration_seconds=duration_seconds,
        session_date=started_at.date(),
        session_notes=session_notes,
        started_at=started_at,
        ended_at=ended_at
    )
    
    session.add(new_session)
    await session.flush()
    
    # Update user's total study time
    user_result = await session.execute(
        select(Users).where(Users.user_id == user_id)
    )
    user = user_result.scalars().first()
    
    if user:
        user.total_study_time += duration_seconds
        await session.flush()
    
    # Update streak (import from streak_service to avoid circular dependency)
    from .streak_service import update_streak_after_session
    await update_streak_after_session(session, user_id, started_at.date())
    
    return new_session

async def get_session_by_id(
    session: AsyncSession,
    session_id: int,
    user_id: str
) -> Optional[StudySessions]:
    """Get a specific study session by ID"""
    
    result = await session.execute(
        select(StudySessions).where(
            and_(
                StudySessions.id == session_id,
                StudySessions.user_id == user_id
            )
        )
    )
    return result.scalars().first()

async def get_user_sessions(
    session: AsyncSession,
    user_id: str,
    skip: int = 0,
    limit: int = 50,
    group_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Tuple[List[StudySessions], int]:
    """Get user's study sessions with filtering"""
    
    query = select(StudySessions).where(StudySessions.user_id == user_id)
    
    # Apply filters
    if group_id is not None:
        query = query.where(StudySessions.group_id == group_id)
    
    if start_date:
        query = query.where(StudySessions.session_date >= start_date.date())
    
    if end_date:
        query = query.where(StudySessions.session_date <= end_date.date())
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await session.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination and ordering
    query = query.order_by(desc(StudySessions.started_at)).offset(skip).limit(limit)
    
    result = await session.execute(query)
    sessions = result.scalars().all()
    
    return list(sessions), total

async def update_session_notes(
    session: AsyncSession,
    session_id: int,
    user_id: str,
    notes: str
) -> Optional[StudySessions]:
    """Update notes for a study session"""
    
    study_session = await get_session_by_id(session, session_id, user_id)
    
    if not study_session:
        return None
    
    study_session.session_notes = notes
    await session.flush()
    
    return study_session

async def delete_session(
    session: AsyncSession,
    session_id: int,
    user_id: str
) -> bool:
    """
    Delete a study session
    
    Also updates user's total_study_time
    """
    
    study_session = await get_session_by_id(session, session_id, user_id)
    
    if not study_session:
        return False
    
    # Update user's total study time
    user_result = await session.execute(
        select(Users).where(Users.user_id == user_id)
    )
    user = user_result.scalars().first()
    
    if user:
        user.total_study_time -= study_session.duration_seconds
        # Ensure it doesn't go negative
        if user.total_study_time < 0:
            user.total_study_time = 0
    
    await session.delete(study_session)
    await session.flush()
    
    return True

# ============================================================================
# ANALYTICS OPERATIONS
# ============================================================================

async def get_daily_stats(
    session: AsyncSession,
    user_id: str,
    target_date: date
) -> dict:
    """Get study statistics for a specific day"""
    
    result = await session.execute(
        select(
            func.sum(StudySessions.duration_seconds).label('total_seconds'),
            func.count(StudySessions.id).label('session_count')
        )
        .where(
            and_(
                StudySessions.user_id == user_id,
                StudySessions.session_date == target_date
            )
        )
    )
    
    # Use mappings() to safely access by key
    row = result.mappings().first()
    
    # Handle case where row is None or values are None
    total_seconds = (row['total_seconds'] if row and row['total_seconds'] else 0)
    session_count = (row['session_count'] if row and row['session_count'] else 0)
    
    return {
        'date': target_date.isoformat(),
        'total_seconds': total_seconds,
        'total_minutes': total_seconds // 60,
        'total_hours': round(total_seconds / 3600, 2),
        'session_count': session_count
    }

async def get_weekly_stats(
    session: AsyncSession,
    user_id: str,
    start_date: date
) -> dict:
    """Get study statistics for a week"""
    
    end_date = start_date + timedelta(days=6)
    
    # Get daily breakdown
    daily_stats = []
    for i in range(7):
        current_date = start_date + timedelta(days=i)
        daily_stat = await get_daily_stats(session, user_id, current_date)
        daily_stats.append(daily_stat)
    
    # Calculate totals
    total_seconds = sum(day['total_seconds'] for day in daily_stats)
    total_sessions = sum(day['session_count'] for day in daily_stats)
    
    return {
        'week_start': start_date.isoformat(),
        'week_end': end_date.isoformat(),
        'total_seconds': total_seconds,
        'total_minutes': total_seconds // 60,
        'total_hours': round(total_seconds / 3600, 2),
        'session_count': total_sessions,
        'daily_breakdown': daily_stats
    }

async def get_monthly_stats(
    session: AsyncSession,
    user_id: str,
    year: int,
    month: int
) -> dict:
    """Get study statistics for a month"""
    
    # Get first and last day of month
    from calendar import monthrange
    _, last_day = monthrange(year, month)
    
    start_date = date(year, month, 1)
    end_date = date(year, month, last_day)
    
    # Get daily breakdown
    daily_stats = []
    current_date = start_date
    while current_date <= end_date:
        daily_stat = await get_daily_stats(session, user_id, current_date)
        daily_stats.append(daily_stat)
        current_date += timedelta(days=1)
    
    # Calculate totals
    total_seconds = sum(day['total_seconds'] for day in daily_stats)
    total_sessions = sum(day['session_count'] for day in daily_stats)
    
    return {
        'month': f"{year}-{month:02d}",
        'total_seconds': total_seconds,
        'total_minutes': total_seconds // 60,
        'total_hours': round(total_seconds / 3600, 2),
        'session_count': total_sessions,
        'daily_breakdown': daily_stats
    }

async def get_comprehensive_analytics(
    session: AsyncSession,
    user_id: str,
    group_id: Optional[int] = None
) -> dict:
    """Get comprehensive study analytics"""
    
    query = select(StudySessions).where(StudySessions.user_id == user_id)
    
    if group_id is not None:
        query = query.where(StudySessions.group_id == group_id)
    
    result = await session.execute(query)
    sessions = result.scalars().all()
    
    if not sessions:
        return {
            'total_study_time_seconds': 0,
            'total_study_time_hours': 0.0,
            'total_sessions': 0,
            'average_session_minutes': 0.0,
            'longest_session_minutes': 0,
            'shortest_session_minutes': 0,
            'most_productive_hour': None,
            'study_streak_days': 0,
            'sessions_this_week': 0,
            'sessions_this_month': 0
        }
    
    # Calculate basic stats
    total_seconds = sum(s.duration_seconds for s in sessions)
    total_sessions = len(sessions)
    avg_seconds = total_seconds / total_sessions
    
    durations = [s.duration_seconds for s in sessions]
    longest_seconds = max(durations)
    shortest_seconds = min(durations)
    
    # Most productive hour (hour of day with most study time)
    hour_totals = defaultdict(int)
    for s in sessions:
        hour = s.started_at.hour
        hour_totals[hour] += s.duration_seconds
    
    most_productive_hour = max(hour_totals.items(), key=lambda x: x[1])[0] if hour_totals else None
    
    # Get streak
    streak_result = await session.execute(
        select(Streaks).where(Streaks.user_id == user_id)
    )
    streak = streak_result.scalars().first()
    current_streak = streak.current_streak if streak else 0
    
    # Sessions this week/month
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    month_start = date(today.year, today.month, 1)
    
    sessions_this_week = len([s for s in sessions if s.session_date >= week_start])
    sessions_this_month = len([s for s in sessions if s.session_date >= month_start])
    
    return {
        'total_study_time_seconds': total_seconds,
        'total_study_time_hours': round(total_seconds / 3600, 2),
        'total_sessions': total_sessions,
        'average_session_minutes': round(avg_seconds / 60, 1),
        'longest_session_minutes': longest_seconds // 60,
        'shortest_session_minutes': shortest_seconds // 60,
        'most_productive_hour': most_productive_hour,
        'study_streak_days': current_streak,
        'sessions_this_week': sessions_this_week,
        'sessions_this_month': sessions_this_month
    }

async def get_group_study_stats(
    session: AsyncSession,
    user_id: str
) -> List[dict]:
    """Get study statistics broken down by group"""
    
    # Get all sessions with group info
    result = await session.execute(
        select(StudySessions, Groups)
        .outerjoin(Groups, StudySessions.group_id == Groups.id)
        .where(StudySessions.user_id == user_id)
    )
    
    sessions_with_groups = result.all()
    
    # Calculate total study time for percentage
    total_study_time = sum(s.duration_seconds for s, _ in sessions_with_groups)
    
    # Group by group_id
    group_stats = defaultdict(lambda: {
        'sessions': [],
        'group_name': None
    })
    
    for study_session, group in sessions_with_groups:
        group_id = study_session.group_id or 0  # 0 for no group
        group_stats[group_id]['sessions'].append(study_session)
        if group:
            group_stats[group_id]['group_name'] = group.group_name
        else:
            group_stats[group_id]['group_name'] = "Personal Study"
    
    # Calculate stats for each group
    result_stats = []
    for group_id, data in group_stats.items():
        sessions = data['sessions']
        group_total_seconds = sum(s.duration_seconds for s in sessions)
        
        last_studied = max(s.ended_at for s in sessions) if sessions else None
        
        percentage = (group_total_seconds / total_study_time * 100) if total_study_time > 0 else 0
        
        result_stats.append({
            'group_id': group_id if group_id != 0 else None,
            'group_name': data['group_name'],
            'total_study_time_seconds': group_total_seconds,
            'total_study_time_hours': round(group_total_seconds / 3600, 2),
            'session_count': len(sessions),
            'last_studied': last_studied,
            'percentage_of_total': round(percentage, 1)
        })
    
    # Sort by total study time descending
    result_stats.sort(key=lambda x: x['total_study_time_seconds'], reverse=True)
    
    return result_stats

# ============================================================================
# LEADERBOARD OPERATIONS
# ============================================================================

async def get_group_leaderboard(
    session: AsyncSession,
    group_id: int,
    period: str = "all_time",  # all_time, monthly, weekly
    current_user_id: Optional[str] = None
) -> dict:
    """Get leaderboard for a specific group"""
    
    query = (
        select(
            Users.user_id,
            Users.username,
            Users.first_name,
            Users.last_name,
            func.sum(StudySessions.duration_seconds).label('total_seconds'),
            func.count(StudySessions.id).label('session_count')
        )
        .join(StudySessions, Users.user_id == StudySessions.user_id)
        .where(StudySessions.group_id == group_id)
        .group_by(Users.user_id, Users.username, Users.first_name, Users.last_name)
    )
    
    # Apply time filters
    if period == "weekly":
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        query = query.where(StudySessions.session_date >= week_start)
    elif period == "monthly":
        today = date.today()
        month_start = date(today.year, today.month, 1)
        query = query.where(StudySessions.session_date >= month_start)
    
    # Order by total time
    query = query.order_by(desc('total_seconds'))
    
    result = await session.execute(query)
    rows = result.all()
    
    # Get group name
    group_result = await session.execute(
        select(Groups.group_name).where(Groups.id == group_id)
    )
    group_name = group_result.scalar() or "Unknown Group"
    
    # Build leaderboard entries
    entries = []
    current_user_rank = None
    
    for rank, row in enumerate(rows, start=1):
        is_current = row.user_id == current_user_id
        
        if is_current:
            current_user_rank = rank
        
        entries.append({
            'user_id': row.user_id,
            'username': row.username,
            'first_name': row.first_name,
            'last_name': row.last_name,
            'total_study_time_seconds': row.total_seconds,
            'total_study_time_hours': round(row.total_seconds / 3600, 2),
            'session_count': row.session_count,
            'rank': rank,
            'is_current_user': is_current
        })
    
    return {
        'group_id': group_id,
        'group_name': group_name,
        'time_period': period,
        'entries': entries,
        'current_user_rank': current_user_rank,
        'total_participants': len(entries)
    }

async def get_global_leaderboard(
    session: AsyncSession,
    period: str = "all_time",
    current_user_id: Optional[str] = None,
    limit: int = 50
) -> dict:
    """Get global leaderboard (all users)"""
    
    query = (
        select(
            Users.user_id,
            Users.username,
            Users.first_name,
            Users.last_name,
            func.sum(StudySessions.duration_seconds).label('total_seconds'),
            func.count(StudySessions.id).label('session_count')
        )
        .join(StudySessions, Users.user_id == StudySessions.user_id)
        .group_by(Users.user_id, Users.username, Users.first_name, Users.last_name)
    )
    
    # Apply time filters
    if period == "weekly":
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        query = query.where(StudySessions.session_date >= week_start)
    elif period == "monthly":
        today = date.today()
        month_start = date(today.year, today.month, 1)
        query = query.where(StudySessions.session_date >= month_start)
    
    # Order by total time and limit
    query = query.order_by(desc('total_seconds')).limit(limit)
    
    result = await session.execute(query)
    rows = result.all()
    
    # Build leaderboard entries
    entries = []
    current_user_rank = None
    
    for rank, row in enumerate(rows, start=1):
        is_current = row.user_id == current_user_id
        
        if is_current:
            current_user_rank = rank
        
        entries.append({
            'user_id': row.user_id,
            'username': row.username,
            'first_name': row.first_name,
            'last_name': row.last_name,
            'total_study_time_seconds': row.total_seconds,
            'total_study_time_hours': round(row.total_seconds / 3600, 2),
            'session_count': row.session_count,
            'rank': rank,
            'is_current_user': is_current
        })
    
    return {
        'group_id': None,
        'group_name': "Global",
        'time_period': period,
        'entries': entries,
        'current_user_rank': current_user_rank,
        'total_participants': len(entries)
    }

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def format_duration(seconds: int) -> dict:
    """Format duration into hours, minutes, seconds"""
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    
    return {
        'hours': hours,
        'minutes': minutes,
        'seconds': secs,
        'formatted': f"{hours}h {minutes}m {secs}s"
    }