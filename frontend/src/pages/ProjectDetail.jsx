// pages/ProjectDetail.jsx
import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import ProjectSidebar from "../components/ProjectDetail/ProjectSidebar";
import TasksView from "../components/ProjectDetail/TasksView";
import MyTasksView from "../components/ProjectDetail/MyTasksView";
import PlaceholderView from "../components/ProjectDetail/PlaceholderView";
import DocsEditor from "./Docs";

// ------------------------------------------------------------------
// Tab → view mapping
// ------------------------------------------------------------------
const TAB_VIEWS = {
    tasks: null,
    "my-tasks": null,
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
  const [docsMaximized, setDocsMaximized] = useState(false);

  const handleInvite = () => {
    // Wire up to your invite modal / API later
    alert("Invite member — connect to your invite API here.");
  };

  function renderContent() {
    if (activeTab === "tasks") {
      return <TasksView projectName={project.subtitle ?? project.name} />;
    }

    if (activeTab === "my-tasks") {
      return <MyTasksView />;
    }

    if (activeTab === "docs") {
      return null;
    }

    const view = TAB_VIEWS[activeTab];
    if (view) {
      return (
        <PlaceholderView
          title={view.title}
          description={view.description}
          icon={view.icon}
        />
      );
    }

    return null;
  }

  return (
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

      {/* Docs editor — expands to full screen when maximized */}
      {activeTab === "docs" && (
        <div className={`fixed z-50 overflow-hidden transition-all duration-200 ${
          docsMaximized ? "inset-0" : "top-16 left-52 right-0 bottom-0"
        }`}>
          <DocsEditor
            embedded
            isMaximized={docsMaximized}
            onMaximize={() => setDocsMaximized(true)}
            onMinimize={() => setDocsMaximized(false)}
            onClose={() => setActiveTab("tasks")}
          />
        </div>
      )}
    </div>
  );
}