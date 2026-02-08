from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database.database import get_db
from ..database.models import Users
from ..schemas.users import UserResponse, CurrentUserResponse
from ..dependencies import get_current_user
from ..services.user_service import update_user

router = APIRouter(prefix="/users", tags=["Users"])

# get current logged-in user

@router.get("/me", response_model=CurrentUserResponse)
async def get_my_profile(
    current_user: Users = Depends(get_current_user)):
    """
    Get the currentuser's profile.

    If this is user's first request, they'll be
    created in database automatically by get_current_user dependency.
    
    Returns:
        User profile with all fields
    """
    return current_user


from pydantic import BaseModel
from typing import Optional
class UpdateProfileRequest(BaseModel):
    """Schema for updating user profile"""
    username: str = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    prefrences: Optional[str] = None
    preferences: str = None


@router.patch("/me", response_model=UserResponse)
async def update_my_profile(
    profile_data: UpdateProfileRequest,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update current user's profile
    
    Request body (all fields optional):
    {
        "username": "new_username",
        "first_name": "John",
        "last_name": "Doe",
        "preferences": "{\"theme\": \"dark\", \"notifications\": true}"
    }
    
    All fields are optional - only send the ones you want to update."""
    
    updated_user = await update_user(
        session=db,
        user_id=current_user.user_id,
        username=profile_data.username,
        first_name=profile_data.first_name,
        last_name=profile_data.last_name,
        preferences=profile_data.preferences
    )

    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return updated_user

@router.get("/{user_id}", response_model=UserResponse)
async def get_user_profile(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get any user's public profile by their ID
    
    it's for looking up
    other users, not the current user.
    """
    result = await db.execute(
        select(Users).where(Users.user_id == user_id)
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

async def get_username_by_id(id:str, session:AsyncSession):
    query = select(Users).where(Users.user_id==id)
    result = await session.execute(query)
    return result.scalar_one_or_none()