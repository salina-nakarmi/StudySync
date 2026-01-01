import React from "react";

const ProgressCard = ({ title = "Progress", width = "w-[260px]" }) => {
  const maxHours = 12;

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const screenTime = [
      { day: "Sun", hours: 3.5 },
    { day: "Mon", hours: 10.0 }, 
    { day: "Tue", hours: 9.1 },
    { day: "Wed", hours: 9.2 },
    { day: "Thu", hours: 7.6 },
    { day: "Fri", hours: 5.8 },
    { day: "Sat", hours: 3.1 },
  ];

  const todayIndex = new Date().getDay();
  const todayLetter = days[todayIndex];

  return (
    <div className={`${width} h-[240px] border-gray-200 p-5 flex flex-col`}>
      <div className="flex flex-col self-start ml-[-12px]">
        <h2 className="text-gray-800 font-bold text-lg -mt-8">{title}</h2>
        <div className="flex items-center gap-2 mt-2">
          <h3 className="text-gray-800 font-bold text-sm">
            {screenTime.reduce((a, b) => a + b.hours, 0)}h
          </h3>
          <h4 className="text-gray-400 font-medium text-sm">This week</h4>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex flex-1 items-center justify-center -mt-1 mr-3">
        <div className="flex items-end justify-between w-[90%]">
          {screenTime.map((bar, i) => {
            const isToday = bar.day === todayLetter;
            return (
              <div key={i} className="flex flex-col items-center w-[12%]">
                <span
                  className={`text-xs font-bold mb-1 ${
                    isToday ? "text-orange-500" : "text-gray-700"
                  }`}
                >
                  {bar.hours}h
                </span>

                {/* Bar */}
                <div
                  className={`w-full rounded-t-sm ${
                    isToday ? "bg-orange-500" : "bg-gray-900"
                  }`}
                  style={{ height: `${(bar.hours / maxHours) * 130}px` }}
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

export default ProgressCard;
