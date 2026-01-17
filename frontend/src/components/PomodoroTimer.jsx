import React, { useState, useEffect } from "react";

export default function PomodoroCircular() {
  const WORK_TIME = 25 * 60;
  const SHORT_BREAK = 5 * 60;
  const LONG_BREAK = 15 * 60;

  const [mode, setMode] = useState("work"); 
  const [time, setTime] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);

  // Countdown timer
  useEffect(() => {
    let timer;
    if (isRunning && time > 0) {
      timer = setInterval(() => setTime((prev) => prev - 1), 1000);
    }

 
    if (time === 0) {
      if (mode === "work") {
        switchMode("short");
      } else {
        setIsRunning(false); 
      }
    }

    return () => clearInterval(timer);
  }, [isRunning, time, mode]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
    if (newMode === "work") setTime(WORK_TIME);
    if (newMode === "short") setTime(SHORT_BREAK);
    if (newMode === "long") setTime(LONG_BREAK);
  };

  const toggleStartPause = () => setIsRunning((prev) => !prev);

  const formattedTime = `${Math.floor(time / 60)
    .toString()
    .padStart(2, "0")}:${(time % 60).toString().padStart(2, "0")}`;

  return (
    <div className="p-4 px-2 bg-white rounded-2xl border border-gray-200 w-[300px] flex flex-col items-center gap-4 h-40 ">
        <h2 className="text-gray-800 font-bold text-lg -mt-2">Flow Timer</h2>
   
     
<div className="w-full flex justify-between items-center">
  <div className="flex gap-6 flex-nowrap -mt-4">
    <button
      onClick={() => switchMode("work")}
      className={`px-2 py-1 h-6 rounded-lg whitespace-nowrap flex-shrink ${
        mode === "work"
          ? "bg-gray-800 text-white font-semibold text-xs"
          : "bg-white text-gray-900 hover:bg-gray-300 text-xs"
      }`}
    >
      Pomodoro
    </button>

    <button
      onClick={() => switchMode("short")}
      className={`px-2 py-1 h-6 rounded-lg whitespace-nowrap flex-shrink ${
        mode === "short"
          ? "bg-gray-800 text-white font-semibold text-xs"
          : "bg-white text-gray-900 hover:bg-gray-300 text-xs"
      }`}
    >
      Short Break
    </button>

    <button
      onClick={() => switchMode("long")}
      className={`px-2 py-1 h-6 rounded-lg whitespace-nowrap flex-shrink ${
        mode === "long"
          ? "bg-gray-800 text-white font-semibold text-xs"
          : "bg-white text-gray-900 hover:bg-gray-300 text-xs"
      }`}
    >
      Long Break
    </button>
  </div>
</div>


  
  
      <div className="text-3xl font-bold -mt-2">{formattedTime}</div>

      
      <button
        onClick={toggleStartPause}
        className="-mt-4 px-6 py-2 w-35 bg-[#FF8C50] h-8   text-white font-bold text-2xl rounded-lg  hover:bg-[#FF8C50]  flex items-center justify-center"
      >
        {isRunning ? "Pause" : "Start"}
      </button>
    </div>
  );
}
