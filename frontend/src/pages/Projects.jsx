// pages/Projects.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  useProjects,
  useTeamMember,
} from "../services/project_service";
import OnboardingPrompt from "../components/Projects/OnboardingPrompt";
import GitHubRepoSearch from "../components/Projects/GitHubRepoSearch";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const PRIMARY_BLUE = "#2C76BA";

// Backend health_indicator (Green/Yellow/Red) drives the badge —
// status (Planning/Active/On Hold/Completed/Cancelled) drives the label.
const STATUS_CONFIG = {
  Active: {
    label: "Active",
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-700 border-green-100",
  },
  Planning: {
    label: "Planning",
    dot: "bg-blue-400",
    badge: "bg-blue-50 text-blue-700 border-blue-100",
  },
  "On Hold": {
    label: "On Hold",
    dot: "bg-yellow-400",
    badge: "bg-yellow-50 text-yellow-700 border-yellow-100",
  },
  Completed: {
    label: "Completed",
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
  },
  Cancelled: {
    label: "Cancelled",
    dot: "bg-red-400",
    badge: "bg-red-50 text-red-700 border-red-100",
  },
};

// health_indicator overrides the badge color when project is at risk,
// regardless of status — a "Red" Active project should look alarming.
const HEALTH_OVERRIDE = {
  Red: { dot: "bg-red-400", badge: "bg-red-50 text-red-700 border-red-100" },
  Yellow: { dot: "bg-yellow-400", badge: "bg-yellow-50 text-yellow-700 border-yellow-100" },
};

/**
 * Maps a raw backend project (ProjectListResponse shape) into the
 * display fields the card components expect. The backend has no
 * icon/subtitle/avatars — those are derived here, not invented server-side.
 */
function toCardProps(project) {
  const progress =
    project.task_count > 0
      ? Math.round((project.completed_task_count / project.task_count) * 100)
      : 0;

  return {
    id: project.project_id,
    name: project.project_name,
    subtitle: project.description || "No description yet",
    type: project.member_count > 1 ? "Team Project" : "Solo Project",
    status: project.status,
    health: project.health_indicator,
    icon: project.project_name?.[0]?.toUpperCase() ?? "P",
    progressLabel: `${project.completed_task_count}/${project.task_count} tasks`,
    progress,
    memberCount: project.member_count,
    isGithubIntegrated: project.is_github_integrated,
    raw: project,
  };
}

function InlineProjectCard({ project, onClick }) {
  const cfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.Planning;
  // Health overrides the badge color only if it signals risk (Yellow/Red)
  const badgeStyle = HEALTH_OVERRIDE[project.health] || cfg;

  const { deleteProject } = useProjects();

  const handleDelete = async (e) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      `Delete "${project.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteProject.mutateAsync(project.id);
    } catch (err) {
      console.error(err);
      alert("Failed to delete project.");
    }
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-gray-200 rounded-2xl p-6.5 hover:shadow-md hover:border-[#2C76BA]/30 transition-all cursor-pointer flex flex-col gap-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ backgroundColor: PRIMARY_BLUE }}
          >
            {project.icon}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">
              {project.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{project.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">

  <button
    onClick={handleDelete}
    className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition"
    title="Delete Project"
  >
    <TrashIcon className="h-4 w-4" />
  </button>

  <span
    className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide border rounded-full px-2.5 py-1 ${badgeStyle.badge}`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`} />
    {cfg.label}
  </span>

</div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span className="font-medium text-gray-700">{project.progressLabel}</span>
          <span className="font-bold" style={{ color: PRIMARY_BLUE }}>
            {project.progress}%
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${project.progress}%`,
              backgroundColor: project.health === "Red" ? "#f87171" : PRIMARY_BLUE,
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            {project.type}
          </span>
          {project.isGithubIntegrated && (
            <span className="flex items-center gap-1 text-gray-400 font-medium">
              <ClockIcon className="h-3 w-3" />
              GitHub
            </span>
          )}
        </div>

        {project.memberCount > 1 && (
          <span className="text-[11px] font-bold text-gray-400">
            {project.memberCount} members
          </span>
        )}
      </div>
    </div>
  );
}

