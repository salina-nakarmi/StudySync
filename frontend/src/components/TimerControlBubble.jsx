// TimerControlBubble.jsx - Draggable floating bubble for timer control
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Pause, Play, X, Coffee } from 'lucide-react';

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

  const bubbleWidth = 220;
  const bubbleHeight = 64;

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    dragMovedRef.current = true;
    const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - bubbleWidth));
    const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - bubbleHeight));
    
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
      className="fixed z-50 bg-black rounded-xl shadow-lg border border-black/10 px-3 py-2 cursor-grab active:cursor-grabbing"
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
      <div className="flex items-center gap-3 min-w-[200px]">
        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
          <Coffee className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1">
          <div className="text-lg font-mono font-bold text-white leading-none">
            {formatTime(timeLeft)}
          </div>
          <div className="text-[10px] text-white/70 uppercase tracking-widest font-semibold">
            {mode}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={`p-2 rounded-lg transition-all ${
              isRunning
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={isRunning ? 'Pause' : 'Play'}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-red-600 text-white transition-all"
            title="Stop"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
