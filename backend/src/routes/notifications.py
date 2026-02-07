from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..database.database import get_db
from ..services.notification_service import (
    get_user_notifications,
    mark_notification_read
)
from ..schemas.notifications import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/{user_id}", response_model=List[NotificationResponse])
async def fetch_notifications(user_id: str, db: AsyncSession = Depends(get_db)):
    return await get_user_notifications(user_id, db)

@router.put("/read/{notification_id}")
async def read_notification(notification_id: int, db: AsyncSession = Depends(get_db)):
    await mark_notification_read(notification_id, db)
    return {"message": "Notification marked as read"}
