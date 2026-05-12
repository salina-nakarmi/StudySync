from fastapi import APIRouter, Depends, HTTPException, Request
from ..dependencies import get_current_user
from ..database.models import Users

router = APIRouter(prefix="/debug", tags=["Debug"])

@router.get("/get-my-token")
async def get_my_token(request: Request):
    """
    Extract and return the JWT token from the current request
    USE THIS to get your token for Swagger UI testing
    
    Steps:
    1. Sign in to your frontend app
    2. Make any API call (e.g., fetch dashboard)
    3. Come to this endpoint: http://localhost:8000/api/debug/get-my-token
    4. Copy the token from the response
    5. Use it in Swagger UI
    """
    auth_header = request.headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=400,
            detail="No token found. Make sure you're signed in and this request is coming from your authenticated frontend."
        )
    
    token = auth_header.replace("Bearer ", "")
    
    return {
        "token": token,
        "instructions": [
            "1. Copy the token above",
            "2. Go to http://localhost:8000/docs",
            "3. Click 'Authorize' button (lock icon)",
            "4. Paste the token",
            "5. Click 'Authorize' then 'Close'",
            "6. Now test any endpoint!"
        ],
        "expires": "This token typically expires in 1 hour",
        "refresh": "If expired, sign out and sign back in to get a new token"
    }

@router.get("/verify-token")
async def verify_token(current_user: Users = Depends(get_current_user)):
    """
    Test if your token works
    If you can see this response, your token is valid!
    """
    return {
        "message": "✅ Token is valid!",
        "user_id": current_user.user_id,
        "email": current_user.email,
        "username": current_user.username
    }