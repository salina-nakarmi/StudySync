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
 # CHANGE THIS: Use flush instead of commit to protect the parent transaction
    await db.flush() 
    await db.refresh(notification)

    # Prepare a payload compatible with frontend expectations
    resp = NotificationResponse.model_validate(notification).model_dump()
    # Provide both the original field names and the frontend-friendly keys
    resp["message"] = resp.get("notification_message")
    resp["type"] = resp.get("notification_type")

    await notification_manager.send_notification(
        data.user_id,
        resp
    )


async def get_user_notifications(user_id: str, db: AsyncSession):
    """Fetch all notifications for a user, ordered by newest first.
    Returns a list of plain dicts with frontend-friendly keys: id, title, message, type, is_read, created_at
    """
    result = await db.execute(
        select(Notifications)
        .where(Notifications.user_id == user_id)
        .order_by(Notifications.created_at.desc())
    )
    notifications = result.scalars().all() or []

    transformed = []
    for n in notifications:
        obj = NotificationResponse.model_validate(n).model_dump()
        obj["message"] = obj.get("notification_message")
        obj["type"] = obj.get("notification_type")
        transformed.append(obj)

    return transformed


async def mark_notification_read(notification_id: int, db: AsyncSession):
    await db.execute(
        update(Notifications)
        .where(Notifications.id == notification_id)
        .values(is_read=True)
    )
    await db.commit()
