from fastapi import APIRouter,File, UploadFile, Form, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from sqlalchemy import select

from ..database.database import get_db
from ..database.models import Users, ResourceType, Resources, Groups, ResourceStatus
from ..schemas.resources import (
    ResourceCreate, 
    ResourceResponse, 
    ResourceUpdate,
    ResourceWithProgress,
    ShareResourceRequest,
    MoveResourceRequest,
    ResourceProgressUpdate,
    ResourceProgressResponse)
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
# PROGRESS TRACKING ENDPOINTS - Pillar 2!
# ============================================================================

@router.post("/{resource_id}/progress", response_model=ResourceProgressResponse)
async def update_resource_progress(
    resource_id: int,
    payload: ResourceProgressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """
    Update your progress on a resource
    
    ✨ THIS IS PILLAR 2! Manual progress tracking ✨
    
    You can track:
    - Status: not_started, in_progress, completed, paused
    - Percentage: 0-100%
    - Personal notes: "Review section 3 again"
    
    Works for BOTH personal and group resources!
    
    Example requests:
        # Just started
        POST /resources/1/progress
        {
            "status": "in_progress",
            "progress_percentage": 0,
            "notes": "Starting today!"
        }
        
        # Halfway through
        {
            "status": "in_progress",
            "progress_percentage": 50,
            "notes": "Need to review chapter 3"
        }
        
        # Completed!
        {
            "status": "completed",
            "progress_percentage": 100,
            "notes": "Great video!"
        }
    
    Smart features:
    - Auto-records when you started (first in_progress)
    - Auto-records when completed
    - Updates last_updated timestamp
    
    Note: You must have permission to VIEW the resource to track it
    """
    
    # Step 1: Check if user can view this resource
    if not await resources_service.can_user_view_resource(
        db, current_user.user_id, resource_id
    ):
        raise HTTPException(
            status_code=404,
            detail="Resource not found"
        )
    
    # Step 2: Parse status string to enum
    try:
        status_enum = ResourceStatus[payload.status.upper()]
    except KeyError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be: not_started, in_progress, completed, or paused"
        )
    
    # Step 3: Update progress
    progress = await resources_service.update_resource_progress(
        session=db,
        user_id=current_user.user_id,
        resource_id=resource_id,
        status=status_enum,
        progress_percentage=payload.progress_percentage,
        notes=payload.notes
    )
    
    await db.commit()
    
    return ResourceProgressResponse(**progress.__dict__)


