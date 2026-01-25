import React, { useState, useEffect } from "react";
import { useStreaks } from "../utils/api";


const getDaysInMonth = (year, month) => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};


const stripTime = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export default function CustomCalendar() {
    //Use React Query hook
  const { streak, isLoading } = useStreaks();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const daysInMonth = getDaysInMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

  //Get streak from API instead of prop
  const streakCount = streak?.current_streak || 0;
 
  // Generate streak dates based on current streak
  const streakDates = [];
  const today = new Date();
  for (let i = 0; i < streakCount; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    streakDates.push(stripTime(d));
  }

    // Generate streak dates based on current streak
    // const streakDates = [];

    // if (streak?.streak_start_date && streak?.last_active_date) {
    //   const start = new Date(streak.streak_start_date);
    //   const end = new Date(streak.last_active_date);
  
    //   for (
    //     let d = new Date(start);
    //     d <= end;
    //     d.setDate(d.getDate() + 1)
    //   ) {
    //     streakDates.push(stripTime(new Date(d)));
    //   }
    // }


  const todayStr = stripTime(today).toISOString();
  const isSameDay = (d1, d2) =>
    stripTime(d1).toISOString() === stripTime(d2).toISOString();

    // Show loading state
  if (isLoading) {
    return (
      <div className="w-300 max-w-[300px] h-[240px] p-3 bg-white rounded-2xl border border-gray-200 flex items-center justify-center mx-auto">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="w-300 max-w-[300px] h-[240px] p-3 bg-white rounded-2xl border border-gray-200 flex flex-col mx-auto sm:item-center">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="flex items-center gap-1 font-bold text-gray-800 text-sm">
          <img src="/calendar.png" alt="calendar icon" className="w-3.5 h-3.5" />
          Focus Calendar
        </h1>

        {/* Month Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
              )
            }
            className="px-2 py-[2px] rounded-lg bg-gray-200 hover:bg-gray-300 transition text-[10px] font-medium"
          >
            ‹
          </button>

          <span className="text-gray-800 font-semibold text-[10px]">
            {currentMonth.toLocaleString("default", { month: "short" })}{" "}
            {currentMonth.getFullYear()}
          </span>

          <button
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
              )
            }
            className="px-2 py-[2px] rounded-lg bg-gray-200 hover:bg-gray-300 transition text-[10px] font-medium"
          >
            ›
          </button>
        </div>
      </div>


<div className="grid grid-cols-7 text-center text-gray-500 font-semibold text-[8px] mt-2 mb-1 ml-[-8px]">
  {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
    <div key={d}>{d}</div>
  ))}
</div>



<div className="grid grid-cols-7 gap-[3px] flex-1 mt-[2px]">
  {daysInMonth.map((day) => {
    const dayStr = stripTime(day).toISOString();
    const isToday = dayStr === todayStr;
    const isStreak = streakDates.some((sd) => isSameDay(sd, day));

    let bgClass =
      "bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-[8px]";

    if (isStreak) {
      bgClass = "bg-orange-500 text-white text-[8px]";
    } else if (isToday) {
      bgClass = "bg-[#2C76BA] text-white text-[8px]";
    }


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
