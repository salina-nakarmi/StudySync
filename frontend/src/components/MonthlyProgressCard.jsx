import React from "react";
import { useAnalytics } from "../utils/api";

const MonthlyProgressCard = ({ title = "Monthly Study Progress" }) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // JS is 0-based

  const { monthlyAnalytics, isLoading } = useAnalytics(year, month);

  if (isLoading || !monthlyAnalytics) {
    return (
      <div className="w-full h-56 border border-gray-200 p-5 flex items-center justify-center rounded-2xl bg-white">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  const dailyBreakdown = monthlyAnalytics.daily_breakdown;

  const breakdownMap = {};
  dailyBreakdown.forEach(day => {
    const dayOfMonth = new Date(day.date).getDate(); // 1–31
    breakdownMap[dayOfMonth] = day.total_minutes;
  });

  const daysInMonth = new Date(year, month, 0).getDate();

  const bars = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return {
      day,
      hours: ((breakdownMap[day] || 0) / 60).toFixed(1),
    };
  });

  const maxHours = Math.max(
    1,
    ...bars.map(b => parseFloat(b.hours))
  );

  const todayDate = today.getDate();

  return (
    <div className="w-full h-56 border border-gray-200 p-5 flex flex-col rounded-2xl bg-white">
      <div className="text-center">
        <h2 className="font-bold text-lg">{title}</h2>
        <p className="text-sm text-gray-400">
          {monthlyAnalytics.total_hours}h this month
        </p>
      </div>

      <div className="flex flex-1 items-end gap-1 mt-3 overflow-x-auto">
        {bars.map((bar, i) => {
          const isToday = bar.day === todayDate;
          const height =
            bar.hours > 0
              ? Math.max((bar.hours / maxHours) * 120, 8)
              : 2;

          return (
            <div key={i} className="flex flex-col items-center w-3">
              <div
                className={`w-full rounded-t ${
                  isToday ? "bg-orange-500" : "bg-gray-900"
                }`}
                style={{ height }}
              />
              <span className="text-[10px] text-gray-500 mt-1">
                {bar.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthlyProgressCard;
