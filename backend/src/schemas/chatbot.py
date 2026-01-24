from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Message(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: Optional[datetime] = None

class ChatRequest(BaseModel):
    """Request to chatbot - load history from DB"""
    message: str
    session_id: Optional[str] = None #optional for multiconverstaional support

class ChatResponse(BaseModel):
    """Response from chatbot with suggestions"""
    response: str
    suggestions: List[str] = []
    session_id: Optional[str] = None #return session id for frontend to track

class ConversationHistory(BaseModel):
    """Full converstaion history for a user"""
    messages: List[Message]
    total_message: int
    session_id: Optional[str] = None

    class Config:
        from_attributes = True