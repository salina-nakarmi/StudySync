# services/project/email_service.py
"""
Sends transactional emails via Resend (https://resend.com).

Configure via env vars:
  RESEND_API_KEY  - required to actually send. Get one from the Resend dashboard.
  EMAIL_FROM      - optional. Defaults to Resend's shared test sender
                    ("onboarding@resend.dev"), which works with zero setup
                    but can only deliver to the email address your Resend
                    account itself is registered with. Verify your own
                    domain in the Resend dashboard and set this to something
                    like "StudySync <invites@yourdomain.com>" to send to
                    arbitrary recipients in production.

If RESEND_API_KEY isn't set, or the Resend API call fails for any reason,
send_invitation_email() logs it and returns False instead of raising —
an email hiccup should never break invite creation. The invite row and
invite_link already exist regardless, so the UI can fall back to "copy
this link and share it yourself" when email_sent comes back false.
"""
import os
import logging
import httpx

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "StudySync <onboarding@resend.dev>")
RESEND_API_URL = "https://api.resend.com/emails"


async def send_invitation_email(
    to_email: str,
    project_name: str,
    inviter_name: str,
    role: str,
    invite_link: str,
) -> bool:
    if not RESEND_API_KEY:
        logger.warning(
            "RESEND_API_KEY not configured — skipping invitation email to %s. "
            "invite_link is still available in the API response as a fallback.",
            to_email,
        )
        return False

    subject = f"You're invited to {project_name} on StudySync"
    html = f"""
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #111827; margin-bottom: 4px;">You're invited to {project_name}</h2>
        <p style="color: #4b5563; line-height: 1.5;">
            {inviter_name} invited you to join <strong>{project_name}</strong>
            as a <strong>{role}</strong> on StudySync.
        </p>
        <p style="margin: 24px 0;">
            <a href="{invite_link}"
               style="background: #1f2937; color: #ffffff; padding: 10px 20px;
                      border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                Accept invitation
            </a>
        </p>
        <p style="color: #9ca3af; font-size: 12px; line-height: 1.4;">
            This invitation expires in 7 days. If you weren't expecting this,
            you can safely ignore this email — no account will be created.
        </p>
    </div>
    """

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(
                RESEND_API_URL,
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": EMAIL_FROM,
                    "to": [to_email],
                    "subject": subject,
                    "html": html,
                },
            )
            if response.status_code >= 400:
                logger.error(
                    "Resend API error sending invite to %s: %s %s",
                    to_email, response.status_code, response.text,
                )
                return False
            return True
        except httpx.HTTPError as exc:
            logger.error("Failed to send invitation email to %s: %s", to_email, exc)
            return False