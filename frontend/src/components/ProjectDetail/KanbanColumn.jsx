// components/ProjectDetail/KanbanColumn.jsx
import { useState } from "react";
import { PlusIcon, ChevronRightIcon } from "lucide-react";
import TaskCard from "./TaskCard";

const COLUMN_CONFIG = {
  "TO DO":       { accent: "bg-gray-200",   count: "text-gray-500" },
  "IN PROGRESS": { accent: "bg-teal-400",   count: "text-teal-600" },
  "IN REVIEW":   { accent: "bg-yellow-400", count: "text-yellow-600" },
  "DONE":        { accent: "bg-green-400",  count: "text-green-600" },
};

export default function KanbanColumn({ title, tasks, onAddTask }) {
  const [open, setOpen] = useState(false);
  const cfg = COLUMN_CONFIG[title] ?? COLUMN_CONFIG["TO DO"];
  const isDone = title === "DONE";

  return (
    <div className="flex flex-col gap-3">
      {/* Clickable row header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-fit group"
      >
        <ChevronRightIcon
          className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
        <span className={`w-2 h-2 rounded-full ${cfg.accent}`} />
        <h3 className="text-xs font-extrabold text-gray-600 tracking-wider uppercase group-hover:text-gray-900 transition-colors">
          {title}
        </h3>
        <span className={`text-xs font-bold ${cfg.count} bg-gray-100 rounded-full px-2 py-0.5`}>
          {tasks.length}
        </span>
      </button>

      {/* Cards — shown only when open */}
      {open && (
        <div className="flex flex-row gap-4 overflow-x-auto pb-1">
          {tasks.map((task) => (
            <div key={task.id} className="shrink-0 w-64">
              <TaskCard task={task} isDone={isDone} />
            </div>
          ))}

          {!isDone && (
            <button
              onClick={() => onAddTask?.(title)}
              className="shrink-0 w-64 h-52 flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-bold text-gray-400 hover:border-[#2C76BA]/40 hover:text-[#2C76BA] transition-all"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Add Task
            </button>
          )}
        </div>
      )}
    </div>
  );
}