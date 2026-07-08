# schemas/projects.py
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime, date
from enum import Enum


# ============================================================
# ENUMS (mirror models.py)
# ============================================================

class ProjectStatus(str, Enum):
    PLANNING = "Planning"
    ACTIVE = "Active"
    ON_HOLD = "On Hold"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class ProjectHealth(str, Enum):
    GREEN = "Green"
    YELLOW = "Yellow"
    RED = "Red"

class TaskStatus(str, Enum):
    TODO = "Todo"
    IN_PROGRESS = "In Progress"
    IN_REVIEW = "In Review"
    DONE = "Done"


# ---- TaskCreate: add this field ----

class TaskCreate(BaseModel):
    task_name: str = Field(..., min_length=1, max_length=300)
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    progress_percentage: int = Field(default=0, ge=0, le=100)   # NEW
    assigned_to: Optional[int] = None
    due_date: Optional[date] = None


# ---- TaskUpdate: add this field ----

class TaskUpdate(BaseModel):
    task_name: Optional[str] = Field(default=None, min_length=1, max_length=300)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    progress_percentage: Optional[int] = Field(default=None, ge=0, le=100)   # NEW
    assigned_to: Optional[int] = None
    due_date: Optional[date] = None


# ---- TaskResponse: add this field ----

class TaskResponse(BaseModel):
    task_id: int
    project_id: int
    task_name: str
    description: Optional[str]
    status: TaskStatus
    progress_percentage: int                 # NEW
    assigned_to: Optional[int]
    due_date: Optional[date]
    created_at: datetime
    updated_at: datetime
    total_hours_logged: float = 0.0
    assignee_username: Optional[str] = None

    class Config:
        from_attributes = True



# ============================================================
# TEAM MEMBERS
# ============================================================

class TeamMemberOnboard(BaseModel):
    """Request: user sets up their project tracker profile"""
    github_username: Optional[str] = None

class TeamMemberUpdate(BaseModel):
    """Request: update profile fields"""
    github_username: Optional[str] = None

class TeamMemberResponse(BaseModel):
    """Response: TeamMember profile"""
    member_id: int
    user_id: str
    github_username: Optional[str]
    # Joined from Users table
    username: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# PROJECTS
# ============================================================

class ProjectCreate(BaseModel):
    """Request: create a new project"""
    project_name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.PLANNING
    health_indicator: ProjectHealth = ProjectHealth.GREEN
    is_github_integrated: bool = False
    github_repo_owner: Optional[str] = None   # e.g. 'facebook'
    github_repo_name: Optional[str] = None    # e.g. 'react'

    @field_validator('github_repo_owner', 'github_repo_name')
    @classmethod
    def github_fields_required_together(cls, v, info):
        """If one github field is set, both must be set"""
        return v

class ProjectUpdate(BaseModel):
    """Request: update project — all fields optional"""
    project_name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    health_indicator: Optional[ProjectHealth] = None
    is_github_integrated: Optional[bool] = None
    github_repo_owner: Optional[str] = None
    github_repo_name: Optional[str] = None

class ProjectMemberSummary(BaseModel):
    """Nested inside ProjectResponse — lightweight member info"""
    member_id: int
    username: str
    first_name: Optional[str]
    last_name: Optional[str]
    role: str
    joined_at: datetime

    class Config:
        from_attributes = True

class ProjectResponse(BaseModel):
    """Response: full project details"""
    project_id: int
    project_name: str
    description: Optional[str]
    status: ProjectStatus
    health_indicator: ProjectHealth
    project_owner_id: Optional[int]
    is_github_integrated: bool
    github_repo_owner: Optional[str]
    github_repo_name: Optional[str]
    created_at: datetime
    updated_at: datetime
    # Computed fields
    members: list[ProjectMemberSummary] = []
    task_count: int = 0
    completed_task_count: int = 0

    class Config:
        from_attributes = True

class ProjectListResponse(BaseModel):
    """Response: lightweight project for list views"""
    project_id: int
    project_name: str
    description: Optional[str]
    status: ProjectStatus
    health_indicator: ProjectHealth
    is_github_integrated: bool
    created_at: datetime
    member_count: int = 0
    task_count: int = 0
    completed_task_count: int = 0

    class Config:
        from_attributes = True


# ============================================================
# PROJECT MEMBERS & INVITATIONS
# ============================================================

class InviteMemberRequest(BaseModel):
    """Request: invite someone by email"""
    email: EmailStr
    role: str = Field(default='member', pattern='^(owner|member)$')

class UpdateMemberRoleRequest(BaseModel):
    """Request: change a member's role"""
    role: str = Field(..., pattern='^(owner|member)$')

class ProjectInvitationResponse(BaseModel):
    """Response: invitation details"""
    id: int
    project_id: int
    invited_email: str
    role: str
    status: str
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# TASKS
# ============================================================


