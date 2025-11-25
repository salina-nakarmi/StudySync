from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database.models import Streaks, Users

today = datetime.now(timezone.utc).date()

async def get_or_create_streak(session: AsyncSession, user_id: str) -> Streaks:
    """
    Get existing streak or create new one
    
    Args:
        session: Async database session
        user_id: User ID (string from Clerk)
        
    Returns:
        Streaks object (never None)
    """
    result = await session.execute(
        select(Streaks).where(Streaks.user_id == user_id)
    )
    streak: Streaks | None = result.scalars().first()
    
    if not streak:
        # Create new streak record
        today = datetime.now(timezone.utc).date()
        streak = Streaks(
            user_id=user_id,
            current_streak=1,
            longest_streak=1,
            last_active_date=today,
            streak_start_date=today
        )
        session.add(streak)
        await session.flush()  # Get the ID without committing
    
    return streak

async def update_streak(session: AsyncSession, user_id:str) -> Streaks:
    """
    Get existing streak or create new one
    
    Args:
        session: Async database session
        user_id: User ID (string from Clerk)
        
    Returns:
        Streaks object
    """
    result = await session.execute(
        select(Streaks).where(Streaks.user_id == user_id)
    )
    streak = result.scalars().first()

    #  CASE 1: No streak record exists yet — create a new one
    if not streak:
        # If no streak exists, create a new one
        today = datetime.now(timezone.utc).date()
        streak = Streaks(
            user_id=user_id,
            current_streak=1,
            longest_streak=1,
            last_active_date=today,
            streak_start_date=today
        )
        session.add(streak)
        await session.flush()  # Get the ID without committing
        
    return streak

async def update_streak(session: AsyncSession, user_id: str) -> dict:
    """
    Update the streak for a user based on their last activity date
    
    Args:
        session: Async database session
        user_id: User ID (string from Clerk)
        
    Returns:
        dict with streak info
        
    Raises:
        ValueError: If user not found
    """
    # Verify user exists
    user_result = await session.execute(
        select(Users).where(Users.user_id == user_id)
    )
    user = user_result.scalars().first()
    
    if not user:
        raise ValueError(f"User with ID {user_id} not found")
    
    # Get or create streak
    streak = await get_or_create_streak(session, user_id)
    
    today = datetime.now(timezone.utc).date()
    last_date = streak.last_active_date
    
    # Already updated today
    if last_date == today:
        return {
            "message": "Streak already updated today",
            "current_streak": streak.current_streak,
            "longest_streak": streak.longest_streak
        }
    
    # User was active yesterday - increment streak
    if last_date == today - timedelta(days=1):
        streak.current_streak += 1
    # User missed a day - reset streak
    elif last_date < today - timedelta(days=1):
        streak.current_streak = 1
        streak.streak_start_date = today
    
    # Update longest streak if needed
    if streak.current_streak > streak.longest_streak:
        streak.longest_streak = streak.current_streak
    
    # Update last activity date
    streak.last_active_date = today
    
    # Changes will be committed by the route's session management
    return {
        "message": "Streak updated successfully",
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "streak_start_date": streak.streak_start_date.isoformat() if streak.streak_start_date else None
    }


async def get_user_streak(session: AsyncSession, user_id: str) -> dict:
    """
    Get current streak information for a user
    
    Args:
        session: Async database session
        user_id: User ID (string from Clerk)
        
    Returns:
        dict with streak information
    """
    streak = await get_or_create_streak(session, user_id)
    
    return {
        "user_id": user_id,
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "last_active_date": streak.last_active_date.isoformat() if streak.last_active_date else None,
        "streak_start_date": streak.streak_start_date.isoformat() if streak.streak_start_date else None
    }




