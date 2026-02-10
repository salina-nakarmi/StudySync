import { ClockIcon } from "@heroicons/react/24/outline";
import { useStudySessions } from "../utils/api";

const TotalTimeSpent = () => {
  const { monthlySummary } = useStudySessions();

  if (!monthlySummary) {
    return (
      <div className="w-full h-56 sm:h-60 bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  const totalMinutes = monthlySummary?.total_minutes || 0;
  const sessionCount = monthlySummary?.session_count || 0;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <div className="w-full h-56 sm:h-60 bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 flex flex-col items-center justify-center">
      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-black mb-2">
        <ClockIcon className="w-5 h-5 text-white" />
      </div>

      <h2 className="text-gray-800 font-bold text-lg">
        Total Time Spent
      </h2>

      <p className="text-2xl font-bold text-black mt-1">
        {hours}h {minutes}m
      </p>

      <p className="text-xs text-gray-500 mt-1">
        This month · {sessionCount} sessions
      </p>
    </div>
  );
};

export default TotalTimeSpent;
