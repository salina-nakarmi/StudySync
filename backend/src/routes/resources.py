from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from sqlalchemy import select

from ..database.database import get_db
from ..database.models import Users, ResourceType, Resources, Groups
from ..schemas.resources import (
    ResourceCreate, 
    ResourceResponse, 
    ResourceUpdate,
    ResourceWithProgress,
    ShareResourceRequest,
    MoveResourceRequest)
from ..dependencies import get_current_user
from ..services import resources_service
from ..services.user_service import get_user_by_id
from ..database.models import Users

router = APIRouter(prefix="/resources", tags=["Resources"])

# ============================================================================
# CREATE - Upload a Resource
# ============================================================================

@router.post("", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_resource(
    payload: ResourceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    # check permission
    if not await resources_service.can_user_upload_resource(
        db, current_user.user_id, payload.group_id
    ):
        if payload.group_id is None:
            # This shouldn't happen (personal always allowed)
            # But good to have defensive check
            raise HTTPException(
                status_code=403, 
                detail="Cannot create personal resources"
            )
    else:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to upload to this group"
            )
    
 # Step 2: If group resource, verify group exists
    if payload.group_id:
        from ..services.group_service import get_group_by_id
        group = await get_group_by_id(db, payload.group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")

    # Step 3: Create resource (uses Part 2 of service!)
    resource = await resources_service.create_resource(
        session=db,
        user_id=current_user.user_id,
        title=payload.title,
        url=payload.url,
        resource_type=payload.resource_type,
        group_id=payload.group_id,
        description=payload.description,
        parent_folder_id=payload.parent_folder_id,
        file_size=payload.file_size
    )
    
    # Step 4: Commit transaction
    await db.commit()
    
    # Step 5: Return response
    return ResourceResponse(
        **resource.__dict__,
        is_personal=(resource.group_id is None)  # Computed field
    )


# ============================================================================
# READ - Get Resources
# ============================================================================

@router.get("/personal", response_model=list[ResourceResponse])
async def get_my_personal_resources(
     resource_type: Optional[ResourceType] = Query(None, description="Filter by type"),
     parent_folder_id: Optional[int] = Query(None, description="Filter by folder"),
     search: Optional[str] = Query(None, description="Search iby title"),
     skip: int = Query(0, ge=0),
     limit: int = Query(100, ge=1, le=200),
     db: AsyncSession = Depends(get_db),
     current_user: Users = Depends(get_current_user)
):
    # No permission check needed - you can always view your own resources!
    
    resources, total = await resources_service.get_personal_resources(
        session=db,
        user_id=current_user.user_id,
        resource_type=resource_type,
        parent_folder_id=parent_folder_id,
        search=search,
        skip=skip,
        limit=limit
    )
    
    # Note: Not committing because we're just reading
    
    return [
        ResourceResponse(
            **resource.__dict__,
            is_personal=True  # We know they're all personal
        )
        for resource in resources
    ]

@router.get("/group/{group_id}", response_model=list[ResourceResponse])
async def get_group_resources(
    group_id: int,
    resource_type: Optional[ResourceType] = Query(None),
    parent_folder_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    #get resources from a specific group
    #must be a grp member to access

    # Step 1: Check id user is grp member
    from ..services.group_service import is_user_in_group

    if not await is_user_in_group(db, current_user.user_id, group_id):
        raise HTTPException(
            status_code=403,
            detail="You must be a member to view this group"
        )
    
    # Step 2: Fetch resources
    resources, total = await resources_service.get_group_resources(
        session=db,
        group_id=group_id,
        resource_type=resource_type,
        parent_folder_id=parent_folder_id,
        search=search,
        skip=skip,
        limit=limit
    )

    return [
        ResourceResponse(
            **resource.__dict__,
            is_personal=False  # We know they're all group resources
        )
        for resource in resources
    ]

@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    # get a single resource by permission check

    # Step 1: Check Permission
    if not await resources_service.can_user_view_resource(
        db, current_user.user_id, resource_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to view this resource"
        )
    # Step 2: Fetch resource
    resource = await resources_service.get_resource_by_id(db, resource_id)

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    return ResourceResponse(
        **resource.__dict__,
        is_personal=(resource.group_id is None)
    )

# ============================================================================
# UPDATE - Modify a Resource
# ============================================================================

@router.patch("/{resource_id}", response_model=ResourceResponse)
async def update_resource(
    resource_id: int,
    payload: ResourceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    # Step 1: Check Permission
    if not await resources_service.can_user_modify_resource(
        db, current_user.user_id, resource_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to modify this resource"
        )
    
    # Step 2: Update resource
    resource = await resources_service.update_resource(
        session=db,
        resource_id=resource_id,
        title=payload.title,
        description=payload.description,
        url=payload.url,
        parent_folder_id=payload.parent_folder_id
    )
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Step 3: Commit transaction
    await db.commit()
    
    # Step 4: Return updated resource
    return ResourceResponse(
        **resource.__dict__,
        is_personal=(resource.group_id is None)
    )

# ============================================================================
# DELETE - Remove a Resource
# ============================================================================

@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    # soft delete a resource
    # Step 1: Check Permission
    if not await resources_service.can_user_modify_resource(
        db, current_user.user_id, resource_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to delete this resource"
        )
    
    # Step 2: Delete resource
    success = await resources_service.delete_resource(db, resource_id)

    if not success:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Step 3: Commit transaction
    await db.commit()

'''Resource Routes - Part 3: Sharing & Advanced Endpoints'''

# ============================================================================
# GET ALL RESOURCES - "My Library" View
# ============================================================================

@router.get("/all", response_model=List[ResourceResponse])
async def get_all_my_resources(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """
    Get all resources you have access to
    
    NEW ENDPOINT! Returns everything:
    - Your personal resources
    - Resources from all your groups
    
    Use cases:
    - "My Library" page
    - Search across all resources
    - Recent activity feed
    
    Example response:
        [
            {"id": 1, "title": "My Notes", "group_id": null, ...},
            {"id": 2, "title": "Group Study Guide", "group_id": 123, ...},
            {"id": 3, "title": "Physics Lab", "group_id": 456, ...}
        ]
    
    Why useful?
    - Single endpoint for complete library
    - Unified search across personal + groups
    - Dashboard overview
    """
    
    resources, total = await resources_service.get_all_user_resources(
        session=db,
        user_id=current_user.user_id,
        skip=skip,
        limit=limit
    )
    
    return [
        ResourceResponse(
            **resource.__dict__,
            is_personal=(resource.group_id is None)
        )
        for resource in resources
    ]


@router.get("/stats/me", response_model=dict)
async def get_my_resource_stats(
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """
    Get your resource statistics
    
    NEW ENDPOINT! Returns summary stats for dashboards.
    
    Example response:
        {
            "personal_count": 15,
            "group_count": 28,
            "total_count": 43,
            "by_type": {
                "video": 12,
                "file": 20,
                "link": 11
            },
            "added_this_week": 3
        }
    
    Use cases:
    - Dashboard widgets: "You have 43 resources"
    - Progress tracking: "Added 3 this week"
    - Category breakdown: "20 files, 12 videos..."
    """
    
    stats = await resources_service.get_user_resource_stats(
        session=db,
        user_id=current_user.user_id
    )
    
    return stats


# ============================================================================
# SHARING ENDPOINTS - Personal ↔ Group
# ============================================================================

@router.post("/{resource_id}/share", response_model=ResourceResponse)
async def share_resource_to_group(
    resource_id: int,
    payload: ShareResourceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """
    Share a personal resource to a group
    
    Flow:
    1. Resource is personal (group_id = null)
    2. Share to group 123
    3. Now group members can see it
    
    Requirements:
    - Resource must be personal (not already shared)
    - You must be the owner
    - You must have permission to upload to target group
    
    Example:
        POST /resources/1/share
        { "group_id": 123 }
        
        Result: Resource 1 now visible to group 123
    
    Common errors:
    - 403: Not your resource
    - 403: Can't upload to that group
    - 400: Resource already shared with a group
    """
    
    # Step 1: Get the resource
    resource = await resources_service.get_resource_by_id(db, resource_id)
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Step 2: Verify ownership
    if resource.uploaded_by != current_user.user_id:
        raise HTTPException(
            status_code=403,
            detail="Only the owner can share resources"
        )
    
    # Step 3: Verify it's personal
    if resource.group_id is not None:
        raise HTTPException(
            status_code=400,
            detail="Resource is already shared with a group. Use /move instead."
        )
    
    # Step 4: Verify permission to upload to target group
    if not await resources_service.can_user_upload_resource(
        db, current_user.user_id, payload.group_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to share to this group"
        )
    
    # Step 5: Share it
    updated_resource = await resources_service.share_resource_to_group(
        db, resource_id, payload.group_id
    )
    
    if not updated_resource:
        raise HTTPException(
            status_code=500,
            detail="Failed to share resource"
        )
    
    await db.commit()
    
    return ResourceResponse(
        **updated_resource.__dict__,
        is_personal=False  # Now it's a group resource
    )


@router.post("/{resource_id}/make-personal", response_model=ResourceResponse)
async def make_resource_personal(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """
    Convert a group resource to personal (unshare)
    
    Flow:
    1. Resource is in group 123 (group_id = 123)
    2. Make it personal
    3. Now only you can see it
    
    Requirements:
    - You must be the owner
    
    Example:
        POST /resources/1/make-personal
        
        Result: Resource 1 now private (group_id = null)
    
    Use case:
        "I shared this with the group but want to make it
         private again"
    
    Warning:
        Group members will lose access!
    """
    
    # Step 1: Get the resource
    resource = await resources_service.get_resource_by_id(db, resource_id)
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Step 2: Verify ownership
    if resource.uploaded_by != current_user.user_id:
        raise HTTPException(
            status_code=403,
            detail="Only the owner can make resources personal"
        )
    
    # Step 3: Make it personal
    updated_resource = await resources_service.make_resource_personal(
        db, resource_id
    )
    
    if not updated_resource:
        raise HTTPException(
            status_code=500,
            detail="Failed to make resource personal"
        )
    
    await db.commit()
    
    return ResourceResponse(
        **updated_resource.__dict__,
        is_personal=True  # Now it's personal
    )


@router.post("/{resource_id}/move", response_model=ResourceResponse)
async def move_resource(
    resource_id: int,
    payload: MoveResourceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """
    Move resource to different group or make personal
    
    Flexible endpoint that handles:
    - Move from one group to another
    - Move from group to personal
    
    Requirements:
    - You must be the owner
    - If moving to group, you must have upload permission
    
    Examples:
        # Move to different group
        POST /resources/1/move
        { "group_id": 456 }
        
        # Make personal
        POST /resources/1/move
        { "group_id": null }
    
    Why this over /share and /make-personal?
    - More flexible (handles all cases)
    - Single endpoint for group switching
    """
    
    # Step 1: Get the resource
    resource = await resources_service.get_resource_by_id(db, resource_id)
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Step 2: Verify ownership
    if resource.uploaded_by != current_user.user_id:
        raise HTTPException(
            status_code=403,
            detail="Only the owner can move resources"
        )
    
    # Step 3: Handle based on target
    if payload.group_id is None:
        # Making personal
        updated_resource = await resources_service.make_resource_personal(
            db, resource_id
        )
    else:
        # Moving to a group - check permission
        if not await resources_service.can_user_upload_resource(
            db, current_user.user_id, payload.group_id
        ):
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to move to this group"
            )
        
        updated_resource = await resources_service.move_resource_to_group(
            db, resource_id, payload.group_id
        )
    
    if not updated_resource:
        raise HTTPException(
            status_code=500,
            detail="Failed to move resource"
        )
    
    await db.commit()
    
    return ResourceResponse(
        **updated_resource.__dict__,
        is_personal=(updated_resource.group_id is None)
    )


# ============================================================================
# UNDERSTANDING THE SHARING ENDPOINTS
# ============================================================================

"""
Three ways to change resource visibility:

1. /share - Personal → Group
   - Specific: Only for sharing personal resources
   - Clear intent: "I want to share this"
   - Returns error if already shared

2. /make-personal - Group → Personal
   - Specific: Only for unsharing
   - Clear intent: "I want this private again"
   - Works from any group

3. /move - Any → Any
   - Flexible: Handles all cases
   - Can move between groups
   - Can make personal
   - One endpoint to rule them all

Choose based on your frontend needs:
- Explicit buttons: Use /share and /make-personal
- Flexible UI: Use /move
- Both: Offer all three (let users choose)

Example UI flows:

Simple:
    [Share to Group ▼] → /share
    [Make Private] → /make-personal

Advanced:
    [Move to: ▼ Personal / Group A / Group B] → /move

Both:
    [Share to Group ▼] → /share
    [Change Group ▼] → /move
    [Make Private] → /make-personal
"""