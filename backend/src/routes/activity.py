from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from ..database.database import get_db
from ..database.models import DailyActivity, Users
from ..dependencies import get_current_user
from ..schemas.activity import DailyActivityResponse

router = APIRouter(prefix="/activity", tags=["Activity"])

@router.get("/history", response_model=List[DailyActivityResponse])
async def get_activity_history(
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch all historical 'green square' data for the logged-in user.
    """
    query = select(DailyActivity).where(
        DailyActivity.user_id == current_user.user_id
    ).order_by(DailyActivity.activity_date.asc())
    
    result = await db.execute(query)
    return result.scalars().all()
