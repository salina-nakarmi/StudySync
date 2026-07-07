import uuid

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.comment import Comment, CommentReply
from app.models.document import Document
from app.models.user import User


def list_comments(db: Session, document: Document, resolved: bool | None = None) -> list[Comment]:
    query = db.query(Comment).filter(Comment.document_id == document.id)
    if resolved is not None:
        query = query.filter(Comment.resolved == resolved)
    return query.order_by(Comment.created_at.asc()).all()


def create_comment(
    db: Session,
    document: Document,
    author: User,
    text: str,
    quoted_text: str | None,
    start_offset: int | None,
    end_offset: int | None,
) -> Comment:
    comment = Comment(
        document_id=document.id,
        author_id=author.id,
        text=text,
        quoted_text=quoted_text,
        start_offset=start_offset,
        end_offset=end_offset,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


def get_comment_or_404(db: Session, document: Document, comment_id: uuid.UUID) -> Comment:
    comment = (
        db.query(Comment)
        .filter(Comment.id == comment_id, Comment.document_id == document.id)
        .first()
    )
    if comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    return comment


def resolve_comment(db: Session, comment: Comment, resolved: bool) -> Comment:
    comment.resolved = resolved
    db.commit()
    db.refresh(comment)
    return comment


def delete_comment(db: Session, comment: Comment) -> None:
    db.delete(comment)
    db.commit()


def add_reply(db: Session, comment: Comment, author: User, text: str) -> CommentReply:
    reply = CommentReply(comment_id=comment.id, author_id=author.id, text=text)
    db.add(reply)
    db.commit()
    db.refresh(reply)
    return reply