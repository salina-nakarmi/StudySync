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
    ResourceWithProgress)
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
    resource = await resource_service.create_resource(
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