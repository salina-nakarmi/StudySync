from fastapi import APIRouter, Depends, HTTPException
from schemas.chatbot import ChatRequest, ChatResponse
from services.chatbot_service import ChatbotService
from dependencies import get_current_user

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])

@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: str = Depends(get_current_user)
):
    """
    Simple chatbot endpoint - Just testing Groq connectivity
    
    Test with:
    - "tell me a joke"
    - "hello"
    - "what's 2+2"
    """
    try:
        print(f"📝 User {current_user} asked: {request.message}")
        
        # Create service and get response
        service = ChatbotService()
        response = await service.get_simple_response(request.message)
        
        print(f"🤖 AI responded: {response[:50]}...")
        
        return ChatResponse(
            response=response,
            suggestions=["Tell me a joke", "How can you help me?", "What's my progress?"]
        )
        
    except Exception as e:
        print(f"❌ Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process message: {str(e)}"
        )

@router.get("/test")
async def test_groq():
    """
    Simple test endpoint to verify Groq API key works
    No authentication needed - just for testing
    """
    try:
        service = ChatbotService()
        response = await service.get_simple_response("Say 'Hello, Groq is working!' in a friendly way")
        return {"status": "success", "response": response}
    except Exception as e:
        return {"status": "error", "error": str(e)}