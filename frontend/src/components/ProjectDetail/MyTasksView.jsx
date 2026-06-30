// components/ProjectDetail/MyTasksView.jsx
import { useState } from "react";
import { CalendarIcon, PaperclipIcon, MessageSquareIcon, CheckCircle2Icon, CircleIcon } from "lucide-react";

const PRIORITY_CONFIG = {
  HIGH:   { bg: "bg-red-100",    text: "text-red-600"   },
  MEDIUM: { bg: "bg-teal-100",   text: "text-teal-700"  },
  LOW:    { bg: "bg-gray-100",   text: "text-gray-500"  },
  DESIGN: { bg: "bg-blue-100",   text: "text-blue-600"  },
};

const STATUS_CONFIG = {
  "TO DO":       { dot: "bg-gray-400",   label: "To Do"       },
  "IN PROGRESS": { dot: "bg-teal-400",   label: "In Progress" },
  "IN REVIEW":   { dot: "bg-yellow-400", label: "In Review"   },
  "DONE":        { dot: "bg-green-500",  label: "Done"        },
};

const MY_TASKS = [
  {
    id: 1,
    title: "Fix authentication redirect bug",
    status: "IN PROGRESS",
    priority: "HIGH",
    dueDate: "Aug 28, 2026",
    progress: 77,
    comments: 2,
    hasAttachment: true,
    done: false,
  },
  {
    id: 2,
    title: "Write unit tests for API endpoints",
    status: "TO DO",
    priority: "MEDIUM",
    dueDate: "Sep 5, 2026",
    progress: 0,
    comments: 0,
    hasAttachment: false,
    done: false,
  },
  {
    id: 3,
    title: "Project proposal submission",
    status: "DONE",
    priority: "LOW",
    dueDate: null,
    progress: 100,
    comments: 1,
    hasAttachment: false,
    done: true,
  },
  {
    id: 4,
    title: "Review pull request for dashboard UI",
    status: "IN REVIEW",
    priority: "MEDIUM",
    dueDate: "Aug 30, 2026",
    progress: 90,
    comments: 3,
    hasAttachment: true,
    done: false,
  },
  {
    id: 5,
    title: "Update project documentation",
    status: "TO DO",
    priority: "LOW",
    dueDate: "Sep 10, 2026",
    progress: 0,
    comments: 0,
    hasAttachment: false,
    done: false,
  },
];

function TaskRow({ task, onToggle }) {
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.LOW;
  const status   = STATUS_CONFIG[task.status]     ?? STATUS_CONFIG["TO DO"];
  const progressColor =
    task.priority === "HIGH"   ? "#f87171" :
    task.priority === "MEDIUM" ? "#14b8a6" : "#2C76BA";

  return (
    <div className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all hover:shadow-sm ${
      task.done ? "border-gray-100 bg-gray-50/50" : "border-gray-200 bg-white hover:border-[#2C76BA]/20"
    }`}>
      {/* Checkbox */}
      <button onClick={() => onToggle(task.id)} className="mt-0.5 shrink-0">
        {task.done
          ? <CheckCircle2Icon className="h-5 w-5 text-green-500" />
          : <CircleIcon className="h-5 w-5 text-gray-300 group-hover:text-gray-400 transition-colors" />
        }
      </button>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className={`text-sm font-semibold leading-snug ${
            task.done ? "line-through text-gray-400" : "text-gray-900"
          }`}>
            {task.title}
          </p>

          <div className="flex items-center gap-2 shrink-0">
            {/* Priority */}
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${priority.bg} ${priority.text}`}>
              {task.priority}
            </span>
            {/* Status dot + label */}
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className={`w-2 h-2 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        {!task.done && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
              <span className="uppercase tracking-wider font-bold">Progress</span>
              <span className="font-bold" style={{ color: progressColor }}>{task.progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${task.progress}%`, backgroundColor: progressColor }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-4 text-[11px] text-gray-400">
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {task.dueDate}
            </span>
          )}
          {task.comments > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquareIcon className="h-3 w-3" />
              {task.comments}
            </span>
          )}
          {task.hasAttachment && (
            <span className="flex items-center gap-1">
              <PaperclipIcon className="h-3 w-3" />
              Attachment
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyTasksView() {
  const [tasks, setTasks] = useState(MY_TASKS);

  const toggleDone = (id) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, done: !t.done, status: !t.done ? "DONE" : "IN PROGRESS", progress: !t.done ? 100 : t.progress }
          : t
      )
    );
  };

  const pending = tasks.filter((t) => !t.done);
  const done    = tasks.filter((t) => t.done);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">My Tasks</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {pending.length} pending · {done.length} completed
          </p>
        </div>
      </div>

      {/* Pending tasks */}
      {pending.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending</p>
          {pending.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={toggleDone} />
          ))}
        </div>
      )}

      {/* Completed tasks */}
      {done.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Completed</p>
          {done.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={toggleDone} />
          ))}
        </div>
      )}

      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <CheckCircle2Icon className="h-10 w-10 mb-3 text-gray-300" />
          <p className="text-sm font-medium">No tasks assigned to you yet.</p>
        </div>
      )}
    </div>
  );
}
