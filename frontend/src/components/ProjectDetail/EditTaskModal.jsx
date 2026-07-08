// components/ProjectDetail/EditTaskModal.jsx
import { useState } from "react";
import { XIcon, TrashIcon } from "lucide-react";
import AssigneeSelect from "./AssigneeSelect";

const PRIMARY_BLUE = "#2C76BA";

export default function EditTaskModal({ task, projectId, onSave, onDelete, onClose }) {
  const [taskName, setTaskName] = useState(task.task_name || "");
  const [description, setDescription] = useState(task.description || "");
  const [dueDate, setDueDate] = useState(
    task.due_date ? task.due_date.slice(0, 10) : ""
  );
  const [assignedTo, setAssignedTo] = useState(task.assigned_to ?? null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isDirty =
    taskName !== (task.task_name || "") ||
    description !== (task.description || "") ||
    dueDate !== (task.due_date ? task.due_date.slice(0, 10) : "") ||
    assignedTo !== (task.assigned_to ?? null);

  const handleSave = () => {
    if (!taskName.trim()) return;
    onSave({
      taskId: task.task_id,
      task_name: taskName.trim(),
      description: description.trim() || null,
      due_date: dueDate || null,
      assigned_to: assignedTo,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(task.task_id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">Edit task</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Task name *
            </label>
            <input
              autoFocus
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#2C76BA] focus:ring-2 focus:ring-[#2C76BA]/10 transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add more context..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none resize-none focus:border-[#2C76BA] focus:ring-2 focus:ring-[#2C76BA]/10 transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Due date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#2C76BA] focus:ring-2 focus:ring-[#2C76BA]/10 transition"
            />
          </div>

          <AssigneeSelect
            projectId={projectId}
            value={assignedTo}
            onChange={setAssignedTo}
          />

          {/* Progress display only — slider stays on the card itself */}
          <div className="flex items-center justify-between text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
            <span className="font-bold uppercase tracking-wider">Current progress</span>
            <span className="font-bold text-gray-700">{task.progress_percentage ?? 0}%</span>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleDelete}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold transition border ${
              confirmDelete
                ? "bg-red-500 text-white border-red-500"
                : "text-red-400 border-red-200 hover:bg-red-50"
            }`}
          >
            <TrashIcon className="h-3.5 w-3.5" />
            {confirmDelete ? "Confirm delete" : "Delete"}
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-bold text-gray-500 rounded-xl hover:bg-gray-50 transition border border-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!taskName.trim() || !isDirty}
            className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl hover:opacity-90 transition disabled:opacity-40"
            style={{ backgroundColor: PRIMARY_BLUE }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}