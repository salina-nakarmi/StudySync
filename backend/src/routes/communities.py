from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
import json

from ..database.database import get_db
from ..database.models import Users, PostType, Groups, Resources
from ..schemas.communities import (
    PostCreate, PostUpdate, PostResponse, PostListResponse, AuthorSummary,
    ToggleResponse, ShareResponse,
    CommentCreate, CommentResponse,
    RecentUploadItem, TopContributorItem,ResourceSummary
)
from ..dependencies import get_current_user
from ..services import community_service, resources_service
from ..services.group_service import is_user_in_group, get_group_by_id

router = APIRouter(prefix="/community", tags=["Community"])


# ============================================================================
# HELPERS - build response DTOs (mirrors ResourceProgressResponse's manual
# construction, since Posts has computed/derived fields __dict__ can't give us)
# ============================================================================

async def _build_post_response(
    db: AsyncSession, post, current_user: Users
) -> PostResponse:
    author_result = await db.get(Users, post.user_id)
    group = await db.get(Groups, post.group_id) if post.group_id else None

    reaction_state = await community_service.get_post_reaction_state(
        db, current_user.user_id, post.id
    )

    type_data = json.loads(post.type_data) if post.type_data else None

    resource_summary = None
    if post.resource_id:
        resource = await db.get(Resources, post.resource_id)
        if resource:
            resource_summary = ResourceSummary(
                id=resource.id,
                title=resource.title,
                url=resource.url,
                resource_type=resource.resource_type.value,
                file_size=resource.file_size,
                total_pages=resource.total_pages,
            )

    return PostResponse(
        id=post.id,
        post_type=post.post_type,
        title=post.title,
        text=post.text,
        group_id=post.group_id,
        community_name=group.group_name if group else None,
        resource_id=post.resource_id,
        resource=resource_summary,   # NEW
        type_data=type_data,
        author=AuthorSummary(
            user_id=author_result.user_id,
            username=author_result.username,
            first_name=author_result.first_name,
            last_name=author_result.last_name,
        ),
        like_count=post.like_count,
        save_count=post.save_count,
        share_count=post.share_count,
        comment_count=post.comment_count,
        liked_by_me=reaction_state["liked_by_me"],
        saved_by_me=reaction_state["saved_by_me"],
        created_at=post.created_at,
        updated_at=post.updated_at,
    )


# ============================================================================
# CREATE
# ============================================================================

