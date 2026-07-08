# routes/invitations.py
import os
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...database.database import get_db
from ...dependencies import get_current_user
from ...database.models import Users, Projects
from ...services.project import team_member_service, project_service, invitation_service, email_service
from ...schemas.projects import InviteMemberRequest
from ...schemas.projects import (
    InvitationPreviewResponse,
    InvitationAcceptResponse,
    ProjectInvitationCreateResponse,
)

router = APIRouter(tags=["invitations"])

FRONTEND_BASE_URL = os.environ.get("FRONTEND_BASE_URL", "http://localhost:5173")


# ============================================================
# CREATE INVITATION (owner-only)
# ============================================================

@router.post(
    "/projects/{project_id}/invite",
    response_model=ProjectInvitationCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def invite_member(
    project_id: int,
    data: InviteMemberRequest,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Owner-only (or role='owner' members — same check). Works identically
    whether the invitee already has a StudySync account or not; if they
    don't, they must sign up first, then the same link works.

    No email-sending service is wired up yet — the invite link is returned
    in the response so it can be shared manually (copy/paste, DM, etc.)
    until a mailer (Resend/SendGrid) is added.
    """
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)
    await project_service.require_owner(db, project_id, member.member_id)

    invitation = await invitation_service.create_invitation(
        db, project_id, member.member_id, data.email, data.role
    )
    await db.commit()

    invite_link = invitation_service.build_invite_link(invitation.token, FRONTEND_BASE_URL)

    # Best-effort email send — a failure here (bad API key, Resend outage, etc.)
    # must never fail the request, since the invitation row + link already exist.
    project_result = await db.execute(select(Projects).where(Projects.project_id == project_id))
    project = project_result.scalar_one()
    inviter_name = (
        f"{current_user.first_name or ''} {current_user.last_name or ''}".strip()
        or current_user.username
    )
    email_sent = await email_service.send_invitation_email(
        to_email=invitation.invited_email,
        project_name=project.project_name,
        inviter_name=inviter_name,
        role=invitation.role,
        invite_link=invite_link,
    )

    return {
        "id": invitation.id,
        "project_id": invitation.project_id,
        "invited_email": invitation.invited_email,
        "role": invitation.role,
        "status": invitation.status.value,
        "expires_at": invitation.expires_at,
        "created_at": invitation.created_at,
        "invite_link": invite_link,
        "email_sent": email_sent,
    }


# ============================================================
# PUBLIC PREVIEW — no auth, mirrors Jira's "you're invited" page
# ============================================================

@router.get("/invitations/{token}", response_model=InvitationPreviewResponse)
async def preview_invitation(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """
    PUBLIC. No Depends(get_current_user) on purpose — an anonymous visitor
    who hasn't signed up yet should still see "You're invited to Project X
    by Y" before hitting any login wall.
    """
    return await invitation_service.preview_invitation(db, token)


# ============================================================
# ACCEPT / DECLINE — requires auth, email must match invited_email
# ============================================================

@router.post("/invitations/{token}/accept", response_model=InvitationAcceptResponse)
async def accept_invitation(
    token: str,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Requires login. The logged-in account's email must match invited_email —
    the token is the source of truth regardless of how it reached the person
    (email, DM, copy-pasted link all work identically).

    Auto-onboards a TeamMember profile if this is their
    first project-tracker interaction.
    """
    result = await invitation_service.accept_invitation(
        db, token, current_user.user_id, current_user.email
    )
    await db.commit()
    return result


@router.post("/invitations/{token}/decline", status_code=status.HTTP_204_NO_CONTENT)
async def decline_invitation(
    token: str,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await invitation_service.decline_invitation(db, token, current_user.email)
    await db.commit()