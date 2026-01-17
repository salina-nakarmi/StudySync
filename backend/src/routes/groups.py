"""
Group management routes
Handles group CRUD, membership, invitations, and permissions
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from ..database.database import get_db
from ..database.models import Users, GroupType, GroupVisibility, InvitationStatus
from ..dependencies import get_current_user
from ..schemas.groups import (
    GroupCreate, GroupUpdate, GroupResponse, GroupDetailResponse,
    JoinGroupRequest, InviteUserRequest, UpdateMemberRoleRequest,
    RespondToInvitationRequest, InvitationResponse, GroupMemberInfo
)
from ..services import group_service
from ..services.user_service import get_user_by_id

router = APIRouter(prefix="/groups", tags=["groups"])

# ============================================================================
# GROUP CRUD ENDPOINTS
# ============================================================================

@router.post("", response_model=GroupDetailResponse, status_code=201)
async def create_group(
    group_data: GroupCreate,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # DEBUG: Print what we received
    print("=" * 50)
    print("Received group_data:")
    print(f"  group_name: {group_data.group_name}")
    print(f"  group_type: {group_data.group_type} (type: {type(group_data.group_type)})")
    print(f"  visibility: {group_data.visibility} (type: {type(group_data.visibility)})")
    print("=" * 50)
    """
    Create a new group
    
    The creator automatically becomes a leader of the group.
    Private groups get an auto-generated invite code.
    """
    
    group = await group_service.create_group(
        session=db,
        creator_id=current_user.user_id,
        group_name=group_data.group_name,
        description=group_data.description,
        image=group_data.image,
        group_type=group_data.group_type,
        visibility=group_data.visibility,
        max_members=group_data.max_members
    )
    
    await db.commit()
    
    # Get members for response
    members = await group_service.get_group_members(db, group.id)
    member_list = [
        GroupMemberInfo(
            user_id=user.user_id,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            role=grouping.role,
            joined_at=grouping.joined_at,
            is_connected=grouping.is_connected,
            last_seen=grouping.last_seen
        )
        for user, grouping in members
    ]
    
    return GroupDetailResponse(
        **group.__dict__,
        member_count=len(member_list),
        user_role=await group_service.get_user_role_in_group(db, current_user.user_id, group.id),
        members=member_list
    )

@router.get("", response_model=List[GroupResponse])
async def list_groups(
    search: Optional[str] = Query(None, description="Search by group name"),
    group_type: Optional[GroupType] = Query(None, description="Filter by group type"),
    visibility: Optional[GroupVisibility] = Query(None, description="Filter by visibility"),
    only_joined: bool = Query(False, description="Only show groups user is a member of"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List groups
    
    - **only_joined=true**: Shows groups the user is a member of
    - **only_joined=false**: Shows public groups (for discovery)
    
    Supports filtering by name, type, and visibility.
    """
    
    if only_joined:
        groups, total = await group_service.get_user_groups(
            session=db,
            user_id=current_user.user_id,
            skip=skip,
            limit=limit,
            search=search,
            group_type=group_type,
            visibility=visibility
        )
    else:
        groups, total = await group_service.get_public_groups(
            session=db,
            skip=skip,
            limit=limit,
            search=search,
            group_type=group_type
        )
    
    # Add member count and user role to each group
    result = []
    for group in groups:
        member_count = await group_service.get_group_member_count(db, group.id)
        user_role = await group_service.get_user_role_in_group(db, current_user.user_id, group.id)
        
        result.append(GroupResponse(
            **group.__dict__,
            member_count=member_count,
            user_role=user_role
        ))
    
    return result

