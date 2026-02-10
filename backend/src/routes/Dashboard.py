from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from ..database.database import get_db
from ..database.models import Users, StudySessions
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

        # ✅ Fetch recent study sessions (last 5)
    recent_sessions_query = (
        select(StudySessions)
        .where(StudySessions.user_id == current_user.user_id)
        .order_by(desc(StudySessions.created_at))
        .limit(5)
    )
    
    result = await db.execute(recent_sessions_query)
    recent_sessions_db = result.scalars().all()
    
    # Format sessions for frontend
    recent_sessions = [
        {
            "duration_seconds": session.duration_seconds,
            "session_notes": session.session_notes or "Study Session",
            "created_at": session.created_at.isoformat(),
            "session_id": session.id  # Optional: if you want to allow clicking to view details
        }
        for session in recent_sessions_db
    ]

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

         #  NEW: Recent study sessions
        "recent_sessions": recent_sessions,

        # TODO: Add groups, recent activity, etc.
        "stats": {
            "study_time_today": 0,  # Will calculate later
            "groups_count": 0,      # Will calculate later
            "active_streak": 0       # Will calculate later
        }
    }




