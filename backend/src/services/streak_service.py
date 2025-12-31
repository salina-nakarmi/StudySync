"""Handles streak-related database operations and calculations"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from ..database.models import Streaks
from typing import Optional
from datetime import date, timedelta

async def get_or_create_streak(session: AsyncSession, user_id: str) -> Streaks:
    """Get existing streak or create new one"""
    
    result = await session.execute(
        select(Streaks).where(Streaks.user_id == user_id)
    )
    streak = result.scalars().first()
    
    if not streak:
        streak = Streaks(
            user_id=user_id,
            current_streak=0,
            longest_streak=0,
            last_active_date=None,
            streak_start_date=None
        )
        session.add(streak)
        await session.flush()
    
    return streak

# ============================================================================
# FUNCTIONS FOR ROUTES (Required by streaks.py routes)
# ============================================================================

async def update_streak(session: AsyncSession, user_id: str) -> dict:
    """
    Manually update streak (for legacy route support)
    
    This is called by POST /streaks/update endpoint.
    Checks if streak should be broken based on current date.
    """
    
    streak = await check_and_update_streak(session, user_id)
    await session.commit()
    
    return {
        "message": "Streak updated successfully",
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "streak_start_date": streak.streak_start_date.isoformat() if streak.streak_start_date else None
    }

async def get_user_streak(session: AsyncSession, user_id: str) -> dict:
    """
    Get user's streak information (for legacy route support)
    
    This is called by GET /streaks/me and GET /streaks/{user_id} endpoints.
    Returns complete streak information.
    """
    
    from ..database.models import Users
    
    # Verify user exists
    user_result = await session.execute(
        select(Users).where(Users.user_id == user_id)
    )
    user = user_result.scalars().first()
    
    if not user:
        raise ValueError(f"User {user_id} not found")
    
    # Get or create streak
    streak = await get_or_create_streak(session, user_id)
    
    # Check if streak needs to be broken
    today = date.today()
    if streak.last_active_date and (today - streak.last_active_date).days > 1:
        streak.current_streak = 0
        streak.streak_start_date = None
        await session.flush()
        await session.commit()
    
    return {
        "user_id": user_id,
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "last_active_date": streak.last_active_date.isoformat() if streak.last_active_date else None,
        "streak_start_date": streak.streak_start_date.isoformat() if streak.streak_start_date else None
    }

# ============================================================================
# AUTOMATIC STREAK UPDATES (Called by study sessions)
# ============================================================================

async def update_streak_after_session(
    session: AsyncSession,
    user_id: str,
    session_date: date
) -> Streaks:
    """
    Update streak after a study session is logged
    
    This function is called automatically when a study session is created.
    It handles the logic of maintaining, incrementing, or breaking streaks.
    
    **Streak Rules**:
    - Streak continues if you study every day
    - Streak breaks if you miss a day
    - Multiple sessions in one day don't increase streak
    """
    
    streak = await get_or_create_streak(session, user_id)
    
    # First session ever
    if streak.last_active_date is None:
        streak.current_streak = 1
        streak.longest_streak = 1
        streak.last_active_date = session_date
        streak.streak_start_date = session_date
        await session.flush()
        return streak
    
    # Same day - no change to streak
    if streak.last_active_date == session_date:
        return streak
    
    # Calculate days between last session and this one
    days_diff = (session_date - streak.last_active_date).days
    
    if days_diff == 1:
        # Consecutive day - increment streak
        streak.current_streak += 1
        streak.last_active_date = session_date
        
        # Update longest streak if needed
        if streak.current_streak > streak.longest_streak:
            streak.longest_streak = streak.current_streak
    
    elif days_diff > 1:
        # Streak broken - start new streak
        streak.current_streak = 1
        streak.last_active_date = session_date
        streak.streak_start_date = session_date
    
    else:
        # days_diff < 0 means session_date is before last_active_date
        # This can happen if user logs a session retroactively
        # Don't update streak in this case
        pass
    
    await session.flush()
    return streak

async def check_and_update_streak(session: AsyncSession, user_id: str) -> Streaks:
    """
    Check current streak status and update if needed
    
    This is for daily checks (like on login) to see if streak is broken.
    Call this when user accesses the app but hasn't logged a session yet.
    """
    
    streak = await get_or_create_streak(session, user_id)
    
    if streak.last_active_date is None:
        # No activity yet
        return streak
    
    today = date.today()
    days_since_last = (today - streak.last_active_date).days
    
    # If more than 1 day has passed, streak is broken
    if days_since_last > 1:
        streak.current_streak = 0
        streak.streak_start_date = None
        await session.flush()
    
    return streak

# ============================================================================
# ANALYTICS & CALENDAR
# ============================================================================

async def get_streak_calendar_data(
    session: AsyncSession,
    user_id: str,
    year: int,
    month: int
) -> dict:
    """
    Get calendar data showing which days user studied
    
    **Returns**: Dictionary with dates as keys and session counts as values
    
    **Example**:
    ```python
    {
        "2024-01-15": 3,  # 3 sessions on Jan 15
        "2024-01-16": 1,  # 1 session on Jan 16
        "2024-01-18": 2   # 2 sessions on Jan 18
    }
    ```
    
    **Frontend can use this to**:
    - Color calendar days (green for active days)
    - Show intensity (darker green for more sessions)
    - Display tooltips with session count
    """
    
    # Query for sessions in the given month
    result = await session.execute(
        select(
            StudySessions.session_date,
            func.count(StudySessions.id).label('session_count')
        )
        .where(
            StudySessions.user_id == user_id,
            extract('year', StudySessions.session_date) == year,
            extract('month', StudySessions.session_date) == month
        )
        .group_by(StudySessions.session_date)
    )
    
    calendar_data = {}
    for row in result.all():
        date_str = row.session_date.isoformat()
        calendar_data[date_str] = row.session_count
    
    return calendar_data

async def get_streak_stats(session: AsyncSession, user_id: str) -> dict:
    """
    Get comprehensive streak statistics
    
    **Returns**:
    - Current streak
    - Longest streak
    - Total days studied
    - Last active date
    - Streak start date
    - Is active today
    """
    
    streak = await get_or_create_streak(session, user_id)
    
    # Get total unique days studied
    result = await session.execute(
        select(func.count(func.distinct(StudySessions.session_date)))
        .where(StudySessions.user_id == user_id)
    )
    total_days_studied = result.scalar() or 0
    
    # Check if active today
    today = date.today()
    is_active_today = streak.last_active_date == today
    
    # Calculate days until streak breaks
    days_until_break = None
    if streak.current_streak > 0 and streak.last_active_date:
        days_since = (today - streak.last_active_date).days
        if days_since == 0:
            days_until_break = 1  # Today, need to study tomorrow
        elif days_since == 1:
            days_until_break = 0  # Tomorrow, need to study today!
    
    return {
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "total_days_studied": total_days_studied,
        "last_active_date": streak.last_active_date.isoformat() if streak.last_active_date else None,
        "streak_start_date": streak.streak_start_date.isoformat() if streak.streak_start_date else None,
        "is_active_today": is_active_today,
        "days_until_break": days_until_break
    }

async def manually_update_streak(session: AsyncSession, user_id: str) -> Streaks:
    """
    Manually trigger streak update (for testing or admin purposes)
    
    **Warning**: This should not be called in normal flow.
    Streaks are automatically updated when sessions are created.
    """
    
    return await check_and_update_streak(session, user_id)