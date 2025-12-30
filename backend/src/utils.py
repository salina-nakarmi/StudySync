# Clerk Authentication verification for Backend
from fastapi import HTTPException, Request
from clerk_backend_api import Clerk, AuthenticateRequestOptions
import os
from dotenv import load_dotenv
import cloudinary

load_dotenv()


# Configure Cloudinary on app startup
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True  # Use HTTPS
)


clerk_sdk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))

def authenticate_and_get_user_details(request: Request) -> dict:
    """
   Authenticate request using Clerk and extract user details from headers
    
    Frontend sends user data in custom headers:
    - X-User-Email
    - X-User-First-Name
    - X-User-Last-Name
    - X-User-Username

    """
    try:
        #verify jwt token
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

        # Step 2: Extract user details from headers (sent by frontend)
        email = request.headers.get("x-user-email") or f"user_{user_id}@temp.com"
        first_name = request.headers.get("x-user-first-name") or None
        last_name = request.headers.get("x-user-last-name") or None
        username = request.headers.get("x-user-username") or None

        #Generate username if not provided
        if not username:
            if first_name and last_name:
                username = f"{first_name}_{last_name}".lower()
                username = ''.join(c if c.isalnum() or c == '_' else '_' for c in username)
            elif first_name:
                username = f"{first_name.lower()}_{user_id[:8]}"
            else:
                username = f"user_{user_id[:8]}"

        result = {
            "user_id": user_id,
            "email": email,
            "username": username,
            "first_name": first_name if first_name else None,
            "last_name": last_name if last_name else None,
        }

        print(f"✅ User details from frontend headers: {result}\n")
        return result
            
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Authentication error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")