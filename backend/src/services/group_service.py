"""Handles all group-realted  databse operations and business logic"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from ..database.models import(
    Groups, Groupings, GroupInvitations, Users,
    GroupRole, GroupType, GroupVisibility, InvitationStatus
)
from typing import Optional, List, Tuple
from datetime import datetime, timedelta
import secrets
import string

# ============================================================================
# GROUP CRUD OPERATIONS
# ============================================================================

async def create_group(
        session: AsyncSession,
        creator_id: str,
        group_name: str,
        description: Optional[str] = None,
        image: Optional[str] = None,
        group_type: GroupType = GroupType.LEADER_CONTROLLED,
        visibility: GroupVisibility = GroupVisibility.PUBLIC,
        max_members: Optional[int] = None
) -> Groups:
    """Create a new group and add creator as leader"""

    #Generate invite code for private gorups
    invite_code = None
    if visibility == GroupVisibility.PRIVATE:
        invite_code = generate_invite_code()
    
    # Create group
    new_group = Groups(
        creator_id=creator_id,
        group_name=group_name,
        description=description,
        image=image,
        group_type=group_type,
        visibility=visibility,
        invite_code=invite_code,
        max_members=max_members,
        is_active=True
    )

    session.add(new_group)
    await session.flush() # To get the group.id

    # Add creator as leader
    creator_membership = Groupings(
        user_id=creator_id,
        group_id=new_group.id,
        role=GroupRole.LEADER,
        invitation_status=InvitationStatus.ACCEPTED
    )

    session.add(creator_membership)
    await session.flush()

    return new_group

async def get_group_by_id(
    session: AsyncSession,
    group_id: int,
    include_members: bool = False
) -> Optional[Groups]:
    """get a group by ID, optionally with mwmbers"""

    query = select(Groups).where(
        and_(Groups.id == group_id, Groups.is_active == True))

    if include_members:
        query = query.options(
            selectinload(Groups.groupings))
    
    result = await session.execute(query)
    return result.scalars().first()

async def get_user_groups(
    session: AsyncSession,
    user_id: str,
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    group_type: Optional[GroupType] = None,
    visibility: Optional[GroupVisibility] = None
) -> Tuple[List[Groups], int]:
    """Get all groups a user is a member of with filtering"""

    #Base query - join with groupings to get user's groups
    query = (
        select(Groups)
        .join(Groupings, Groupings.group_id == Groups.id)
        .where(
            and_(
                Groupings.user_id == user_id,
                Groups.is_active == True,
                Groupings.invitation_status == InvitationStatus.ACCEPTED
            )
        )
    )

    # Apply filters
    if search:
        query = query.where(Groups.group_name.ilike(f"%{search}%"))
    
    if group_type:
        query = query.where(Groups.group_type == group_type)
    
    if visibility:
        query = query.where(Groups.visibility == visibility)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await session.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination and ordering
    query = query.order_by(Groups.updated_at.desc()).offset(skip).limit(limit)
    
    result = await session.execute(query)
    groups = result.scalars().all()
    
    return list(groups), total

async def get_public_groups(
    session: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    group_type: Optional[GroupType] = None
) -> Tuple[List[Groups], int]:
    """Get all public groups (for discovery)"""
    
    query = select(Groups).where(
        and_(
            Groups.visibility == GroupVisibility.PUBLIC,
            Groups.is_active == True
        )
    )
    
    # Apply filters
    if search:
        query = query.where(Groups.group_name.ilike(f"%{search}%"))
    
    if group_type:
        query = query.where(Groups.group_type == group_type)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await session.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination and ordering
    query = query.order_by(Groups.created_at.desc()).offset(skip).limit(limit)
    
    result = await session.execute(query)
    groups = result.scalars().all()
    
    return list(groups), total

async def update_group(
    session: AsyncSession,
    group_id: int,
    group_name: Optional[str] = None,
    description: Optional[str] = None,
    image: Optional[str] = None,
    group_type: Optional[GroupType] = None,
    visibility: Optional[GroupVisibility] = None,
    max_members: Optional[int] = None
) -> Optional[Groups]:
    """Update group details"""
    
    group = await get_group_by_id(session, group_id)
    if not group:
        return None
    
    # Update only provided fields
    if group_name is not None:
        group.group_name = group_name
    
    if description is not None:
        group.description = description
    
    if image is not None:
        group.image = image
    
    if group_type is not None:
        group.group_type = group_type
    
    if visibility is not None:
        # Generate invite code if changing to private
        if visibility == GroupVisibility.PRIVATE and not group.invite_code:
            group.invite_code = generate_invite_code()
        group.visibility = visibility
    
    if max_members is not None:
        group.max_members = max_members
    
    await session.flush()
    return group

async def delete_group(
    session: AsyncSession,
    group_id: int
) -> bool:
    """Soft delete a group"""
    
    group = await get_group_by_id(session, group_id)
    if not group:
        return False
    
    group.is_active = False
    await session.flush()
    return True

# ============================================================================
# MEMBERSHIP OPERATIONS
# ============================================================================

async def get_user_role_in_group(
    session: AsyncSession,
    user_id: str,
    group_id: int
) -> Optional[GroupRole]:
    """Get a user's role in a group"""
    
    result = await session.execute(
        select(Groupings.role).where(
            and_(
                Groupings.user_id == user_id,
                Groupings.group_id == group_id,
                Groupings.invitation_status == InvitationStatus.ACCEPTED
            )
        )
    )
    return result.scalars().first()

