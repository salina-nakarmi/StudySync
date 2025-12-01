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
         dict with user details from token:
        {
            "user_id": "user_2abc123xyz",
            "email": "maren@example.com",
            "username": "maren_p",           # if available
            "first_name": "Maren",           # if available
            "last_name": "Philips"           # if available
        }
        
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

        # Extract additional user info for lazy creation
        # JWT standard claims for names (from OIDC spec):
        # - given_name: First name
        # - family_name: Last name
        # - name: Full name
        # - email: Email address
        # These fields might not always be present, so we provide defaults
        email = payload.get("email")
        if not email:
            email = f"user_{user_id}@temp.com"

        username = (
            payload.get("username") or       # Clerk's username field
            payload.get("preferred_username") or  # OIDC standard
            None  # Will be generated in get_or_create_user
        )

        first_name = (
            payload.get("given_name") or     # OIDC standard (Google, Apple use this)
            payload.get("first_name") or     # Some providers use this
            None
        )
        last_name = (
            payload.get("family_name") or    # OIDC standard
            payload.get("last_name") or      # Some providers use this
            None
        )

        # If we have full name but not first/last, try to split it
        if not first_name and not last_name:
            full_name = payload.get("name")
            if full_name and " " in full_name:
                parts = full_name.split(" ", 1)  # Split on first space only
                first_name = parts[0]
                last_name = parts[1] if len(parts) > 1 else None


        return {
            "user_id": user_id,
            "email": email,
            "username": username,      # Might be None
            "first_name": first_name,  # Might be None
            "last_name": last_name,    # Might be None

            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")