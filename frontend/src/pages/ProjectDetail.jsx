// pages/ProjectDetail.jsx
import { useState } from "react";
<<<<<<< HEAD
import { useParams, useLocation, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import ProjectSidebar from "../components/ProjectDetail/ProjectSidebar";
import TasksView from "../components/ProjectDetail/TasksView";
import PlaceholderView from "../components/ProjectDetail/PlaceholderView";
import DocsEditor from "./Docs";

// ------------------------------------------------------------------
// Tab → view mapping
// ------------------------------------------------------------------
const TAB_VIEWS = {
    tasks: null,
    "my-tasks": {
      title: "My Tasks",
      description: "Tasks assigned specifically to you will appear here.",
      icon: "✅",
    },
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
      description: "GitHub repository and code management.",
      icon: "💻",
    },
  };

// ------------------------------------------------------------------
// ProjectDetail page
// ------------------------------------------------------------------
export default function ProjectDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Project data passed via router state (from Projects.jsx onClick)
  // Falls back to a sensible default so the page works if navigated directly
  const project = location.state?.project ?? {
    id,
    name: "Project Alpha",
    subtitle: "Education App Dev",
    icon: "A",
  };

  const [activeTab, setActiveTab] = useState("tasks");

  const handleInvite = () => {
    // Wire up to your invite modal / API later
    alert("Invite member — connect to your invite API here.");
  };

  function renderContent() {
    if (activeTab === "tasks") {
      return <TasksView projectName={project.subtitle ?? project.name} />;
    }

    if (activeTab === "docs") {
      return null;
=======
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";

import { useProjects } from "../services/project_service";
import ProjectSidebar from "../components/ProjectDetail/ProjectSidebar";
import TasksView from "../components/ProjectDetail/TasksView";
import TeamView from "../components/ProjectDetail/TeamView";
import TrackingView from "../components/ProjectDetail/TrackingView";
import RepositoryView from "../components/ProjectDetail/RepositoryView";
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
    description: "Time logs and GitHub commit activity.",
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
    if (activeTab === "team") {
      return <TeamView projectId={projectId} project={project} />;
    }
    if (activeTab === "tracking") {
      return <TrackingView projectId={projectId} project={project} />;
    }
    if (activeTab === "repository") {
      return <RepositoryView projectId={projectId} project={project} />;
>>>>>>> cbad5c1133e1c2b70224ae2138832950fb9088d8
    }

    const view = TAB_VIEWS[activeTab];
    if (view) {
<<<<<<< HEAD
      return (
        <PlaceholderView
          title={view.title}
          description={view.description}
          icon={view.icon}
        />
      );
    }

=======
      return <PlaceholderView title={view.title} description={view.description} icon={view.icon} />;
    }
>>>>>>> cbad5c1133e1c2b70224ae2138832950fb9088d8
    return null;
  }

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-white">
      <Navbar />

      <ProjectSidebar
        project={project}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onInvite={handleInvite}
      />

      <main className="ml-52 pt-24 min-h-screen">
        {/* Breadcrumb + filter bar */}
        <div className="flex items-center justify-between px-8 pr-40 h-12">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate("/projects")}
              className="text-gray-400 hover:text-gray-700 transition font-medium"
            >
              Projects
            </button>
            <span className="text-gray-300">/</span>
            <span className="font-semibold text-gray-800 truncate max-w-xs">
              {project.name}
            </span>
          </div>

          <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            Filter
          </button>
        </div>

        {/* Page content */}
        {activeTab !== "docs" && (
          <div className="px-8 py-6">
            {renderContent()}
          </div>
        )}
      </main>

      {/* Docs editor — full bleed below navbar, beside sidebar */}
      {activeTab === "docs" && (
        <div className="fixed top-16 left-52 right-0 bottom-0 z-30 overflow-hidden">
          <DocsEditor embedded />
        </div>
=======
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

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden ml-52 mt-16">
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
>>>>>>> cbad5c1133e1c2b70224ae2138832950fb9088d8
      )}
    </div>
  );
}