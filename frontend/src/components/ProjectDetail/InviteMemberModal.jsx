// components/ProjectDetail/InviteMemberModal.jsx
import { useState } from "react";
import { useProjectInvitations } from "../../services/project_service";
import { CheckIcon, CopyIcon } from "lucide-react";

const PRIMARY_BLUE = "#2C76BA";

/**
 * Owner-only invite flow. No email-sending service exists yet (per
 * backend design — see invitation_service.py), so this surfaces the
 * raw invite_link returned by POST /projects/{id}/invite for the owner
 * to copy and share manually (email, DM, wherever). Works identically
 * regardless of channel since the token itself is what's checked on accept.
 */
export default function InviteMemberModal({ projectId, onClose }) {
  const { inviteMember } = useProjectInvitations(projectId);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [copied, setCopied] = useState(false);

  const handleSubmit = () => {
    if (!email.trim()) return;
    inviteMember.mutate({ email: email.trim(), role });
  };

  const handleCopy = async () => {
    if (!inviteMember.data?.invite_link) return;
    await navigator.clipboard.writeText(inviteMember.data.invite_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const created = inviteMember.isSuccess && inviteMember.data;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Invite a team member</h2>
        <p className="text-xs text-gray-400 mb-5">
          They'll need to sign in with this exact email to accept.
        </p>

        {!created ? (
          <>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#2C76BA] focus:ring-2 focus:ring-[#2C76BA]/10 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Role
                </label>
                <div className="flex gap-2">
                  {["member", "owner"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition border ${
                        role === r
                          ? "bg-[#2C76BA] text-white border-[#2C76BA]"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {inviteMember.isError && (
                <p className="text-xs text-red-500">{inviteMember.error.message}</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-sm font-bold text-gray-500 rounded-xl hover:bg-gray-50 transition border border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!email.trim() || inviteMember.isPending}
                className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl hover:opacity-90 transition disabled:opacity-50"
                style={{ backgroundColor: PRIMARY_BLUE }}
              >
                {inviteMember.isPending ? "Sending..." : "Create Invite"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-4">
              <p className="text-sm font-bold text-green-700 mb-1">Invite created</p>
              <p className="text-xs text-green-600">
                Share this link with {created.invited_email} — no email was sent automatically.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3">
              <input
                readOnly
                value={created.invite_link}
                className="flex-1 bg-transparent text-xs text-gray-600 outline-none truncate"
              />
              <button
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition"
                style={{ backgroundColor: copied ? "#22c55e" : PRIMARY_BLUE }}
              >
                {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-5 py-2.5 text-sm font-bold text-gray-500 rounded-xl hover:bg-gray-50 transition border border-gray-200"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}