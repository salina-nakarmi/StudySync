# services/team_member_service.py
"""
Business logic for TeamMember profiles — the project tracker's user identity.

Every TeamMember maps 1:1 to a Users row (Clerk account). The TeamMember
profile itself is created either:
  1. Explicitly — user visits the tracker and onboards (sets hourly_rate, github_username)
  2. Implicitly — user accepts a project invitation before ever onboarding
     (auto-created with hourly_rate=0, github_username=None)
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from ...database.models import TeamMembers, Users


async def get_team_member_by_user_id(db: AsyncSession, user_id: str) -> TeamMembers | None:
    """Fetch a TeamMember profile by their underlying Users.user_id. Returns None if not onboarded."""
    result = await db.execute(
        select(TeamMembers).where(TeamMembers.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def get_team_member_or_404(db: AsyncSession, user_id: str) -> TeamMembers:
    """Same as above but raises 404 — use this in routes where onboarding is required."""
    member = await get_team_member_by_user_id(db, user_id)
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You haven't set up your project tracker profile yet. POST /api/team-members/onboard first.",
        )
    return member


async def get_team_member_by_id(db: AsyncSession, member_id: int) -> TeamMembers | None:
    """Fetch by internal member_id (used when resolving FKs like assigned_to, project_owner_id)."""
    result = await db.execute(
        select(TeamMembers).where(TeamMembers.member_id == member_id)
    )
    return result.scalar_one_or_none()


async def onboard_team_member(
    db: AsyncSession,
    user_id: str,
    hourly_rate: float,
    github_username: str | None,
) -> TeamMembers:
    """
    Explicit onboarding — user opts into the project tracker.
    Idempotent-ish: if already onboarded, this just updates their existing profile
    rather than erroring, since re-submitting the onboarding form is a reasonable UX.
    """
    existing = await get_team_member_by_user_id(db, user_id)
    if existing:
        existing.hourly_rate = hourly_rate
        existing.github_username = github_username
        await db.flush()
        return existing

    if github_username:
        await _ensure_github_username_available(db, github_username)

    member = TeamMembers(
        user_id=user_id,
        hourly_rate=hourly_rate,
        github_username=github_username,
    )
    db.add(member)
    await db.flush()  # populate member.member_id without committing
    return member


async def get_or_create_team_member(db: AsyncSession, user_id: str) -> tuple[TeamMembers, bool]:
    """
    Implicit onboarding — used by the invitation-accept flow.
    Returns (member, was_created) so callers can report team_member_auto_created.
    """
    existing = await get_team_member_by_user_id(db, user_id)
    if existing:
        return existing, False

    member = TeamMembers(user_id=user_id, hourly_rate=0.00, github_username=None)
    db.add(member)
    await db.flush()
    return member, True


async def update_team_member(
    db: AsyncSession,
    user_id: str,
    hourly_rate: float | None,
    github_username: str | None,
) -> TeamMembers:
    """PATCH /team-members/me — partial update, only touches provided fields."""
    member = await get_team_member_or_404(db, user_id)

    if hourly_rate is not None:
        member.hourly_rate = hourly_rate

    if github_username is not None:
        if github_username != member.github_username:
            await _ensure_github_username_available(db, github_username)
        member.github_username = github_username

    await db.flush()
    return member


async def _ensure_github_username_available(db: AsyncSession, github_username: str) -> None:
    """github_username has a UNIQUE constraint — give a clean 409 instead of a raw IntegrityError."""
    result = await db.execute(
        select(TeamMembers).where(TeamMembers.github_username == github_username)
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"GitHub username '{github_username}' is already linked to another team member.",
        )


async def build_team_member_response_data(db: AsyncSession, member: TeamMembers) -> dict:
    """
    Joins Users to get the display fields (username/email/name) that live
    on the Users table rather than being duplicated on TeamMembers.
    """
    result = await db.execute(select(Users).where(Users.user_id == member.user_id))
    user = result.scalar_one()

    return {
        "member_id": member.member_id,
        "user_id": member.user_id,
        "hourly_rate": float(member.hourly_rate),
        "github_username": member.github_username,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "created_at": member.created_at,
        "updated_at": member.updated_at,
    }