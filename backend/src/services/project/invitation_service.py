# services/invitation_service.py
"""
Project invitation flow, modeled after how Jira/Linear handle it:

  1. Owner invites by email -> we create a ProjectInvitations row with a token.
     - If a Users account with that email already exists, we still go through
       the same token flow (keeps the logic uniform) but they can accept immediately.
     - If no account exists, the same token works once they sign up.
  2. GET /invitations/{token}  -> PUBLIC, no auth. Shows "You're invited to X"
     before any login wall, exactly like Jira's portal preview.
  3. POST /invitations/{token}/accept -> requires auth. The logged-in user's
     email MUST match invited_email (token is the source of truth, not the
     delivery channel — works the same whether sent by email or pasted in a DM).
     Auto-onboards a TeamMember profile if they don't have one yet.

No real email sending exists yet (no SendGrid/Resend configured) — we generate
the token + link and return it in the API response so it can be shared manually
or wired into a mailer later.
"""
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from ...database.models import ProjectInvitations, Projects, TeamMembers, Users, InvitationStatus
from . import team_member_service, project_service

INVITATION_EXPIRY_DAYS = 7


def _utcnow() -> datetime:
    """
    Naive UTC 'now' — matches the TIMESTAMP WITHOUT TIME ZONE columns
    (expires_at, created_at via func.now(), responded_at) in the DB.
    asyncpg raises "can't subtract offset-naive and offset-aware datetimes"
    if a tz-aware datetime.now(timezone.utc) is bound to one of these columns,
    so every write/comparison against them must go through this helper.

    If these columns are ever migrated to TIMESTAMPTZ, switch this back to
    `datetime.now(timezone.utc)` and drop the .replace(tzinfo=None) below.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _generate_token() -> str:
    """URL-safe token for the /join?token=xxx link."""
    return secrets.token_urlsafe(32)


async def create_invitation(
    db: AsyncSession,
    project_id: int,
    invited_by_member_id: int,
    invited_email: str,
    role: str,
) -> ProjectInvitations:
    """
    Creates the invitation row. Permission check (must be owner) happens
    in the route via project_service.require_owner() before this is called.
    """
    invited_email = invited_email.lower()

    # Don't double-invite someone who already has a pending invite to this project
    existing = await db.execute(
        select(ProjectInvitations).where(
            ProjectInvitations.project_id == project_id,
            ProjectInvitations.invited_email == invited_email,
            ProjectInvitations.status == InvitationStatus.PENDING,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email already has a pending invitation to this project.",
        )

    invitation = ProjectInvitations(
        project_id=project_id,
        invited_by=invited_by_member_id,
        invited_email=invited_email,
        role=role,
        token=_generate_token(),
        status=InvitationStatus.PENDING,
        expires_at=_utcnow() + timedelta(days=INVITATION_EXPIRY_DAYS),
    )
    db.add(invitation)
    await db.flush()
    return invitation


async def get_invitation_by_token_or_404(db: AsyncSession, token: str) -> ProjectInvitations:
    result = await db.execute(select(ProjectInvitations).where(ProjectInvitations.token == token))
    invitation = result.scalar_one_or_none()
    if invitation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found.")
    return invitation


def _effective_status(invitation: ProjectInvitations) -> str:
    """Computes 'expired' on the fly rather than a background job flipping the DB row."""
    if invitation.status == InvitationStatus.PENDING and invitation.expires_at < _utcnow():
        return "expired"
    return invitation.status.value


async def preview_invitation(db: AsyncSession, token: str) -> dict:
    """
    PUBLIC endpoint data — no auth check here, the route itself has no
    auth dependency. Shows project name + inviter before any login wall.
    """
    invitation = await get_invitation_by_token_or_404(db, token)

    project_result = await db.execute(select(Projects).where(Projects.project_id == invitation.project_id))
    project = project_result.scalar_one()

    inviter_result = await db.execute(
        select(Users)
        .join(TeamMembers, TeamMembers.user_id == Users.user_id)
        .where(TeamMembers.member_id == invitation.invited_by)
    )
    inviter = inviter_result.scalar_one()
    inviter_name = f"{inviter.first_name or ''} {inviter.last_name or ''}".strip() or inviter.username

    return {
        "project_id": project.project_id,
        "project_name": project.project_name,
        "project_description": project.description,
        "invited_email": invitation.invited_email,
        "invited_by_name": inviter_name,
        "role": invitation.role,
        "status": _effective_status(invitation),
        "expires_at": invitation.expires_at,
    }


async def accept_invitation(db: AsyncSession, token: str, current_user_id: str, current_user_email: str) -> dict:
    """
    Requires auth (route enforces this). Email must match — the token is
    the source of truth regardless of how the person reached it (inbox, DM, etc).
    """
    invitation = await get_invitation_by_token_or_404(db, token)

    effective_status = _effective_status(invitation)
    if effective_status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This invitation is {effective_status} and can no longer be accepted.",
        )

    if current_user_email.lower() != invitation.invited_email.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "This invitation was sent to a different email address. "
                "Log in with the invited email to accept it."
            ),
        )

    # Auto-onboard if this is their first time touching the project tracker
    member, was_created = await team_member_service.get_or_create_team_member(db, current_user_id)

    await project_service.add_member_to_project(
        db, invitation.project_id, member.member_id, role=invitation.role
    )

    invitation.status = InvitationStatus.ACCEPTED
    invitation.responded_at = _utcnow()
    await db.flush()

    project_result = await db.execute(select(Projects).where(Projects.project_id == invitation.project_id))
    project = project_result.scalar_one()

    return {
        "project_id": project.project_id,
        "project_name": project.project_name,
        "member_id": member.member_id,
        "role": invitation.role,
        "team_member_auto_created": was_created,
    }


async def decline_invitation(db: AsyncSession, token: str, current_user_email: str) -> None:
    invitation = await get_invitation_by_token_or_404(db, token)

    if current_user_email.lower() != invitation.invited_email.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This invitation was sent to a different email address.",
        )

    invitation.status = InvitationStatus.DECLINED
    invitation.responded_at = _utcnow()
    await db.flush()


def build_invite_link(token: str, frontend_base_url: str) -> str:
    """e.g. https://studysync.app/join?token=xxx — used in the create_invitation route response."""
    return f"{frontend_base_url}/join?token={token}"