async def is_user_in_group(
    session: AsyncSession,
    user_id: str,
    group_id: int
) -> bool:
    """Check if user is a member of a group"""
    
    result = await session.execute(
        select(Groupings).where(
            and_(
                Groupings.user_id == user_id,
                Groupings.group_id == group_id,
                Groupings.invitation_status == InvitationStatus.ACCEPTED
            )
        )
    )
    return result.scalars().first() is not None

async def get_group_members(
    session: AsyncSession,
    group_id: int
) -> List[Tuple[Users, Groupings]]:
    """Get all members of a group with their roles"""
    
    result = await session.execute(
        select(Users, Groupings)
        .join(Groupings, Users.user_id == Groupings.user_id)
        .where(
            and_(
                Groupings.group_id == group_id,
                Groupings.invitation_status == InvitationStatus.ACCEPTED
            )
        )
        .order_by(
            # Leaders first, then admins, then members
            Groupings.role.desc(),
            Groupings.joined_at.asc()
        )
    )
    return result.all()

async def get_group_member_count(
    session: AsyncSession,
    group_id: int
) -> int:
    """Get the number of members in a group"""
    
    result = await session.execute(
        select(func.count(Groupings.user_id)).where(
            and_(
                Groupings.group_id == group_id,
                Groupings.invitation_status == InvitationStatus.ACCEPTED
            )
        )
    )
    return result.scalar() or 0

async def join_group(
    session: AsyncSession,
    user_id: str,
    group_id: int,
    invite_code: Optional[str] = None
) -> Optional[Groupings]:
    """Join a public group or private group with invite code"""
    
    # Get group
    group = await get_group_by_id(session, group_id)
    if not group:
        return None
    
    # Check if already a member
    if await is_user_in_group(session, user_id, group_id):
        return None
    
    # Check visibility and invite code
    if group.visibility == GroupVisibility.PRIVATE:
        if not invite_code or invite_code != group.invite_code:
            return None
    
    # Check max members
    if group.max_members:
        current_count = await get_group_member_count(session, group_id)
        if current_count >= group.max_members:
            return None
    
    # Create membership
    membership = Groupings(
        user_id=user_id,
        group_id=group_id,
        role=GroupRole.MEMBER,
        invitation_status=InvitationStatus.ACCEPTED
    )
    
    session.add(membership)
    await session.flush()
    
    return membership

async def leave_group(
    session: AsyncSession,
    user_id: str,
    group_id: int
) -> bool:
    """Leave a group"""
    
    result = await session.execute(
        select(Groupings).where(
            and_(
                Groupings.user_id == user_id,
                Groupings.group_id == group_id
            )
        )
    )
    membership = result.scalars().first()
    
    if not membership:
        return False
    
    # Don't allow last leader to leave
    if membership.role == GroupRole.LEADER:
        leader_count = await session.execute(
            select(func.count(Groupings.user_id)).where(
                and_(
                    Groupings.group_id == group_id,
                    Groupings.role == GroupRole.LEADER,
                    Groupings.invitation_status == InvitationStatus.ACCEPTED
                )
            )
        )
        if leader_count.scalar() <= 1:
            return False  # Can't leave if you're the only leader
    
    await session.delete(membership)
    await session.flush()
    return True

async def update_member_role(
    session: AsyncSession,
    group_id: int,
    user_id: str,
    new_role: GroupRole
) -> Optional[Groupings]:
    """Update a member's role in a group"""
    
    result = await session.execute(
        select(Groupings).where(
            and_(
                Groupings.user_id == user_id,
                Groupings.group_id == group_id,
                Groupings.invitation_status == InvitationStatus.ACCEPTED
            )
        )
    )
    membership = result.scalars().first()
    
    if not membership:
        return None
    
    membership.role = new_role
    await session.flush()
    return membership

async def remove_member(
    session: AsyncSession,
    group_id: int,
    user_id: str
) -> bool:
    """Remove a member from a group"""
    
    result = await session.execute(
        select(Groupings).where(
            and_(
                Groupings.user_id == user_id,
                Groupings.group_id == group_id
            )
        )
    )
    membership = result.scalars().first()
    
    if not membership:
        return False
    
    await session.delete(membership)
    await session.flush()
    return True

