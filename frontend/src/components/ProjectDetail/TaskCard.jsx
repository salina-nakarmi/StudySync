// components/ProjectDetail/TaskCard.jsx
import { useState, useEffect } from "react";
import { CalendarIcon, ClockIcon } from "lucide-react";

function formatDueDate(dateString) {
  if (!dateString) return null;
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function TaskCard({ task, isDone = false, onProgressChange, onCardClick }) {
  const [localProgress, setLocalProgress] = useState(task.progress_percentage ?? 0);

  useEffect(() => {
    setLocalProgress(task.progress_percentage ?? 0);
  }, [task.progress_percentage]);

  const progressColor =
    localProgress >= 100 ? "#22c55e" : localProgress > 0 ? "#2C76BA" : "#9ca3af";

  const handleSliderRelease = () => {
    if (localProgress !== (task.progress_percentage ?? 0)) {
      onProgressChange(localProgress);
    }
  };

  return (
    <div
      onClick={onCardClick}
      className={`group rounded-2xl border p-4 flex flex-col gap-3 cursor-pointer transition-all hover:shadow-md ${
        isDone
          ? "border-gray-100 bg-gray-50/50 opacity-80"
          : "border-gray-200 bg-white hover:border-[#2C76BA]/30"
      }`}
    >
      {/* Task name */}
      <p
        className={`text-sm font-bold leading-snug ${
          isDone ? "line-through text-gray-400" : "text-gray-900"
        }`}
      >
        {task.task_name}
      </p>

      {/* Description preview */}
      {task.description && !isDone && (
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Progress slider — stopPropagation so clicking/dragging the slider
          doesn't also open the edit modal */}
      <div onClick={(e) => e.stopPropagation()}>
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
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${progressColor} ${localProgress}%, #f3f4f6 ${localProgress}%)`,
            accentColor: progressColor,
          }}
        />
      </div>

      {/* Footer */}
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
              <ClockIcon className="h-3 w-3" />
              {task.total_hours_logged}h
            </span>
          )}
        </div>

        {task.assignee_username ? (
          <div
            className="h-7 w-7 rounded-full bg-[#2C76BA] flex items-center justify-center text-[10px] font-bold text-white shrink-0"
            title={task.assignee_username}
          >
            {task.assignee_username[0]?.toUpperCase()}
          </div>
        ) : (
          isDone && (
            <div className="h-7 w-7 rounded-full bg-green-500 flex items-center justify-center">
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