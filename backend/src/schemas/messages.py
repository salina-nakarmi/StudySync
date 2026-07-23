from pydantic import BaseModel
from typing import Optional
from ..database.models import MessageType
from datetime import datetime
class MessageResponse(BaseModel):
    sender_id: str
    group_id: int
    content: str
    type: str

class StoreMessageRequest(BaseModel):
    user_id: str
    group_id: int
    content: str
    type: MessageType    

class LoadMessageRequest(BaseModel):
    last_message_id: Optional[int] = None
    user_id: str
    group_id: int 

class EditingMessageRequest(BaseModel):
    user_id: str
    message_id: int
    group_id: int  
    edited_content: str
    edited_type: str

class ReplyingMessageRequest(BaseModel):
    replied_message_id: int
    group_id: int
    replied_to_id: str
    replied_by_id: str
    reply_content: str
    reply_content_type: str   

class DeletingMessageRequest(BaseModel):
    delete_message_id: int
    group_id: int
    user_id: str

class GetMessageRequest(BaseModel):
    message_id: int
    user_id: str
    group_id: int 
    is_reply: bool 

# --- Direct Message Schemas (Updated receiver_id to str) ---

class DirectMessageResponse(BaseModel):
    sender_id: str
    receiver_id: str
    content: str
    type: str

class StoreDirectMessageRequest(BaseModel):
    sender_id: str
    receiver_id: str
    content: str
    type: MessageType    

class LoadDirectMessageRequest(BaseModel):
    last_message_id: Optional[int] = None
    sender_id: str
    receiver_id: str 

class EditingDirectMessageRequest(BaseModel):
    sender_id: str
    message_id: int
    receiver_id: str  
    edited_content: str
    edited_type: str

class ReplyingDirectMessageRequest(BaseModel):
    replied_message_id: int
    receiver_id: str
    replied_to_id: str
    replied_by_id: str
    reply_content: str
    reply_content_type: str   

class DeletingDirectMessageRequest(BaseModel):
    delete_message_id: int
    receiver_id: str
    sender_id: str

class GetDirectMessageRequest(BaseModel):
    message_id: int
    sender_id: str
    receiver_id: str
    is_reply: bool


class ConversationPreview(BaseModel):
    friend_id: str
    username:str
    last_message_preview: Optional[str] = None
    latest_message_time: Optional[datetime] = None