from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class FriendRequestCreate(BaseModel):
    receiver_id: str

class FriendRequestResponse(BaseModel):
    id: int
    sender_id: str
    receiver_id: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FriendListItem(BaseModel):
    user_id: str
    email: str
    full_name: str
    profile_image: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class FriendWithStatus(BaseModel):
    user_id: str
    email: str
    full_name: str
    profile_image: Optional[str] = None
    friendship_status: str  # "friend", "pending_sent", "pending_received", "none"
    request_id: Optional[int] = None

class SentFriendRequests(BaseModel):
    id: int
    receiver_id: str
    receiver_email: str
    receiver_name: str
    status: str
    created_at: datetime

class ReceivedFriendRequests(BaseModel):
    id: int
    sender_id: str
    sender_email: str
    sender_name: str
    status: str
    created_at: datetime

class FriendRequestUpdate(BaseModel):
    status: str  # "accepted" or "rejected"


