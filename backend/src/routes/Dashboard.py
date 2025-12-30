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

# ============================================================================
# PROGRESS STATISTICS - For Dashboards
# ============================================================================
async def get_user_progress_stats(
    session: AsyncSession,
    user_id: str
) -> dict:
    """
    Use case:
        Dashboard widgets:
        "📚 12 resources in progress"
        "✅ 23 resources completed"
        "🎯 53% completion rate"
    """
    all_progress = await get_all_user_progress(session, user_id)
    
    # Count by status
    by_status = {
        "not_started": 0,
        "in_progress": 0,
        "completed": 0,
        "paused": 0
    }
    
    for progress in all_progress:
        status_name = progress.status.value
        by_status[status_name] = by_status.get(status_name, 0) + 1
    
    total = len(all_progress)
    completed = by_status["completed"]
    completion_rate = (completed / total * 100) if total > 0 else 0
    
    return {
        "not_started": by_status["not_started"],
        "in_progress": by_status["in_progress"],
        "completed": by_status["completed"],
        "paused": by_status["paused"],
        "total_tracked": total,
        "completion_rate": round(completion_rate, 1)
    }