# ============================================================================
# INVITATION OPERATIONS
# ============================================================================

async def create_invitation(
    session: AsyncSession,
    group_id: int,
    invited_user_id: str,
    invited_by: str,
    invitation_message: Optional[str] = None,
    expires_in_days: int = 7
) -> Optional[GroupInvitations]:
    """Create a group invitation"""
    
    # Check if invitation already exists
    existing = await session.execute(
        select(GroupInvitations).where(
            and_(
                GroupInvitations.group_id == group_id,
                GroupInvitations.invited_user_id == invited_user_id,
                GroupInvitations.status == InvitationStatus.PENDING
            )
        )
    )
    
    if existing.scalars().first():
        return None  # Already has pending invitation
    
    # Check if already a member
    if await is_user_in_group(session, invited_user_id, group_id):
        return None
    
    invitation = GroupInvitations(
        group_id=group_id,
        invited_user_id=invited_user_id,
        invited_by=invited_by,
        invitation_message=invitation_message,
        expires_at=datetime.utcnow() + timedelta(days=expires_in_days),
        status=InvitationStatus.PENDING
    )
    
    session.add(invitation)
    await session.flush()
    return invitation

async def get_user_invitations(
    session: AsyncSession,
    user_id: str,
    status: Optional[InvitationStatus] = None
) -> List[GroupInvitations]:
    """Get all invitations for a user"""
    
    query = select(GroupInvitations).where(
        GroupInvitations.invited_user_id == user_id
    )
    
    if status:
        query = query.where(GroupInvitations.status == status)
    else:
        # Default to pending invitations
        query = query.where(GroupInvitations.status == InvitationStatus.PENDING)
    
    query = query.order_by(GroupInvitations.created_at.desc())
    
    result = await session.execute(query)
    return list(result.scalars().all())

async def respond_to_invitation(
    session: AsyncSession,
    invitation_id: int,
    user_id: str,
    accept: bool
) -> Optional[Groupings]:
    """Accept or decline a group invitation"""
    
    # Get invitation
    result = await session.execute(
        select(GroupInvitations).where(
            and_(
                GroupInvitations.id == invitation_id,
                GroupInvitations.invited_user_id == user_id,
                GroupInvitations.status == InvitationStatus.PENDING
            )
        )
    )
    invitation = result.scalars().first()
    
    if not invitation:
        return None
    
    # Check expiry
    if invitation.expires_at < datetime.utcnow():
        invitation.status = InvitationStatus.DECLINED
        await session.flush()
        return None
    
    # Update invitation status
    invitation.status = InvitationStatus.ACCEPTED if accept else InvitationStatus.DECLINED
    invitation.responded_at = datetime.utcnow()
    
    membership = None
    
    if accept:
        # Check max members
        group = await get_group_by_id(session, invitation.group_id)
        if group and group.max_members:
            current_count = await get_group_member_count(session, invitation.group_id)
            if current_count >= group.max_members:
                invitation.status = InvitationStatus.DECLINED
                await session.flush()
                return None
        
        # Create membership
        membership = Groupings(
            user_id=user_id,
            group_id=invitation.group_id,
            role=GroupRole.MEMBER,
            invitation_status=InvitationStatus.ACCEPTED,
            invited_by=invitation.invited_by,
            invited_at=invitation.created_at
        )
        session.add(membership)
    
    await session.flush()
    return membership

# ============================================================================
# PERMISSION CHECKS
# ============================================================================

async def can_manage_resources(
    session: AsyncSession,
    user_id: str,
    group_id: int
) -> bool:
    """Check if user can manage resources in a group"""
    
    group = await get_group_by_id(session, group_id)
    if not group:
        return False
    
    role = await get_user_role_in_group(session, user_id, group_id)
    if not role:
        return False
    
    # In community groups, all members can manage resources
    if group.group_type == GroupType.COMMUNITY:
        return True
    
    # In leader-controlled groups, only leaders and admins can
    return role in [GroupRole.LEADER, GroupRole.ADMIN]

async def can_manage_group(
    session: AsyncSession,
    user_id: str,
    group_id: int
) -> bool:
    """Check if user can manage group settings"""
    
    role = await get_user_role_in_group(session, user_id, group_id)
    return role in [GroupRole.LEADER, GroupRole.ADMIN]

async def is_group_leader(
    session: AsyncSession,
    user_id: str,
    group_id: int
) -> bool:
    """Check if user is a leader of the group"""
    
    role = await get_user_role_in_group(session, user_id, group_id)
    return role == GroupRole.LEADER

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def generate_invite_code(length: int = 8) -> str:
    """Generate a random invite code"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))



