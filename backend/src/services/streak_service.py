"""
Handles streak-related database operations and calculations
"""

from datetime import date
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract

from ..database.models import Streaks, Users, StudySessions


# =============================================================================
# UTILITY
# =============================================================================

def ensure_date(value):
    """
    Ensures the value is a `date` (not datetime).
    Prevents: date - datetime errors.
    """
    if value is None:
        return None
    return value.date() if hasattr(value, "date") else value


# =============================================================================
# CORE HELPERS
# =============================================================================

async def get_or_create_streak(
    session: AsyncSession,
    user_id: str
) -> Streaks:
    """
    Fetch existing streak or create a new one
    """

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


# =============================================================================
# ROUTE FUNCTIONS (USED BY streaks.py)
# =============================================================================

async def update_streak(
    session: AsyncSession,
    user_id: str
) -> dict:
    """
    POST /streaks/update
    """

    streak = await check_and_update_streak(session, user_id)
    await session.commit()

    return {
        "message": "Streak updated successfully",
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "streak_start_date": (
            streak.streak_start_date.isoformat()
            if streak.streak_start_date else None
        )
    }


async def get_user_streak(
    session: AsyncSession,
    user_id: str
) -> dict:
    """
    GET /streaks/me
    GET /streaks/{user_id}
    """

    # Verify user exists
    result = await session.execute(
        select(Users).where(Users.user_id == user_id)
    )
    user = result.scalars().first()

    if not user:
        raise ValueError(f"User {user_id} not found")

    streak = await get_or_create_streak(session, user_id)

    today = date.today()
    last_active = ensure_date(streak.last_active_date)

    # Break streak if inactive for more than 1 day
    if last_active and (today - last_active).days > 1:
        streak.current_streak = 0
        streak.streak_start_date = None
        await session.flush()
        await session.commit()

    return {
        "user_id": user_id,
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "last_active_date": (
            last_active.isoformat() if last_active else None
        ),
        "streak_start_date": (
            streak.streak_start_date.isoformat()
            if streak.streak_start_date else None
        )
    }


# =============================================================================
# AUTOMATIC STREAK UPDATE (CALLED WHEN STUDY SESSION IS CREATED)
# =============================================================================

async def update_streak_after_session(
    session: AsyncSession,
    user_id: str,
    session_date: date
) -> Streaks:
    """
    Update streak when a study session is logged
    """

    streak = await get_or_create_streak(session, user_id)
    last_active = ensure_date(streak.last_active_date)

    # First ever activity
    if last_active is None:
        streak.current_streak = 1
        streak.longest_streak = 1
        streak.last_active_date = session_date
        streak.streak_start_date = session_date
        await session.flush()
        return streak

    # Same day → no change
    if last_active == session_date:
        return streak

    days_diff = (session_date - last_active).days

    if days_diff == 1:
        streak.current_streak += 1
        streak.last_active_date = session_date

        if streak.current_streak > streak.longest_streak:
            streak.longest_streak = streak.current_streak

    elif days_diff > 1:
        streak.current_streak = 1
        streak.last_active_date = session_date
        streak.streak_start_date = session_date

    await session.flush()
    return streak


# =============================================================================
# DAILY CHECK (LOGIN / DASHBOARD LOAD)
# =============================================================================

async def check_and_update_streak(
    session: AsyncSession,
    user_id: str
) -> Streaks:
    """
    Check if streak is broken due to inactivity
    """

    streak = await get_or_create_streak(session, user_id)
    last_active = ensure_date(streak.last_active_date)

    if last_active is None:
        return streak

    today = date.today()
    days_since_last = (today - last_active).days

    if days_since_last > 1:
        streak.current_streak = 0
        streak.streak_start_date = None
        await session.flush()

    return streak


# =============================================================================
# CALENDAR / ANALYTICS
# =============================================================================

async def get_streak_calendar_data(
    session: AsyncSession,
    user_id: str,
    year: int,
    month: int
) -> dict:
    """
    Calendar heatmap data
    """

    result = await session.execute(
        select(
            StudySessions.session_date,
            func.count(StudySessions.id).label("session_count")
        )
        .where(
            StudySessions.user_id == user_id,
            extract("year", StudySessions.session_date) == year,
            extract("month", StudySessions.session_date) == month
        )
        .group_by(StudySessions.session_date)
    )

    return {
        row.session_date.isoformat(): row.session_count
        for row in result.all()
    }


async def get_streak_stats(
    session: AsyncSession,
    user_id: str
) -> dict:
    """
    Advanced streak statistics
    """

    streak = await get_or_create_streak(session, user_id)
    last_active = ensure_date(streak.last_active_date)
    today = date.today()

    result = await session.execute(
        select(func.count(func.distinct(StudySessions.session_date)))
        .where(StudySessions.user_id == user_id)
    )
    total_days_studied = result.scalar() or 0

    is_active_today = last_active == today

    days_until_break: Optional[int] = None
    if streak.current_streak > 0 and last_active:
        days_since = (today - last_active).days
        days_until_break = max(0, 1 - days_since)

    return {
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "total_days_studied": total_days_studied,
        "last_active_date": (
            last_active.isoformat() if last_active else None
        ),
        "streak_start_date": (
            streak.streak_start_date.isoformat()
            if streak.streak_start_date else None
        ),
        "is_active_today": is_active_today,
        "days_until_break": days_until_break
    }


async def manually_update_streak(
    session: AsyncSession,
    user_id: str
) -> Streaks:
    """
    Admin/testing only
    """
    return await check_and_update_streak(session, user_id)
