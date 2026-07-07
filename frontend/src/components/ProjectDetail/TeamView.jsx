import { useMemo, useState } from "react";
import {
    ChevronDownIcon,
    PencilIcon,
    SearchIcon,
    ShieldCheckIcon,
    TrashIcon,
} from "lucide-react";

import { useProjectMembers, useTeamMember } from "../../services/project_service";

const ROLE_OPTIONS = ["owner", "member"];

function formatRole(role) {
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Member";
}

function formatDate(value) {
    if (!value) return "Unknown";
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(value));
}

function MemberCard({ member, canManage, onRoleChange, onRemove }) {
    const [open, setOpen] = useState(false);
    const isOwner = member.role === "owner";

    return (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition hover:shadow-sm">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-gray-900">
                        {member.first_name || member.last_name
                            ? `${member.first_name || ""} ${member.last_name || ""}`.trim()
                            : member.username}
                    </p>
                    <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-bold text-gray-600">
                        {formatRole(member.role)}
                    </span>
                    {isOwner && <ShieldCheckIcon className="h-3.5 w-3.5 text-yellow-500" title="Owner" />}
                </div>
                <p className="mt-1 text-xs text-gray-400">@{member.username}</p>
                <p className="mt-2 text-[11px] text-gray-400">Joined {formatDate(member.joined_at)}</p>
            </div>

            {canManage && !isOwner && (
                <div className="relative shrink-0">
                    <button
                        onClick={() => setOpen((value) => !value)}
                        className="flex items-center gap-1 text-[11px] text-gray-500 transition-colors hover:text-gray-800"
                        type="button"
                    >
                        <PencilIcon className="h-3 w-3" />
                        Change
                        <ChevronDownIcon className="h-3 w-3" />
                    </button>

                    {open && (
                        <>
                            <button
                                className="fixed inset-0 z-10"
                                onClick={() => setOpen(false)}
                                aria-label="Close role menu"
                                type="button"
                            />
                            <div className="absolute right-0 top-6 z-20 min-w-[128px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                                {ROLE_OPTIONS.map((role) => (
                                    <button
                                        key={role}
                                        onClick={() => {
                                            onRoleChange(member.member_id, role);
                                            setOpen(false);
                                        }}
                                        className={`w-full px-3 py-1.5 text-left text-xs font-medium transition-colors hover:bg-gray-50 ${member.role === role ? "font-bold text-gray-900" : "text-gray-600"
                                            }`}
                                        type="button"
                                    >
                                        {formatRole(role)}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    <button
                        onClick={() => onRemove(member.member_id)}
                        className="ml-auto mt-3 flex items-center gap-1 text-[11px] text-red-400 transition-colors hover:text-red-600"
                        type="button"
                    >
                        <TrashIcon className="h-3 w-3" />
                        Remove
                    </button>
                </div>
            )}
        </div>
    );
}

export default function TeamView({ projectId, project }) {
    const { members, isLoading, error, updateMemberRole, removeMember } = useProjectMembers(projectId);
    const { profile } = useTeamMember();
    const [query, setQuery] = useState("");

    const visibleMembers = useMemo(() => members || project?.members || [], [members, project?.members]);
    const canManageMembers = profile?.member_id === project?.project_owner_id;

    const filteredMembers = useMemo(() => {
        const search = query.trim().toLowerCase();
        if (!search) {
            return visibleMembers;
        }

        return visibleMembers.filter((member) => {
            const displayName = `${member.first_name || ""} ${member.last_name || ""}`.trim();
            return [displayName, member.username, member.role]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(search);
        });
    }, [query, visibleMembers]);

    const ownerCount = visibleMembers.filter((member) => member.role === "owner").length;

    if (isLoading && visibleMembers.length === 0) {
        return <div className="py-12 text-center text-sm text-gray-400">Loading team...</div>;
    }

    if (error) {
        return <div className="py-12 text-center text-sm text-red-500">Couldn't load team members: {error.message}</div>;
    }

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h2 className="text-lg font-bold text-gray-900">Team</h2>
                <p className="text-sm text-gray-500">Live project members and roles from the backend.</p>
            </div>

            <div className="flex max-w-sm items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
                <SearchIcon className="h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search members..."
                    className="w-full bg-transparent text-sm outline-none"
                />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Members</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{visibleMembers.length}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Owners</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{ownerCount}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Your access</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{canManageMembers ? "Owner" : "Member"}</p>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {filteredMembers.map((member) => (
                    <MemberCard
                        key={member.member_id}
                        member={member}
                        canManage={canManageMembers}
                        onRoleChange={(targetMemberId, role) => updateMemberRole.mutate({ targetMemberId, role })}
                        onRemove={(targetMemberId) => removeMember.mutate(targetMemberId)}
                    />
                ))}
            </div>

            {filteredMembers.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-400">No members matched your search.</div>
            )}
        </div>
    );
}