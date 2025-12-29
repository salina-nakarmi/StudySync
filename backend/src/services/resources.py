"""
Permission checks. if the user is allowed to play with the resources
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from ..database.models import Resources
from ..services.group_service import is_user_in_group, can_manage_resources
from typing import Optional

# ============================================================================
# PERMISSION CHECKS - The Foundation
# ============================================================================

async def can_user_view_resource(
        session: AsyncSession,
        user_id: str,
        resource_id: int
) -> bool:
    # first get the resource
    resource = await get_resource_by_id(session, resource_id)

    if not resource or resource.is_deleted:
        return False
    
    #rule 1: personal resource - only owner can view
    if resource.group_id is None:
        return resource.owner_id == user_id
    
    #rule 2: group resource - check if user is in group
    return await is_user_in_group(session, user_id, resource.group_id)

async def can_user_upload_resource(
        session: AsyncSession,
        user_id: str,
        group_id: Optional[int] 
) -> bool:
    # personal resource upload - always allowed
    if group_id is None:
        return True
    
    # group resource upload - check group permissions
    return await can_manage_resources(session, user_id, group_id)

async def can_user_modify_resource(
        session: AsyncSession,
        user_id: str,
        resource_id: int
) -> bool:
    # first get the resource
    resource = await get_resource_by_id(session, resource_id)

    if not resource or resource.is_deleted:
        return False
    
    #rule 1: personal resource - only owner can modify
    if resource.group_id is None:
        return resource.uploaded_by == user_id
    
    if resource.uploaded_by == user_id:
        
    
    #rule 2: group resource - check group permissions
    return await can_manage_resources(session, user_id, resource.group_id
)
