# Clerk Authentication for Backend
from fastapi import HTTPException, Request
from clerk_backend_api import Clerk, AuthenticateRequestOptions
import os
from dotenv import load_dotenv

load_dotenv()


clerk_sdk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))

def authenticate_and_get_user_details(request: Request) -> dict:
    """
    Authenticate request using Clerk and extract user details
    
    Args:
        request: FastAPI Request object
        
    Returns:
        dict with user_id and other claims
        
    Raises:
        HTTPException: If authentication fails
    """
    try:
        request_state = clerk_sdk.authenticate_request(
            request,
            AuthenticateRequestOptions(
                authorized_parties=["http://localhost:5173", "http://localhost:5174"],
                jwt_key=os.getenv("JWT_KEY")
            )
        )

        if not request_state.is_signed_in:
            raise HTTPException(status_code=401, detail="Not authenticated")

        user_id = request_state.payload.get("sub")

        if not user_id:
            raise HTTPException(status_code=400, detail="User ID not found in token")
        
        # Can extract more claims if needed
        return {
            "user_id": user_id,
            "email": request_state.payload.get("email"),
            "username": request_state.payload.get("username")
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")