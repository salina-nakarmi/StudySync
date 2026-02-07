// TimerControlBubble.jsx - Draggable floating bubble for timer control
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Pause, Play, X } from 'lucide-react';

export default function TimerControlBubble({ 
  isRunning, 
  timeLeft, 
  onToggle, 
  onClose,
  mode,
  formatTime,
  onOpenControlPanel 
}) {
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef(null);
  const dragMovedRef = useRef(false);

  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return; // Don't drag when clicking buttons
    dragMovedRef.current = false;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    dragMovedRef.current = true;
    const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 120));
    const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 120));
    
    setPosition({ x: newX, y: newY });
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  return (
    <div
      ref={bubbleRef}
      className="fixed z-50 bg-white rounded-full shadow-md border-2 border-sky-400 p-4 cursor-grab active:cursor-grabbing"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        if (e.target.closest('button')) return;
        if (dragMovedRef.current) {
          dragMovedRef.current = false;
          return;
        }
        onOpenControlPanel();
      }}
    >
      {/* Main Bubble Content */}
      <div className="flex flex-col items-center gap-2 min-w-[120px]">
        
        {/* Timer Time */}
        <div className="text-center">
          <div className="text-lg font-mono font-bold text-gray-800">
            {formatTime(timeLeft)}
          </div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            {mode}
          </div>
        </div>

        {/* Status Indicator */}
        <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />

        {/* Quick Controls */}
        <div className="flex gap-2">
          <button
            onClick={onToggle}
            className={`p-2 rounded-full transition-all ${
              isRunning
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            title={isRunning ? 'Pause' : 'Play'}
          >
            {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-200 hover:bg-red-100 text-gray-700 hover:text-red-600 transition-all"
            title="Stop"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Open Control Panel Button */}
        <button
          onClick={onOpenControlPanel}
          className="mt-1 text-[10px] font-semibold text-blue-600 hover:text-blue-700 hover:underline w-full text-center"
        >
          Details
        </button>
      </div>
    </div>
  );
}
