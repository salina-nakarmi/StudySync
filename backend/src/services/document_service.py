import re
import secrets
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..database.models import Document, DocumentVersion, DocumentCollaborator, Comment
from ..database.models import Users
from ..services.user_service import get_user_by_email

MAX_VERSIONS_KEPT = 50

# Roles that may edit document content / metadata.
EDIT_ROLES = ("owner", "editor")
# Roles that may add comments (editors and owners can always comment too).
COMMENT_ROLES = ("owner", "editor", "commenter")


def _word_count(html: str) -> int:
    text = re.sub(r"<[^>]*>", " ", html or "")
    return len([w for w in text.strip().split() if w])


def _char_count(html: str) -> int:
    text = re.sub(r"<[^>]*>", "", html or "")
    return len(text)


# ── Documents ────────────────────────────────────────────────────────────────

def create_document(db: Session, owner: Users, title: str, content: str, font_family: str, font_size: str) -> Document:
    doc = Document(
        title=title,
        content=content,
        owner_id=owner.id,
        last_edited_by_id=owner.id,
        font_family=font_family,
        font_size=font_size,
        word_count=_word_count(content),
        char_count=_char_count(content),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def get_document_or_404(db: Session, document_id: int) -> Document:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


def get_user_role(document: Document, user: Users) -> str | None:
    """Returns the user's role on a document ('owner', 'editor', 'commenter', 'viewer') or None."""
    if document.owner_id == user.id:
        return "owner"
    for collab in document.collaborators:
        if collab.user_id == user.id:
            return collab.role
    return None


def assert_can_view(document: Document, user: Users) -> None:
    if get_user_role(document, user) is None:
        raise HTTPException(status_code=403, detail="You don't have access to this document")


def assert_can_edit(document: Document, user: Users) -> None:
    role = get_user_role(document, user)
    if role not in EDIT_ROLES:
        raise HTTPException(status_code=403, detail="You don't have edit access to this document")


def assert_can_comment(document: Document, user: Users) -> None:
    role = get_user_role(document, user)
    if role not in COMMENT_ROLES:
        raise HTTPException(status_code=403, detail="You don't have permission to comment on this document")


def assert_is_owner(document: Document, user: Users) -> None:
    if document.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only the document owner can do this")


def list_documents(db: Session, user: Users, trashed: bool = False, starred: bool | None = None) -> list[Document]:
    query = (
        db.query(Document)
        .outerjoin(DocumentCollaborator, DocumentCollaborator.document_id == Document.id)
        .filter(
            or_(Document.owner_id == user.id, DocumentCollaborator.user_id == user.id),
            Document.trashed == trashed,
        )
    )
    if starred is not None:
        query = query.filter(Document.starred == starred)
    return query.order_by(Document.updated_at.desc()).distinct().all()


def search_documents(db: Session, user: Users, q: str) -> list[Document]:
    like = f"%{q}%"
    return (
        db.query(Document)
        .outerjoin(DocumentCollaborator, DocumentCollaborator.document_id == Document.id)
        .filter(
            or_(Document.owner_id == user.id, DocumentCollaborator.user_id == user.id),
            Document.trashed.is_(False),
            or_(Document.title.ilike(like), Document.content.ilike(like)),
        )
        .order_by(Document.updated_at.desc())
        .distinct()
        .all()
    )


def update_document(db: Session, document: Document, user: Users, **fields) -> Document:
    for key, value in fields.items():
        if value is not None:
            setattr(document, key, value)

    if "content" in fields and fields["content"] is not None:
        document.word_count = _word_count(fields["content"])
        document.char_count = _char_count(fields["content"])

    document.last_edited_by_id = user.id
    db.commit()
    db.refresh(document)
    return document


def save_version(db: Session, document: Document, user: Users) -> DocumentVersion:
    """Snapshot the current content -- called by the Save button and by autosave."""
    version = DocumentVersion(
        document_id=document.id,
        content=document.content,
        title=document.title,
        word_count=document.word_count,
        edited_by_id=user.id,
    )
    db.add(version)
    db.commit()

    # Keep version history bounded.
    all_versions = (
        db.query(DocumentVersion)
        .filter(DocumentVersion.document_id == document.id)
        .order_by(DocumentVersion.created_at.desc())
        .all()
    )
    for stale in all_versions[MAX_VERSIONS_KEPT:]:
        db.delete(stale)
    db.commit()
    db.refresh(version)
    return version


def list_versions(db: Session, document: Document) -> list[DocumentVersion]:
    return (
        db.query(DocumentVersion)
        .filter(DocumentVersion.document_id == document.id)
        .order_by(DocumentVersion.created_at.desc())
        .all()
    )


def restore_version(db: Session, document: Document, version_id: int, user: Users) -> Document:
    version = (
        db.query(DocumentVersion)
        .filter(DocumentVersion.id == version_id, DocumentVersion.document_id == document.id)
        .first()
    )
    if version is None:
        raise HTTPException(status_code=404, detail="Version not found")

    # Snapshot current state before overwriting, so restoring is itself reversible.
    save_version(db, document, user)

    document.content = version.content
    document.title = version.title
    document.word_count = version.word_count
    document.char_count = _char_count(version.content)
    document.last_edited_by_id = user.id
    db.commit()
    db.refresh(document)
    return document


def duplicate_document(db: Session, document: Document, user: Users) -> Document:
    copy = Document(
        title=f"{document.title} (copy)",
        content=document.content,
        owner_id=user.id,
        last_edited_by_id=user.id,
        font_family=document.font_family,
        font_size=document.font_size,
        style=document.style,
        style_set=document.style_set,
        word_count=document.word_count,
        char_count=document.char_count,
    )
    db.add(copy)
    db.commit()
    db.refresh(copy)
    return copy


def trash_document(db: Session, document: Document) -> Document:
    document.trashed = True
    document.trashed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(document)
    return document


def restore_from_trash(db: Session, document: Document) -> Document:
    document.trashed = False
    document.trashed_at = None
    db.commit()
    db.refresh(document)
    return document


def permanently_delete(db: Session, document: Document) -> None:
    db.delete(document)
    db.commit()


def toggle_star(db: Session, document: Document, starred: bool) -> Document:
    document.starred = starred
    db.commit()
    db.refresh(document)
    return document


# ── Collaborators (per-user Share dialog) ──────────────────────────────────

def add_collaborator(db: Session, document: Document, email: str, role: str) -> DocumentCollaborator:
    invited_user = get_user_by_email(db, email)
    if invited_user is None:
        raise HTTPException(status_code=404, detail="No user found with that email. They must sign in once first.")

    existing = (
        db.query(DocumentCollaborator)
        .filter(DocumentCollaborator.document_id == document.id, DocumentCollaborator.user_id == invited_user.id)
        .first()
    )
    if existing:
        existing.role = role
        db.commit()
        db.refresh(existing)
        return existing

    collab = DocumentCollaborator(document_id=document.id, user_id=invited_user.id, role=role)
    db.add(collab)
    db.commit()
    db.refresh(collab)
    return collab


def remove_collaborator(db: Session, document: Document, user_id: str) -> None:
    collab = (
        db.query(DocumentCollaborator)
        .filter(DocumentCollaborator.document_id == document.id, DocumentCollaborator.user_id == user_id)
        .first()
    )
    if collab is None:
        raise HTTPException(status_code=404, detail="Collaborator not found")
    db.delete(collab)
    db.commit()


# ── Public share link ───────────────────────────────────────────────────────

def update_share_link(db: Session, document: Document, enabled: bool, role: str) -> Document:
    document.share_link_enabled = enabled
    document.share_link_role = role
    if enabled and not document.share_link_token:
        document.share_link_token = secrets.token_urlsafe(16)
    if not enabled:
        document.share_link_token = None
    db.commit()
    db.refresh(document)
    return document


def get_document_by_share_token(db: Session, token: str) -> Document:
    doc = (
        db.query(Document)
        .filter(Document.share_link_token == token, Document.share_link_enabled.is_(True))
        .first()
    )
    if doc is None:
        raise HTTPException(status_code=404, detail="This share link is invalid or has been disabled")
    return doc


# ── Comments (threaded) ─────────────────────────────────────────────────────

def get_comment_or_404(db: Session, document: Document, comment_id: int) -> Comment:
    comment = (
        db.query(Comment)
        .filter(Comment.id == comment_id, Comment.document_id == document.id)
        .first()
    )
    if comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    return comment


def create_comment(
    db: Session,
    document: Document,
    user: Users,
    text: str,
    quoted_text: str | None = None,
    start_offset: int | None = None,
    end_offset: int | None = None,
    parent_id: int | None = None,
) -> Comment:
    if parent_id is not None:
        # Validate the parent belongs to the same document and is itself top-level,
        # so threads stay one level deep (matches most Word-style comment UIs).
        parent = get_comment_or_404(db, document, parent_id)
        if parent.parent_id is not None:
            raise HTTPException(status_code=400, detail="Cannot reply to a reply; reply to the top-level comment")

    comment = Comment(
        document_id=document.id,
        author_id=user.id,
        parent_id=parent_id,
        text=text,
        quoted_text=quoted_text,
        start_offset=start_offset,
        end_offset=end_offset,
        resolved=False,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


def list_comments(db: Session, document: Document) -> list[Comment]:
    """Returns top-level comments with `.replies` populated, ordered oldest-first."""
    top_level = (
        db.query(Comment)
        .filter(Comment.document_id == document.id, Comment.parent_id.is_(None))
        .order_by(Comment.created_at.asc())
        .all()
    )
    return top_level


def update_comment_text(db: Session, comment: Comment, text: str) -> Comment:
    comment.text = text
    comment.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(comment)
    return comment


def set_comment_resolved(db: Session, comment: Comment, resolved: bool) -> Comment:
    # Resolving a thread resolves its replies too, so the thread disappears together.
    comment.resolved = resolved
    for reply in comment.replies:
        reply.resolved = resolved
    db.commit()
    db.refresh(comment)
    return comment


def delete_comment(db: Session, comment: Comment) -> None:
    db.delete(comment)  # cascades to replies via relationship config
    db.commit()


def assert_can_manage_comment(comment: Comment, document: Document, user: Users) -> None:
    """Only the comment's author or the document owner can edit/delete/resolve it."""
    if comment.author_id != user.id and document.owner_id != user.id:
        raise HTTPException(status_code=403, detail="You can only manage your own comments")