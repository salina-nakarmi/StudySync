import { useMemo } from "react";
import {
    CircleDotIcon,
    CodeIcon,
    ExternalLinkIcon,
    GitBranchIcon,
    GitCommitHorizontalIcon,
    RefreshCwIcon,
} from "lucide-react";

import { useGithub } from "../../services/project_service";

function formatDateTime(value) {
    if (!value) return "Unknown";
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(value));
}

export default function RepositoryView({ projectId, project }) {
    const { commits, total, hasMore, isLoading, isFetchingMore, error, loadMore, syncCommits } = useGithub(projectId, {
        enabled: Boolean(project?.is_github_integrated),
    });

    const repositoryName = useMemo(() => {
        if (project?.github_repo_owner && project?.github_repo_name) {
            return `${project.github_repo_owner}/${project.github_repo_name}`;
        }
        return "GitHub repository linked";
    }, [project?.github_repo_name, project?.github_repo_owner]);

    const cloneUrl = useMemo(() => {
        if (project?.github_repo_owner && project?.github_repo_name) {
            return `https://github.com/${project.github_repo_owner}/${project.github_repo_name}.git`;
        }
        return "GitHub integration is disabled for this project";
    }, [project?.github_repo_name, project?.github_repo_owner]);

    if (isLoading && !commits) {
        return <div className="py-12 text-center text-sm text-gray-400">Loading repository...</div>;
    }

    if (error && project?.is_github_integrated) {
        return <div className="py-12 text-center text-sm text-red-500">Couldn't load repository commits: {error.message}</div>;
    }

    if (!project?.is_github_integrated) {
        return (
            <div className="flex flex-col gap-5">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Repository</h2>
                    <p className="text-sm text-gray-500">Connect a GitHub repo on the project record to unlock this view.</p>
                </div>
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
                    <CodeIcon className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-3 text-sm font-semibold text-gray-900">No GitHub repository linked</p>
                    <p className="mt-1 text-sm text-gray-500">
                        Enable GitHub integration and set the repository owner/name in the backend project settings.
                    </p>
                </div>
            </div>
        );
    }

    // GitHub integration is enabled but repo owner/name haven't been set yet
    if (!project?.github_repo_owner || !project?.github_repo_name) {
        return (
            <div className="flex flex-col gap-5">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Repository</h2>
                    <p className="text-sm text-gray-500">GitHub integration is enabled but no repository has been linked yet.</p>
                </div>
                <div className="rounded-2xl border border-dashed border-yellow-200 bg-yellow-50 p-8 text-center">
                    <CodeIcon className="mx-auto h-8 w-8 text-yellow-400" />
                    <p className="mt-3 text-sm font-semibold text-gray-900">Repository not configured</p>
                    <p className="mt-1 text-sm text-gray-500">
                        Use <span className="font-mono text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5">PATCH /api/projects/{projectId}</span> to set{" "}
                        <span className="font-mono text-xs">github_repo_owner</span> and{" "}
                        <span className="font-mono text-xs">github_repo_name</span>.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        <CodeIcon className="h-5 w-5 text-gray-400" />
                        <h2 className="text-lg font-bold text-gray-900">Repository</h2>
                        <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[11px] font-bold text-gray-400">
                            Live
                        </span>
                    </div>
                    <p className="max-w-xl text-sm text-gray-500">
                        GitHub integration, synced commits, and manual refresh from the backend.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">
                        <span className="font-mono">{cloneUrl}</span>
                    </div>
                    <button
                        onClick={() => syncCommits.mutate()}
                        disabled={syncCommits.isPending}
                        className="flex items-center gap-2 rounded-xl bg-gray-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-gray-700 disabled:opacity-50"
                        type="button"
                    >
                        <RefreshCwIcon className={`h-4 w-4 ${syncCommits.isPending ? "animate-spin" : ""}`} />
                        {syncCommits.isPending ? "Syncing..." : "Sync commits"}
                    </button>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Repository</p>
                    <p className="mt-2 text-lg font-bold text-gray-900">{repositoryName}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Commits synced</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{total}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Status</p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <CircleDotIcon className="h-4 w-4 text-green-500" />
                        Integration enabled
                    </p>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h3 className="text-sm font-bold text-gray-900">Recent synced commits</h3>
                    {project.github_repo_owner && project.github_repo_name && (
                        <a
                            href={`https://github.com/${project.github_repo_owner}/${project.github_repo_name}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs font-medium text-[#2C76BA] hover:underline"
                        >
                            Open repo
                            <ExternalLinkIcon className="h-3.5 w-3.5" />
                        </a>
                    )}
                </div>
                <div className="divide-y divide-gray-100">
                    {(commits || []).map((commit) => (
                        <div key={commit.commit_id} className="flex items-start gap-3 px-5 py-4">
                            <div className="mt-0.5 rounded-full bg-blue-50 p-2 text-[#2C76BA]">
                                <GitCommitHorizontalIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-900">{commit.commit_message}</p>
                                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                                    <GitBranchIcon className="h-3 w-3" />
                                    <span>{commit.member_username || commit.author_github_username}</span>
                                    <span className="text-gray-300">•</span>
                                    <span>{commit.sha.slice(0, 7)}</span>
                                    <span className="text-gray-300">•</span>
                                    <span>{formatDateTime(commit.committed_at)}</span>
                                </p>
                            </div>
                        </div>
                    ))}
                    {(commits || []).length === 0 && (
                        <div className="px-5 py-10 text-center text-sm text-gray-400">
                            No commits have been synced for this project yet.
                        </div>
                    )}

                    {/* Load more button — only shown when more commits exist in DB */}
                    {hasMore && (
                        <div className="px-5 py-4 border-t border-gray-100">
                            <button
                                onClick={loadMore}
                                disabled={isFetchingMore}
                                className="w-full py-2.5 text-sm font-bold text-[#2C76BA] rounded-xl border border-[#2C76BA]/20 hover:bg-blue-50 transition disabled:opacity-50"
                            >
                                {isFetchingMore
                                    ? "Loading..."
                                    : `Load more (${total - commits.length} remaining)`}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}