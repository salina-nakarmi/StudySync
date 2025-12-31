from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# ============================================================================
# STUDY SESSION SCHEMAS
# ============================================================================

class StudySessionCreate(BaseModel):
    """Schema for creating/starting a study session"""
    group_id: Optional[int] = Field(None, description="Optional: Study within a specific group")
    session_notes: Optional[str] = Field(None, max_length=1000, description="Notes about what you're studying")

class StudySessionStart(BaseModel):
    """Schema for starting a timer (minimal data needed)"""
    group_id: Optional[int] = None

class StudySessionEnd(BaseModel):
    """Schema for ending a study session"""
    duration_seconds: int = Field(..., ge=1, description="Total duration in seconds")
    session_notes: Optional[str] = Field(None, max_length=1000)
    group_id: Optional[int] = None

class StudySessionUpdate(BaseModel):
    """Schema for updating session notes"""
    session_notes: Optional[str] = Field(None, max_length=1000)

class StudySessionResponse(BaseModel):
    """Schema for study session responses"""
    id: int
    user_id: str
    group_id: Optional[int]
    duration_seconds: int
    session_date: datetime
    session_notes: Optional[str]
    started_at: datetime
    ended_at: datetime
    created_at: datetime
    
    # Computed fields
    duration_minutes: Optional[int] = None
    duration_hours: Optional[float] = None
    
    class Config:
        from_attributes = True

class StudySessionWithGroupInfo(StudySessionResponse):
    """Enhanced response with group details"""
    group_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# ============================================================================
# ANALYTICS SCHEMAS
# ============================================================================

class DailyStudyStats(BaseModel):
    """Daily study statistics"""
    date: str  # YYYY-MM-DD format
    total_seconds: int
    total_minutes: int
    total_hours: float
    session_count: int

class WeeklyStudyStats(BaseModel):
    """Weekly study statistics"""
    week_start: str  # YYYY-MM-DD format
    week_end: str
    total_seconds: int
    total_minutes: int
    total_hours: float
    session_count: int
    daily_breakdown: list[DailyStudyStats]

class MonthlyStudyStats(BaseModel):
    """Monthly study statistics"""
    month: str  # YYYY-MM format
    total_seconds: int
    total_minutes: int
    total_hours: float
    session_count: int
    daily_breakdown: list[DailyStudyStats]

class StudyAnalytics(BaseModel):
    """Comprehensive study analytics"""
    total_study_time_seconds: int
    total_study_time_hours: float
    total_sessions: int
    average_session_minutes: float
    longest_session_minutes: int
    shortest_session_minutes: int
    most_productive_hour: Optional[int] = None  # 0-23
    study_streak_days: int
    sessions_this_week: int
    sessions_this_month: int

class GroupStudyStats(BaseModel):
    """Study statistics for a specific group"""
    group_id: int
    group_name: str
    total_study_time_seconds: int
    total_study_time_hours: float
    session_count: int
    last_studied: Optional[datetime]
    percentage_of_total: float  # Percentage of user's total study time

# ============================================================================
# LEADERBOARD SCHEMAS
# ============================================================================

class LeaderboardEntry(BaseModel):
    """Entry in a leaderboard"""
    user_id: str
    username: str
    first_name: Optional[str]
    last_name: Optional[str]
    total_study_time_seconds: int
    total_study_time_hours: float
    session_count: int
    rank: int
    is_current_user: bool = False

class GroupLeaderboard(BaseModel):
    """Leaderboard for a specific group"""
    group_id: int
    group_name: str
    time_period: str  # "all_time", "monthly", "weekly"
    entries: list[LeaderboardEntry]
    current_user_rank: Optional[int] = None
    total_participants: int

# ============================================================================
# ACTIVE SESSION SCHEMAS (for real-time tracking)
# ============================================================================

class ActiveSessionCreate(BaseModel):
    """Create an active session (timer started)"""
    group_id: Optional[int] = None

class ActiveSessionResponse(BaseModel):
    """Response for active session"""
    session_id: str  # Temporary ID before committing to DB
    user_id: str
    group_id: Optional[int]
    started_at: datetime
    elapsed_seconds: int

class ActiveSessionEnd(BaseModel):
    """End an active session"""
    session_id: str
    final_notes: Optional[str] = None

# ============================================================================
# QUERY SCHEMAS
# ============================================================================

class StudySessionQuery(BaseModel):
    """Query parameters for filtering study sessions"""
    group_id: Optional[int] = Field(None, description="Filter by group")
    start_date: Optional[datetime] = Field(None, description="Filter sessions after this date")
    end_date: Optional[datetime] = Field(None, description="Filter sessions before this date")
    skip: int = Field(0, ge=0)
    limit: int = Field(50, ge=1, le=200)

class AnalyticsQuery(BaseModel):
    """Query parameters for analytics"""
    period: str = Field("all_time", description="all_time, monthly, weekly, daily")
    group_id: Optional[int] = Field(None, description="Filter by specific group")
    year: Optional[int] = Field(None, ge=2020, le=2100)
    month: Optional[int] = Field(None, ge=1, le=12)
    week: Optional[int] = Field(None, ge=1, le=53)