
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ..database.database import get_db
from ..services.streak_service import update_streak, get_user_streak
from ..utils import authenticate_and_get_user_details


router = APIRouter(prefix="/streaks", tags=["streaks"])

@router.post("/update")
async def update_streak_me(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Update the streak for the currently authenticated user.
    """
    try:
        auth_details = authenticate_and_get_user_details(request)
        user_id = auth_details["user_id"]
        
        result = await update_streak(db, user_id)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/me")
async def get_my_streak(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Get the current streak information for authenticated user
    """
    try:
        auth_details = authenticate_and_get_user_details(request)
        user_id = auth_details["user_id"]
        
        result = await get_user_streak(db, user_id)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}")
async def get_user_streak_by_id(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get streak information for a specific user by ID (for admins/public profiles)
    """
    try:
        result = await get_user_streak(db, user_id)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

