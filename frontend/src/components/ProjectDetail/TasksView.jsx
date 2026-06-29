// components/ProjectDetail/TasksView.jsx
import { SlidersHorizontalIcon } from "lucide-react";
import { useTasks } from "../../services/project_service";
import KanbanColumn from "./KanbanColumn";

/**
 * Column placement is DERIVED from progress_percentage, not an independent
 * field the user picks. This mirrors how the slider on each TaskCard works:
 * dragging it both updates the percentage AND keeps task.status in sync,
 * so existing status-based backend queries (completed_task_count, etc.)
 * never drift out of sync with what the board visually shows.
 *
 *   0%        -> TO DO        (status: "Todo")
 *   1-99%      -> IN PROGRESS  (status: "In Progress")
 *   100%       -> DONE         (status: "Done")
 *
 * "In Review" is intentionally not reachable from the UI anymore — the
 * backend enum still has it (no migration needed), it's just unused here.
 */
export function deriveColumn(progressPercentage) {
  if (progressPercentage >= 100) return "DONE";
  if (progressPercentage > 0) return "IN PROGRESS";
  return "TO DO";
}

export function deriveStatus(progressPercentage) {
  if (progressPercentage >= 100) return "Done";
  if (progressPercentage > 0) return "In Progress";
  return "Todo";
}

function groupTasksByColumn(tasks) {
  const columns = { "TO DO": [], "IN PROGRESS": [], DONE: [] };
  for (const task of tasks) {
    columns[deriveColumn(task.progress_percentage)].push(task);
  }
  return columns;
}

export default function TasksView({ projectId, projectName, onlyMine = false }) {
  const { tasks, myTasks, isLoading, isLoadingMine, updateTask, createTask } = useTasks(projectId);

  const activeList = onlyMine ? myTasks : tasks;
  const loading = onlyMine ? isLoadingMine : isLoading;

  const columns = groupTasksByColumn(activeList || []);

  // Called when a TaskCard's slider moves — keeps progress_percentage AND
  // status in sync in a single PATCH, so they can never drift apart.
  const handleProgressChange = (taskId, newProgress) => {
    updateTask.mutate({
      taskId,
      progress_percentage: newProgress,
      status: deriveStatus(newProgress),
    });
  };

  const handleAddTask = (columnTitle) => {
    // New tasks start at the percentage implied by the column clicked —
    // "Add Task" only appears on TO DO and IN PROGRESS columns (not DONE),
    // so a sensible starting point per column is 0% or 1%.
    const startingProgress = columnTitle === "IN PROGRESS" ? 1 : 0;
    createTask.mutate({
      task_name: "New task",
      progress_percentage: startingProgress,
      status: deriveStatus(startingProgress),
    });
  };

  if (loading) {
    return <div className="text-sm text-gray-400 py-12 text-center">Loading tasks...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">
          {onlyMine ? "My Tasks" : "Project Tasks"}:{" "}
          <span className="text-[#2C76BA]">{projectName}</span>
        </h2>

        <button className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-700 hover:border-gray-300 transition shadow-sm">
          <SlidersHorizontalIcon className="h-3.5 w-3.5" />
          Filter
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5 flex-1 overflow-y-auto pb-4">
        {Object.entries(columns).map(([title, columnTasks]) => (
          <KanbanColumn
            key={title}
            title={title}
            tasks={columnTasks}
            onAddTask={handleAddTask}
            onProgressChange={handleProgressChange}
          />
        ))}
      </div>

      {activeList?.length === 0 && (
        <div className="text-center py-12 text-sm text-gray-400">
          {onlyMine ? "No tasks assigned to you yet." : "No tasks yet — add one to get started."}
        </div>
      )}
    </div>
  );
}