@router.post("/posts", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    payload: PostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    if payload.group_id:
        group = await get_group_by_id(db, payload.group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")

        if not await is_user_in_group(db, current_user.user_id, payload.group_id):
            raise HTTPException(
                status_code=403,
                detail="You must be a member to post in this group"
            )

    if payload.post_type == PostType.RESOURCE and not payload.resource_id:
        raise HTTPException(status_code=400, detail="resource_id is required for resource posts")
    if payload.post_type == PostType.LINK and not payload.link_data:
        raise HTTPException(status_code=400, detail="link_data is required for link posts")

    if payload.resource_id:
        resource = await db.get(Resources, payload.resource_id)
        if not resource:
            raise HTTPException(status_code=404, detail="Resource not found")

    post = await community_service.create_post(
        session=db,
        user_id=current_user.user_id,
        post_type=payload.post_type,
        title=payload.title,
        text=payload.text,
        group_id=payload.group_id,
        resource_id=payload.resource_id,
        link_data=payload.link_data.model_dump() if payload.link_data else None,
    )

    await db.commit()
    await db.refresh(post)

    return await _build_post_response(db, post, current_user)


# ============================================================================
# READ
# ============================================================================

@router.get("/posts", response_model=PostListResponse)
async def list_posts(
    post_type: Optional[PostType] = Query(None),
    group_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    # If scoped to a private group, verify membership first
    if group_id:
        group = await get_group_by_id(db, group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        if not await is_user_in_group(db, current_user.user_id, group_id):
            raise HTTPException(
                status_code=403,
                detail="You must be a member to view this group's posts"
            )

    posts, total = await community_service.get_posts(
        session=db,
        post_type=post_type,
        group_id=group_id,
        search=search,
        skip=skip,
        limit=limit,
    )

    return PostListResponse(
        posts=[await _build_post_response(db, p, current_user) for p in posts],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/posts/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    if not await community_service.can_user_view_post(db, current_user.user_id, post_id):
        raise HTTPException(status_code=404, detail="Post not found")

    post = await community_service.get_post_by_id(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    return await _build_post_response(db, post, current_user)

@router.get("/my-resources-for-post", response_model=List[dict])
async def get_my_resources_for_post(
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """Lightweight list of the current user's resources, for the
    'attach a resource' picker in the create-post modal."""
    resources, _ = await resources_service.get_all_user_resources(
        session=db, user_id=current_user.user_id, skip=0, limit=100
    )
    return [
        {"id": r.id, "title": r.title, "resource_type": r.resource_type.value}
        for r in resources
    ]

# ============================================================================
# UPDATE
# ============================================================================

@router.patch("/posts/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    payload: PostUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    if not await community_service.can_user_modify_post(db, current_user.user_id, post_id):
        raise HTTPException(status_code=403, detail="You don't have permission to edit this post")

    post = await community_service.update_post(
        session=db,
        post_id=post_id,
        title=payload.title,
        text=payload.text,
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    await db.commit()
    return await _build_post_response(db, post, current_user)


# ============================================================================
# DELETE
# ============================================================================

@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    if not await community_service.can_user_modify_post(db, current_user.user_id, post_id):
        raise HTTPException(status_code=403, detail="You don't have permission to delete this post")

    success = await community_service.delete_post(db, post_id)
    if not success:
        raise HTTPException(status_code=404, detail="Post not found")

    await db.commit()


# ============================================================================
# REACTIONS: like / save / share
# ============================================================================

@router.post("/posts/{post_id}/like", response_model=ToggleResponse)
async def toggle_like(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    if not await community_service.can_user_view_post(db, current_user.user_id, post_id):
        raise HTTPException(status_code=404, detail="Post not found")

    try:
        active, like_count = await community_service.toggle_like(db, current_user.user_id, post_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Post not found")

    await db.commit()
    return ToggleResponse(active=active, like_count=like_count)


@router.post("/posts/{post_id}/save", response_model=ToggleResponse)
async def toggle_save(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    if not await community_service.can_user_view_post(db, current_user.user_id, post_id):
        raise HTTPException(status_code=404, detail="Post not found")

    try:
        active, save_count = await community_service.toggle_save(db, current_user.user_id, post_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Post not found")

    await db.commit()
    return ToggleResponse(active=active, save_count=save_count)


@router.post("/posts/{post_id}/share", response_model=ShareResponse)
async def share_post(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    if not await community_service.can_user_view_post(db, current_user.user_id, post_id):
        raise HTTPException(status_code=404, detail="Post not found")

    try:
        share_count = await community_service.increment_share_count(db, post_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Post not found")

    await db.commit()
    return ShareResponse(
        share_count=share_count,
        share_url=f"/community/posts/{post_id}",
    )


# ============================================================================
# COMMENTS
# ============================================================================

@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
async def list_comments(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    if not await community_service.can_user_view_post(db, current_user.user_id, post_id):
        raise HTTPException(status_code=404, detail="Post not found")

    all_comments = await community_service.get_post_comments(db, post_id)

    by_parent = {}
    for c in all_comments:
        by_parent.setdefault(c.parent_comment_id, []).append(c)

    async def to_response(comment) -> CommentResponse:
        author = await db.get(Users, comment.user_id)
        return CommentResponse(
            id=comment.id,
            post_id=comment.post_id,
            parent_comment_id=comment.parent_comment_id,
            text=comment.text,
            author=AuthorSummary(
                user_id=author.user_id,
                username=author.username,
                first_name=author.first_name,
                last_name=author.last_name,
            ),
            is_edited=comment.is_edited,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
            replies=[await to_response(r) for r in by_parent.get(comment.id, [])],
        )

    top_level = by_parent.get(None, [])
    return [await to_response(c) for c in top_level]


@router.post("/posts/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def add_comment(
    post_id: int,
    payload: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    if not await community_service.can_user_view_post(db, current_user.user_id, post_id):
        raise HTTPException(status_code=404, detail="Post not found")

    try:
        comment = await community_service.add_comment(
            session=db,
            post_id=post_id,
            user_id=current_user.user_id,
            text=payload.text,
            parent_comment_id=payload.parent_comment_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    await db.commit()
    await db.refresh(comment)

    author = current_user
    return CommentResponse(
        id=comment.id,
        post_id=comment.post_id,
        parent_comment_id=comment.parent_comment_id,
        text=comment.text,
        author=AuthorSummary(
            user_id=author.user_id,
            username=author.username,
            first_name=author.first_name,
            last_name=author.last_name,
        ),
        is_edited=comment.is_edited,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        replies=[],
    )


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    # Ownership check happens inside — need the comment's user_id first
    from ..database.models import PostComments
    from sqlalchemy import select

    result = await db.execute(select(PostComments).where(PostComments.id == comment_id))
    comment = result.scalars().first()

    if not comment or comment.is_deleted:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="You don't have permission to delete this comment")

    success = await community_service.delete_comment(db, comment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Comment not found")

    await db.commit()


# ============================================================================
# SIDEBAR
# ============================================================================

@router.get("/sidebar/recent-uploads", response_model=List[RecentUploadItem])
async def recent_uploads(
    limit: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    posts = await community_service.get_recent_uploads(db, limit=limit)

    items = []
    for p in posts:
        meta = "Resource"
        if p.resource_id:
            resource = await db.get(Resources, p.resource_id)
            if resource:
                parts = []
                if resource.total_pages:
                    parts.append(f"{resource.total_pages} pages")
                if resource.resource_type:
                    parts.append(resource.resource_type.value.upper())
                meta = " · ".join(parts) if parts else meta
        items.append(RecentUploadItem(post_id=p.id, title=p.title, meta=meta))

    return items


@router.get("/sidebar/top-contributors", response_model=List[TopContributorItem])
async def top_contributors(
    limit: int = Query(3, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    ranked = await community_service.get_top_contributors(db, limit=limit)

    result = []
    for rank, entry in enumerate(ranked, start=1):
        user = await db.get(Users, entry["user_id"])
        if not user:
            continue
        result.append(
            TopContributorItem(
                user_id=entry["user_id"],
                username=user.username,
                contributions=entry["contributions"],
                rank=rank,
            )
        )
    return result