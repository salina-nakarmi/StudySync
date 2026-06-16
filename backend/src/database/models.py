import enum
import uuid
from datetime import datetime, date
from .database import Base
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy import ForeignKey, func, PrimaryKeyConstraint, Boolean, Enum, UniqueConstraint, Numeric, Text, Index

class GroupRole(enum.Enum):
    LEADER="leader" #Can have multiple leaders in shared group
    MEMBER="member"
    ADMIN= "admin"

class GroupType(enum.Enum):
    LEADER_CONTROLLED = "leader_controlled"  # Only leaders manage resources
    COMMUNITY = "community"  # Any member can manage resources

class GroupVisibility(enum.Enum):
    PUBLIC = "public" #anyone can join
    PRIVATE = "private"  # Invitation required

class InvitationStatus(enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"

class ResourceType(enum.Enum):
    IMAGE="image"
    VIDEO="video"
    FILE="file"
    FOLDER="folder"
    LINK ="link" # external URL

class ResourceStatus(enum.Enum):
    """Self-reported resource completion status"""
    NOT_STARTED="not_started"
    IN_PROGRESS="in_progress"
    COMPLETED="completed"
    PAUSED="paused"

class MessageType(enum.Enum):
    IMAGE="image"
    TEXT = "text"

# ============================================================
# ENUMS — Project Tracker
# ============================================================
 
class ProjectStatus(enum.Enum):
    PLANNING = "Planning"
    ACTIVE = "Active"
    ON_HOLD = "On Hold"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
 
class ProjectHealth(enum.Enum):
    GREEN = "Green"
    YELLOW = "Yellow"
    RED = "Red"
 
class TaskStatus(enum.Enum):
    TODO = "Todo"
    IN_PROGRESS = "In Progress"
    IN_REVIEW = "In Review"
    DONE = "Done"
 
 

# clerk gives user_id in str format so, "user_2ab34CDeFG" user_id and its related foreing key will be in str format
class Users(Base):
    """
    Minimal user table - Clerk manages authentication
    Store only what's needed for app logic and quick lookups
    """
    __tablename__ = 'users'

    user_id:Mapped[str]=mapped_column(primary_key=True) # from Clerk

    # Cache these for performance (sync from Clerk on create/update)
    username:Mapped[str]= mapped_column(unique=True, index=True) #index true for faster search
    email:Mapped[str]= mapped_column(unique=True)

    first_name: Mapped[str | None]
    last_name: Mapped[str  | None]

    # App-specific data
    # Denormalized field: Updated whenever a StudySession is created
    # Kept for performance (avoids SUM query on every dashboard load)
    total_study_time: Mapped[int] = mapped_column(default=0)  # Total seconds
    preferences: Mapped[str | None]  # JSON string for settings

    created_at:Mapped[datetime] = mapped_column(default=func.now())
    updated_at:Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())


class Groups(Base):
    """
    Enhanced Groups with support for:
    - Public/Private visibility
    - Leader-controlled vs Community types
    - Multiple leaders support
    """
    __tablename__ = 'groups'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

     # Creator (first leader)
    creator_id: Mapped[str] = mapped_column(ForeignKey('users.user_id'))
    
    group_name: Mapped[str] = mapped_column(index=True) #creates a "map" that lets the database find that name instantly.
    description: Mapped[str | None]
    image: Mapped[str | None]

     # Group configuration
    group_type: Mapped[GroupType] = mapped_column(
        Enum(GroupType), 
        default=GroupType.LEADER_CONTROLLED
    )
    visibility: Mapped[GroupVisibility] = mapped_column(
        Enum(GroupVisibility), 
        default=GroupVisibility.PUBLIC
    )

    # For private groups
    invite_code: Mapped[str | None] = mapped_column(unique=True, index=True)
    max_members: Mapped[int | None]  # Optional capacity limit

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())

