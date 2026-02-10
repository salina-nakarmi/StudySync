from pydantic import BaseModel
from datetime import datetime


class NotificationResponse(BaseModel):
    id: int
    title: str
    notification_message: str
    notification_type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CreateNotificationRequest(BaseModel):
    user_id: str
    title: str
    message: str
    type: str
