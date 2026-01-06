from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from ..database.models import Messages
from enum import Enum

class MessageResponse(BaseModel):
    sender_id: str 
    group_id: str
    content: str
    type: str


class StoreMessageRequest(BaseModel):
    user_id:str
    group_id:str
    content:str
    type:str


class TypingMessageRequest(BaseModel):
    typing:bool    

class LoadMessageRequest(BaseModel):
    last_message_id: str
    user_id: str
    group_id: str 

class EditingMessageRequest(BaseModel):
    user_id: str
    message_id: str
    group_id:  str  
    edited_content: str
    edited_type: str

class ReplyingMessageRequest(BaseModel):
    message_id   