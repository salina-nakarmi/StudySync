// UnifiedStudyTimer.jsx - With Real API Integration
import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, Clock, Zap, Coffee, Trophy, ChevronDown } from 'lucide-react';
import { useStudySessions } from '../utils/api';
import { useQueryClient } from '@tanstack/react-query';
import TimerControlBubble from './TimerControlBubble';
import TimerControlPanel from './TimerControlPanel';


export default function UnifiedStudyTimer({ onSessionComplete, groupId = null, embedded = false }) {
  // use mutations from api.js
  const { createSession } = useStudySessions();
  const queryClient = useQueryClient(); // ✅ NEW: For manual refresh

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

  const getInitialTimerState = (state) => {
    if (!state) {
      return {
        mode: 'POMO',
        timeLeft: MODES.POMO.time,
        totalStudied: 0,
        sessionStarted: false,
        isRunning: false,
        didComplete: false,
        lastSaveTime: Date.now(),
      };
    }

    const mode = state.mode || 'POMO';
    const baseTime = MODES[mode]?.time || MODES.POMO.time;
    let timeLeft = typeof state.timeLeft === 'number' ? state.timeLeft : baseTime;
    let totalStudied = typeof state.totalStudied === 'number' ? state.totalStudied : 0;
    let totalElapsed = typeof state.totalElapsed === 'number'
      ? state.totalElapsed
      : Math.max(0, baseTime - timeLeft);
    const sessionStarted = !!state.sessionStarted;
    const isRunning = !!state.isRunning;
    const lastSaveTime = state.lastSaveTime || Date.now();

    if (isRunning) {
      const timePassed = Math.floor((Date.now() - lastSaveTime) / 1000);
      if (timePassed > 0) {
        timeLeft = Math.max(timeLeft - timePassed, 0);
        totalElapsed += timePassed;
        if (mode === 'DEEP' || mode === 'POMO') {
          totalStudied += timePassed;
        }
      }
    }

    return {
      mode,
      timeLeft,
      totalStudied,
      totalElapsed,
      sessionStarted,
      isRunning,
      didComplete: isRunning && timeLeft === 0,
      lastSaveTime,
    };
  };

  const initialState = getInitialTimerState(savedState);

  const [mode, setMode] = useState(initialState.mode);
  const [timeLeft, setTimeLeft] = useState(initialState.timeLeft);
  const [isRunning, setIsRunning] = useState(initialState.isRunning);
  const [totalStudied, setTotalStudied] = useState(initialState.totalStudied);
  const [totalElapsed, setTotalElapsed] = useState(initialState.totalElapsed);
  const [sessionStarted, setSessionStarted] = useState(initialState.sessionStarted);
  const [showEndModal, setShowEndModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(initialState.lastSaveTime);
  const [pendingAutoComplete, setPendingAutoComplete] = useState(initialState.didComplete);

  // ✅ Save timer state to localStorage whenever it changes
  useEffect(() => {
    const timerState = {
      mode,
      timeLeft,
      totalStudied,
      totalElapsed,
      sessionStarted,
      isRunning,
      lastSaveTime: Date.now(),
    };

    localStorage.setItem('study_timer_state', JSON.stringify(timerState));
    setLastSaveTime(timerState.lastSaveTime);
  }, [mode, timeLeft, totalStudied, totalElapsed, sessionStarted, isRunning]);

  // ✅ Adjust time if page was closed while timer was running
  useEffect(() => {
    if (savedState && savedState.lastSaveTime) {
      const timePassed = Math.floor((Date.now() - savedState.lastSaveTime) / 1000);
      if (timePassed > 0 && timePassed < 3600) {
        console.log(`⏰ Page was closed for ${timePassed} seconds`);
      }
    }
  }, []);


  const resetTimer = useCallback(() => {
    setTimeLeft(MODES[mode].time);
    setIsRunning(false);
    setTotalStudied(0);
    setTotalElapsed(0);
    setSessionStarted(false);
    setSessionNotes('');
    localStorage.removeItem('study_timer_state');
    console.log('🗑️ Timer state cleared');
  }, [MODES, mode]);

  const handleToggle = () => {
    setIsRunning((prev) => !prev);
    if (!sessionStarted) setSessionStarted(true);
  };

  const handleStopRequest = () => {
    setIsRunning(false);
    setShowEndModal(true);
  };

  const handleTimerComplete = useCallback(() => {
    const isStudyMode = mode === 'DEEP' || mode === 'POMO';
    const durationSeconds = isStudyMode ? totalStudied : totalElapsed;
    // Auto-show end modal when timer completes
    if (durationSeconds >= 60) { // Only if at least 1 minute
      setShowEndModal(true);
    } else {
      alert("Session complete! 🎉");
      resetTimer();
    }
  }, [mode, totalStudied, totalElapsed, resetTimer]);

  useEffect(() => {
    if (pendingAutoComplete) {
      setIsRunning(false);
      handleTimerComplete();
      setPendingAutoComplete(false);
    }
  }, [pendingAutoComplete, handleTimerComplete]);

  // Timer logic
  useEffect(() => {
    let timer;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        setTotalElapsed(prev => prev + 1);
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
  }, [isRunning, timeLeft, mode, handleTimerComplete]);

  const switchMode = (newMode) => {
    if (isRunning && !window.confirm("Switching modes will reset the current timer. Continue?")) {
      return;
    }
    setMode(newMode);
    setTimeLeft(MODES[newMode].time);
    setIsRunning(false);
  };

    // ✅ CHANGED: Use mutation instead of manual API call
    const handleEndSession = async () => {
      const isStudyMode = mode === 'DEEP' || mode === 'POMO';
      const durationSeconds = isStudyMode ? totalStudied : totalElapsed;
      if (durationSeconds < 60) {
        alert("Session too short (minimum 1 minute)");
        return;
      }
  
      try {
        await createSession.mutateAsync({
          duration_seconds: durationSeconds,
          session_notes: sessionNotes || `${MODES[mode].label} session`,
          group_id: groupId,
        });
  
        console.log("✅ Session logged successfully");
        
        // ✅ NEW: Manually invalidate queries to refresh UI
        queryClient.invalidateQueries(['dashboard']);
        queryClient.invalidateQueries(['streaks']);
        queryClient.invalidateQueries(['study-sessions']);
  
        alert(`Session saved! ${Math.floor(durationSeconds / 60)} minutes logged 🎉`);
        
        setShowEndModal(false);
        resetTimer();
        if (typeof onSessionComplete === 'function') {
          onSessionComplete();
        }
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
    const isStudyMode = mode === 'DEEP' || mode === 'POMO';
    const displaySeconds = isStudyMode ? totalStudied : totalElapsed;
    const progress = ((MODES[mode].time - timeLeft) / MODES[mode].time) * 100;

  return (
    <>
      {!embedded && (
        <>
          {!isMinimized && (
            <div className="fixed bottom-6 right-6 z-50 w-[320px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                    }`}
                  ></div>
                  <h3 className="font-bold text-gray-800 text-sm">Study Hub</h3>
                </div>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="text-gray-400 hover:text-gray-700 transition-colors text-xs font-semibold flex items-center gap-1"
                >
                  <ChevronDown className="w-4 h-4" />
                  Minimize
                </button>
              </div>

              <div className="flex flex-col items-center justify-center py-4">
                <div className={`mb-2 p-3 rounded-full ${MODES[mode].color} bg-opacity-10`}>
                </div>
                <div className={`text-4xl font-mono font-bold mb-1 ${isRunning ? 'text-gray-800' : 'text-gray-400'}`}>
                  {formatTime(timeLeft)}
                </div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                  {MODES[mode].label}
                </p>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all duration-1000 ${MODES[mode].color}`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                {Object.keys(MODES).map((m) => {
                  const ModeIcon = MODES[m].icon;
                  return (
                    <button
                      key={m}
                      onClick={() => switchMode(m)}
                      disabled={isRunning}
                      className={`py-1.5 px-2 rounded-md text-[10px] font-semibold transition-all flex items-center justify-center gap-1 ${
                        mode === m
                          ? `${MODES[m].color} text-white shadow-lg`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'
                      }`}
                    >
                      <ModeIcon className="w-3 h-3" />
                      {MODES[m].label}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleToggle}
                  className={`flex-[2] py-2.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                    isRunning
                      ? 'bg-orange-500 hover:bg-orange-600'
                      : 'bg-gray-800 hover:bg-gray-900'
                  }`}
                >
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isRunning ? 'PAUSE' : 'START'}
                </button>

                {sessionStarted && (
                  <button
                    onClick={handleStopRequest}
                    className="flex-1 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 rounded-xl font-bold flex items-center justify-center"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
                <span>Session time:</span>
                <span className="font-bold">{formatTime(displaySeconds)}</span>
              </div>

              <button
                onClick={() => setIsControlPanelOpen(true)}
                className="w-full mt-3 py-2 text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                Open details panel
              </button>
            </div>
          )}

          {isMinimized && (
            <TimerControlBubble
              isRunning={isRunning}
              timeLeft={timeLeft}
              onToggle={handleToggle}
              onClose={handleStopRequest}
              mode={MODES[mode].label}
              formatTime={formatTime}
              onOpenControlPanel={() => setIsMinimized(false)}
            />
          )}

          <TimerControlPanel
            isOpen={isControlPanelOpen}
            onClose={() => setIsControlPanelOpen(false)}
            isRunning={isRunning}
            onToggle={handleToggle}
            onStop={handleStopRequest}
            mode={mode}
            MODES={MODES}
            onModeChange={switchMode}
            formatTime={formatTime}
            timeLeft={timeLeft}
            totalStudied={displaySeconds}
            progress={progress}
          />
        </>
      )}

      {/* Embedded Timer (Dashboard Mode) */}
      {embedded && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 w-full">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                }`}
              ></div>
              <h3 className="font-bold text-gray-800 text-sm">Study Hub</h3>
            </div>
            <span className="text-[11px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              {Math.floor(displaySeconds / 60)}m logged
            </span>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {Object.keys(MODES).map((m) => {
              const ModeIcon = MODES[m].icon;
              return (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`py-1.5 px-2 rounded-md text-[10px] font-semibold transition-all flex items-center justify-center gap-1 ${
                    mode === m
                      ? `${MODES[m].color} text-white shadow-lg scale-105`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ModeIcon className="w-3 h-3" />
                  {MODES[m].label}
                </button>
              );
            })}
          </div>

          {/* Timer Display */}
          <div className="relative mb-6">
            <div className="flex flex-col items-center justify-center py-8">
              <div className={`mb-3 p-4 rounded-full ${MODES[mode].color} bg-opacity-10`}>
                <CurrentIcon className={`w-8 h-8 ${MODES[mode].color.replace('bg-', 'text-')}`} />
              </div>

              <div className={`text-6xl font-mono font-bold mb-2 ${isRunning ? 'text-gray-800' : 'text-gray-400'}`}>
                {formatTime(timeLeft)}
              </div>

              <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                {MODES[mode].label}
              </p>
            </div>

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
              onClick={handleToggle}
              className={`flex-[2] py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                isRunning
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-gray-800 hover:bg-gray-900'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRunning ? 'PAUSE' : 'START'}
            </button>

            {sessionStarted && (
              <button
                onClick={handleStopRequest}
                className="flex-1 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 rounded-xl font-bold flex items-center justify-center"
              >
                <Square className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Stats */}
          {displaySeconds > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Session time:</span>
                <span className="font-bold">{formatTime(displaySeconds)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      
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
                You studied for <span className="font-bold text-green-600">{Math.floor(displaySeconds / 60)} minutes</span>
              </p>

              {/* Session Stats */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Mode:</span>
                  <span className="font-semibold text-gray-800">{MODES[mode].label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold text-gray-800">{formatTime(displaySeconds)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Minutes:</span>
                  <span className="font-semibold text-gray-800">{Math.floor(displaySeconds / 60)} min</span>
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
                  className="flex-1 min-h-[48px] py-3 px-5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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

// ============================================================================
// USAGE IN DASHBOARD.JSX
// ============================================================================

/*
import UnifiedStudyTimer from '../components/UnifiedStudyTimer';

// In your Dashboard component:
<UnifiedStudyTimer onSessionComplete={refreshDashboard} />

// Or with a specific group:
<UnifiedStudyTimer 
  onSessionComplete={refreshDashboard} 
  groupId={selectedGroupId} 
/>
*/