class Groupings(Base):
    """
    User-Group membership with roles and invitation tracking
    Supports multiple leaders per group
    """
    __tablename__ = 'groupings'

    user_id: Mapped[str] = mapped_column(ForeignKey('users.user_id'))
    group_id: Mapped[int] = mapped_column(ForeignKey('groups.id'))

    role: Mapped[GroupRole] = mapped_column(Enum(GroupRole), default=GroupRole.MEMBER)

    # Invitation tracking (for private groups)
    invitation_status: Mapped[InvitationStatus | None] = mapped_column(Enum(InvitationStatus))
    invited_by: Mapped[str | None] = mapped_column(ForeignKey('users.user_id'))
    invited_at: Mapped[datetime | None]
    
    joined_at: Mapped[datetime] = mapped_column(default=func.now())
    
    # Session tracking
    is_connected: Mapped[bool] = mapped_column(Boolean, default=False)
    last_seen: Mapped[datetime | None]

    __table_args__ = (
        PrimaryKeyConstraint('user_id', 'group_id'),
    )

class GroupInvitations(Base):
    """
    Separate table for pending invitations
    Makes it easier to manage and expire invitations
    """
    __tablename__ = 'group_invitations'
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    group_id: Mapped[int] = mapped_column(ForeignKey('groups.id'))
    invited_user_id: Mapped[str] = mapped_column(ForeignKey('users.user_id'))
    invited_by: Mapped[str] = mapped_column(ForeignKey('users.user_id'))
    
    status: Mapped[InvitationStatus] = mapped_column(
        Enum(InvitationStatus), 
        default=InvitationStatus.PENDING
    )
    
    invitation_message: Mapped[str | None]
    expires_at: Mapped[datetime]  # Auto-decline after expiry
    
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    responded_at: Mapped[datetime | None]


class Resources(Base):
    """
    Resources shared within groups
    Permissions based on group_type in Groups table
    """
    __tablename__='resources'

    id:Mapped[int]=mapped_column(primary_key=True, autoincrement=True)

    uploaded_by: Mapped[str] = mapped_column(ForeignKey('users.user_id'))
    group_id: Mapped[int | None] = mapped_column(ForeignKey('groups.id')) #Optional for private resource tracking as well

    url: Mapped[str]
    resource_type: Mapped[ResourceType] = mapped_column(Enum(ResourceType))
    
    title: Mapped[str]  # Add title
    description: Mapped[str | None]

    # Optional: folder organization
    parent_folder_id: Mapped[int | None] = mapped_column(ForeignKey('resources.id'))
    
    file_size: Mapped[int | None]  # bytes
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())
    
class ResourceProgress(Base):
    """
    Page-based progress tracking for PDFs and documents
    """
    __tablename__ = 'resource_progress'
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.user_id'))
    resource_id: Mapped[int] = mapped_column(ForeignKey('resources.id'))
    
    # Page-based tracking (replaces percentage)
    current_page: Mapped[int] = mapped_column(default=0)
    
    # Auto-calculated percentage
    progress_percentage: Mapped[int] = mapped_column(default=0)  # Computed field
    
    # Status tracking
    status: Mapped[ResourceStatus] = mapped_column(
        Enum(ResourceStatus),
        default=ResourceStatus.NOT_STARTED
    )
    
    # User's notes
    notes: Mapped[str | None]
    
    # Timestamps
    started_at: Mapped[datetime | None]
    completed_at: Mapped[datetime | None]
    last_updated: Mapped[datetime] = mapped_column(
        default=func.now(), 
        onupdate=func.now()
    )
    
    created_at: Mapped[datetime] = mapped_column(default=func.now())

class StudySessions(Base):
    """
    NEW TABLE (replaces TimeSpends): Track study sessions with group context
    User starts/stops timer, we log the session
    """
    __tablename__ = 'study_sessions'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.user_id'))
    group_id: Mapped[int | None] = mapped_column(ForeignKey('groups.id'))  # Optional: can study without group
    
    # Session details
    duration_seconds: Mapped[int]
    session_date: Mapped[datetime] = mapped_column(index=True)  # Index for date queries
    
    # Optional: User can add notes about what they studied
    session_notes: Mapped[str | None]
    
    started_at: Mapped[datetime]
    ended_at: Mapped[datetime]
    
    created_at: Mapped[datetime] = mapped_column(default=func.now())

