
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..database.database import get_db
from ..database.models import Users
from ..services.streak_service import update_streak, get_user_streak
from ..dependencies import get_current_user


router = APIRouter(prefix="/streaks", tags=["streaks"])

@router.post("/update")
async def update_streak_me(
    current_user: Users = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)):
    """
    Update the streak for the current user.

    Streak record will be created by streak_service if needed.
    """
    try:
        result = await update_streak(db, current_user.user_id)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/me")
async def get_my_streak(
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the current user's streak information.
    """
    try:        
        result = await get_user_streak(db, current_user.user_id)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}")
async def get_user_streak_by_id(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get streak for any user by ID (public profile view)
    """
    try:
        result = await get_user_streak(db, user_id)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

