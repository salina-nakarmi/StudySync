from pydantic import BaseModel
from datetime import date

class DailyActivityResponse(BaseModel):
    activity_date: date
    total_seconds: int
    session_count: int

    class Config:
        from_attributes = True
