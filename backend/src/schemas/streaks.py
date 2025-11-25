from pydantic import BaseModel, Field
from datetime import date
from typing import Optional

class StreakResponse(BaseModel):
    # Response model for user's streak data
    user_id: str
    current_streak: int = Field(..., ge=0, description="Current streak count in days")
    longest_streak: int = Field(..., ge=0, description="Longest streak count in days")
    last_active_date: Optional[str] = Field(None, description="last activity date (ISO format)")
    streak_start_date: Optional[str] = Field(None, description="Current streak start date")

    class Config:
        from_attributes = True

class StreakUpdateResponse(BaseModel):
    # Response  after updating streak
    message: str
    current_streak: int
    longest_streak: int
    streak_start_date: Optional[str] = None
