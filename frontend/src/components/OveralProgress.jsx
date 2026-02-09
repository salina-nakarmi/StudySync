import React from "react";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import { useResourceProgress } from "../utils/api";

const OverallProgress = () => {
  const { progressStats } = useResourceProgress();

  if (!progressStats) {
    return (
      <div className="w-full h-56 sm:h-60 bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  const totalTracked = progressStats.total_tracked || 0;
  const completed = progressStats.completed || 0;
  const inProgress = progressStats.in_progress || 0;
  const completionRate = progressStats.completion_rate || 0;

  return (
    <div className="w-full h-56 sm:h-60 bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 flex flex-col items-center justify-center">
      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-black mb-2">
        <ChartBarIcon className="w-5 h-5 text-white" />
      </div>

      <h2 className="text-gray-800 font-bold text-lg mb-1">
        Overall Progress
      </h2>

      <p className="text-2xl font-bold text-black mb-1">
        {completionRate.toFixed(0)}%
      </p>

      <p className="text-xs text-gray-500 mb-3">
        {completed} of {totalTracked} resources completed
      </p>

      <div className="flex gap-4 text-xs">
        <div className="text-center">
          <p className="font-bold text-orange-600">{inProgress}</p>
          <p className="text-gray-400">In Progress</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-green-600">{completed}</p>
          <p className="text-gray-400">Completed</p>
        </div>
      </div>
    </div>
  );
};

export default OverallProgress;