@router.get("/{group_id}", response_model=GroupDetailResponse)
async def get_group(
    group_id: int,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed information about a specific group
    
    Includes:
    - Group details
    - Member list with roles
    - User's role in the group
    
    Note: Private group details only visible to members.
    """
    
    group = await group_service.get_group_by_id(db, group_id)
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if user can view this group
    user_role = await group_service.get_user_role_in_group(db, current_user.user_id, group_id)
    
    if group.visibility == GroupVisibility.PRIVATE and not user_role:
        raise HTTPException(
            status_code=403,
            detail="This is a private group. You need an invitation to view it."
        )
    
    # Get members
    members = await group_service.get_group_members(db, group_id)
    member_list = [
        GroupMemberInfo(
            user_id=user.user_id,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            role=grouping.role,
            joined_at=grouping.joined_at,
            is_connected=grouping.is_connected,
            last_seen=grouping.last_seen
        )
        for user, grouping in members
    ]
    
    return GroupDetailResponse(
        **group.__dict__,
        member_count=len(member_list),
        user_role=user_role,
        members=member_list
    )

@router.patch("/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: int,
    group_data: GroupUpdate,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update group details
    
    Only leaders and admins can update group settings.
    """
    
    # Check permissions
    if not await group_service.can_manage_group(db, current_user.user_id, group_id):
        raise HTTPException(
            status_code=403,
            detail="Only group leaders and admins can update group settings"
        )
    
    group = await group_service.update_group(
        session=db,
        group_id=group_id,
        group_name=group_data.group_name,
        description=group_data.description,
        image=group_data.image,
        group_type=group_data.group_type,
        visibility=group_data.visibility,
        max_members=group_data.max_members
    )
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    await db.commit()
    
    member_count = await group_service.get_group_member_count(db, group_id)
    user_role = await group_service.get_user_role_in_group(db, current_user.user_id, group_id)
    
    return GroupResponse(
        **group.__dict__,
        member_count=member_count,
        user_role=user_role
    )

@router.delete("/{group_id}", status_code=204)
async def delete_group(
    group_id: int,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a group (soft delete)
    
    Only group leaders can delete groups.
    """
    
    # Check if user is a leader
    if not await group_service.is_group_leader(db, current_user.user_id, group_id):
        raise HTTPException(
            status_code=403,
            detail="Only group leaders can delete the group"
        )
    
    success = await group_service.delete_group(db, group_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Group not found")
    
    await db.commit()

# ============================================================================
# MEMBERSHIP ENDPOINTS
# ============================================================================

@router.post("/{group_id}/join", response_model=dict, status_code=201)
async def join_group(
    group_id: int,
    join_data: JoinGroupRequest,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Join a group
    
    - **Public groups**: No invite code needed
    - **Private groups**: Requires valid invite code
    
    Returns error if:
    - Already a member
    - Max members reached
    - Invalid invite code (for private groups)
    """
    
    # Check if already a member
    if await group_service.is_user_in_group(db, current_user.user_id, group_id):
        raise HTTPException(status_code=400, detail="You are already a member of this group")
    
    membership = await group_service.join_group(
        session=db,
        user_id=current_user.user_id,
        group_id=group_id,
        invite_code=join_data.invite_code
    )
    
    if not membership:
        group = await group_service.get_group_by_id(db, group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        if group.visibility == GroupVisibility.PRIVATE:
            raise HTTPException(
                status_code=403,
                detail="Invalid invite code or group is at maximum capacity"
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="Unable to join group. It may be at maximum capacity."
            )
    
    await db.commit()
    
    return {
        "message": "Successfully joined the group",
        "group_id": group_id,
        "role": membership.role.value
    }

@router.delete("/{group_id}/leave", status_code=200)
async def leave_group(
    group_id: int,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Leave a group
    
    Note: The last leader cannot leave the group.
    They must transfer leadership or delete the group.
    """
    
    success = await group_service.leave_group(
        session=db,
        user_id=current_user.user_id,
        group_id=group_id
    )
    
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Unable to leave group. You may be the last leader. Transfer leadership first."
        )
    
    await db.commit()
    
    return {"message": "Successfully left the group"}

@router.get("/{group_id}/members", response_model=List[GroupMemberInfo])
async def get_group_members(
    group_id: int,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all members of a group
    
    Only accessible to group members.
    """
    
    # Check if user is a member
    if not await group_service.is_user_in_group(db, current_user.user_id, group_id):
        raise HTTPException(
            status_code=403,
            detail="You must be a member to view the member list"
        )
    
    members = await group_service.get_group_members(db, group_id)
    
    return [
        GroupMemberInfo(
            user_id=user.user_id,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            role=grouping.role,
            joined_at=grouping.joined_at,
            is_connected=grouping.is_connected,
            last_seen=grouping.last_seen
        )
        for user, grouping in members
    ]

@router.patch("/{group_id}/members/role", response_model=dict)
async def update_member_role(
    group_id: int,
    role_data: UpdateMemberRoleRequest,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a member's role
    
    Only leaders can update member roles.
    """
    
    # Check if requester is a leader
    if not await group_service.is_group_leader(db, current_user.user_id, group_id):
        raise HTTPException(
            status_code=403,
            detail="Only group leaders can update member roles"
        )
    
    # Can't demote yourself if you're the last leader
    if role_data.user_id == current_user.user_id:
        raise HTTPException(
            status_code=400,
            detail="Use the transfer leadership feature to change your own role"
        )
    
    membership = await group_service.update_member_role(
        session=db,
        group_id=group_id,
        user_id=role_data.user_id,
        new_role=role_data.new_role
    )
    
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found in this group")
    
    await db.commit()
    
    return {
        "message": "Member role updated successfully",
        "user_id": role_data.user_id,
        "new_role": role_data.new_role.value
    }

@router.delete("/{group_id}/members/{user_id}", status_code=200)
async def remove_member(
    group_id: int,
    user_id: str,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove a member from the group
    
    Only leaders and admins can remove members.
    Cannot remove other leaders.
    """
    
    # Check if requester can manage group
    if not await group_service.can_manage_group(db, current_user.user_id, group_id):
        raise HTTPException(
            status_code=403,
            detail="Only group leaders and admins can remove members"
        )
    
    # Check target user's role
    target_role = await group_service.get_user_role_in_group(db, user_id, group_id)
    
    if not target_role:
        raise HTTPException(status_code=404, detail="User is not a member of this group")
    
    # Can't remove leaders (use transfer/demote instead)
    if target_role.value == "leader":
        raise HTTPException(
            status_code=400,
            detail="Cannot remove leaders. Demote them first or transfer leadership."
        )
    
    success = await group_service.remove_member(db, group_id, user_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Member not found")
    
    await db.commit()
    
    return {"message": "Member removed successfully"}

# ============================================================================
# INVITATION ENDPOINTS
# ============================================================================

@router.post("/{group_id}/invite", response_model=dict, status_code=201)
async def invite_user(
    group_id: int,
    invite_data: InviteUserRequest,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Invite a user to join the group
    
    Only leaders and admins can send invitations.
    Works for both public and private groups.
    """
    
    # Check permissions
    if not await group_service.can_manage_group(db, current_user.user_id, group_id):
        raise HTTPException(
            status_code=403,
            detail="Only group leaders and admins can invite users"
        )
    
    # Check if invited user exists
    invited_user = await get_user_by_id(db, invite_data.invited_user_id)
    if not invited_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user is already a member
    if await group_service.is_user_in_group(db, invite_data.invited_user_id, group_id):
        raise HTTPException(status_code=400, detail="User is already a member of this group")
    
    invitation = await group_service.create_invitation(
        session=db,
        group_id=group_id,
        invited_user_id=invite_data.invited_user_id,
        invited_by=current_user.user_id,
        invitation_message=invite_data.invitation_message
    )
    
    if not invitation:
        raise HTTPException(
            status_code=400,
            detail="User already has a pending invitation to this group"
        )
    
    await db.commit()
    
    return {
        "message": "Invitation sent successfully",
        "invitation_id": invitation.id,
        "expires_at": invitation.expires_at
    }

@router.get("/invitations/me", response_model=List[InvitationResponse])
async def get_my_invitations(
    status: Optional[InvitationStatus] = Query(None, description="Filter by status"),
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all invitations for the current user
    
    Default: Shows only pending invitations
    """
    
    invitations = await group_service.get_user_invitations(
        session=db,
        user_id=current_user.user_id,
        status=status
    )
    
    # Enrich with group and user details
    result = []
    for inv in invitations:
        group = await group_service.get_group_by_id(db, inv.group_id)
        inviter = await get_user_by_id(db, inv.invited_by)
        
        if group and inviter:
            result.append(InvitationResponse(
                id=inv.id,
                group_id=inv.group_id,
                group_name=group.group_name,
                invited_by_username=inviter.username,
                invited_by_user_id=inviter.user_id,
                status=inv.status,
                invitation_message=inv.invitation_message,
                expires_at=inv.expires_at,
                created_at=inv.created_at,
                responded_at=inv.responded_at
            ))
    
    return result

@router.post("/invitations/{invitation_id}/respond", response_model=dict)
async def respond_to_invitation(
    invitation_id: int,
    response_data: RespondToInvitationRequest,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Accept or decline a group invitation
    
    - **accept=true**: Join the group
    - **accept=false**: Decline the invitation
    """
    
    membership = await group_service.respond_to_invitation(
        session=db,
        invitation_id=invitation_id,
        user_id=current_user.user_id,
        accept=response_data.accept
    )
    
    if membership is None and response_data.accept:
        raise HTTPException(
            status_code=400,
            detail="Unable to accept invitation. It may have expired or the group is full."
        )
    
    await db.commit()
    
    if response_data.accept:
        return {
            "message": "Invitation accepted! You are now a member of the group.",
            "group_id": membership.group_id,
            "role": membership.role.value
        }
    else:
        return {"message": "Invitation declined"}

# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@router.get("/{group_id}/can-manage-resources", response_model=dict)
async def check_resource_permissions(
    group_id: int,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Check if the current user can manage resources in this group
    
    Useful for frontend to show/hide resource management UI.
    """
    
    can_manage = await group_service.can_manage_resources(
        session=db,
        user_id=current_user.user_id,
        group_id=group_id
    )
    
    return {
        "group_id": group_id,
        "can_manage_resources": can_manage
    }