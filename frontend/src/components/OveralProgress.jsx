import React, { useState } from "react";
import { ChartBarIcon } from "@heroicons/react/24/outline";

const OverallProgress = () => {
  const [tasks] = useState([
    { id: 1, title: "DSA Lab", completed: true },
    { id: 2, title: "Math Assignment", completed: true },
    { id: 3, title: "OS Notes", completed: false },
    { id: 4, title: "Project UI", completed: false },
    { id: 5, title: "Report Writing", completed: false },
  ]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const progress = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="shrink-0">
      <div className="w-[320px] h-40  bg-white rounded-2xl border border-gray-200 p-4 flex flex-col items-center justify-center">
        <div className="w-7 h-7 flex items-center justify-center rounded-full bg-black mb-2">
          <ChartBarIcon className="w-3 h-3 text-white" />
        </div>
        <h2 className="text-gray-800 font-bold text-lg mb-1">Overall Progress</h2>
        <p className="text-2xl font-bold text-black mb-2">{progress}%</p>
        {/* <div className="w-full h-2 bg-gray-200 rounded-2xl">
          <div
            className="h-2 bg-[#2C76BA] rounded-2xl transition-all"
            style={{ width: `${progress}%` }}
          />
        </div> */}
        <p className="text-xs text-gray-500 mt-2">
          {completedTasks} of {totalTasks} tasks completed
        </p>
      </div>
    </div>
  );
};

export default OverallProgress;
