from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class ResourceType(str, Enum):
    image = "image"
    video = "video"
    file = "file"
    folder = "folder"
    link = "link"

# ============================================================================
# REQUEST SCHEMAS - What API accepts
# ============================================================================
class ResourceCreate(BaseModel):
    group_id: Optional[int] = Field(None, description="GroupId None, resource is personal")
    url: str = Field(..., description="Resource URL")
    resource_type: ResourceType
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    parent_folder_id: Optional[int] = Field(None, description="Parent folder for organization")
    file_size: Optional[int] = Field(None, ge=0, description="File size in bytes, if applicable")

class ResourceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    url: Optional[str] = None
    parent_folder_id: Optional[int] = None

# ============================================================================
# RESPONSE SCHEMAS - What API returns
# ============================================================================
class ResourceResponse(BaseModel):
    id: int
    group_id: Optional[int]
    url: str
    uploaded_by: str
    resource_type: ResourceType
    title: str
    description: Optional[str]
    parent_folder_id: Optional[int]
    file_size: Optional[int]
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    # Computed field (calculated, not in database)
    is_personal: bool = Field(
        default=False, 
        description="True if personal resource (group_id is null)"
    )
    
    class Config:
        from_attributes = True  # Allow creating from ORM models

class ResourceWithUploaderInfo(ResourceResponse):
    """
    Enhanced response with uploader details
    
    Use when you want to show who uploaded the resource
    """
    uploader_username: Optional[str] = None
    uploader_first_name: Optional[str] = None
    uploader_last_name: Optional[str] = None

# ============================================================================
# SHARING SCHEMAS - For moving resources between contexts
# ============================================================================

class ShareResourceRequest(BaseModel):
    """
    Share a personal resource to a group
    
    Example:
        POST /resources/123/share
        { "group_id": 456 }
    """
    group_id: int = Field(..., description="Group to share with")

class MoveResourceRequest(BaseModel):
    """
    Move resource to different group or make personal
    
    Example:
        # Make personal
        POST /resources/123/move
        { "group_id": null }
        
        # Move to different group
        POST /resources/123/move
        { "group_id": 789 }
    """
    group_id: Optional[int] = Field(
        None, 
        description="Target group ID (null = make personal)"
    )

# ============================================================================
# PROGRESS TRACKING SCHEMAS - For Pillar 2
# ============================================================================

class ResourceProgressUpdate(BaseModel):
    """"Manual progress tracking"""
    status: str = Field(..., pattern="^(not_started|in_progress|completed|paused)$", description = "Current status")
    progress_percentage: int = Field(..., ge=0, le=100)
    notes: Optional[str] = Field(None, max_length=1000)

class ResourceProgressResponse(BaseModel):
    """
    Resource progress response
    
    Shows user's tracking data for a resource
    """
    id: int
    user_id: str
    resource_id: int
    status: str
    progress_percentage: int
    notes: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    last_updated: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

class ResourceWithProgress(ResourceResponse):
    """
    Resource with user's progress data
    
    Combines resource info + progress tracking
    Perfect for "My Library" views
    
    Example response:
        {
            "id": 123,
            "title": "Calculus Video",
            "url": "https://...",
            ...
            "my_progress": {
                "status": "in_progress",
                "progress_percentage": 50,
                "notes": "Review this again"
            }
        }
    """
    my_progress: Optional[ResourceProgressResponse] = Field(
        None, 
        description="User's progress on this resource"
    )
