import enum
from datetime import datetime
from .database import Base
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy import ForeignKey, func, PrimaryKeyConstraint, Boolean, Enum

class GroupRole(enum.Enum):
    LEADER="leader" #Can have multiple leaders in shared group
    MEMBER="member"
    ADMIN= "admin"

class GroupType(enum.Enum):
    LEADER_CONTROLLED = "leader_controlled"  # Only leaders manage resources
    COMMUNITY = "community"  # Any member can manage resources

class GroupVisibility(enum.Enum):
    PUBLIC = "public"  # Anyone can join
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

class MessageType(enum.Enum):
    IMAGE="image"
    TEXT = "text"

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
    
    group_name: Mapped[str] = mapped_column(index=True)
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
    group_id: Mapped[int] = mapped_column(ForeignKey('groups.id'))

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



class TimeSpends(Base):
    """
    Track time spent in groups
    """
    __tablename__='timespends'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)  # FIXED missing PK

    user_id:Mapped[str]=mapped_column(ForeignKey('users.user_id'))
    group_id:Mapped[int]=mapped_column(ForeignKey('groups.id'))

    duration_seconds:Mapped[int]
    session_date: Mapped[datetime] = mapped_column(default=func.now())  # Date of study session

    started_at:Mapped[datetime]=mapped_column(default=func.now())
    ended_at:Mapped[datetime|None]    
  
    

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

    # Thread support
    reply_to_id: Mapped[int | None] = mapped_column(ForeignKey('messages.id'))

    is_edited: Mapped[bool] = mapped_column(Boolean, default=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at:Mapped[datetime]=mapped_column(default=func.now())
    updated_at:Mapped[datetime]=mapped_column(default=func.now(), onupdate=func.now())



class Notifications(Base):
    """
    User notifications for various events
    """
    __tablename__ = 'notifications'

    id:Mapped[int]=mapped_column(primary_key=True, autoincrement=True)
    user_id:Mapped[str]=mapped_column(ForeignKey('users.user_id'))

    notification_message:Mapped[str]
    notification_type: Mapped[str]  # e.g., 'invitation', 'mention', 'resource_added'

    is_read:Mapped[bool]=mapped_column(Boolean, default=False) 
    created_at:Mapped[datetime]=mapped_column(default=func.now())  


    
 
