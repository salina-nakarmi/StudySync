// components/ProjectDetail/TeamView.jsx
import { useState } from "react";
import {
  UserPlusIcon,
  ShieldCheckIcon,
  PencilIcon,
  TrashIcon,
  MailIcon,
  GitCommitHorizontalIcon,
  CheckSquareIcon,
  ClockIcon,
  ChevronDownIcon,
  SearchIcon,
} from "lucide-react";

// ─── Static data ─────────────────────────────────────────────────────────────────

const ROLES = ["Owner", "Admin", "Member", "Viewer"];

const ROLE_CONFIG = {
  Owner:  { bg: "bg-yellow-50",  text: "text-yellow-700", border: "border-yellow-200" },
  Admin:  { bg: "bg-blue-50",    text: "text-blue-700",   border: "border-blue-200"   },
  Member: { bg: "bg-gray-100",   text: "text-gray-600",   border: "border-gray-200"   },
  Viewer: { bg: "bg-green-50",   text: "text-green-700",  border: "border-green-200"  },
};

const INITIAL_MEMBERS = [
  {
    id: 1,
    name: "abc",
    email: "abc@studysync.io",
    role: "Owner",
    avatar: "https://i.pravatar.cc/40?img=47",
    joinedDate: "Jun 10, 2026",
    commits: 24,
    tasksCompleted: 9,
    lastActive: "2 hours ago",
    status: "online",
  },
  {
    id: 2,
    name: "xyz",
    email: "xyz@studysync.io",
    role: "Admin",
    avatar: "https://i.pravatar.cc/40?img=32",
    joinedDate: "Jun 11, 2026",
    commits: 18,
    tasksCompleted: 7,
    lastActive: "5 hours ago",
    status: "online",
  },
  {
    id: 3,
    name: "123",
    email: "123@studysync.io",
    role: "Member",
    avatar: "https://i.pravatar.cc/40?img=12",
    joinedDate: "Jun 12, 2026",
    commits: 9,
    tasksCompleted: 4,
    lastActive: "Yesterday",
    status: "away",
  },
  {
    id: 4,
    name: "456",
    email: "456@studysync.io",
    role: "Member",
    avatar: "https://i.pravatar.cc/40?img=25",
    joinedDate: "Jun 13, 2026",
    commits: 11,
    tasksCompleted: 5,
    lastActive: "3 days ago",
    status: "offline",
  },
];

const STATUS_DOT = {
  online:  "bg-green-400",
  away:    "bg-yellow-400",
  offline: "bg-gray-300",
};

// ─── Sub-components ──────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.Member;
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {role}
    </span>
  );
}

function RoleDropdown({ current, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800 transition-colors"
      >
        <PencilIcon className="h-3 w-3" />
        Change
        <ChevronDownIcon className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-6 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[120px]">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => { onChange(r); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors ${
                  r === current ? "text-gray-900 font-bold" : "text-gray-600"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MemberCard({ member, onRoleChange, onRemove, isOwner }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-2xl hover:shadow-sm transition-all group">
      {/* Avatar + status */}
      <div className="relative shrink-0">
        <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${STATUS_DOT[member.status]}`}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-bold text-gray-900">{member.name}</p>
              <RoleBadge role={member.role} />
              {member.role === "Owner" && (
                <ShieldCheckIcon className="h-3.5 w-3.5 text-yellow-500" title="Owner" />
              )}
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <MailIcon className="h-3 w-3" />
              {member.email}
            </p>
          </div>

          {/* Actions — visible on hover */}
          {!isOwner && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <RoleDropdown current={member.role} onChange={(r) => onRoleChange(member.id, r)} />
              <button
                onClick={() => onRemove(member.id)}
                className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-600 transition-colors"
              >
                <TrashIcon className="h-3 w-3" />
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-5 mt-3 text-[11px] text-gray-400">
          <span className="flex items-center gap-1">
            <GitCommitHorizontalIcon className="h-3 w-3" />
            <strong className="text-gray-700">{member.commits}</strong> commits
          </span>
          <span className="flex items-center gap-1">
            <CheckSquareIcon className="h-3 w-3" />
            <strong className="text-gray-700">{member.tasksCompleted}</strong> tasks done
          </span>
          <span className="flex items-center gap-1">
            <ClockIcon className="h-3 w-3" />
            Active {member.lastActive}
          </span>
          <span className="flex items-center gap-1">
            Joined {member.joinedDate}
          </span>
        </div>
      </div>
    </div>
  );
}

function InviteModal({ onClose }) {
  const [email, setEmail]   = useState("");
  const [role, setRole]     = useState("Member");
  const [sent, setSent]     = useState(false);

  const handleSend = () => {
    if (!email.trim()) return;
    setSent(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-base font-bold text-gray-900 mb-1">Invite a team member</h3>
        <p className="text-xs text-gray-400 mb-4">They'll receive an email invite to join this project.</p>

        {sent ? (
          <div className="flex flex-col items-center py-6 gap-2 text-green-600">
            <CheckSquareIcon className="h-8 w-8" />
            <p className="text-sm font-bold">Invite sent!</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 mb-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@email.com"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#2C76BA] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#2C76BA] transition-colors bg-white"
                >
                  {ROLES.filter((r) => r !== "Owner").map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="px-4 py-2 text-sm font-bold bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Send invite
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────────

export default function TeamView() {
  const [members, setMembers]     = useState(INITIAL_MEMBERS);
  const [search, setSearch]       = useState("");
  const [filterRole, setFilter]   = useState("All");
  const [showInvite, setShowInvite] = useState(false);

  const changeRole = (id, role) =>
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));

  const removeMember = (id) =>
    setMembers((prev) => prev.filter((m) => m.id !== id));

  const filtered = members.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
                        m.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = filterRole === "All" || m.role === filterRole;
    return matchSearch && matchRole;
  });

  const online  = members.filter((m) => m.status === "online").length;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Team</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {members.length} members · <span className="text-green-500 font-medium">{online} online</span>
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-1.5 text-sm font-bold bg-gray-800 text-white px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors"
        >
          <UserPlusIcon className="h-4 w-4" />
          Invite member
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-[180px]">
          <SearchIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none w-full"
          />
        </div>

        {/* Role filter */}
        <div className="flex items-center gap-1">
          {["All", ...ROLES].map((r) => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterRole === r
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Member list */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <UserPlusIcon className="h-8 w-8 mb-2 text-gray-300" />
            <p className="text-sm font-medium">No members match your search.</p>
          </div>
        )}
        {filtered.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            onRoleChange={changeRole}
            onRemove={removeMember}
            isOwner={member.role === "Owner"}
          />
        ))}
      </div>

      {/* Invite modal */}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  );
}
