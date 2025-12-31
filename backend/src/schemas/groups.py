from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from ..database.models import GroupType, GroupVisibility, GroupRole, InvitationStatus

# =============================================
# Group Schemas
# ================================================

class GroupBase(BaseModel):
    """Base schema for grup data"""
    group_name: str = Field(..., min_length=5, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    image: Optional[str] = None  # URL to group image
    group_type: GroupType = Field(default=GroupType.LEADER_CONTROLLED)
    visibility: GroupVisibility = Field(default=GroupVisibility.PUBLIC)
    max_members: Optional[int] = Field(None, ge=2, le=1000)

class GroupCreate(GroupBase):
    """Schema for creating a new group"""
    pass

class GroupUpdate(BaseModel):
    """Schema for updating group details"""
    group_name: Optional[str] = Field(None, min_length=5, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    image: Optional[str] = None
    group_type: Optional[GroupType] = None
    visibility: Optional[GroupVisibility] = None
    max_members: Optional[int] = Field(None, ge=2, le=1000)

class GroupMemberInfo(BaseModel):
    """Member information for group responses"""
    user_id: str
    username: str
    first_name: Optional[str]
    last_name: Optional[str]
    role: GroupRole
    joined_at: datetime
    is_connected: bool
    last_seen: Optional[datetime]

    class Config:
        from_attributes = True # for api responses to read attributes from ORM models

class GroupResponse(GroupBase):
    """Schema for group responses"""
    id: int
    creator_id: str
    invite_code: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    # Optional include member count
    member_count: Optional[int] = None

    #Optional: Include user's role if they're a member
    user_role: Optional[GroupRole] = None

    class Config:
        from_attributes = True 

class GroupDetailResponse(GroupResponse):
    """Detailed group response with members list"""
    members: List[GroupMemberInfo] = []

    class Config:
        from_attributes = True

# ===================================================
# Membership Schemas
# ====================================================

class JoinGroupRequest(BaseModel):
    """Schema for joining a group"""
    invite_code: Optional[str] = Field(None, description="Required for private groups")

class InviteUserRequest(BaseModel):
    """Schema for inviting a user to a group"""
    invited_user_id: str = Field(..., description="User ID to invite")
    invitation_message: Optional[str] = Field(None, max_length=500)

class UpdateMemberRoleRequest(BaseModel):
    """Schema for updating a member's role"""
    user_id: str = Field(..., description="User ID to update")
    new_role: GroupRole = Field(..., description="New role to assign")

class RespondToInvitationRequest(BaseModel):
    """Schema for responding to a group invitation"""
    accept: bool = Field(..., description="True to accept, False to decline")

# ============================================================================
# INVITATION SCHEMAS
# ============================================================================

class InvitationResponse(BaseModel):
    """Schema for invitation responses"""
    id: int
    group_id: int
    group_name: str
    invited_by_username: str
    invited_by_user_id: str
    status: InvitationStatus
    invitation_message: Optional[str]
    expires_at: datetime
    created_at: datetime
    responded_at: Optional[datetime]

    class Config:
        from_attributes = True

# ============================================================================
# QUERY SCHEMAS
# ============================================================================

class GroupListQuery(BaseModel):
    """Query parameters for listing groups"""
    search: Optional[str] = Field(None, description="Search by group name")
    group_type: Optional[GroupType] = None
    visibility: Optional[GroupVisibility] = None
    only_joined: bool = Field(False, description="Only show groups user is a member of")
    skip: int = Field(0, ge=0)
    limit: int = Field(20, ge=1, le=100)
