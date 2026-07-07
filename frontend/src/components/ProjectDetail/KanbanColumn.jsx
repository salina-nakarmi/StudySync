import { PlusIcon } from "lucide-react";

import TaskCard from "./TaskCard";

const COLUMN_THEME = {
    "TO DO": {
        chip: "bg-gray-100 text-gray-700",
        dot: "bg-gray-400",
    },
    "IN PROGRESS": {
        chip: "bg-blue-50 text-blue-700",
        dot: "bg-blue-500",
    },
    DONE: {
        chip: "bg-green-50 text-green-700",
        dot: "bg-green-500",
    },
};

export default function KanbanColumn({ title, tasks, onAddTask, onProgressChange }) {
    const theme = COLUMN_THEME[title] || COLUMN_THEME["TO DO"];
    const isDoneColumn = title === "DONE";

    return (
        <section className="min-h-[520px] rounded-2xl border border-gray-200 bg-white/70 p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} />
                    <h3 className="text-sm font-extrabold text-gray-800">{title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${theme.chip}`}>
                        {tasks.length}
                    </span>
                </div>

                {!isDoneColumn && (
                    <button
                        onClick={() => onAddTask(title)}
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-bold text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
                    >
                        <PlusIcon className="h-3.5 w-3.5" />
                        Add task
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {tasks.map((task) => (
                    <TaskCard
                        key={task.task_id}
                        task={task}
                        isDone={isDoneColumn}
                        onProgressChange={(newProgress) => onProgressChange(task.task_id, newProgress)}
                    />
                ))}
            </div>
        </section>
    );
}