from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database.database import get_db
from ..database.models import Users
from ..utils import authenticate_and_get_user_details

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


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
                "email": user.email,
                "total_study_time": user.total_study_time,
                "created_at": user.created_at.isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/", response_model=UserResponse, status_code=201)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new user (typically called after Clerk signup webhook)
    """
    try:
        # Check if user already exists
        result = await db.execute(
            select(Users).where(Users.user_id == user_data.user_id)
        )
        existing_user = result.scalars().first()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Create new user
        new_user = Users(
            user_id=user_data.user_id,
            username=user_data.username,
            email=user_data.email,
            total_study_time=0
        )
        
        db.add(new_user)
        # Commit happens automatically in get_db
        
        # Refresh to get generated timestamps
        await db.refresh(new_user)
        
        return new_user
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))