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


class ResourceCreate(BaseModel):
    group_id: int
    url: str
    resource_type: ResourceType
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    parent_folder_id: Optional[int] = None
    file_size: Optional[int] = None


class ResourceResponse(BaseModel):
    id: int
    group_id: int
    url: str
    uploaded_by: str
    resource_type: ResourceType
    title: str
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
