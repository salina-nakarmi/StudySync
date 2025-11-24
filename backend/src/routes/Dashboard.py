from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database.database import async_session_local
from ..database.models import Users
from ..utils import authenticate_and_get_user_details

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

# Dependency: Provide DB session
async def get_db():
    async with async_session_local() as session:
        yield session

@router.get("/")
async def get_dashboard(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Get dashboard data for authenticated user
    """
    try:
        auth_details = authenticate_and_get_user_details(request)
        user_id = auth_details["user_id"]
        
        # Fetch user data
        result = await db.execute(select(Users).where(Users.user_id == user_id))
        user = result.scalars().first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "message": "Dashboard data",
            "user": {
                "user_id": user.user_id,
                "username": user.username,
                "email": user.email
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))