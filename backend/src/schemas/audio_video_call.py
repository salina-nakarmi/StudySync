from pydantic import BaseModel
from datetime import datetime


class TokenRequest(BaseModel):
    room_name: str
    user_id: str
    display_name: str
    
class CallHistoryResponse(BaseModel):
    id: int
    group_id: int
    started_at: datetime
    ended_at: datetime
    participants: list[str]

    class Config:
        from_attributes = True    

class KickParticipant(BaseModel):
    room_name: str
    participant: str        

class MuteParticipant(BaseModel):
    room_name: str
    participant: str
    track_sid: str
    mute: bool

class RoomRequest(BaseModel):
    room_name: str
    max_participants: int = 20