// pages/Projects.jsx

import React, { useState } from "react";
import Navbar from "../components/Navbar";
import ProjectCard from "../components/Projects/ProjectCard";
import StartNewProjectCard from "../components/Projects/StartNewProjectCard";
import CreateProjectModal from "../components/Projects/CreateProjectModal";

const INITIAL_PROJECTS = [
  {
    id: 1,
    name: "Thesis: AI in Ethics",
    subtitle: "Research Paper • Solo Project",
    status: "Delayed",
    iconBg: "#e0f7f4",
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
    status: "Active",
    iconBg: "#1a3a2f",
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
  },
];

export default function Projects() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = ({ name, invites, githubEnabled }) => {
    setProjects((prev) => [
      ...prev,
      {
        id: Date.now(),
        name,
        subtitle: `Solo Project${
          invites.length ? ` • ${invites.length} collaborator(s)` : ""
        }`,
        status: "Active",
        iconBg: "#e8f4ff",
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
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="px-10 py-9">
        {/* ── Top Bar ── */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Your Projects
            </h1>

            <p className="text-sm text-gray-400 mt-1">
              Central hub for all your academic and personal research
              initiatives.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 h-9 w-52 shadow-sm">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#aaa"
                strokeWidth="2.2"
                className="shrink-0"
              >
                <circle cx="11" cy="11" r="8" />
                <line
                  x1="21"
                  y1="21"
                  x2="16.65"
                  y2="16.65"
                />
              </svg>

              <input
                className="bg-transparent text-sm text-gray-700 outline-none w-full placeholder:text-gray-400"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter Button */}
            <button className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#555"
                strokeWidth="2"
              >
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="11" y1="18" x2="13" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Active Projects ── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🚀</span>

              <h2 className="text-base font-bold text-gray-800">
                Active Projects
              </h2>
            </div>

            <button className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors">
              View All
            </button>
          </div>

          <div className="flex flex-wrap gap-4">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onView={() => console.log("View", project.name)}
                onBoard={() => console.log("Board", project.name)}
              />
            ))}

            <StartNewProjectCard
              onClick={() => setShowModal(true)}
            />
          </div>
        </section>

        {/* ── Archive ── */}
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-3">
            Archive
          </h2>

          <div className="flex flex-col gap-2">
            {ARCHIVED_PROJECTS.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 hover:shadow-sm transition-shadow cursor-pointer"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    {p.name}
                  </p>

                  <p className="text-xs text-gray-400 mt-0.5">
                    {p.subtitle}
                  </p>
                </div>

                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ccc"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Modal ── */}
      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}