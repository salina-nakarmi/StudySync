from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..schemas.users import UserCreate, UserResponse, CurrentUserResponse
from ..database.models import Users
from ..utils import authenticate_and_get_user_details
from ..database.database import async_session_local

router = APIRouter(prefix="/users", tags=["Users"])

# ---------------------------------------------------------
# Dependency: Provide DB session to routes
# ---------------------------------------------------------
async def get_db():
    async with async_session_local() as session:
        yield session

# get current logged-in user

@router.get("/me", response_model=CurrentUserResponse)
async def get_current_user(request: Request,
                           db: AsyncSession = Depends(get_db)):
    """
    Get the currently authenticated user's details.
    """
    try:
        auth_details = authenticate_and_get_user_details(request)
        user_id = auth_details["user_id"]

        result = await db.execute(select(Users).where(Users.user_id == user_id))
        user = result.scalars().first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return user
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))