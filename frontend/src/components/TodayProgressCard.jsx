import React from "react";

const ScreenTimeCard = () => {
  const data = [
    { day: "Sun", hours: 3.5 },
    { day: "Mon", hours: 10.0 },
    { day: "Tue", hours: 9.1 },
    { day: "Wed", hours: 9.2 },
    { day: "Thu", hours: 7.6 },
    { day: "Fri", hours: 5.8 },
    { day: "Sat", hours: 3.1 },
  ];

  const todayIndex = new Date().getDay();
  const today = data[todayIndex];
  const maxHours = 12;

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className=" sm:w-[400px] md:w-[580px] lg:w-[920px] h-60 bg-white rounded-2xl border border-gray-200 p-4 mx-auto">
      
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-gray-700 font-semibold text-sm">Screen Time</p>
          <p className="text-black font-bold text-lg">
            {Math.floor(today.hours)}h {Math.round((today.hours % 1) * 60)} min
          </p>
        </div>
        <p className="text-gray-400 text-sm">{formattedDate}</p>
      </div>

      {/* Chart */}
      <div className="flex justify-center items-end h-[130px] gap-2 sm:gap-4 md:gap-6 lg:gap-14">
        {data.map((item, index) => {
          const isToday = index === todayIndex;
          return (
            <div key={index} className="flex flex-col items-center">
              {/* Time label only for today */}
              {isToday && (
                <span className="text-orange-500 text-xs font-bold mb-1">
                  {Math.floor(item.hours)}h {Math.round((item.hours % 1) * 60)}m
                </span>
              )}

              {/* Bar */}
              <div
                className={`w-4 rounded-[4px] ${isToday ? "bg-orange-400" : "bg-gray-900"}`}
                style={{
                  height: `${(item.hours / maxHours) * 80}px`,
                }}
              />

              {/* Dot */}
              <div
                className={`w-3 h-3 rounded-full mt-2 ${isToday ? "bg-orange-400" : "bg-black"}`}
              />

              {/* Day */}
              <span className="text-xs mt-1 text-gray-500">{item.day[0]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScreenTimeCard;
