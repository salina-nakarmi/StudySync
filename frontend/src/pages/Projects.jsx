// pages/Projects.jsx
import React, { useState } from "react";
import Navbar from "../components/Navbar";
import ProjectCard from "../components/Projects/ProjectCard";
import StartNewProjectCard from "../components/Projects/StartNewProjectCard";
import CreateProjectModal from "../components/Projects/CreateProjectModal";
import { useNavigate } from "react-router-dom";



import {
  PlusIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArchiveBoxIcon,
  ChevronRightIcon,
  RocketLaunchIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const PRIMARY_BLUE = "#2C76BA";

const INITIAL_PROJECTS = [
  {
    id: 1,
    name: "Thesis: AI in Ethics",
    subtitle: "Research Paper",
    type: "Solo Project",
    status: "Delayed",
    icon: "📄",
    progressLabel: "Chapter 1 & 2 Drafts",
    progress: 32,
    deadline: "14 days left",
    avatars: null,
  },
  {
    id: 2,
    name: "Project Alpha",
    subtitle: "Education App Development",
    type: "Team Project",
    status: "Active",
    icon: "🅐",
    progressLabel: "MVP Development",
    progress: 48,
    deadline: null,
    avatars: [
      "https://i.pravatar.cc/40?img=3",
      "https://i.pravatar.cc/40?img=5",
    ],
  },
];

const ARCHIVED_PROJECTS = [
  {
    id: 99,
    name: "Database Systems",
    subtitle: "Completed 3 mos ago",
    progress: 100,
  },
];

const STATUS_CONFIG = {
  Active: {
    label: "Active",
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-700 border-green-100",
  },
  Delayed: {
    label: "Delayed",
    dot: "bg-red-400",
    badge: "bg-red-50 text-red-700 border-red-100",
  },
  Paused: {
    label: "Paused",
    dot: "bg-yellow-400",
    badge: "bg-yellow-50 text-yellow-700 border-yellow-100",
  },
};

function InlineProjectCard({ project, onClick }) {
  const cfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.Active;

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-gray-200 rounded-2xl p-6.5 hover:shadow-md hover:border-[#2C76BA]/30 transition-all cursor-pointer flex flex-col gap-5"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg shrink-0">
            {project.icon}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">
              {project.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{project.subtitle}</p>
          </div>
        </div>

        <span
          className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide border rounded-full px-2.5 py-1 ${cfg.badge}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span className="font-medium text-gray-700">{project.progressLabel}</span>
          <span className="font-bold" style={{ color: PRIMARY_BLUE }}>{project.progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${project.progress}%`,
              backgroundColor:
                project.status === "Delayed" ? "#f87171" : PRIMARY_BLUE,
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            {project.type}
          </span>
          {project.deadline && (
            <span className="flex items-center gap-1 text-red-400 font-medium">
              <ClockIcon className="h-3 w-3" />
              {project.deadline}
            </span>
          )}
        </div>

        {project.avatars && project.avatars.length > 0 && (
          <div className="flex -space-x-1.5">
            {project.avatars.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="h-6 w-6 rounded-full border-2 border-white object-cover"
              />
            ))}
          </div>
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

function InlineCreateModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [invites, setInvites] = useState("");
  const [githubEnabled, setGithubEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      onCreate({
        name: name.trim(),
        description,
        invites: invites.split(",").map((s) => s.trim()).filter(Boolean),
        githubEnabled,
      });
      setSubmitting(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
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

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Invite Collaborators
            </label>
            <input
              type="text"
              value={invites}
              onChange={(e) => setInvites(e.target.value)}
              placeholder="email1@x.com, email2@x.com"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#2C76BA] focus:ring-2 focus:ring-[#2C76BA]/10 transition"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <div>
              <p className="text-sm font-bold text-gray-700">GitHub Integration</p>
              <p className="text-xs text-gray-400">Link a repository to this project</p>
            </div>
            <button
              onClick={() => setGithubEnabled((p) => !p)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                githubEnabled ? "bg-[#2C76BA]" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  githubEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
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
            disabled={!name.trim() || submitting}
            className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl hover:opacity-90 transition disabled:opacity-50"
            style={{ backgroundColor: PRIMARY_BLUE }}
          >
            {submitting ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
// inside the Projects component:
  const navigate = useNavigate();

  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = projects.filter((p) => p.status === "Active").length;
  const delayedCount = projects.filter((p) => p.status === "Delayed").length;

  const handleCreate = ({ name, invites }) => {
    setProjects((prev) => [
      ...prev,
      {
        id: Date.now(),
        name,
        subtitle: "New Project",
        type: invites.length ? "Team Project" : "Solo Project",
        status: "Active",
        icon: "🚀",
        progressLabel: "Getting started",
        progress: 0,
        deadline: null,
        avatars: null,
      },
    ]);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        {/* Page Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Projects</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Central hub for all your academic and personal research initiatives.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 w-40 shadow-sm">
              <MagnifyingGlassIcon className="h-3 w-3 text-gray-400 shrink-0" />
              <input
                className="bg-transparent text-[9px] text-gray-700 outline-none w-full placeholder:text-gray-400"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter */}
            <button className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition">
              <AdjustmentsHorizontalIcon className="h-4 w-4 text-gray-500" />
            </button>

            {/* Create */}
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
              value: projects.length,
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
              label: "Delayed",
              value: delayedCount,
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

        {/* Active Projects */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800">Active Projects</h2>
            <button className="text-xs font-bold hover:underline transition" style={{ color: PRIMARY_BLUE }}>
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {filtered.map((project) => (
    <InlineProjectCard
      key={project.id}
      project={project}
      onClick={() => navigate(`/projects/${project.id}`, { state: { project } })}
    />
  ))}
  <StartNewCard onClick={() => setShowModal(true)} />
</div>

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 mt-4">
              <RocketLaunchIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">No projects match your search.</p>
            </div>
          )}
        </section>

        {/* Archive */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ArchiveBoxIcon className="h-4 w-4 text-gray-400" />
            <h2 className="text-base font-bold text-gray-800">Archive</h2>
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {ARCHIVED_PROJECTS.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {ARCHIVED_PROJECTS.map((p) => (
              <div
                key={p.id}
                className="group flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-4.5 hover:border-gray-300 hover:shadow-sm transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <CheckCircleIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-300 rounded-full" style={{ width: `${p.progress}%` }} />
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {showModal && (
        <InlineCreateModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}