class Streaks(Base):
    __tablename__ = 'streaks'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.user_id'), unique=True)

    current_streak: Mapped[int] = mapped_column(default=0)
    longest_streak: Mapped[int] = mapped_column(default=0)
    last_active_date: Mapped[datetime | None]
    streak_start_date: Mapped[datetime | None]

    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())
    

class Messages(Base):
    """
    Group chat messages
    """
    __tablename__='messages'

    id:Mapped[int]=mapped_column(primary_key=True, autoincrement=True)
    user_id:Mapped[str]=mapped_column(ForeignKey('users.user_id'))
    group_id:Mapped[int]=mapped_column(ForeignKey('groups.id'))
    content:Mapped[str]
    message_type:Mapped[str]=mapped_column(Enum(MessageType, default=MessageType.TEXT))
    
    is_reply:Mapped[bool] = mapped_column
    is_edited: Mapped[bool] = mapped_column(Boolean, default=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    seen_no: Mapped[int] = mapped_column(default = 0)
    created_at:Mapped[datetime]=mapped_column(default=func.now())
    updated_at:Mapped[datetime]=mapped_column(default=func.now(), onupdate=func.now())


class Replying(Base):

    __tablename__ = "replying"
    
    id:Mapped[int] = mapped_column(primary_key=True, autoincrement = True)
    message_id:Mapped[int] = mapped_column(ForeignKey('messages.id'))
    group_id:Mapped[int] = mapped_column(ForeignKey('groups.id'))
    replied_message_id:Mapped[int] = mapped_column(ForeignKey('messages.id'))
    replied_to_id:Mapped[str] = mapped_column(ForeignKey('users.user_id'))
    replied_by_id:Mapped[str] = mapped_column(ForeignKey('users.user_id'))


class DirectMessages(Base):
    """direct messages between users outside of groups"""
    __tablename__ = 'direct_messages'
    
    id: Mapped[int] = mapped_column(primary_key = True, autoincrement = True)
    sender_id:Mapped[str]=mapped_column(ForeignKey('users.user_id'))
    receiver_id:Mapped[str]=mapped_column(ForeignKey('users.user_id'))
    content:Mapped[str]
    message_type:Mapped[str]=mapped_column(Enum(MessageType, default=MessageType.TEXT))    
    is_reply:Mapped[bool] = mapped_column
    is_edited: Mapped[bool] = mapped_column(Boolean, default=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    seen_no: Mapped[int] = mapped_column(default = 0)
    created_at:Mapped[datetime]=mapped_column(default=func.now())
    updated_at:Mapped[datetime]=mapped_column(default=func.now(), onupdate=func.now())

class DirectMessagesReplying(Base):

    __tablename__ = "direct_messages_replying"
    
    id:Mapped[int] = mapped_column(primary_key=True, autoincrement = True)
    message_id:Mapped[int] = mapped_column(ForeignKey('direct_messages.id'))
    replied_message_id:Mapped[int] = mapped_column(ForeignKey('direct_messages.id'))
    replied_to_id:Mapped[str] = mapped_column(ForeignKey('users.user_id'))
    replied_by_id:Mapped[str] = mapped_column(ForeignKey('users.user_id'))


class Notifications(Base):
    """
    User notifications for various events
    """
    __tablename__ = 'notifications'

    id:Mapped[int]=mapped_column(primary_key=True, autoincrement=True)
    user_id:Mapped[str]=mapped_column(ForeignKey('users.user_id'))
    title = Mapped[str]
    notification_message:Mapped[str]
    notification_type:Mapped[str]
    is_read:Mapped[bool]=mapped_column(Boolean, default=False) 
    created_at:Mapped[datetime]=mapped_column(default=func.now())  


class ChatConversations(Base):
    """
    Store chatbot conversation history for personalized AI responses
    Each message (user + assistant) is stored separately
    """
    __tablename__ = 'chat_conversations'
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.user_id'), index=True)
    
    # Message content
    role: Mapped[str]  # 'user' or 'assistant'
    content: Mapped[str]  # The actual message
    
    # Optional: Session grouping (for future multi-conversation support)
    session_id: Mapped[str | None] = mapped_column(index=True)
    
    # Metadata
    tokens_used: Mapped[int | None]  # Track AI token usage
    model_used: Mapped[str | None]  # Which AI model was used
    
    created_at: Mapped[datetime] = mapped_column(default=func.now(), index=True)
    
    # For soft deletion (keep history but hide from UI)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)

class DailyActivity(Base):
    """
    NEW TABLE: Summarizes activity per day for the heatmap calendar.
    Ensures 'green squares' are saved and easily queryable.
    """
    __tablename__ = 'daily_activity'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.user_id'), index=True)
    
    # Use date only (no time) to make grouping easy
    activity_date: Mapped[date] = mapped_column(index=True) 
    
    # Store total seconds for the day to determine "shade of green"
    total_seconds: Mapped[int] = mapped_column(default=0)
    
    # Optional: track session count for that day
    session_count: Mapped[int] = mapped_column(default=0)

    # Unique constraint so you only have one row per user/day
    __table_args__ = (UniqueConstraint('user_id', 'activity_date', name='_user_date_uc'),)

 
# ============================================================
# PROJECT TRACKER MODELS
# ============================================================
  
class TeamMembers(Base):
    """
    Project tracker participants.
 
    Optionally linked to a StudySync Users account via `user_id`.
    Someone can be a team member without ever touching the StudySync
    study/group features — or they can have both.
 
    The `github_username` field is used to resolve commit authors from
    the GitHub API back to an internal team member.
    """
    __tablename__ = 'team_members'
 
    member_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
 
    # Every team member must have a StudySync (Clerk) account.
    # Created lazily on first request like all other users — but the
    # TeamMember profile itself is created manually when the user opts
    # into the project tracker (so hourly_rate / github_username can
    # be filled in intentionally).
    # UNIQUE: one Clerk account → at most one team member profile.
    user_id: Mapped[str] = mapped_column(
        ForeignKey('users.user_id', ondelete='CASCADE'),
        unique=True,
        index=True,
    )
 
    # full_name and email are intentionally NOT duplicated here —
    # they already live on Users (synced from Clerk). Join to Users
    # whenever you need to display a member's name or contact.
 
    # Numeric(10,2): up to 99,999,999.99 with cent precision
    hourly_rate: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
 
    # Used to match GitHub commit authors to this member automatically
    github_username: Mapped[str | None] = mapped_column(unique=True, index=True, default=None)
 
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())
 
 
class Projects(Base):
    """
    A project being tracked. Supports GitHub integration for commit syncing.
    """
    __tablename__ = 'projects'
 
    project_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
 
    project_name: Mapped[str]
    description: Mapped[str | None]
 
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus),
        default=ProjectStatus.PLANNING,
    )
    health_indicator: Mapped[ProjectHealth] = mapped_column(
        Enum(ProjectHealth),
        default=ProjectHealth.GREEN,
    )
 
    # Numeric(12,2): up to 9,999,999,999.99
    budget: Mapped[float] = mapped_column(Numeric(12, 2))
 
    # The member who owns/leads this project
    project_owner_id: Mapped[int | None] = mapped_column(
        ForeignKey('team_members.member_id', ondelete='SET NULL'),
        default=None,
    )
 
    # GitHub integration — store owner + repo name separately so we can
    # call the API without parsing a URL each time
    is_github_integrated: Mapped[bool] = mapped_column(Boolean, default=False)
    github_repo_owner: Mapped[str | None] = mapped_column(default=None)  # e.g. 'facebook'
    github_repo_name: Mapped[str | None] = mapped_column(default=None)   # e.g. 'react'
 
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())
 
