import React from "react";
import { useStudySessions } from "../utils/api";

const TodayProgressCard = ({ title = "Study Progress" }) => {
  const { weeklySummary } = useStudySessions();

  if (!weeklySummary) {
    return (
      <div className="w-full h-56 sm:h-60 border border-gray-200 p-4 sm:p-5 flex items-center justify-center rounded-2xl bg-white">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  const maxHours = 12;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const dailyBreakdown = weeklySummary.week?.daily_breakdown || [];
  
  const screenTime = days.map((day, index) => {
    const dayData = dailyBreakdown[index] || { total_minutes: 0 };
    return {
      day,
      hours: (dayData.total_minutes / 60).toFixed(1),
    };
  });

  const todayIndex = new Date().getDay();
  const todayLetter = days[todayIndex];
  
  const totalHours = screenTime.reduce((sum, bar) => sum + parseFloat(bar.hours), 0).toFixed(1);

  return (
    <div className="w-full h-56 sm:h-60 border border-gray-200 p-4 sm:p-5 flex flex-col rounded-2xl bg-white">
      <div className="flex flex-col items-center">
        <h2 className="text-gray-800 font-bold text-lg text-center">{title}</h2>
        <div className="flex items-center gap-2 mt-2">
          <h3 className="text-gray-800 font-bold text-sm">
            {totalHours}h
          </h3>
          <h4 className="text-gray-400 font-medium text-sm">This week</h4>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center mt-1 w-full">
        <div className="flex items-end justify-between w-full gap-0.5 sm:gap-2">
          {screenTime.map((bar, i) => {
            const isToday = bar.day === todayLetter;
            const hours = parseFloat(bar.hours);
            
            return (
              <div key={i} className="flex flex-col items-center w-[8%] sm:w-[9%]">
                <span
                  className={`text-xs font-bold mb-1 ${
                    isToday ? "text-orange-500" : "text-gray-700"
                  }`}
                >
                  {bar.hours}h
                </span>

                <div
                  className={`w-full rounded-t-sm ${
                    isToday ? "bg-orange-500" : "bg-gray-900"
                  }`}
                  style={{ 
                    height: `${hours > 0 ? Math.max((hours / maxHours) * 130, 10) : 2}px`,
                    minHeight: hours > 0 ? '10px' : '2px'
                  }}
                ></div>

                <span className="text-xs mt-2 text-gray-600">{bar.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TodayProgressCard;