import { ClockIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

const TotalTimeSpent = () => {
  // Mock data (frontend only)
  const [totalMinutes] = useState(320); // example: 5 hrs 20 min

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <div className="w-[320px] h-40 bg-white rounded-2xl border border-gray-200 p-4 flex flex-col items-center justify-center">
      
      {/* Icon */}
      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-black mb-2">
        <ClockIcon className="w-5 h-5 text-white" />
      </div>

      {/* Title */}
      <h2 className="text-gray-800 font-bold text-lg">
        Total Time Spent
      </h2>

      {/* Time */}
      <p className="text-2xl font-bold text-black mt-1">
        {hours}h {minutes}m
      </p>

      <p className="text-xs text-gray-500 mt-1">
        Across entire app
      </p>
    </div>
  );
};

export default TotalTimeSpent;
