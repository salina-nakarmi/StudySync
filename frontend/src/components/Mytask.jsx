import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export default function MyTask() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("myTasks");
    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, title: "Design UI Dashboard", color: "bg-amber-50", completed: false },
          { id: 2, title: "Fix API Integration", color: "bg-blue-50", completed: false },
          { id: 3, title: "Write Documentation", color: "bg-pink-50", completed: false },
        ];
  });

  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef(null);

  // ---------------- SAVE TO LOCALSTORAGE ----------------
  useEffect(() => {
    localStorage.setItem("myTasks", JSON.stringify(tasks));
  }, [tasks]);

  // ---------------- ADD TASK ----------------
  const addTask = () => {
    if (inputValue.trim() === "") return;
    const newTask = {
      id: Date.now(),
      title: inputValue,
      completed: false,
      color: ["bg-amber-50", "bg-blue-50", "bg-pink-50"][Math.floor(Math.random() * 3)],
    };
    setTasks([...tasks, newTask]);
    setInputValue("");
  };

  // ---------------- DELETE TASK ----------------
  const deleteTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  // ---------------- TOGGLE COMPLETE ----------------
const toggleComplete = (id) => {
  setTasks(tasks.filter((task) => task.id !== id));
};

  // ---------------- HANDLE ENTER KEY ----------------
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      addTask();
    }
  };

  return (
    <div className="w-[300px] h-[488px] p-3 bg-white rounded-2xl border border-gray-200 mx-auto -mt-6 -ml-6">
      <h2 className="text-gray-800 font-bold text-lg">My Task</h2>

      {/* Input Field */}
      <div className="flex gap-2 mt-3">
        <input
          className="flex-1 border border-gray-200 rounded-lg px-2 text-sm outline-none"
          placeholder="Add new task..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={addTask}
          className="px-3 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
        >
          Add
        </button>
      </div>

      {/* Scrollable Tasks Section */}
      <div
        ref={scrollRef}
        className="mt-4 flex flex-col gap-3 overflow-y-auto h-[380px] pr-2 w-full"
        style={{ scrollbarWidth: "none" }} // Firefox
      >
      
        <div className="px-3 h-12 border border-gray-200 rounded-xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex justify-center items-center text-xs font-bold">
              {tasks.length}
            </div>
            <h2 className="font-semibold text-gray-800">Total Tasks</h2>
          </div>
          <ChevronDown size={20} />
        </div>

       
        {tasks.length === 0 && (
          <p className="text-xs text-gray-500 text-center mt-5">
            ~ No Tasks Available ~
          </p>
        )}

     
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`${task.color} rounded-2xl h-14 w-full flex justify-between items-center px-4`}
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleComplete(task.id)}
                className="w-4 h-4 accent-green-300"
              />
              <p
                className={`font-medium text-gray-800 text-sm ${
                  task.completed ? "line-through text-gray-400" : ""
                }`}
              >
                {task.title}
              </p>
            </div>
            <button
              onClick={() => deleteTask(task.id)}
              className="text-red-500 font-bold text-xs"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
