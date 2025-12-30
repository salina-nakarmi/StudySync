''' fastapi dependencies for authentication and user management
    this is where the user creation magic happens 
    
    every protected route uses get_current_user dependency
    whcih automatically creates users on first request.'''

from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from .database.database import get_db
from .database.models import Users
from .services.user_service import get_or_create_user
from .utils import authenticate_and_get_user_details

async def get_current_user(
        request: Request,
        db: AsyncSession = Depends(get_db)
        ) -> Users:
    ''' How it works:
    1. Verify JWT token with Clerk (using utils.py)
    2. Check if user exists in OUR database
    3. If NOT exist: Create them automatically (lazy creation!)
    4. Return the user object
    
    request in args contains Jwt_token in headers
    
    returns users if created first time'''

    auth_details = authenticate_and_get_user_details(request)

    user = await get_or_create_user(
        session = db,
        user_id=auth_details["user_id"],
        email=auth_details["email"],
        first_name= auth_details.get("first_name"),
        last_name= auth_details.get("last_name"),
        username=auth_details.get("username"),
    )

    return user

# Optional: Dependency to just get user_id without creating user
async def get_current_user_id(request: Request) -> str:
    """
    Just verify authentication and return user_id (no database access)
    
    Use this for routes that don't need full user object.
    More efficient than get_current_user() if you only need the ID.
    
    Example:
    @router.get("/quick-check")
    async def quick(user_id: str = Depends(get_current_user_id)):
        return {"user_id": user_id}
    """
    auth_details = authenticate_and_get_user_details(request)
    return auth_details["user_id"]

# Contains get_current_user() - the dependency all routes use