class TaskCreate(BaseModel):
    """Request: create a task inside a project"""
    task_name: str = Field(..., min_length=1, max_length=300)
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    progress_percentage: int = Field(default=0, ge=0, le=100)
    assigned_to: Optional[int] = None   # member_id
    due_date: Optional[date] = None


class TaskUpdate(BaseModel):
    """Request: update task fields"""
    task_name: Optional[str] = Field(default=None, min_length=1, max_length=300)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    progress_percentage: Optional[int] = Field(default=None, ge=0, le=100)
    assigned_to: Optional[int] = None
    due_date: Optional[date] = None


class TaskResponse(BaseModel):
    """Response: task details"""
    task_id: int
    project_id: int
    task_name: str
    description: Optional[str]
    status: TaskStatus
    progress_percentage: int = 0
    assigned_to: Optional[int]
    due_date: Optional[date]
    created_at: datetime
    updated_at: datetime
    # Computed
    total_hours_logged: float = 0.0
    assignee_username: Optional[str] = None

    class Config:
        from_attributes = True

# ============================================================
# TIME LOGS
# ============================================================

class TimeLogCreate(BaseModel):
    """Request: manually log hours against a task"""
    hours_spent: float = Field(..., gt=0, le=24, description="Hours worked (e.g. 2.5)")
    logged_at: date = Field(default_factory=date.today)
    notes: Optional[str] = None

class TimeLogResponse(BaseModel):
    """Response: a single time log entry"""
    log_id: int
    task_id: int
    task_name: str
    member_id: int
    member_username: str
    hours_spent: float
    logged_at: date
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# GITHUB COMMITS
# ============================================================

class GithubCommitResponse(BaseModel):
    """Response: a single synced commit"""
    commit_id: int
    sha: str
    author_github_username: str
    member_id: Optional[int]        # None if no matching TeamMember found
    member_username: Optional[str]  # Resolved from TeamMembers.github_username
    commit_message: str
    commit_url: str
    committed_at: datetime

    class Config:
        from_attributes = True

class GithubSyncResponse(BaseModel):
    """Response: result of a manual GitHub sync"""
    new_commits: int
    total_commits: int
    unresolved_authors: list[str]   # github usernames with no matching TeamMember


# ============================================================
# TRACKING (analytics)
# ============================================================

class MemberTrackingBreakdown(BaseModel):
    """Per-member total hours in the tracking tab"""
    member_id: int
    username: str
    total_hours: float

class ProjectTrackingResponse(BaseModel):
    """Response: full tracking tab data"""
    project_id: int
    project_name: str
    total_hours: float
    member_breakdown: list[MemberTrackingBreakdown]
    # Only populated if is_github_integrated = True
    recent_commits: list[GithubCommitResponse] = []
    total_commit_count: int = 0


# ============================================================
# INVITATION CREATION RESPONSE (includes the shareable link)
# ============================================================
 
class ProjectInvitationCreateResponse(BaseModel):
    """
    Response for POST /api/projects/{id}/invite
 
    Includes invite_link since no mailer is wired up yet — the owner
    needs the raw link to share manually (email, DM, copy/paste).
    Once a real mailer is added, this field can stay for "copy link" UX
    even alongside an automatic email send.
    """
    id: int
    project_id: int
    invited_email: str
    role: str
    status: str
    expires_at: datetime
    created_at: datetime
    invite_link: str
 
    class Config:
        from_attributes = True
 
 
# ============================================================
# INVITATION TOKEN FLOW (public preview + accept)
# ============================================================
 
class InvitationPreviewResponse(BaseModel):
    """
    Response for GET /api/invitations/{token}
    Public endpoint — no auth required. Shown before the user logs in/signs up,
    mirrors how Jira/Linear show "You've been invited to X" before the auth wall.
    """
    project_id: int
    project_name: str
    project_description: Optional[str]
    invited_email: str
    invited_by_name: str          # display name of the inviter (joined from Users)
    role: str
    status: str                   # pending | accepted | declined | expired
    expires_at: datetime
 
    class Config:
        from_attributes = True
 
 
class InvitationAcceptResponse(BaseModel):
    """
    Response for POST /api/invitations/{token}/accept
    Confirms the result of accepting — including whether a TeamMember
    profile was auto-created (first-time tracker user).
    """
    project_id: int
    project_name: str
    member_id: int
    role: str
    team_member_auto_created: bool   # True if this accept also created their TeamMember profile
 
 
# ============================================================
# Add this field to the existing TeamMemberResponse usage —
# no model change needed, just noting that GET /team-members/me
# should return 404 (not an empty object) if the profile doesn't exist yet,
# so the frontend can distinguish "not onboarded" from "onboarded with zero rate"
# ============================================================
 