// components/ProjectDetail/MyTasksView.jsx
import { useState } from "react";
import { CalendarIcon, ClockIcon, CheckCircle2Icon, CircleIcon } from "lucide-react";
import { useTasks } from "../../services/project_service";
import { deriveColumn, deriveStatus, STATUS_DOT, STATUS_LABEL, formatDueDate } from "./taskStatus";
import EditTaskModal from "./EditTaskModal";

function TaskRow({ task, onToggle, onClick }) {
  const column = deriveColumn(task.progress_percentage ?? 0);
  const isDone = column === "DONE";
  const progressColor = isDone ? "#22c55e" : task.progress_percentage > 0 ? "#2C76BA" : "#9ca3af";

  return (
    <div
      onClick={() => onClick(task)}
      className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all hover:shadow-sm cursor-pointer ${
        isDone ? "border-gray-100 bg-gray-50/50" : "border-gray-200 bg-white hover:border-[#2C76BA]/20"
      }`}
    >
      {/* Checkbox — toggles between Done and In Progress */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task);
        }}
        className="mt-0.5 shrink-0"
      >
        {isDone
          ? <CheckCircle2Icon className="h-5 w-5 text-green-500" />
          : <CircleIcon className="h-5 w-5 text-gray-300 group-hover:text-gray-400 transition-colors" />
        }
      </button>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className={`text-sm font-semibold leading-snug ${
            isDone ? "line-through text-gray-400" : "text-gray-900"
          }`}>
            {task.task_name}
          </p>

          <span className="flex items-center gap-1.5 text-[11px] text-gray-500 shrink-0">
            <span className={`w-2 h-2 rounded-full ${STATUS_DOT[column]}`} />
            {STATUS_LABEL[column]}
          </span>
        </div>

        {task.description && !isDone && (
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-2">
            {task.description}
          </p>
        )}

        {/* Progress bar */}
        {!isDone && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
              <span className="uppercase tracking-wider font-bold">Progress</span>
              <span className="font-bold" style={{ color: progressColor }}>
                {task.progress_percentage ?? 0}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${task.progress_percentage ?? 0}%`, backgroundColor: progressColor }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-4 text-[11px] text-gray-400">
          {task.due_date && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {formatDueDate(task.due_date)}
            </span>
          )}
          {task.total_hours_logged > 0 && (
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              {task.total_hours_logged}h logged
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyTasksView({ projectId }) {
  const { myTasks, isLoadingMine, updateTask, deleteTask } = useTasks(projectId);
  const [editingTask, setEditingTask] = useState(null);

  const tasks = myTasks || [];
  const pending = tasks.filter((t) => (t.progress_percentage ?? 0) < 100);
  const done = tasks.filter((t) => (t.progress_percentage ?? 0) >= 100);

  const toggleDone = (task) => {
    const isDone = (task.progress_percentage ?? 0) >= 100;
    // Un-completing restores 50% rather than 0 — treated as "back in progress",
    // not "never started".
    const newProgress = isDone ? 50 : 100;
    updateTask.mutate({
      taskId: task.task_id,
      progress_percentage: newProgress,
      status: deriveStatus(newProgress),
    });
  };

  const handleEditSave = ({ taskId, task_name, description, due_date, assigned_to }) => {
    updateTask.mutate({ taskId, task_name, description, due_date, assigned_to });
  };

  const handleDelete = (taskId) => {
    deleteTask.mutate(taskId);
  };

  if (isLoadingMine) {
    return <div className="text-sm text-gray-400 py-12 text-center">Loading your tasks...</div>;
  }

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
            <TaskRow key={task.task_id} task={task} onToggle={toggleDone} onClick={setEditingTask} />
          ))}
        </div>
      )}

      {/* Completed tasks */}
      {done.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Completed</p>
          {done.map((task) => (
            <TaskRow key={task.task_id} task={task} onToggle={toggleDone} onClick={setEditingTask} />
          ))}
        </div>
      )}

      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <CheckCircle2Icon className="h-10 w-10 mb-3 text-gray-300" />
          <p className="text-sm font-medium">No tasks assigned to you yet.</p>
        </div>
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          projectId={projectId}
          onSave={handleEditSave}
          onDelete={handleDelete}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}