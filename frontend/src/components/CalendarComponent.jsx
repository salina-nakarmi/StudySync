import React, { useState, useMemo } from "react";
import { useDailyActivity } from "../utils/api"; // Updated hook import

const getDaysInMonth = (year, month) => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

// Utility to normalize dates for comparison
const stripTime = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();

export default function CustomCalendar() {
  // 1. Fetch persistent history from your new Neon table
  const { data: activityLogs, isLoading } = useDailyActivity();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const daysInMonth = getDaysInMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

  const todayStr = stripTime(new Date());

  // 2. Memoize the set of active dates for instant lookup
  const activeDates = useMemo(() => {
    if (!activityLogs) return new Set();
    return new Set(activityLogs.map((log) => stripTime(new Date(log.activity_date))));
  }, [activityLogs]);

  if (isLoading) {
    return (
      <div className="w-300 max-w-[300px] h-[240px] p-3 bg-white rounded-2xl border border-gray-200 flex items-center justify-center mx-auto">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[240px] p-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="flex items-center gap-1 font-bold text-gray-800 text-sm">
          <img src="/calendar.png" alt="calendar icon" className="w-3.5 h-3.5" />
          Focus Calendar
        </h1>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            className="px-2 py-[2px] rounded-lg bg-gray-200 hover:bg-gray-300 transition text-[10px] font-medium"
          >‹</button>
          <span className="text-gray-800 font-semibold text-[10px]">
            {currentMonth.toLocaleString("default", { month: "short" })} {currentMonth.getFullYear()}
          </span>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            className="px-2 py-[2px] rounded-lg bg-gray-200 hover:bg-gray-300 transition text-[10px] font-medium"
          >›</button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-gray-500 font-semibold text-[8px] mt-2 mb-1 ml-[-8px]">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, idx) => (
          <div key={`${d}-${idx}`}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[3px] flex-1 mt-[2px]">
        {daysInMonth.map((day) => {
          const dayStr = stripTime(day);
          const isToday = dayStr === todayStr;
          
          // 3. Persistent Check: If the date exists in Neon, it's green forever.
          const hasActivity = activeDates.has(dayStr);

          let bgClass = "bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-[8px]";
          
          // Priority coloring
          if (hasActivity) bgClass = "bg-green-500 text-white text-[8px]";
          // Example: different shades based on study time
// if (hasActivity) {
//   const hours = log.total_seconds / 3600;
//   if (hours > 4) bgClass = "bg-green-700"; // Heavy study
//   else if (hours > 2) bgClass = "bg-green-500"; // Medium
//   else bgClass = "bg-green-300"; // Light
// }

          if (isToday) bgClass = "ring-2 ring-orange-400 bg-gray-100 text-gray-800 text-[8px]";
          if (isToday && hasActivity) bgClass = "bg-orange-500 text-white text-[8px]";

          return (
            <div
              key={day.toISOString()}
              className={`flex items-center justify-center rounded-full h-5 w-5 sm:h-6 sm:w-6 ${bgClass}`}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
