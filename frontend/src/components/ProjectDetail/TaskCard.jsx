// components/ProjectDetail/TaskCard.jsx
import { useState, useEffect } from "react";
import { CalendarIcon, MessageSquareIcon, PaperclipIcon } from "lucide-react";

// Priority is currently a frontend-only visual concept — your Tasks model
// has no priority field. Defaulting everything to a neutral look until
// (if) that's added to the backend, rather than inventing fake values.
const PRIORITY_CONFIG = {
  HIGH:   { bg: "bg-red-100",  text: "text-red-600",  label: "HIGH" },
  MEDIUM: { bg: "bg-teal-100", text: "text-teal-700", label: "MEDIUM" },
  LOW:    { bg: "bg-gray-100", text: "text-gray-500", label: "LOW" },
  DEFAULT:{ bg: "bg-gray-100", text: "text-gray-400", label: "TASK" },
};

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.DEFAULT;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold tracking-wide px-2.5 py-1 rounded-md ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function formatDueDate(dateString) {
  if (!dateString) return null;
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function TaskCard({ task, isDone = false, onProgressChange }) {
  // Local state lets the slider feel instant while dragging — the actual
  // PATCH only fires on release (onMouseUp/onTouchEnd), not on every
  // pixel of drag, so we don't spam the API mid-gesture.
  const [localProgress, setLocalProgress] = useState(task.progress_percentage);

  // Keep local slider position in sync if the task updates from elsewhere
  // (e.g. another tab, or a refetch after the mutation settles).
  useEffect(() => {
    setLocalProgress(task.progress_percentage);
  }, [task.progress_percentage]);

  const progressColor =
    localProgress >= 100 ? "#22c55e" : localProgress > 0 ? "#14b8a6" : "#9ca3af";

  const handleSliderRelease = () => {
    if (localProgress !== task.progress_percentage) {
      onProgressChange(localProgress);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border p-4 flex flex-col gap-3 transition-all hover:shadow-md ${
        isDone ? "border-gray-100 opacity-80" : "border-gray-200 hover:border-[#2C76BA]/20"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        {task.hasAttachment && <PaperclipIcon className="h-4 w-4 text-gray-300 shrink-0 mt-0.5" />}
      </div>

      <div>
        <p className={`text-sm font-bold leading-snug ${isDone ? "line-through text-gray-400" : "text-gray-900"}`}>
          {task.task_name}
        </p>
        {task.description && !isDone && (
          <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-3">
            {task.description}
          </p>
        )}
      </div>

      {/* Real draggable slider — this IS the source of truth for which
          column the card lives in, not a separate manual status picker */}
      <div>
        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1.5">
          <span className="uppercase tracking-wider font-bold">Progress</span>
          <span className="font-bold" style={{ color: progressColor }}>
            {localProgress}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={localProgress}
          onChange={(e) => setLocalProgress(Number(e.target.value))}
          onMouseUp={handleSliderRelease}
          onTouchEnd={handleSliderRelease}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-current"
          style={{
            background: `linear-gradient(to right, ${progressColor} ${localProgress}%, #f3f4f6 ${localProgress}%)`,
            color: progressColor,
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-gray-400">
          {task.due_date && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {formatDueDate(task.due_date)}
            </span>
          )}
          {task.total_hours_logged > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquareIcon className="h-3 w-3" />
              {task.total_hours_logged}h logged
            </span>
          )}
        </div>

        {task.assignee_username ? (
          <div
            className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 shrink-0"
            title={task.assignee_username}
          >
            {task.assignee_username[0]?.toUpperCase()}
          </div>
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