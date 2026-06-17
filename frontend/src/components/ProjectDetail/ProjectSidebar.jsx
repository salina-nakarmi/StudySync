// components/ProjectDetail/ProjectSidebar.jsx
import {
    CheckSquareIcon,
    UserIcon,
    FileTextIcon,
    BarChart2Icon,
    UsersIcon,
    GitBranchIcon,
    UserPlusIcon,
  } from "lucide-react";
  
  const NAV_ITEMS = [
    { id: "tasks",      label: "Tasks",       icon: CheckSquareIcon },
    { id: "my-tasks",  label: "My Tasks",    icon: UserIcon },
    { id: "docs",      label: "Docs",        icon: FileTextIcon },
    { id: "tracking",  label: "Tracking",    icon: BarChart2Icon },
    { id: "team",      label: "Team",        icon: UsersIcon },
    { id: "repository",label: "Repository",  icon: GitBranchIcon },
  ];
  
  export default function ProjectSidebar({ project, activeTab, onTabChange, onInvite }) {
    return (
      <aside className="fixed top-16 left-0 w-52 h-[calc(100vh-64px)] bg-white border-r border-gray-100 flex flex-col z-40">
        {/* Project identity */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2C76BA] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {project?.icon ?? project?.name?.[0] ?? "P"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate leading-tight">
                {project?.name ?? "Project"}
              </p>
              <p className="text-[10px] text-gray-400 truncate mt-0.5">
                {project?.subtitle ?? ""}
              </p>
            </div>
          </div>
        </div>
  
        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  active
                    ? "bg-gray-800 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            );
          })}
        </nav>
  
        {/* Invite Member */}
        <div className="px-4 py-4 border-t border-gray-100">
          <button
            onClick={onInvite}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:border-[#2C76BA] hover:text-[#2C76BA] transition-all"
          >
            <UserPlusIcon className="h-4 w-4" />
            Invite Member
          </button>
        </div>
      </aside>
    );
  }