# ============================================================
# ADD THIS TO models.py — ProjectInvitations table
# ============================================================

# Add this import at the top of models.py if not already there:
# import secrets

class ProjectInvitations(Base):
    __tablename__ = 'project_invitations'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    project_id: Mapped[int] = mapped_column(ForeignKey('projects.project_id', ondelete='CASCADE'))
    invited_by: Mapped[int] = mapped_column(ForeignKey('team_members.member_id', ondelete='CASCADE'))

    invited_email: Mapped[str] = mapped_column(index=True)  # Email of the invitee
    role: Mapped[str] = mapped_column(default='member')     # Role they'll get on joining

    # Unique token for the invite link: /join?token=xxx
    token: Mapped[str] = mapped_column(unique=True, index=True)

    status: Mapped[InvitationStatus] = mapped_column(
        Enum(InvitationStatus),
        default=InvitationStatus.PENDING
    )

    expires_at: Mapped[datetime]          # 7-day expiry
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    responded_at: Mapped[datetime | None]

class ProjectMembers(Base):
    """
    Many-to-many: which team members are on which projects.
    Mirrors the Groupings pattern from the StudySync side.
    """
    __tablename__ = 'project_members'
 
    project_id: Mapped[int] = mapped_column(ForeignKey('projects.project_id', ondelete='CASCADE'))
    member_id: Mapped[int] = mapped_column(ForeignKey('team_members.member_id', ondelete='CASCADE'))
 
    # Simple role string — extend to an Enum if needed later
    role: Mapped[str] = mapped_column(default='member')  # 'owner' | 'member'
 
    joined_at: Mapped[datetime] = mapped_column(default=func.now())
 
    __table_args__ = (
        PrimaryKeyConstraint('project_id', 'member_id'),
    )
 
 
