from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from ..database.models import Messages
from enum import Enum

class MessageResponse(BaseModel):
    sender_id: int 
    group_id: int
    content: str
    type: str


class StoreMessageRequest(BaseModel):
    user_id:int
    group_id:int
    content:str
    type:str    

class LoadMessageRequest(BaseModel):
    last_message_id: int
    user_id: int
    group_id: int 

class EditingMessageRequest(BaseModel):
    user_id: int
    message_id: int
    group_id:  int  
    edited_content: str
    edited_type: str

class ReplyingMessageRequest(BaseModel):
    replied_message_id:int
    group_id: int
    replied_to_id: int
    replied_by_id : int
    reply_content : str
    reply_content_type : str   

class DeletingMessageRequest(BaseModel):
    delete_message_id :int
    group_id :int
    user_id: id
     
class GetMessageRequest(BaseModel):
    message_id: int
    user_id : int
    group_id: int 
    is_reply: bool     