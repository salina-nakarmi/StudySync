// components/ProjectDetail/AddTaskModal.jsx
import { useState } from "react";
import { XIcon } from "lucide-react";
import AssigneeSelect from "./AssigneeSelect";

const PRIMARY_BLUE = "#2C76BA";

export default function AddTaskModal({ projectId, initialColumn, onConfirm, onClose }) {
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState(null);

  const handleCreate = () => {
    if (!taskName.trim()) return;
    onConfirm({
      task_name: taskName.trim(),
      description: description.trim() || null,
      due_date: dueDate || null,
      assigned_to: assignedTo,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">Add task</h2>
            {initialColumn && (
              <p className="text-xs text-gray-400 mt-0.5">
                Adding to <span className="font-semibold text-gray-500">{initialColumn}</span>
              </p>
            )}
          </div>
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
              placeholder="What needs to get done?"
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
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-bold text-gray-500 rounded-xl hover:bg-gray-50 transition border border-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!taskName.trim()}
            className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl hover:opacity-90 transition disabled:opacity-40"
            style={{ backgroundColor: PRIMARY_BLUE }}
          >
            Add task
          </button>
        </div>
      </div>
    </div>
  );
}