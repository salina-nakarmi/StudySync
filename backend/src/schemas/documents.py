import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import String, Integer, ForeignKey, Text  # <-- Make sure Text is added here

# ── Documents ────────────────────────────────────────────────────────────────

class DocumentCreate(BaseModel):
    title: str = "Untitled Document"
    content: str = ""
    font_family: str = "Calibri"
    font_size: str = "12"


class DocumentUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    font_family: str | None = None
    font_size: str | None = None
    style: str | None = None
    style_set: str | None = None


class DocumentResponse(BaseModel):
    id: int
    title: str
    content: str
    owner_id: int
    last_edited_by_id: int | None
    font_family: str
    font_size: str
    word_count: int
    char_count: int
    starred: bool
    trashed: bool
    share_link_enabled: bool
    share_link_role: str | None
    share_link_token: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentListItem(BaseModel):
    id: int
    title: str
    owner_id: int
    word_count: int
    starred: bool
    trashed: bool
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentVersionResponse(BaseModel):
    id: int
    document_id: int
    title: str
    word_count: int
    edited_by_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Collaborators / sharing ─────────────────────────────────────────────────

class CollaboratorAdd(BaseModel):
    email: EmailStr
    role: str = Field(pattern="^(editor|commenter|viewer)$")


class CollaboratorResponse(BaseModel):
    user_id: str
    role: str

    class Config:
        from_attributes = True


class ShareLinkUpdate(BaseModel):
    enabled: bool
    role: str = Field(default="viewer", pattern="^(editor|commenter|viewer)$")


class ShareLinkResponse(BaseModel):
    share_link_enabled: bool
    share_link_role: str | None
    share_link_token: str | None


# ── Comments ─────────────────────────────────────────────────────────────────

class CommentCreate(BaseModel):
    text: str
    quoted_text: str | None = None
    start_offset: int | None = None
    end_offset: int | None = None


class CommentReplyCreate(BaseModel):
    text: str


class CommentUpdate(BaseModel):
    text: str


class CommentResolve(BaseModel):
    resolved: bool


class CommentResponse(BaseModel):
    id: int
    document_id: int
    author_id: int
    parent_id: int | None
    text: str
    quoted_text: str | None
    start_offset: int | None
    end_offset: int | None
    resolved: bool
    created_at: datetime
    updated_at: datetime | None
    replies: list["CommentResponse"] = []

    class Config:
        from_attributes = True


# Rebuild recursive forward references at the root execution level
CommentResponse.model_rebuild()