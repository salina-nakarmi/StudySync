from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from ..schemas.chatbot import ChatRequest, ChatResponse, ConversationHistory, Message
from ..services.chatbot_service import ChatbotService
from ..services.chatbot_conversation_service import ConversationService
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
    Personalized chat endpoint - uses real user data! with conversation history
    """
    try:
        user = current_user.username
        print(f"📝 User {user} asked: {request.message}")
        
        # Create service and get response
        service = ChatbotService(db, current_user)
        response_txt, session_id = await service.get_personalized_response(
            request.message,
            session_id=request.session_id
            )
        
        print(f"🤖 AI responded: {response_txt[:50]}...")
        
        return ChatResponse(
            response=response_txt,
            suggestions=["How's my progress?", "What should I study?", "Show my streak"],
            session_id=session_id
        )
        
    except Exception as e:
        print(f"❌ Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process message: {str(e)}"
        )

router.get("/history", response_model=ConversationHistory)
async def get_conversation_history(
    limit: int = 20,
    session_id: Optional[str] = None,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get conversation history for current user
    
    Args:
        limit: Maximum number of messages to return (default 20)
        session_id: Optional - filter by specific session
    """
    try:
        conv_service = ConversationService(db, current_user.user_id)
        
        # Get history
        history = await conv_service.get_recent_history(
            limit=limit,
            session_id=session_id
        )
        
        return ConversationHistory(
            messages=[
                Message(
                    role=msg["role"],
                    content=msg["content"],
                    timestamp=msg["timestamp"]
                )
                for msg in history
            ],
            total_messages=len(history),
            session_id=session_id
        )
        
    except Exception as e:
        print(f"❌ Error getting history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get conversation history: {str(e)}"
        )

@router.delete("/history")
async def clear_conversation_history(
    session_id: Optional[str] = None,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Clear conversation history
    
    Args:
        session_id: Optional - clear specific session, or all if not provided
    """
    try:
        conv_service = ConversationService(db, current_user.user_id)
        await conv_service.clear_history(session_id=session_id)
        await db.commit()
        
        return {
            "message": "Conversation history cleared",
            "session_id": session_id
        }
        
    except Exception as e:
        print(f"❌ Error clearing history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear history: {str(e)}"
        )

@router.get("/stats")
async def get_conversation_stats(
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get statistics about user's conversations"""
    try:
        conv_service = ConversationService(db, current_user.user_id)
        stats = await conv_service.get_conversation_stats()
        
        return stats
        
    except Exception as e:
        print(f"❌ Error getting stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get stats: {str(e)}"
        )

@router.get("/test")
async def test_groq():
    """Test endpoint - NO authentication, NO database"""
    try:
        print("🧪 Testing Groq API connection...")
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