import React, { useState, useEffect } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { FaPlay, FaPause } from "react-icons/fa"; 

export default function TimeTracker() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let timer;
    if (isRunning) {
      timer = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning]);

  const percentage = (seconds / 3600) * 100; // Example goal: 1 hour

  const formattedTime = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  return (
    <div className="p-1 bg-white rounded-2xl border border-gray-200 border-opacity-70 w-80 h-[120px]">
      {/* Top Row: Title + Circular Clock */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold -mt-10 ml-3">Time Tracker</h2>
        <div className="w-24 mr-3  ">
          <CircularProgressbar
            value={percentage}
            text={formattedTime}
            styles={buildStyles({
              pathColor: "#2563eb",
              textColor: "#111",
              textSize: "24px",
              
              
            })}
          />
        </div>
      </div>

      {/* Bottom Row: Start/Pause Button Left, Clock Right */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="border border-gray-400  w-6 h-6 rounded-full hover:bg-gray-200 transition -mt-16 ml-6 flex items-center justify-center"
        >
         {isRunning ? <FaPause size={10} /> : <FaPlay size={10} />}
        </button>

         
        
      </div>
    </div>
  );
}
