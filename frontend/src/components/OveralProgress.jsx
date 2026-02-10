import React from "react";
import { PresentationChartLineIcon } from "@heroicons/react/24/outline";
import { useStudySessions } from "../utils/api";

const OverallProgress = () => {
  const { todaySummary, weeklySummary, isLoading } = useStudySessions();

  return (
    <div className="w-full h-56 sm:h-60 bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 flex flex-col items-center justify-center">
      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-black mb-2">
        <PresentationChartLineIcon className="w-5 h-5 text-white" />
      </div>

      <h2 className="text-gray-800 font-bold text-lg mb-1">
      Avg per day (this week): 
      </h2>

      <p>
    {weeklySummary && (
      <span className="font-semibold">
        {weeklySummary.average_minutes_per_day} mins
      </span>
    )}
  </p>
    </div>
  );
};

export default OverallProgress;