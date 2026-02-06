// TimerControlPanel.jsx - Dialog for controlling timer from bubble
import React from 'react';
import { Play, Pause, Square, Clock, Zap, Coffee, X } from 'lucide-react';

export default function TimerControlPanel({ 
  isOpen, 
  onClose, 
  isRunning, 
  onToggle, 
  onStop,
  mode, 
  MODES, 
  onModeChange,
  formatTime,
  timeLeft,
  totalStudied,
  progress
}) {
  if (!isOpen) return null;

  const CurrentIcon = MODES[mode]?.icon || Clock;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-full ${MODES[mode].color} bg-opacity-10`}>
              <CurrentIcon className={`w-5 h-5 ${MODES[mode].color.replace('bg-', 'text-')}`} />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">Study Timer</h2>
              <p className="text-xs text-gray-500">{MODES[mode].label}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timer Display */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-center mb-6">
          <div className="text-5xl font-mono font-bold text-gray-800 mb-2">
            {formatTime(timeLeft)}
          </div>
          <div className={`w-full bg-gray-300 h-2 rounded-full mt-4 overflow-hidden`}>
            <div
              className={`h-full ${MODES[mode].color} transition-all duration-1000`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 uppercase tracking-widest font-bold">
            {isRunning ? 'Running' : 'Paused'} • {Math.floor(totalStudied / 60)}m studied
          </p>
        </div>

        {/* Mode Selector */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
            Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(MODES).map((m) => {
              const ModeIcon = MODES[m].icon;
              return (
                <button
                  key={m}
                  onClick={() => onModeChange(m)}
                  disabled={isRunning}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                    mode === m
                      ? `${MODES[m].color} text-white shadow-lg`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'
                  }`}
                >
                  <ModeIcon className="w-3.5 h-3.5" />
                  {MODES[m].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={onToggle}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              isRunning
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-gray-800 hover:bg-gray-900 text-white'
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

          {totalStudied > 0 && (
            <button
              onClick={onStop}
              className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-600 font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          )}
        </div>

        {/* Session Info */}
        {totalStudied > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Session Time:</span>
              <span className="font-semibold text-gray-800">{formatTime(totalStudied)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Progress:</span>
              <span className="font-semibold text-gray-800">{progress.toFixed(0)}%</span>
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-semibold transition-colors"
        >
          Close Panel
        </button>
      </div>
    </div>
  );
}
