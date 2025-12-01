import React, { useState } from "react";

const FocusGoalCard = () => {
  const [tasks, setTasks] = useState([]);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [newTask, setNewTask] = useState("");

  const addTask = () => {
    if (!newTask.trim()) return;
    const id = Date.now();
    setTasks([...tasks, { id, name: newTask }]);
    setNewTask("");
  };

  return (
    <div className="w-[290px] bg-white rounded-3xl border border-gray-200 p-4 flex flex-col gap-3">
      <h2 className="text-gray-800 font-bold text-lg">Today's Focus Goal</h2>
      <h3 className="text-[#2C76BA] text-sm text-center">
        Finish 3 lab simulation task
      </h3>

      {/* Progress Bar */}
      <div className="w-full flex flex-col items-center">
        <div className="w-full h-3 bg-gray-200 rounded-2xl">
          <div className="h-3 bg-[#2C76BA] rounded-2xl" style={{ width: "50%" }}></div>
        </div>
        <p className="text-gray-600 text-xs mt-1 text-center">50% completed</p>
      </div>

      {/* Task List */}
      <div className="flex flex-col gap-2 mt-2">
        <h4 className="text-sm font-semibold">Tasks</h4>

        {/* Add Task */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="flex-1 p-1 border rounded"
          />
          <button
            onClick={addTask}
            className="bg-blue-600 text-white px-2 rounded hover:bg-blue-700"
          >
            Add
          </button>
        </div>

        {/* Task Items */}
        <ul className="flex flex-col gap-1 max-h-32 overflow-y-auto">
          {tasks.map((task) => (
            <li
              key={task.id}
              onClick={() => setCurrentTaskId(task.id)}
              className={`p-1 rounded cursor-pointer ${
                currentTaskId === task.id ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
            >
              {task.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FocusGoalCard;
