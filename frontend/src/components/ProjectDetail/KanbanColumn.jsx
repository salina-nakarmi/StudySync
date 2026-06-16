// components/ProjectDetail/KanbanColumn.jsx
import { PlusIcon, MoreHorizontalIcon } from "lucide-react";
import TaskCard from "./TaskCard";

const COLUMN_CONFIG = {
  "TO DO":       { accent: "bg-gray-200",   count: "text-gray-500" },
  "IN PROGRESS": { accent: "bg-teal-400",   count: "text-teal-600" },
  "IN REVIEW":   { accent: "bg-yellow-400", count: "text-yellow-600" },
  "DONE":        { accent: "bg-green-400",  count: "text-green-600" },
};

export default function KanbanColumn({ title, tasks, onAddTask }) {
  const cfg = COLUMN_CONFIG[title] ?? COLUMN_CONFIG["TO DO"];
  const isDone = title === "DONE";

  return (
    <div className="flex flex-col gap-3 min-w-0">
      {/* Column header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${cfg.accent}`} />
          <h3 className="text-xs font-extrabold text-gray-600 tracking-wider uppercase">
            {title}
          </h3>
          <span
            className={`text-xs font-bold ${cfg.count} bg-gray-100 rounded-full px-2 py-0.5`}
          >
            {tasks.length}
          </span>
        </div>
        {!isDone && (
          <button className="p-1 rounded-lg hover:bg-gray-100 transition">
            <MoreHorizontalIcon className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Task cards */}
      <div className="flex flex-col gap-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} isDone={isDone} />
        ))}
      </div>

      {/* Add task — only on non-done columns */}
      {!isDone && (
        <button
          onClick={() => onAddTask?.(title)}
          className="mt-1 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-bold text-gray-400 hover:border-[#2C76BA]/40 hover:text-[#2C76BA] transition-all"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add Task
        </button>
      )}
    </div>
  );
}