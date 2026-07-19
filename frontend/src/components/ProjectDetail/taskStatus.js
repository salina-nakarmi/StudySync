// components/ProjectDetail/taskStatus.js
// Single source of truth for deriving a task's kanban column / status label
// from its progress_percentage. Previously this logic lived only inside
// TasksView.jsx, and MyTasksView.jsx used static mock data with a different
// (hand-written, "priority"-based) status shape — the two views could never
// agree on what "In Progress" meant. Both views should import from here.

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

export function groupTasksByColumn(tasks) {
  const columns = { "TO DO": [], "IN PROGRESS": [], DONE: [] };
  for (const task of tasks) {
    columns[deriveColumn(task.progress_percentage ?? 0)].push(task);
  }
  return columns;
}

export const STATUS_DOT = {
  "TO DO": "bg-gray-400",
  "IN PROGRESS": "bg-[#2C76BA]",
  DONE: "bg-green-500",
};

export const STATUS_LABEL = {
  "TO DO": "To Do",
  "IN PROGRESS": "In Progress",
  DONE: "Done",
};

export function formatDueDate(dateString) {
  if (!dateString) return null;
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function initialsFor(username) {
  return username ? username[0].toUpperCase() : "?";
}