class Tasks(Base):
    """
    A unit of work inside a project, optionally assigned to a team member.
    """
    __tablename__ = 'tasks'
 
    task_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
 
    project_id: Mapped[int] = mapped_column(
        ForeignKey('projects.project_id', ondelete='CASCADE'),
        index=True,
    )
    assigned_to: Mapped[int | None] = mapped_column(
        ForeignKey('team_members.member_id', ondelete='SET NULL'),
        default=None,
    )
 
    task_name: Mapped[str]
    description: Mapped[str | None]
 
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus),
        default=TaskStatus.TODO,
    )
 
    due_date: Mapped[date | None]
 
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())
 
 
class TimeLogs(Base):
    """
    Hours logged by a team member against a specific task.
    Used to calculate labour cost: hours_spent × member.hourly_rate.
    """
    __tablename__ = 'time_logs'
 
    log_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
 
    task_id: Mapped[int] = mapped_column(
        ForeignKey('tasks.task_id', ondelete='CASCADE'),
        index=True,
    )
    member_id: Mapped[int] = mapped_column(
        ForeignKey('team_members.member_id', ondelete='CASCADE'),
    )
 
    # Numeric(5,2): up to 999.99 hours per log entry
    hours_spent: Mapped[float] = mapped_column(Numeric(5, 2))
 
    logged_at: Mapped[date]         # The work date (not the insert date)
    notes: Mapped[str | None]       # Optional: what was worked on
 
    created_at: Mapped[datetime] = mapped_column(default=func.now())
 
 
class GithubCommits(Base):
    """
    Ledger of commits synced from the GitHub API for integrated projects.
 
    `sha` has a unique constraint to prevent duplicate imports on re-sync.
    `member_id` is resolved by matching `author_github_username` against
    TeamMembers.github_username at sync time — null if no match found.
    """
    __tablename__ = 'github_commits'
 
    commit_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
 
    project_id: Mapped[int] = mapped_column(
        ForeignKey('projects.project_id', ondelete='CASCADE'),
        index=True,
    )
 
    sha: Mapped[str] = mapped_column(unique=True, index=True)          # Prevents duplicate syncs
    author_github_username: Mapped[str]                                 # Raw value from GitHub API
    member_id: Mapped[int | None] = mapped_column(                     # Resolved internal user
        ForeignKey('team_members.member_id', ondelete='SET NULL'),
        default=None,
    )
 
    commit_message: Mapped[str] = mapped_column(Text)
    commit_url: Mapped[str]
    committed_at: Mapped[datetime]                                      # GitHub's authored/committed timestamp
 
    created_at: Mapped[datetime] = mapped_column(default=func.now())   # When we synced it
 