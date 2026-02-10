from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from ..database.models import Notifications
from ..schemas.notifications import NotificationResponse
from .notification_ws_manager import notification_manager

async def create_notification(data, db: AsyncSession):
    notification = Notifications(
        user_id=data.user_id,
        title=data.title,
        notification_message=data.message,
        notification_type=data.type,
    )
    db.add(notification)
    print(f"Notification added to database")
    await db.commit()
    await db.refresh(notification)

    await notification_manager.send_notification(
        data.user_id,
        NotificationResponse.model_validate(notification).model_dump()
    )

async def get_user_notifications(user_id: str, db: AsyncSession):
    """Fetch all notifications for a user, ordered by newest first."""
    result = await db.execute(
        select(Notifications)
        .where(Notifications.user_id == user_id)
        .order_by(Notifications.created_at.desc())
    )
    # Return list (empty if none found)
    return result.scalars().all() or []

async def mark_notification_read(notification_id: int, db: AsyncSession):
    await db.execute(
        update(Notifications)
        .where(Notifications.id == notification_id)
        .values(is_read=True)
    )
    await db.commit()


