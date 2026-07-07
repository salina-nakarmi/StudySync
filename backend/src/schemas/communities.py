from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal
from ..database.models import PostType  # adjust import path to match your project layout


# ============================================================
# Type-specific payloads (become `type_data` JSON on the model)
# ============================================================

class LinkPostData(BaseModel):
    link_title: str
    link_url: str
    link_snippet: Optional[str] = None


class ResourcePostData(BaseModel):
    # Only used if you want to snapshot resource info at post-time;
    # otherwise this can be omitted entirely and derived from the
    # linked Resource via resource_id at read time.
    subject: Optional[str] = None


# ============================================================
# Post schemas
# ============================================================

class PostCreate(BaseModel):
    post_type: PostType
    title: str
    text: Optional[str] = None
    group_id: Optional[int] = None

    # Only one of these should be set, matching post_type
    resource_id: Optional[int] = None
    link_data: Optional[LinkPostData] = None


class PostUpdate(BaseModel):
    title: Optional[str] = None
    text: Optional[str] = None


class AuthorSummary(BaseModel):
    """Lightweight author info embedded in post/comment responses."""
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class ResourceSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    url: str
    resource_type: str
    file_size: Optional[int] = None
    total_pages: Optional[int] = None

class PostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    post_type: PostType
    title: str
    text: Optional[str] = None

    group_id: Optional[int] = None
    community_name: Optional[str] = None  # populated from Groups.group_name in the route

    resource_id: Optional[int] = None
    resource: Optional[ResourceSummary] = None 
    type_data: Optional[dict] = None  # parsed from the JSON string before returning

    author: AuthorSummary

    like_count: int
    save_count: int
    share_count: int
    comment_count: int

    # Per-requesting-user flags — NOT stored on Posts; computed in the
    # route by checking PostLikes/PostSaves for the current user_id.
    liked_by_me: bool = False
    saved_by_me: bool = False

    created_at: datetime
    updated_at: datetime


class PostListResponse(BaseModel):
    posts: list[PostResponse]
    total: int
    skip: int
    limit: int


# ============================================================
# Like / Save — simple toggle responses
# ============================================================

class ToggleResponse(BaseModel):
    """Returned by POST /posts/{id}/like and /posts/{id}/save"""
    active: bool          # True = now liked/saved, False = now un-liked/un-saved
    like_count: Optional[int] = None
    save_count: Optional[int] = None


class ShareResponse(BaseModel):
    share_count: int
    share_url: Optional[str] = None


# ============================================================
# Comments
# ============================================================

class CommentCreate(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    parent_comment_id: Optional[int] = None


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    post_id: int
    parent_comment_id: Optional[int] = None
    text: str
    author: AuthorSummary
    is_edited: bool
    created_at: datetime
    updated_at: datetime
    replies: list["CommentResponse"] = []  # populated in the route for top-level comments


CommentResponse.model_rebuild()  # needed for the self-referencing `replies` field


# ============================================================
# Sidebar
# ============================================================

class RecentUploadItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    post_id: int
    title: str
    meta: str  # e.g. "PDF · 8 pages" — built in the route from resource fields


class TopContributorItem(BaseModel):
    user_id: str
    username: str
    contributions: int
    rank: int


# ============================================================
# Query params (used as FastAPI dependency, not a body)
# ============================================================

class PostFilterParams(BaseModel):
    post_type: Optional[PostType] = None
    group_id: Optional[int] = None
    search: Optional[str] = None
    skip: int = 0
    limit: int = 20


