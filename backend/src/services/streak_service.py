from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from src.database.models import Streaks, Users

today = datetime.now(timezone.utc).date()

async def update_streak(session: Session, user_id:int):
    """Update the streak for a user based on their last activity date.

    Args:
        session (Session): The database session.
        user_id (int): The ID of the user whose streak is to be updated.
    """
    streak = session.query(Streaks).filter(Streaks.user_id == user_id).first()
    user = session.query(Users).filter(Users.user_id == user_id).first()

    if not user:
        print(f"User with ID {user_id} not found.")
        return


    #  CASE 1: No streak record exists yet — create a new one
    if not streak:
        # If no streak exists, create a new one
        new_streak = Streaks(
            user_id=user_id,
            current_streak=1,
            longest_streak=1,
            last_active_date=today,
            streak_start_date=today
        )
        session.add(new_streak)
        session.commit()
        return

    #  CASE 2: Streak record exists — update it based on last activity
    last_date = streak.last_active_date

    if last_date == today:
        return # already updated today
    
    if last_date == today - timedelta(days=1):
        # User was active yesterday, increment the streak
        streak.current_streak += 1
    elif last_date < today - timedelta(days=1):
        # User missed a day, reset the streak
        streak.current_streak = 1
        streak.streak_start_date = today

    # Update longest streak if needed
    if streak.current_streak > streak.longest_streak:
        streak.longest_streak = streak.current_streak

    # Update the last activity date
    streak.last_active_date = today

    session.commit()


