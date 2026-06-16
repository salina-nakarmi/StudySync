// components/ProjectDetail/TasksView.jsx
import { useState } from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import KanbanColumn from "./KanbanColumn";

const INITIAL_TASKS = {
  "TO DO": [
    {
      id: 1,
      name: "project tab",
      description:
        "all the function needed to make this project tacker really efficent will be added logically with the help of related works",
      priority: "HIGH",
      progress: 0,
      dueDate: "Jun 16, 2026",
      commentCount: 0,
      assigneeAvatar: "https://i.pravatar.cc/40?img=12",
      hasAttachment: false,
    },
  ],
  "IN PROGRESS": [
    {
      id: 2,
      name: "Develop API endpoints for Project sync",
      description: null,
      priority: "MEDIUM",
      progress: 45,
      dueDate: "Aug 24",
      commentCount: 1,
      assigneeAvatar: "https://i.pravatar.cc/40?img=8",
      hasAttachment: false,
    },
    {
      id: 3,
      name: "Fix authentication redirect bug",
      description:
        "Users are not being redirected to the dashboard after successful login on mobile devices.",
      priority: "HIGH",
      progress: 77,
      dueDate: "Aug 28",
      commentCount: 0,
      assigneeAvatar: "https://i.pravatar.cc/40?img=5",
      hasAttachment: true,
    },
    {
      id: 4,
      name: "Setup Figma components",
      description:
        "Create a comprehensive design system for the new project modules.",
      priority: "DESIGN",
      progress: 15,
      dueDate: "Sep 02",
      commentCount: 0,
      assigneeAvatar: "https://i.pravatar.cc/40?img=3",
      hasAttachment: false,
    },
  ],
  "IN REVIEW": [],
  "DONE": [
    {
      id: 5,
      name: "Project proposal submission",
      description: null,
      priority: "LOW",
      progress: 100,
      dueDate: null,
      commentCount: 0,
      assigneeAvatar: "https://i.pravatar.cc/40?img=7",
      hasAttachment: false,
    },
  ],
};

export default function TasksView({ projectName }) {
  const [columns, setColumns] = useState(INITIAL_TASKS);

  const handleAddTask = (columnTitle) => {
    // Placeholder — wire to a modal later
    console.log("Add task to:", columnTitle);
  };

  return (
    <div className="flex flex-col h-full">
      {/* View header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">
          Project Tasks:{" "}
          <span className="text-[#2C76BA]">{projectName ?? "Alpha Dev"}</span>
        </h2>

        <button className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-700 hover:border-gray-300 transition shadow-sm">
          <SlidersHorizontalIcon className="h-3.5 w-3.5" />
          Filter
        </button>
      </div>

      {/* Kanban board — 4 columns */}
      <div className="grid grid-cols-4 gap-5 flex-1 overflow-y-auto pb-4">
        {Object.entries(columns).map(([title, tasks]) => (
          <KanbanColumn
            key={title}
            title={title}
            tasks={tasks}
            onAddTask={handleAddTask}
          />
        ))}
      </div>
    </div>
  );
}