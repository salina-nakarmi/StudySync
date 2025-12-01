import React, { useState } from "react";

// Generate all days in a month
const getDaysInMonth = (year, month) => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

// Helper to remove time
const stripTime = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export default function CustomCalendar({ streak = 3 }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());

  // Last X streak dates
  const streakDates = [];
  const today = new Date();
  for (let i = 0; i < streak; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    streakDates.push(stripTime(d));
  }

  const todayStr = stripTime(today).toISOString();
  const isSameDay = (d1, d2) => stripTime(d1).toISOString() === stripTime(d2).toISOString();

  return (
    <div className="w-[344px] h-[240px] p-3 bg-white rounded-2xl border border-gray-200  flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="flex items-center gap-2 font-bold text-gray-800 text-lg">
          <img src="/calendar.png" alt="calendar icon" className="w-4 h-4" />
          Focus Calendar
        </h1 >

        {/* Month Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
              )
            }
            className="px-2 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 transition text-xs font-medium mr-4"
          >
            ‹
          </button>
          <span className="text-gray-800 font-semibold text-xs mr-4">
            {currentMonth.toLocaleString("default", { month: "short" })}{" "}
            {currentMonth.getFullYear()}
          </span>
          <button
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
              )
            }
            className="px-2 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 transition text-xs font-medium mr-4"
          >
            ›
          </button>
        </div>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 text-center text-gray-500 font-semibold text-[8px] mb-1 flex-0">
        {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-7 gap-[2px] flex-1">
        {daysInMonth.map((day) => {
          const dayStr = stripTime(day).toISOString();
          const isToday = dayStr === todayStr;
          const isStreak = streakDates.some((sd) => isSameDay(sd, day));

          let bgClass = "bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-[8px]";
          if (isStreak) bgClass = "bg-orange-500 text-white text-[8px]";
          if (isToday) bgClass = "bg-blue-500 text-white text-[8px]";

          return (
            <div
              key={day.toISOString()}
              className={`flex items-center justify-center rounded-full h-6 w-6 ${bgClass}`}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
