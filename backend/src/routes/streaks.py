from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..services.streak_service import update_streak as update_streak_logic
from ..database.models import Streaks

router = APIRouter(prefix="/streaks", tags=["streaks"])



from fastapi import APIRouter, Request, HTTPException, Depends
from services.streak_service import update_streak as update_streak_logic
from database.models import User, Streaks
from sqlalchemy.orm import Session
from database.database import get_db

router = APIRouter(prefix="/streaks", tags=["streaks"])

@router.post("/update")
def update_streak_me(request: Request, db: Session = Depends(get_db)):
    """
    Update the streak for the currently authenticated user.
    """
    try:
        # Assuming user authentication is handled elsewhere
        user_id = request.state.user_id  # e.g. middleware sets this
        update_streak_logic(db, user_id)
        return {"message": f"Streak updated for user {user_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.post("/update/{user_id}")
def update_streak_by_id(user_id: int, db: Session = Depends(get_db)):
    """
    Update the streak for a specific user by ID.
    """
    try:
        update_streak_logic(db, user_id)
        return {"message": f"Streak updated for user {user_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# use /update for the logged-in user and /update/{user_id} for admin/testing.