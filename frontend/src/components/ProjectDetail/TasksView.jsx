// components/ProjectDetail/TasksView.jsx
import { useState } from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import { useTasks } from "../../services/project_service";
import KanbanColumn from "./KanbanColumn";
import AddTaskModal from "./AddTaskModal";
import EditTaskModal from "./EditTaskModal";

function deriveColumn(progressPercentage) {
  if (progressPercentage >= 100) return "DONE";
  if (progressPercentage > 0) return "IN PROGRESS";
  return "TO DO";
}

function deriveStatus(progressPercentage) {
  if (progressPercentage >= 100) return "Done";
  if (progressPercentage > 0) return "In Progress";
  return "Todo";
}

function groupTasksByColumn(tasks) {
  const columns = { "TO DO": [], "IN PROGRESS": [], DONE: [] };
  for (const task of tasks) {
    columns[deriveColumn(task.progress_percentage ?? 0)].push(task);
  }
  return columns;
}

export default function TasksView({ projectId, projectName }) {
  const { tasks, isLoading, updateTask, createTask, deleteTask } = useTasks(projectId);

  // Which column triggered "+ Add task"
  const [addingToColumn, setAddingToColumn] = useState(null);
  // Which task is open for editing
  const [editingTask, setEditingTask] = useState(null);

  const columns = groupTasksByColumn(tasks || []);

  const handleAddTask = (columnTitle) => {
    setAddingToColumn(columnTitle);
  };

  const handleCreateConfirm = ({ task_name, description, due_date }) => {
    const startingProgress = addingToColumn === "IN PROGRESS" ? 1 : 0;
    createTask.mutate({
      task_name,
      description,
      due_date,
      progress_percentage: startingProgress,
      status: deriveStatus(startingProgress),
    });
    setAddingToColumn(null);
  };

  const handleProgressChange = (taskId, newProgress) => {
    updateTask.mutate({
      taskId,
      progress_percentage: newProgress,
      status: deriveStatus(newProgress),
    });
  };

  const handleEditSave = ({ taskId, task_name, description, due_date }) => {
    updateTask.mutate({ taskId, task_name, description, due_date });
  };

  const handleDelete = (taskId) => {
    deleteTask.mutate(taskId);
  };

  if (isLoading) {
    return <div className="text-sm text-gray-400 py-12 text-center">Loading tasks...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">
          Project Tasks:{" "}
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
            onCardClick={setEditingTask}
          />
        ))}
      </div>

      {tasks?.length === 0 && (
        <div className="text-center py-12 text-sm text-gray-400">
          No tasks yet — click "+ Add task" to get started.
        </div>
      )}

      {/* Add task modal */}
      {addingToColumn && (
        <AddTaskModal
          initialColumn={addingToColumn}
          onConfirm={handleCreateConfirm}
          onClose={() => setAddingToColumn(null)}
        />
      )}

      {/* Edit task modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onSave={handleEditSave}
          onDelete={handleDelete}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}