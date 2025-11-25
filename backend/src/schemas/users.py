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
    pass

# response model returned by api
class UserResponse(UserBase):
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