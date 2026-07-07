// pages/JoinProject.jsx
import { useSearchParams, useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";
import {
  useInvitationPreview,
  useInvitationResponse,
} from "../services/project_service";
import { CheckCircleIcon, XCircleIcon, ClockIcon } from "lucide-react";

const PRIMARY_BLUE = "#2C76BA";

/**
 * Public landing page for /join?token=xxx
 *
 * Mirrors Jira's pattern: the preview (GET /invitations/{token}) is public,
 * so an anonymous visitor sees "you're invited to Project X by Y" before
 * any login wall. Accept/decline require auth — if logged out, we bounce
 * through Clerk's sign-up/sign-in with a redirectUrl back to this exact
 * page (including the token), so the person lands right back here after
 * authenticating and can finish accepting.
 */
export default function JoinProject() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const { isSignedIn, user } = useUser();
  const { redirectToSignUp, redirectToSignIn } = useClerk();

  const { data: invitation, isLoading, error } = useInvitationPreview(token);
  const { acceptInvitation, declineInvitation } = useInvitationResponse();

  if (!token) {
    return (
      <CenteredCard>
        <XCircleIcon className="h-10 w-10 text-red-400 mb-3" />
        <h1 className="text-lg font-bold text-gray-900 mb-1">Invalid invitation link</h1>
        <p className="text-sm text-gray-500">This link is missing its invitation token.</p>
      </CenteredCard>
    );
  }

  if (isLoading) {
    return (
      <CenteredCard>
        <p className="text-sm text-gray-400">Loading invitation...</p>
      </CenteredCard>
    );
  }

  if (error || !invitation) {
    return (
      <CenteredCard>
        <XCircleIcon className="h-10 w-10 text-red-400 mb-3" />
        <h1 className="text-lg font-bold text-gray-900 mb-1">Invitation not found</h1>
        <p className="text-sm text-gray-500">
          This invitation link doesn't exist or has already been used.
        </p>
      </CenteredCard>
    );
  }

  // Server computes "expired" on the fly rather than a background job
  // flipping the status — see invitation_service._effective_status
  if (invitation.status !== "pending") {
    const statusCopy = {
      accepted: { icon: CheckCircleIcon, color: "text-green-500", text: "This invitation has already been accepted." },
      declined: { icon: XCircleIcon, color: "text-gray-400", text: "This invitation was declined." },
      expired: { icon: ClockIcon, color: "text-yellow-500", text: "This invitation has expired." },
    }[invitation.status] || { icon: ClockIcon, color: "text-gray-400", text: "This invitation is no longer active." };

    const StatusIcon = statusCopy.icon;
    return (
      <CenteredCard>
        <StatusIcon className={`h-10 w-10 mb-3 ${statusCopy.color}`} />
        <h1 className="text-lg font-bold text-gray-900 mb-1">{invitation.project_name}</h1>
        <p className="text-sm text-gray-500">{statusCopy.text}</p>
      </CenteredCard>
    );
  }

  // Logged-in but wrong account — token's invited_email is the source of
  // truth regardless of delivery channel (email, DM, copy/paste all work
  // identically), but it must match whoever is actually signed in.
  const emailMismatch =
    isSignedIn && user?.primaryEmailAddress?.emailAddress?.toLowerCase() !== invitation.invited_email.toLowerCase();

  const handleAccept = () => {
    if (!isSignedIn) {
      redirectToSignUp({ redirectUrl: window.location.href });
      return;
    }
    acceptInvitation.mutate(token, {
      onSuccess: (result) => {
        navigate(`/projects/${result.project_id}`);
      },
    });
  };

  const handleDecline = () => {
    declineInvitation.mutate(token, {
      onSuccess: () => navigate("/projects"),
    });
  };

  return (
    <CenteredCard>
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold mb-4"
        style={{ backgroundColor: PRIMARY_BLUE }}
      >
        {invitation.project_name?.[0]?.toUpperCase() ?? "P"}
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">
        You're invited to {invitation.project_name}
      </h1>
      <p className="text-sm text-gray-500 text-center mb-1">
        {invitation.invited_by_name} invited you as a{" "}
        <span className="font-bold text-gray-700">{invitation.role}</span>
      </p>
      {invitation.project_description && (
        <p className="text-xs text-gray-400 text-center mb-5 max-w-sm">
          {invitation.project_description}
        </p>
      )}

      <p className="text-[11px] text-gray-400 mb-6">
        Invited: <span className="font-medium text-gray-500">{invitation.invited_email}</span>
      </p>

      {emailMismatch ? (
        <div className="w-full bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-sm text-yellow-800 font-medium mb-1">Wrong account</p>
          <p className="text-xs text-yellow-700">
            You're signed in as {user.primaryEmailAddress?.emailAddress}, but this invitation
            was sent to {invitation.invited_email}. Sign in with that email to accept.
          </p>
          <button
            onClick={() => redirectToSignIn({ redirectUrl: window.location.href })}
            className="mt-3 text-sm font-bold hover:underline"
            style={{ color: PRIMARY_BLUE }}
          >
            Switch account
          </button>
        </div>
      ) : (
        <div className="flex gap-3 w-full">
          <button
            onClick={handleDecline}
            disabled={declineInvitation.isPending}
            className="flex-1 py-2.5 text-sm font-bold text-gray-500 rounded-xl hover:bg-gray-50 transition border border-gray-200 disabled:opacity-50"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={acceptInvitation.isPending}
            className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl hover:opacity-90 transition disabled:opacity-50"
            style={{ backgroundColor: PRIMARY_BLUE }}
          >
            {!isSignedIn
              ? "Sign up to accept"
              : acceptInvitation.isPending
              ? "Joining..."
              : "Accept invitation"}
          </button>
        </div>
      )}

      {acceptInvitation.isError && (
        <p className="text-xs text-red-500 mt-3 text-center">{acceptInvitation.error.message}</p>
      )}
    </CenteredCard>
  );
}

function CenteredCard({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center text-center">
        {children}
      </div>
    </div>
  );
}