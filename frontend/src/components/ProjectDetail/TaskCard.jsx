// components/ProjectDetail/TaskCard.jsx
import { CalendarIcon, MessageSquareIcon, PaperclipIcon } from "lucide-react";

const PRIORITY_CONFIG = {
  HIGH:   { bg: "bg-red-100",    text: "text-red-600",   label: "HIGH" },
  MEDIUM: { bg: "bg-teal-100",   text: "text-teal-700",  label: "MEDIUM" },
  LOW:    { bg: "bg-gray-100",   text: "text-gray-500",  label: "LOW" },
  DESIGN: { bg: "bg-blue-100",   text: "text-blue-600",  label: "DESIGN" },
};

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.LOW;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-extrabold tracking-wide px-2.5 py-1 rounded-md ${cfg.bg} ${cfg.text}`}
    >
      {cfg.label}
      <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="currentColor">
        <path d="M5 7L1 3h8L5 7z" />
      </svg>
    </span>
  );
}

export default function TaskCard({ task, isDone = false }) {
  const progressColor =
    task.priority === "HIGH" ? "#f87171" :
    task.priority === "MEDIUM" ? "#14b8a6" :
    "#2C76BA";

  return (
    <div
      className={`bg-white rounded-2xl border p-4 flex flex-col gap-3 transition-all hover:shadow-md ${
        isDone ? "border-gray-100 opacity-80" : "border-gray-200 hover:border-[#2C76BA]/20"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        {task.hasAttachment && (
          <PaperclipIcon className="h-4 w-4 text-gray-300 shrink-0 mt-0.5" />
        )}
      </div>

      {/* Title + description */}
      <div>
        <p
          className={`text-sm font-bold leading-snug ${
            isDone ? "line-through text-gray-400" : "text-gray-900"
          }`}
        >
          {task.name}
        </p>
        {task.description && !isDone && (
          <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-3">
            {task.description}
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1.5">
          <span className="uppercase tracking-wider font-bold">Progress</span>
          <span className="font-bold" style={{ color: progressColor }}>
            {task.progress}%
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${task.progress}%`, backgroundColor: progressColor }}
          />
        </div>
      </div>

      {/* Footer: due date, comments, assignee */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-gray-400">
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {task.dueDate}
            </span>
          )}
          {task.commentCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquareIcon className="h-3 w-3" />
              {task.commentCount}
            </span>
          )}
        </div>

        {task.assigneeAvatar ? (
          <img
            src={task.assigneeAvatar}
            alt=""
            className="h-7 w-7 rounded-full border-2 border-white object-cover shadow-sm"
          />
        ) : (
          isDone && (
            <div className="h-7 w-7 rounded-full bg-[#2C76BA] flex items-center justify-center">
              <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )
        )}
      </div>
    </div>
  );
}