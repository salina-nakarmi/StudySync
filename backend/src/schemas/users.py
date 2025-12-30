from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    user_id: str = Field(..., description="Unique user ID from Clerk")
    username: str = Field(..., min_length=3, max_length=50, description="Username of the user")
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: EmailStr
    

# user creation through clerk
class UserCreate(UserBase):
    """Schema for creating a new user (rarely used with lazy creation)"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None

# response model returned by api
class UserResponse(UserBase):
    """Schema for user responses"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    total_study_time: int = Field(default=0, description="Total study time in seconds")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# for /users/me endpoint
class CurrentUserResponse(UserResponse):
    preferences: Optional[str] = Field(None, description="JSON string of user preferences")

    class Config:
        from_attributes = True

class UpdateProfileRequest(BaseModel):
    """Schema for updating user profile"""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    preferences: Optional[str] = Field(None, description="JSON string of preferences")