function StartNewCard({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="group bg-white border-2 border-dashed border-gray-200 rounded-2xl p-7 hover:border-[#2C76BA]/40 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center gap-4 min-h-48 text-center"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition group-hover:opacity-90"
        style={{ backgroundColor: PRIMARY_BLUE }}
      >
        <PlusIcon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-700 group-hover:text-[#2C76BA] transition">
          Start New Project
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          Create or collaborate on something new
        </p>
      </div>
    </button>
  );
}

function InlineCreateModal({ onClose, onCreate, isSubmitting }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRepo, setSelectedRepo] = useState(null); // { owner, name, full_name, description }

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({
      project_name: name.trim(),
      description: description.trim() || null,
      is_github_integrated: !!selectedRepo,
      github_repo_owner: selectedRepo?.owner ?? null,
      github_repo_name: selectedRepo?.name ?? null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Create New Project</h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Project Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Machine Learning Research"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#2C76BA] focus:ring-2 focus:ring-[#2C76BA]/10 transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none resize-none focus:border-[#2C76BA] focus:ring-2 focus:ring-[#2C76BA]/10 transition"
            />
          </div>

          {/* GitHub repo search — selecting a repo auto-enables integration.
              Clearing the selection disables it. No separate toggle needed. */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
              GitHub Repository (optional)
            </label>
            <GitHubRepoSearch
              selected={selectedRepo}
              onSelect={setSelectedRepo}
              onClear={() => setSelectedRepo(null)}
            />
            <p className="text-[11px] text-gray-400 mt-1.5">
              Linking a repo enables commit sync and the Repository tab.
            </p>
          </div>
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
            disabled={!name.trim() || isSubmitting}
            className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl hover:opacity-90 transition disabled:opacity-50"
            style={{ backgroundColor: PRIMARY_BLUE }}
          >
            {isSubmitting ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const { isOnboarded, isLoading: isLoadingProfile } = useTeamMember();
  // Only fire once we KNOW the profile check finished AND came back
  // onboarded — isOnboarded defaults to true while isLoadingProfile is
  // still true (it's just `!isError`, and isError starts false), so
  // gating on isOnboarded alone would still let this fire one render
  // too early and reproduce the premature-404 server log noise.
  const { projects, isLoading, error, createProject } = useProjects({
    enabled: !isLoadingProfile && isOnboarded,
  });
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Wait until we know onboarding status before deciding what to render —
  // otherwise we'd flash the projects grid (or the prompt) incorrectly
  // for a frame while the profile check is still in flight.
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <p className="text-sm text-gray-400 text-center">Loading...</p>
        </main>
      </div>
    );
  }

  // No TeamMember profile yet (backend 404s GET /team-members/me) —
  // show the one-time setup prompt instead of an error banner or an
  // empty projects grid that implies something's broken.
  if (!isOnboarded) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <OnboardingPrompt />
        </main>
      </div>
    );
  }

  const cards = (projects || []).map(toCardProps);

  const filtered = cards.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = cards.filter((p) => p.status === "Active").length;
  const atRiskCount = cards.filter((p) => p.health === "Red" || p.health === "Yellow").length;

  const handleCreate = (data) => {
    createProject.mutate(data, {
      onSuccess: () => setShowModal(false),
    });
  };

  const handleOpenProject = (project) => {
    // Navigate by real project_id — ProjectDetail re-fetches via useProjects().getProject(id)
    // rather than trusting location.state, so a page refresh / direct link still works.
    navigate(`/projects/${project.id}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Projects</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Central hub for all your academic and personal research initiatives.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 w-40 shadow-sm">
              <MagnifyingGlassIcon className="h-3 w-3 text-gray-400 shrink-0" />
              <input
                className="bg-transparent text-[9px] text-gray-700 outline-none w-full placeholder:text-gray-400"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition">
              <AdjustmentsHorizontalIcon className="h-4 w-4 text-gray-500" />
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] font-bold text-white rounded-xl hover:opacity-90 transition shadow-sm"
              style={{ backgroundColor: "#0f172a" }}
            >
              <PlusIcon className="h-3 w-3" />
              New Project
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            {
              label: "Total Projects",
              value: cards.length,
              icon: RocketLaunchIcon,
              color: "text-[#2C76BA]",
              bg: "bg-blue-50",
            },
            {
              label: "Active",
              value: activeCount,
              icon: CheckCircleIcon,
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              label: "At Risk",
              value: atRiskCount,
              icon: ExclamationTriangleIcon,
              color: "text-red-500",
              bg: "bg-red-50",
            },
          ].map(({ label, value, icon: StatIcon, color, bg }) => (
            <div
              key={label}
              className="bg-white border border-gray-200 rounded-2xl px-5 py-5.5 flex items-center gap-4 shadow-sm"
            >
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                {React.createElement(StatIcon, { className: `h-5 w-5 ${color}` })}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Projects grid */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800">Your Projects</h2>
          </div>

          {isLoading && (
            <div className="col-span-full text-center py-16 text-sm text-gray-400">
              Loading projects...
            </div>
          )}

          {error && (
            <div className="col-span-full text-center py-16 bg-red-50 rounded-2xl border border-red-100 text-sm text-red-500">
              Couldn't load projects: {error.message}
            </div>
          )}

          {!isLoading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((project) => (
                <InlineProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => handleOpenProject(project)}
                />
              ))}
              <StartNewCard onClick={() => setShowModal(true)} />
            </div>
          )}

          {!isLoading && !error && filtered.length === 0 && cards.length > 0 && (
            <div className="col-span-full text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 mt-4">
              <RocketLaunchIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">No projects match your search.</p>
            </div>
          )}

          {!isLoading && !error && cards.length === 0 && (
            <div className="col-span-full text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 mt-4">
              <RocketLaunchIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">
                No projects yet — create your first one to get started.
              </p>
            </div>
          )}
        </section>
      </main>

      {showModal && (
        <InlineCreateModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
          isSubmitting={createProject.isPending}
        />
      )}
    </div>
  );
}