@router.get("/{resource_id}/progress/me", response_model=ResourceProgressResponse)
async def get_my_progress_on_resource(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """
    Get your progress on a specific resource
    
    Returns your tracking data:
    - Current status
    - Percentage complete
    - Your notes
    - When you started
    - When you completed
    
    Example response:
        {
            "id": 1,
            "user_id": "user_123",
            "resource_id": 5,
            "status": "in_progress",
            "progress_percentage": 75,
            "notes": "Almost done, review section 4",
            "started_at": "2024-12-20T10:00:00Z",
            "completed_at": null,
            "last_updated": "2024-12-28T15:30:00Z"
        }
    
    If you haven't tracked this resource yet:
        Returns default state (not_started, 0%)
    """
    
    # Step 1: Check permission
    if not await resources_service.can_user_view_resource(
        db, current_user.user_id, resource_id
    ):
        raise HTTPException(
            status_code=404,
            detail="Resource not found"
        )
    
    # Step 2: Get progress
    progress = await resources_service.get_resource_progress(
        db, current_user.user_id, resource_id
    )
    
    # Step 3: Return progress or default state
    if not progress:
        # Not tracking yet - return default
        from datetime import datetime
        return ResourceProgressResponse(
            id=0,  # Not in DB yet
            user_id=current_user.user_id,
            resource_id=resource_id,
            status="not_started",
            progress_percentage=0,
            notes=None,
            started_at=None,
            completed_at=None,
            last_updated=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
    
    return ResourceProgressResponse(**progress.__dict__)


@router.get("/my-progress", response_model=List[ResourceProgressResponse])
async def get_all_my_progress(
    status: Optional[str] = Query(
        None, 
        regex="^(not_started|in_progress|completed|paused)$",
        description="Filter by status"
    ),
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """
    Get all your resource progress
    
    Optionally filter by status:
    - in_progress: "Continue where you left off"
    - completed: "Your achievements!"
    - paused: "Resume these later"
    - not_started: "Haven't started these yet"
    
    Use cases:
    - Dashboard: "5 resources in progress"
    - Achievements page: "23 completed!"
    - Resume page: "Continue studying"
    
    Examples:
        # Get everything you're tracking
        GET /resources/my-progress
        
        # Get only in-progress resources
        GET /resources/my-progress?status=in_progress
        
        # Get completed resources
        GET /resources/my-progress?status=completed
    
    Perfect for:
    - "Continue where you left off" section
    - Progress dashboard
    - Achievement tracking
    """
    
    # Parse status filter if provided
    status_filter = None
    if status:
        try:
            status_filter = ResourceStatus[status.upper()]
        except KeyError:
            raise HTTPException(
                status_code=400,
                detail="Invalid status"
            )
    
    # Get progress list
    progress_list = await resources_service.get_all_user_progress(
        session=db,
        user_id=current_user.user_id,
        status_filter=status_filter
    )
    
    return [
        ResourceProgressResponse(**p.__dict__)
        for p in progress_list
    ]


@router.delete("/{resource_id}/progress/me", status_code=status.HTTP_204_NO_CONTENT)
async def reset_my_progress(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """
    Reset your progress on a resource
    
    Deletes all tracking data - fresh start!
    
    Use cases:
    - "I want to start over"
    - "Clear my progress"
    - Accidental marking
    
    Example:
        DELETE /resources/1/progress/me
        
        Result: All progress data for resource 1 deleted
    """
    
    success = await resources_service.delete_resource_progress(
        db, current_user.user_id, resource_id
    )
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="No progress found for this resource"
        )
    
    await db.commit()


@router.get("/progress/stats", response_model=dict)
async def get_my_progress_stats(
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """
    Get your progress statistics
    
    NEW ENDPOINT! Perfect for dashboard widgets.
    
    Example response:
        {
            "not_started": 5,
            "in_progress": 12,
            "completed": 23,
            "paused": 3,
            "total_tracked": 43,
            "completion_rate": 53.5
        }
    
    Use for:
    - Dashboard: "📚 12 in progress, ✅ 23 completed"
    - Progress bars: "53% completion rate"
    - Motivation: "23 resources conquered!"
    """
    
    stats = await resources_service.get_user_progress_stats(
        session=db,
        user_id=current_user.user_id
    )
    
    return stats


# ============================================================================
# CONVENIENCE ENDPOINTS - Quick Actions
# ============================================================================

@router.post("/{resource_id}/mark-completed", response_model=ResourceProgressResponse)
async def mark_resource_completed(
    resource_id: int,
    notes: Optional[str] = Query(None, max_length=1000),
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """
    Quick action: Mark as completed
    
    Convenience endpoint that:
    - Sets status to COMPLETED
    - Sets progress to 100%
    - Records completion timestamp
    
    Example:
        POST /resources/1/mark-completed?notes=Great video!
        
    This is a shortcut for:
        POST /resources/1/progress
        {
            "status": "completed",
            "progress_percentage": 100,
            "notes": "Great video!"
        }
    
    Why this endpoint?
    - Simpler for frontends
    - Single-click completion
    - Clear intent
    """
    
    # Check permission
    if not await resources_service.can_user_view_resource(
        db, current_user.user_id, resource_id
    ):
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Mark completed
    progress = await resources_service.mark_resource_completed(
        session=db,
        user_id=current_user.user_id,
        resource_id=resource_id,
        notes=notes
    )
    
    await db.commit()
    
    return ResourceProgressResponse(**progress.__dict__)


@router.post("/{resource_id}/mark-started", response_model=ResourceProgressResponse)
async def mark_resource_started(
    resource_id: int,
    notes: Optional[str] = Query(None, max_length=1000),
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """
    Quick action: Mark as started
    
    Convenience endpoint that:
    - Sets status to IN_PROGRESS
    - Sets progress to 0%
    - Records start timestamp
    
    Example:
        POST /resources/1/mark-started?notes=Starting today!
    
    Why this endpoint?
    - Quick "I'm starting this" button
    - Simpler than full progress update
    - Clear intent
    """
    
    # Check permission
    if not await resources_service.can_user_view_resource(
        db, current_user.user_id, resource_id
    ):
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Mark started
    progress = await resources_service.mark_resource_started(
        session=db,
        user_id=current_user.user_id,
        resource_id=resource_id,
        notes=notes
    )
    
    await db.commit()
    
    return ResourceProgressResponse(**progress.__dict__)


# ============================================================================
# 🎉 ALL THREE PILLARS COMPLETE! 🎉
# ============================================================================

"""
Congratulations! You now have a complete resource tracking system with:

✅ PILLAR 1: Study Sessions
   - Automatic time tracking
   - Daily/weekly analytics
   - Streak system
   (Implemented in study_sessions.py routes)

✅ PILLAR 2: Resource Progress (THIS FILE!)
   - Manual progress tracking
   - Status updates (in_progress, completed, etc.)
   - Personal notes
   - Progress statistics

✅ PILLAR 3: Group Accountability
   - Leaderboards
   - Weekly rankings
   - Social motivation
   (Implemented in study_sessions.py routes)

Total Endpoints in resources.py:
- 6 Basic CRUD (create, read, update, delete, get by ID, get personal)
- 3 Sharing (share, make-personal, move)
- 2 Statistics (resource stats, progress stats)
- 7 Progress tracking (update, get, list, reset, mark-completed, mark-started, stats)
= 18 TOTAL ENDPOINTS! 🚀

Your StudySync application is now feature-complete for all three tracking pillars!
"""


from fastapi import File, UploadFile
from ..services.upload_service import (
    upload_file_to_cloudinary,
    validate_file_size,
    sanitize_filename
)

# ============================================================================
# ADD THIS ENDPOINT TO YOUR ROUTER
# ============================================================================

@router.post("/upload", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    group_id: Optional[int] = None,
    description: Optional[str] = None,
    parent_folder_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """
    Upload file to Cloudinary and create resource
    
    **File Upload Flow:**
    1. User selects file from frontend
    2. File uploaded to Cloudinary (cloud storage)
    3. Get public URL from Cloudinary
    4. Save URL in database as resource
    
    **Supports:**
    - Images (jpg, png, gif, webp)
    - Videos (mp4, mov, avi)
    - Documents (pdf, doc, docx)
    - Any file type
    
    **Parameters:**
    - **file**: File to upload (required)
    - **group_id**: null = personal, int = group resource
    - **description**: Optional description
    - **parent_folder_id**: Optional folder organization
    
    **Max File Size:** 50MB (Cloudinary free tier: 100MB)
    
    **Example (with curl):**
    ```bash
    curl -X POST "http://localhost:8000/api/resources/upload" \
      -H "Authorization: Bearer YOUR_TOKEN" \
      -F "file=@/path/to/notes.pdf" \
      -F "group_id=null" \
      -F "description=My calculus notes"
    ```
    
    **Example (with JavaScript):**
    ```javascript
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('group_id', groupId || 'null');
    formData.append('description', 'My notes');
    
    await fetch('/api/resources/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData  // Don't set Content-Type!
    });
    ```
    """
    
    # Step 1: Validate file size (optional, adjust as needed)
    validate_file_size(file, max_size_mb=50)
    
    # Step 2: Check upload permission
    if not await resources_service.can_user_upload_resource(
        db, current_user.user_id, group_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to upload to this location"
        )
    
    # Step 3: Verify group exists if provided
    if group_id:
        from ..services.group_service import get_group_by_id
        group = await get_group_by_id(db, group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
    
    # Step 4: Upload to Cloudinary
    try:
        upload_result = await upload_file_to_cloudinary(
            file=file,
            folder="study-resources"  # Organize in Cloudinary
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}"
        )
    
    # Step 5: Detect resource type from content type
    from ..database.models import ResourceType
    
    content_type = file.content_type or "application/octet-stream"
    
    if content_type.startswith('image/'):
        resource_type = ResourceType.IMAGE
    elif content_type.startswith('video/'):
        resource_type = ResourceType.VIDEO
    elif content_type == 'application/pdf':
        resource_type = ResourceType.FILE
    elif 'link' in file.filename.lower() or 'url' in file.filename.lower():
        resource_type = ResourceType.LINK
    else:
        resource_type = ResourceType.FILE
    
    # Step 6: Clean filename for title
    clean_title = sanitize_filename(file.filename)
    
    # Step 7: Create resource in database
    resource = await resources_service.create_resource(
        session=db,
        user_id=current_user.user_id,
        title=clean_title,
        url=upload_result['url'],  # Cloudinary public URL
        resource_type=resource_type,
        group_id=group_id,
        description=description,
        parent_folder_id=parent_folder_id,
        file_size=upload_result['size']
    )
    
    # Step 8: Commit to database
    await db.commit()
    await db.refresh(resource) 
    # Step 9: Return resource
    return ResourceResponse(
        **resource.__dict__,
        is_personal=(resource.group_id is None)
    )


# ============================================================================
# OPTIONAL: DELETE WITH CLOUDINARY CLEANUP
# ============================================================================

# If you want to also delete from Cloudinary when resource is deleted,
# modify your existing delete_resource endpoint:

@router.delete("/{resource_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource_permanently(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """
    Delete resource from database AND Cloudinary
    
    WARNING: This is permanent! The file will be removed from cloud storage.
    
    Use the regular DELETE /resources/{id} for soft delete (keeps file).
    """
    
    # Check permission
    if not await resources_service.can_user_modify_resource(
        db, current_user.user_id, resource_id
    ):
        raise HTTPException(status_code=403, detail="No permission")
    
    # Get resource
    resource = await resources_service.get_resource_by_id(db, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Delete from Cloudinary (if URL is from Cloudinary)
    if "cloudinary.com" in resource.url:
        # Extract public_id from URL
        # URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{public_id}.{format}
        try:
            from ..services.upload_service import delete_file_from_cloudinary
            
            # Simple extraction (works for most cases)
            url_parts = resource.url.split('/')
            public_id_with_ext = '/'.join(url_parts[-2:])  # folder/filename.ext
            public_id = public_id_with_ext.rsplit('.', 1)[0]  # Remove extension
            
            await delete_file_from_cloudinary(public_id)
        except Exception as e:
            print(f"Warning: Could not delete from Cloudinary: {e}")
            # Continue with database deletion anyway
    
    # Delete from database
    success = await resources_service.delete_resource(db, resource_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    await db.commit()


@router.post("/debug-upload")
async def debug_upload(
    file: UploadFile = File(...),
    group_id: int = Form(None),
    description: str = Form(None),
    parent_folder_id: int = Form(None),
    db = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """
    Debug endpoint to check if uploaded file and form data reach backend.
    """

    # Print file info
    file_content_preview = await file.read()
    print("=== DEBUG UPLOAD RECEIVED ===")
    print("File name:", file.filename)
    print("Content type:", file.content_type)
    print("File size (bytes):", len(file_content_preview))
    print("Preview (first 100 bytes):", file_content_preview[:100])

    # Reset file pointer if you want to use it later
    await file.seek(0)

    # Print form data
    print("Group ID:", group_id)
    print("Description:", description)
    print("Parent folder ID:", parent_folder_id)
    print("Uploaded by user ID:", current_user.user_id)

    return {
        "file_name": file.filename,
        "content_type": file.content_type,
        "file_size": len(file_content_preview),
        "group_id": group_id,
        "description": description,
        "parent_folder_id": parent_folder_id
    }