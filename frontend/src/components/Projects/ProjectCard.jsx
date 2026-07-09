import React from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useProjects } from "../../services/project_service";

const statusStyles = {
  Active: "bg-emerald-50 text-emerald-600",
  Delayed: "bg-red-50 text-red-500",
  Paused: "bg-yellow-50 text-yellow-600",
};

const dotStyles = {
  Active: "bg-emerald-500",
  Delayed: "bg-red-500",
  Paused: "bg-yellow-500",
};

export default function ProjectCard({ project }) {
  const navigate = useNavigate();
  const { deleteProject } = useProjects();

  const badge = statusStyles[project.status] || statusStyles.Active;
  const dot = dotStyles[project.status] || dotStyles.Active;
  const barColor =
    project.status === "Delayed" ? "bg-gray-900" : "bg-teal-500";

  const handleDelete = async (e) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"?\n\nThis action cannot be undone.`
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
      onClick={() => navigate(`/projects/${project.id}`)}
      className="bg-white border border-gray-100 rounded-2xl p-5 w-64 flex flex-col gap-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
          style={{ background: project.iconBg || "#e0f7f4" }}
        >
          {project.icon}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={deleteProject.isPending}
            title="Delete project"
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} />
          </button>

          <span
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {project.status}
          </span>
        </div>
      </div>

      {/* Title */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 leading-tight">
          {project.name}
        </h3>

        <p className="text-xs text-gray-400 mt-0.5">
          {project.subtitle}
        </p>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-xs text-gray-500">
            {project.progressLabel}
          </span>

          <span className="text-xs font-semibold text-gray-800">
            {project.progress}%
          </span>
        </div>

        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center mt-1">
        {project.deadline && (
          <span className="flex items-center gap-1 text-xs text-red-500 flex-1">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>

            {project.deadline}
          </span>
        )}

        {project.avatars && (
          <div className="flex items-center">
            {project.avatars.map((src, i) => (
              <img
                key={i}
                src={src}
                alt="member"
                className="w-6 h-6 rounded-full border-2 border-white object-cover"
                style={{ marginLeft: i === 0 ? 0 : -8 }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}