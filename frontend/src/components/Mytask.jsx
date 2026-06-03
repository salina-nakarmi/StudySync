import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

export default function MyTask() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("myTasks");

    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, title: "Design UI Dashboard", completed: false },
          { id: 2, title: "Fix API Integration", completed: false },
          { id: 3, title: "Write Documentation", completed: false },
        ];
  });

  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    localStorage.setItem("myTasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!inputValue.trim()) return;

    const newTask = {
      id: Date.now(),
      title: inputValue.trim(),
      completed: false,
    };

    // newest task on top
    setTasks((prev) => [newTask, ...prev]);

    setInputValue("");
  };

  const toggleComplete = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  };

  const deleteTask = (id) => {
    setTasks((prev) =>
      prev.filter((task) => task.id !== id)
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      addTask();
    }
  };

  return (
    <div
      className="
        w-full
        h-full
        min-h-[585px]
        bg-white
        rounded-[28px]
        border
        border-gray-200
        shadow-sm
        flex
        flex-col
        overflow-hidden
      "
    >
      {/* Header */}
      <div className="px-6 pt-6 shrink-0">
        <h2 className="text-[20px] font-bold text-[#0f172a]">
          My Tasks
        </h2>
      </div>

      {/* Input */}
      <div className="px-6 mt-5 mb-5 shrink-0">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Add new task..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="
              flex-1
              h-12
              bg-gray-100
              rounded-2xl
              px-4
              text-sm
              outline-none
            "
          />

          <button
            onClick={addTask}
            className="
              h-12
              px-6
              rounded-2xl
              bg-[#0f172a]
              text-white
              font-semibold
              text-sm
            "
          >
            Add
          </button>
        </div>
      </div>

      {/* Scrollable Task Area */}
      <div
        className="
          flex-1
          min-h-0
          overflow-y-auto
          px-6
          pb-6
          space-y-3
        "
        style={{
          scrollbarWidth: "thin",
        }}
      >
        {tasks.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-gray-400">
              No tasks yet
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="
                h-14
                bg-gray-50
                rounded-2xl
                border
                border-gray-100
                px-4
                flex
                items-center
                justify-between
              "
            >
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() =>
                    toggleComplete(task.id)
                  }
                  className="
                    w-4
                    h-4
                    accent-indigo-600
                    shrink-0
                  "
                />

                <p
                  className={`
                    text-sm
                    truncate
                    ${
                      task.completed
                        ? "line-through text-gray-400"
                        : "text-gray-700"
                    }
                  `}
                >
                  {task.title}
                </p>
              </div>

              <button
                onClick={() => deleteTask(task.id)}
                className="
                  text-gray-300
                  hover:text-red-500
                  transition-colors
                "
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}