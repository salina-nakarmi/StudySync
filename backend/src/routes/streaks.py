from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date

from ..database.database import get_db
from ..database.models import Users
from ..services.streak_service import (
    update_streak, 
    get_user_streak,
    get_streak_calendar_data,
    get_streak_stats
)
from ..dependencies import get_current_user

router = APIRouter(prefix="/streaks", tags=["streaks"])

# ============================================================================
# BASIC STREAK ENDPOINTS (Original)
# ============================================================================

@router.post("/update")
async def update_streak_me(
    current_user: Users = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """
    Manually update/check the streak for the current user.
    
    **Note**: In normal flow, streaks are automatically updated when study sessions are logged.
    This endpoint is mainly for:
    - Daily login checks
    - Manual refresh
    - Testing purposes
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
    
    **Returns**:
    - Current streak count
    - Longest streak achieved
    - Last active date
    - Streak start date
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
    
    Allows viewing other users' streak achievements.
    Useful for:
    - Viewing friends' progress
    - Public profile pages
    - Leaderboards
    """
    try:
        result = await get_user_streak(db, user_id)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# ENHANCED ENDPOINTS (New)
# ============================================================================

@router.get("/calendar/me")
async def get_my_calendar_data(
    year: int = Query(..., ge=2020, le=2100, description="Year to view"),
    month: int = Query(..., ge=1, le=12, description="Month to view (1-12)"),
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get calendar data for visualization
    
    **Returns**: Dictionary mapping dates to session counts
    
    **Example Response**:
    ```json
    {
      "2024-12-01": 2,
      "2024-12-02": 1,
      "2024-12-05": 3
    }
    ```
    
    **Frontend Use**:
    - Highlight active days on calendar
    - Show intensity (darker color = more sessions)
    - Display tooltips with session count
    """
    try:
        calendar_data = await get_streak_calendar_data(
            session=db,
            user_id=current_user.user_id,
            year=year,
            month=month
        )
        
        return {
            "year": year,
            "month": month,
            "calendar_data": calendar_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/me")
async def get_my_streak_stats(
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive streak statistics
    
    **Returns**:
    - Current and longest streaks
    - Total days studied
    - Last active date
    - Whether active today
    - Days until streak breaks
    
    **Perfect for**: Dashboard overview cards
    """
    try:
        stats = await get_streak_stats(
            session=db,
            user_id=current_user.user_id
        )
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/{user_id}")
async def get_user_streak_stats(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive streak statistics for any user (public view)
    
    Useful for viewing other users' achievements and progress.
    """
    try:
        stats = await get_streak_stats(
            session=db,
            user_id=user_id
        )
        return stats
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/calendar/{user_id}")
async def get_user_calendar_data(
    user_id: str,
    year: int = Query(..., ge=2020, le=2100),
    month: int = Query(..., ge=1, le=12),
    db: AsyncSession = Depends(get_db)
):
    """
    Get calendar data for any user (public profile view)
    
    Allows viewing other users' study patterns.
    """
    try:
        calendar_data = await get_streak_calendar_data(
            session=db,
            user_id=user_id,
            year=year,
            month=month
        )
        
        return {
            "user_id": user_id,
            "year": year,
            "month": month,
            "calendar_data": calendar_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))