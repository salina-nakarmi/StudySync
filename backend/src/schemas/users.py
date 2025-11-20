from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    user_id: str
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: EmailStr
    phone_no:Optional[str]=None

# user creation through clerk
class UserCreate(UserBase):
    pass

# response model returned by api
class UserResponse(UserBase):
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# for /users/me response
class CurrentUserResponse(UserResponse):
    user_id: str
    email: EmailStr
    username: str

    class Config:
        orm_mode = True