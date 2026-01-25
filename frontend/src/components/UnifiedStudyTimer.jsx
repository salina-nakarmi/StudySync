// UnifiedStudyTimer.jsx - With localStorage Persistence
import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, Zap, Coffee, Trophy } from 'lucide-react';
import { useStudySessions } from '../utils/api';
import { useQueryClient } from '@tanstack/react-query';

export default function UnifiedStudyTimer({ onSessionComplete, groupId = null }) {
  const { createSession } = useStudySessions();
  const queryClient = useQueryClient();

  // Constants for different modes
  const MODES = {
    DEEP: { label: 'Deep Work', time: 60 * 60, color: 'bg-purple-600', icon: Zap },
    POMO: { label: 'Pomodoro', time: 25 * 60, color: 'bg-indigo-600', icon: Clock },
    SHORT: { label: 'Short Break', time: 5 * 60, color: 'bg-teal-600', icon: Coffee },
    LONG: { label: 'Long Break', time: 15 * 60, color: 'bg-cyan-600', icon: Coffee }
  };

  // ✅ Load timer state from localStorage on mount
  const loadTimerState = () => {
    try {
      const saved = localStorage.getItem('study_timer_state');
      if (saved) {
        const state = JSON.parse(saved);
        console.log('♻️ Restored timer state from localStorage');
        return state;
      }
    } catch (error) {
      console.error('Failed to load timer state:', error);
    }
    return null;
  };

  const savedState = loadTimerState();

  const [mode, setMode] = useState(savedState?.mode || 'POMO');
  const [timeLeft, setTimeLeft] = useState(savedState?.timeLeft || MODES.POMO.time);
  const [isRunning, setIsRunning] = useState(false); // Always start paused after refresh
  const [totalStudied, setTotalStudied] = useState(savedState?.totalStudied || 0);
  const [sessionStarted, setSessionStarted] = useState(savedState?.sessionStarted || false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [lastSaveTime, setLastSaveTime] = useState(savedState?.lastSaveTime || Date.now());

  // ✅ Save timer state to localStorage whenever it changes
  useEffect(() => {
    const timerState = {
      mode,
      timeLeft,
      totalStudied,
      sessionStarted,
      lastSaveTime: Date.now(),
    };
    
    localStorage.setItem('study_timer_state', JSON.stringify(timerState));
  }, [mode, timeLeft, totalStudied, sessionStarted]);

  // ✅ Adjust time if page was closed while timer was running
  useEffect(() => {
    if (savedState && savedState.lastSaveTime) {
      const timePassed = Math.floor((Date.now() - savedState.lastSaveTime) / 1000);
      if (timePassed > 0 && timePassed < 3600) { // Only adjust if < 1 hour
        console.log(`⏰ Page was closed for ${timePassed} seconds`);
        // Note: We don't auto-deduct time because timer was paused
        // If you want to continue running in background, implement background timer
      }
    }
  }, []);

  // Timer logic
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
      handleTimerComplete();
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode]);

  const handleTimerComplete = () => {
    // Auto-show end modal when timer completes
    if (totalStudied >= 60) { // Only if studied at least 1 minute
      setShowEndModal(true);
    } else {
      alert("Session complete! 🎉");
      resetTimer();
    }
  };

  const switchMode = (newMode) => {
    if (isRunning && !window.confirm("Switching modes will reset the current timer. Continue?")) {
      return;
    }
    setMode(newMode);
    setTimeLeft(MODES[newMode].time);
    setIsRunning(false);
  };

  const resetTimer = () => {
    // Reset all state
    setTimeLeft(MODES[mode].time);
    setIsRunning(false);
    setTotalStudied(0);
    setSessionStarted(false);
    setSessionNotes('');
    
    // ✅ Clear localStorage when resetting
    localStorage.removeItem('study_timer_state');
    console.log('🗑️ Timer state cleared');
  };

  const handleEndSession = async () => {
    if (totalStudied < 60) {
      alert("Session too short (minimum 1 minute)");
      return;
    }

    try {
      await createSession.mutateAsync({
        duration_seconds: totalStudied,
        session_notes: sessionNotes || `${MODES[mode].label} session`,
        group_id: groupId,
      });

      console.log("✅ Session logged successfully");
      
      // Manually invalidate queries to refresh UI
      queryClient.invalidateQueries(['dashboard']);
      queryClient.invalidateQueries(['streaks']);
      queryClient.invalidateQueries(['study-sessions']);

      alert(`Session saved! ${Math.floor(totalStudied / 60)} minutes logged 🎉`);
      
      setShowEndModal(false);
      resetTimer();
    } catch (error) {
      console.error("❌ Failed to log session:", error);
      alert(`Failed to save session: ${error.message}`);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const CurrentIcon = MODES[mode].icon;
  const progress = ((MODES[mode].time - timeLeft) / MODES[mode].time) * 100;

  return (
    <>
      {/* Main Timer Widget */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-80">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
              <h3 className="font-bold text-gray-800">Study Hub</h3>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-green-100 text-green-700 rounded-full">
              {Math.floor(totalStudied / 60)}m logged
            </span>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {Object.keys(MODES).map((m) => {
              const ModeIcon = MODES[m].icon;
              return (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    mode === m 
                      ? `${MODES[m].color} text-white shadow-lg scale-105` 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ModeIcon className="w-3.5 h-3.5" />
                  {MODES[m].label}
                </button>
              );
            })}
          </div>

          {/* Timer Display */}
          <div className="relative mb-6">
            <div className="flex flex-col items-center justify-center py-6">
              {/* Icon */}
              <div className={`mb-3 p-3 rounded-full ${MODES[mode].color} bg-opacity-10`}>
                <CurrentIcon className={`w-6 h-6 ${MODES[mode].color.replace('bg-', 'text-')}`} />
              </div>
              
              {/* Time */}
              <div className={`text-5xl font-mono font-bold mb-2 transition-colors ${
                isRunning ? 'text-gray-800' : 'text-gray-400'
              }`}>
                {formatTime(timeLeft)}
              </div>
              
              {/* Mode Label */}
              <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                {MODES[mode].label}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ${MODES[mode].color}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button
              onClick={() => { 
                setIsRunning(!isRunning); 
                if (!sessionStarted) setSessionStarted(true);
              }}
              className={`flex-[2] py-3 rounded-xl font-bold text-white transition-all active:scale-95 flex items-center justify-center gap-2 ${
                isRunning 
                  ? 'bg-orange-500 hover:bg-orange-600' 
                  : 'bg-gray-800 hover:bg-gray-900'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  PAUSE
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  START
                </>
              )}
            </button>
            
            {sessionStarted && (
              <button
                onClick={() => setShowEndModal(true)}
                className="flex-1 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 rounded-xl font-bold transition-all flex items-center justify-center"
              >
                <Square className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Stats */}
          {totalStudied > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Session time:</span>
                <span className="font-bold">{formatTime(totalStudied)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* End Session Modal */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 bg-green-100 rounded-full">
                <Trophy className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
              Great Session!
            </h2>
            <p className="text-center text-gray-600 mb-6">
              You studied for <span className="font-bold text-green-600">{Math.floor(totalStudied / 60)} minutes</span>
            </p>

            {/* Session Stats */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mode:</span>
                <span className="font-semibold text-gray-800">{MODES[mode].label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Duration:</span>
                <span className="font-semibold text-gray-800">{formatTime(totalStudied)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Minutes:</span>
                <span className="font-semibold text-gray-800">{Math.floor(totalStudied / 60)} min</span>
              </div>
            </div>

            {/* Session Notes */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Session Notes (Optional)
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="What did you work on? How did it go?"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                rows="3"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEndModal(false);
                  setIsRunning(false);
                }}
                disabled={createSession.isLoading}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEndSession}
                disabled={createSession.isLoading}
                className="flex-[2] py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createSession.isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Save Session'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}