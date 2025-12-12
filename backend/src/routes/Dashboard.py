from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..database.database import get_db
from ..database.models import Users
from ..dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("")
async def get_dashboard(
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get dashboard data for authenticated user

    LAZY CREATION: User is automatically created on first visit
    to dashboard if they don't exist yet.
    
    Returns:
        Dashboard data including user info and stats
    """
    return {
        "message": "Welcome to your dashboard!",
        "user": {
            "user_id": current_user.user_id,
            "username": current_user.username,
            "email": current_user.email,
            "first_name": current_user.first_name,      # ← Added
            "last_name": current_user.last_name,        # ← Added
            "total_study_time": current_user.total_study_time,
            "member_since": current_user.created_at.isoformat()
        },
        # TODO: Add groups, recent activity, etc.
        "stats": {
            "study_time_today": 0,  # Will calculate later
            "groups_count": 0,      # Will calculate later
            "active_streak": 0       # Will calculate later
        }
    }


