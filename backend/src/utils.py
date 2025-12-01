# Clerk Authentication verification for Backend
from fastapi import HTTPException, Request
from clerk_backend_api import Clerk, AuthenticateRequestOptions
import os
from dotenv import load_dotenv

load_dotenv()


clerk_sdk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))

def authenticate_and_get_user_details(request: Request) -> dict:
    """
    Authenticate request using Clerk and extract user details
    
    here clerk sdk verifies the JWT token signature, checks token hasn't expired, 
    and extracts user info from token payload

    Args:
        request: FastAPI Request object
        
    Returns:
        dict with user_id and other claims
        
    Raises:
        HTTPException 401: If token is invalid or missing
        HTTPException 500: If authentication fails
    """
    try:
        #verify token with clerk
        request_state = clerk_sdk.authenticate_request(
            request,
            AuthenticateRequestOptions(
                authorized_parties=[
                    "http://localhost:5173", # Vite default 
                    "http://localhost:5174", # Alternative port
                    "http://localhost:3000", #React default
                    ],
                jwt_key=os.getenv("JWT_KEY")
            )
        )

    #Checks if user is signed in
        if not request_state.is_signed_in:
            raise HTTPException(
                status_code=401, 
                detail="Not authenticated - please sign in")
        
        # Extract user information from token payload
        # The token contains claims (data) about the user
        payload = request_state.payload

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=401, 
                detail="Invalid token: missing user_id")
        
        #  extract additional claims for trigger creation

        # These fields might not always be present, so we provide defaults
        email = payload.get("email", f"user_{user_id}@temp.com")
        username = payload.get("username", f"user_{user_id[:8]}")

        return {
            "user_id": user_id,
            "email": request_state.payload.get("email"),
            "username": request_state.payload.get("username")
            # You can add more fields here if Clerk token contains them:
            # "first_name": payload.get("first_name"),
            # "last_name": payload.get("last_name"),

            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")