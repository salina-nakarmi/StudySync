// components/Projects/ProjectSidebar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  {
    key: "board",
    label: "Board",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    key: "docs",
    label: "Docs",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    key: "tracking",
    label: "Tracking",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    key: "team",
    label: "Team",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: "repository",
    label: "Repository",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
];

export default function ProjectSidebar({ project, activeTab, onTabChange, isOpen, onToggle }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 h-[calc(100vh-64px)] bg-white border-r border-gray-100 z-40
          flex flex-col transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? "w-44" : "w-0"}
        `}
      >
        <div className="flex flex-col h-full min-w-[176px]">
          {/* Project Header */}
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: project?.iconBg || "#e0f7f4" }}
              >
                {project?.icon || "🚀"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-gray-900 truncate leading-tight">
                  {project?.name || "Project"}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  {project?.subtitle || ""}
                </p>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onTabChange(item.key)}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150
                    ${isActive
                      ? "bg-sky-400 text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    }
                  `}
                >
                  <span className={isActive ? "text-white" : "text-gray-400"}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Invite Member */}
          <div className="px-3 pb-5">
            <button className="w-full border border-gray-200 rounded-xl py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Invite Member
            </button>
          </div>
        </div>
      </aside>

      {/* Hamburger toggle button — always visible */}
      <button
        onClick={onToggle}
        className={`
          fixed top-[76px] z-50 w-8 h-8 bg-white border border-gray-200 rounded-lg
          flex items-center justify-center shadow-sm hover:bg-gray-50 transition-all duration-300
          ${isOpen ? "left-[152px]" : "left-3"}
        `}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </>
  );
}