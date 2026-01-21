import React, { useState, useEffect } from 'react';

export default function UnifiedStudyTimer() {
  // Constants for different modes
  const MODES = {
    DEEP: { label: 'Deep Work', time: 60 * 60, color: 'bg-purple-600' },
    POMO: { label: 'Pomodoro', time: 25 * 60, color: 'bg-indigo-600' },
    SHORT: { label: 'Short Break', time: 5 * 60, color: 'bg-teal-600' },
    LONG: { label: 'Long Break', time: 15 * 60, color: 'bg-cyan-600' }
  };

  const [mode, setMode] = useState('DEEP'); // Default to 1 hr
  const [timeLeft, setTimeLeft] = useState(MODES.DEEP.time);
  const [isRunning, setIsRunning] = useState(false);
  const [totalStudied, setTotalStudied] = useState(0); 
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  useEffect(() => {
    let timer;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        // Only log study time if the mode is DEEP or POMO
        if (mode === 'DEEP' || mode === 'POMO') {
          setTotalStudied(prev => prev + 1);
        }
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      alert("Time is up! Great session.");
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode]);

  const switchMode = (newMode) => {
    if (isRunning && !window.confirm("Switching modes will reset the current timer. Continue?")) return;
    setMode(newMode);
    setTimeLeft(MODES[newMode].time);
    setIsRunning(false);
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 w-80">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800">Study Hub</h3>
          <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">
            {Math.floor(totalStudied / 60)}m logged
          </span>
        </div>

        {/* Mode Selector - Grid layout for more options */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {Object.keys(MODES).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                mode === m 
                ? 'bg-gray-800 text-white shadow-md' 
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {MODES[m].label}
            </button>
          ))}
        </div>

        {/* Timer Circle/Display */}
        <div className="flex flex-col items-center justify-center py-4 border-y border-gray-50 mb-6">
          <div className={`text-5xl font-mono font-bold mb-1 ${isRunning ? 'text-grey-600' : 'text-gray-400'}`}>
            {formatTime(timeLeft)}
          </div>
          <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">
            {MODES[mode].label}
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={() => { setIsRunning(!isRunning); setSessionStarted(true); }}
            className={`flex-[2] py-3 rounded-xl font-bold text-white transition-transform active:scale-95 ${
              isRunning ? 'bg-orange-500' : 'bg-grey-600'
            }`}
          >
            {isRunning ? 'PAUSE' : 'START'}
          </button>
          
          {sessionStarted && (
            <button
              onClick={() => setShowEndModal(true)}
              className="flex-1 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 rounded-xl font-bold transition-colors"
            >
              END
            </button>
          )}
        </div>
      </div>
      
      {/* End Modal logic would go here, same as your previous code */}
    </div>
  );
}
