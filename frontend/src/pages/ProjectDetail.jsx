// pages/ProjectDetail.jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";

import { useProjects } from "../services/project_service";
import ProjectSidebar from "../components/ProjectDetail/ProjectSidebar";
import TasksView from "../components/ProjectDetail/TasksView";
import PlaceholderView from "../components/ProjectDetail/PlaceholderView";
import InviteMemberModal from "../components/ProjectDetail/InviteMemberModal";

const TAB_VIEWS = {
  tasks: null, // rendered directly as <TasksView />
  "my-tasks": null, // also <TasksView onlyMine /> — see renderContent
  docs: {
    title: "Docs",
    description: "Project documentation and notes will live here.",
    icon: "📄",
  },
  tracking: {
    title: "Tracking",
    description: "Time logs, budget usage, and GitHub commit activity.",
    icon: "📊",
  },
  team: {
    title: "Team",
    description: "View and manage everyone on this project.",
    icon: "👥",
  },
  repository: {
    title: "Repository",
    description: "Linked GitHub repo, recent commits, and branch status.",
    icon: "🔀",
  },
};

export default function ProjectDetail() {
  // project_id comes from the URL, not router state — works on refresh
  // and direct links, since we re-fetch from the backend every time.
  const { id } = useParams();
  const projectId = Number(id);
  const navigate = useNavigate();

  const { getProject } = useProjects();
  const { data: project, isLoading, error } = getProject(projectId);

  const [activeTab, setActiveTab] = useState("tasks");
  const [showInviteModal, setShowInviteModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f8f9fb]">
        <p className="text-sm text-gray-400">Loading project...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f8f9fb] gap-3">
        <p className="text-sm text-red-500">
          Couldn't load this project{error ? `: ${error.message}` : "."}
        </p>
        <button
          onClick={() => navigate("/projects")}
          className="text-sm font-bold text-[#2C76BA] hover:underline"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  function renderContent() {
    if (activeTab === "tasks") {
      return <TasksView projectId={projectId} projectName={project.project_name} onlyMine={false} />;
    }
    if (activeTab === "my-tasks") {
      return <TasksView projectId={projectId} projectName={project.project_name} onlyMine />;
    }

    const view = TAB_VIEWS[activeTab];
    if (view) {
      return <PlaceholderView title={view.title} description={view.description} icon={view.icon} />;
    }
    return null;
  }

  return (
    <div className="flex h-screen bg-[#f8f9fb] overflow-hidden">
      <ProjectSidebar
        project={{
          name: project.project_name,
          subtitle: project.description,
          icon: project.project_name?.[0]?.toUpperCase(),
        }}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onInvite={() => setShowInviteModal(true)}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-3 px-8 py-4 bg-white border-b border-gray-100 shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </button>
        </header>

        <div className="flex-1 overflow-auto px-8 py-6">{renderContent()}</div>
      </main>

      {showInviteModal && (
        <InviteMemberModal projectId={projectId} onClose={() => setShowInviteModal(false)} />
      )}
    </div>
  );
}