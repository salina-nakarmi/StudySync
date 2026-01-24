from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from ..schemas.chatbot import ChatRequest, ChatResponse
from ..services.chatbot_service import ChatbotService
from ..database.models import Users
from ..dependencies import get_current_user, get_db

# Remove /api prefix since app.py already adds it
router = APIRouter(prefix="/chatbot", tags=["Chatbot"])

@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: Users = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """
    Personalized chat endpoint - uses real user data!
    """
    try:
        user = current_user.username
        print(f"📝 User {user} asked: {request.message}")
        
        # Create service and get response
        service = ChatbotService(db, current_user)
        response = await service.get_personalized_response(request.message)
        
        print(f"🤖 AI responded: {response[:50]}...")
        
        return ChatResponse(
            response=response,
            suggestions=["How's my progress?", "What should I study?", "Show my streak"]
        )
        
    except Exception as e:
        print(f"❌ Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process message: {str(e)}"
        )

@router.get("/test")
async def test_groq(
    current_user: Optional[str] = Depends(lambda: None)
):
    """
    Test endpoint - NO authentication, NO database
    """
    try:
        print("🧪 Testing Groq API connection...")
        # Use simple response (no db needed)
        service = ChatbotService(None, None)
        response = await service.get_simple_response("Say hello in a friendly way")
        print(f"✅ Groq test successful")
        return {"status": "success", "response": response}
    except Exception as e:
        print(f"❌ Groq test failed: {e}")
        return {"status": "error", "error": str(e)}

@router.get("/health")
async def chatbot_health():
    """Health check"""
    return {"status": "healthy", "service": "chatbot"}