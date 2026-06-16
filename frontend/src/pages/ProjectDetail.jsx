// pages/ProjectDetail.jsx
import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, ChevronDownIcon, MoreVerticalIcon } from "lucide-react";

import ProjectSidebar from "../components/ProjectDetail/ProjectSidebar";
import TasksView from "../components/ProjectDetail/TasksView";
import PlaceholderView from "../components/ProjectDetail/PlaceholderView";

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
    // Full viewport height, no scroll on the shell — scroll happens inside the board
    <div className="flex h-screen bg-[#f8f9fb] overflow-hidden">
      {/* ── Left Sidebar ── */}
      <ProjectSidebar
        project={project}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onInvite={handleInvite}
      />

      {/* ── Main content area ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-8 py-4 bg-white border-b border-gray-100 shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto px-8 py-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}