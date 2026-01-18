from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Message(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: Optional[datetime] = None

class ChatRequest(BaseModel):
    message: str
    conversation_history: List[Message] = []

class ChatResponse(BaseModel):
    response: str
    suggestions: List[str] = []