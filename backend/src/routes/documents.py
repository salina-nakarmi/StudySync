from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..dependencies import get_current_user
from ..database.database import get_db
from ..database.models import Users
from ..services import document_service as svc
from ..schemas.documents import (
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    DocumentListItem,
    DocumentVersionResponse,
    CollaboratorAdd,
    CollaboratorResponse,
    ShareLinkUpdate,
    ShareLinkResponse,
    CommentCreate,
    CommentReplyCreate,
    CommentUpdate,
    CommentResolve,
    CommentResponse,
)

router = APIRouter(prefix="/documents", tags=["Documents"])


# ── Documents ────────────────────────────────────────────────────────────────

@router.post("", response_model=DocumentResponse)
def create_document(
    payload: DocumentCreate,
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = svc.create_document(
        db, current_user,
        title=payload.title,
        content=payload.content,
        font_family=payload.font_family,
        font_size=payload.font_size,
    )
    return doc


@router.get("", response_model=list[DocumentListItem])
def list_documents(
    trashed: bool = Query(False),
    starred: bool | None = Query(None),
    q: str | None = Query(None, description="Search title/content"),
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if q:
        return svc.search_documents(db, current_user, q)
    return svc.list_documents(db, current_user, trashed=trashed, starred=starred)


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = svc.get_document_or_404(db, document_id)
    svc.assert_can_view(doc, current_user)
    return doc


@router.put("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: int,
    payload: DocumentUpdate,
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = svc.get_document_or_404(db, document_id)
    svc.assert_can_edit(doc, current_user)
    return svc.update_document(db, doc, current_user, **payload.model_dump(exclude_unset=True))


@router.delete("/{document_id}")
def trash_document(
    document_id: int,
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = svc.get_document_or_404(db, document_id)
    svc.assert_can_edit(doc, current_user)
    svc.trash_document(db, doc)
    return {"message": "Document moved to trash"}


@router.post("/{document_id}/restore", response_model=DocumentResponse)
def restore_document(
    document_id: int,
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = svc.get_document_or_404(db, document_id)
    svc.assert_is_owner(doc, current_user)
    return svc.restore_from_trash(db, doc)


@router.delete("/{document_id}/permanent")
def permanently_delete_document(
    document_id: int,
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = svc.get_document_or_404(db, document_id)
    svc.assert_is_owner(doc, current_user)
    svc.permanently_delete(db, doc)
    return {"message": "Document permanently deleted"}


@router.post("/{document_id}/duplicate", response_model=DocumentResponse)
def duplicate_document(
    document_id: int,
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = svc.get_document_or_404(db, document_id)
    svc.assert_can_view(doc, current_user)
    return svc.duplicate_document(db, doc, current_user)


@router.patch("/{document_id}/star", response_model=DocumentResponse)
def star_document(
    document_id: int,
    starred: bool = Query(...),
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = svc.get_document_or_404(db, document_id)
    svc.assert_can_view(doc, current_user)
    return svc.toggle_star(db, doc, starred)


# ── Version history ──────────────────────────────────────────────────────────

@router.post("/{document_id}/versions", response_model=DocumentVersionResponse)
def save_version(
    document_id: int,
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = svc.get_document_or_404(db, document_id)
    svc.assert_can_edit(doc, current_user)
    return svc.save_version(db, doc, current_user)


@router.get("/{document_id}/versions", response_model=list[DocumentVersionResponse])
def list_versions(
    document_id: int,
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = svc.get_document_or_404(db, document_id)
    svc.assert_can_view(doc, current_user)
    return svc.list_versions(db, doc)


@router.post("/{document_id}/versions/{version_id}/revert", response_model=DocumentResponse)
def revert_document_version(
    document_id: int,
    version_id: int,
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = svc.get_document_or_404(db, document_id)
    svc.assert_can_edit(doc, current_user)
    return svc.restore_version(db, doc, version_id, current_user)


# ── Collaborators & share link ──────────────────────────────────────────────

@router.post("/{document_id}/collaborators", response_model=CollaboratorResponse)
def add_collaborator(
    document_id: int,
    payload: CollaboratorAdd,
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = svc.get_document_or_404(db, document_id)
    svc.assert_is_owner(doc, current_user)
    return svc.add_collaborator(db, doc, payload.email, payload.role)


@router.delete("/{document_id}/collaborators/{user_id}")
def remove_collaborator(
    document_id: int,
    user_id: str,
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = svc.get_document_or_404(db, document_id)
    svc.assert_is_owner(doc, current_user)
    svc.remove_collaborator(db, doc, user_id)
    return {"message": "Collaborator removed"}


@router.put("/{document_id}/share-link", response_model=ShareLinkResponse)
def update_share_link(
    document_id: int,
    payload: ShareLinkUpdate,
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = svc.get_document_or_404(db, document_id)
    svc.assert_is_owner(doc, current_user)
    return svc.update_share_link(db, doc, payload.enabled, payload.role)


# ── Comments (threaded) ──────────────────────────────────────────────────────

@router.get("/{document_id}/comments", response_model=list[CommentResponse])
def list_comments(
    document_id: int,
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = svc.get_document_or_404(db, document_id)
    svc.assert_can_view(doc, current_user)
    return svc.list_comments(db, doc)


@router.post("/{document_id}/comments", response_model=CommentResponse)
def create_comment(
    document_id: int,
    payload: CommentCreate,
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = svc.get_document_or_404(db, document_id)
    svc.assert_can_comment(doc, current_user)
    return svc.create_comment(
        db, doc, current_user,
        text=payload.text,
        quoted_text=payload.quoted_text,
        start_offset=payload.start_offset,
        end_offset=payload.end_offset,
    )


@router.post("/{document_id}/comments/{comment_id}/replies", response_model=CommentResponse)
def reply_to_comment(
    document_id: int,
    comment_id: int,
    payload: CommentReplyCreate,
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = svc.get_document_or_404(db, document_id)
    svc.assert_can_comment(doc, current_user)
    return svc.create_comment(db, doc, current_user, text=payload.text, parent_id=comment_id)


@router.patch("/{document_id}/comments/{comment_id}", response_model=CommentResponse)
def edit_comment(
    document_id: int,
    comment_id: int,
    payload: CommentUpdate,
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = svc.get_document_or_404(db, document_id)
    svc.assert_can_view(doc, current_user)
    comment = svc.get_comment_or_404(db, doc, comment_id)
    svc.assert_can_manage_comment(comment, doc, current_user)
    return svc.update_comment_text(db, comment, payload.text)


@router.patch("/{document_id}/comments/{comment_id}/resolve", response_model=CommentResponse)
def resolve_comment(
    document_id: int,
    comment_id: int,
    payload: CommentResolve,
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = svc.get_document_or_404(db, document_id)
    svc.assert_can_comment(doc, current_user)
    comment = svc.get_comment_or_404(db, doc, comment_id)
    return svc.set_comment_resolved(db, comment, payload.resolved)


@router.delete("/{document_id}/comments/{comment_id}")
def delete_comment(
    document_id: int,
    comment_id: int,
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = svc.get_document_or_404(db, document_id)
    svc.assert_can_view(doc, current_user)
    comment = svc.get_comment_or_404(db, doc, comment_id)
    svc.assert_can_manage_comment(comment, doc, current_user)
    svc.delete_comment(db, comment)
    return {"message": "Comment deleted"}