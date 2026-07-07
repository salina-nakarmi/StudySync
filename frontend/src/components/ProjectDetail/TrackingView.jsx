import { GitCommitHorizontalIcon } from "lucide-react";

import { useProjectTracking } from "../../services/project_service";

function formatDateTime(value) {
    if (!value) return "Unknown";
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(value));
}

export default function TrackingView({ projectId, project }) {
    const { data, isLoading, error } = useProjectTracking(projectId);

    if (isLoading && !data) {
        return <div className="py-12 text-center text-sm text-gray-400">Loading tracking...</div>;
    }

    if (error) {
        return <div className="py-12 text-center text-sm text-red-500">Couldn't load tracking: {error.message}</div>;
    }

    const tracking = data || {
        project_name: project?.project_name,
        total_hours: 0,
        member_breakdown: [],
        recent_commits: [],
        total_commit_count: 0,
    };

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h2 className="text-lg font-bold text-gray-900">Tracking</h2>
                <p className="text-sm text-gray-500">Time logs and recent GitHub activity from the backend.</p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Project</p>
                    <p className="mt-2 text-xl font-bold text-gray-900">{tracking.project_name}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Total hours</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{tracking.total_hours.toFixed(2)}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Contributors</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{tracking.member_breakdown.length}</p>
                </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                        <h3 className="text-sm font-bold text-gray-900">Member hours breakdown</h3>
                        <span className="text-xs text-gray-400">Manual time logs</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {tracking.member_breakdown.map((member) => (
                            <div key={member.member_id} className="flex items-center justify-between gap-3 px-5 py-4">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{member.username}</p>
                                    <p className="text-xs text-gray-400">{member.total_hours.toFixed(2)} logged hours</p>
                                </div>
                                <p className="text-sm font-bold text-gray-900">{member.total_hours.toFixed(2)} h</p>
                            </div>
                        ))}
                        {tracking.member_breakdown.length === 0 && (
                            <div className="px-5 py-10 text-center text-sm text-gray-400">
                                No time logs have been recorded yet.
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                        <h3 className="text-sm font-bold text-gray-900">Recent commits</h3>
                        <span className="text-xs text-gray-400">{tracking.total_commit_count} total</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {tracking.recent_commits.map((commit) => (
                            <div key={commit.commit_id} className="px-5 py-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 rounded-full bg-green-50 p-2 text-green-600">
                                        <GitCommitHorizontalIcon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-gray-900">{commit.commit_message}</p>
                                        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                                            <span>{commit.member_username || commit.author_github_username}</span>
                                            <span className="text-gray-300">•</span>
                                            <span>{commit.sha.slice(0, 7)}</span>
                                            <span className="text-gray-300">•</span>
                                            <span>{formatDateTime(commit.committed_at)}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {tracking.recent_commits.length === 0 && (
                            <div className="px-5 py-10 text-center text-sm text-gray-400">
                                No GitHub commits are synced yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}