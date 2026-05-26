import React from "react";

export default function StartNewProjectCard({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-64 min-h-[190px] border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-gray-100 hover:border-gray-300 flex flex-col items-center justify-center gap-3 transition-all duration-200 outline-none cursor-pointer group"
    >
      <div className="w-11 h-11 rounded-full bg-gray-200 group-hover:bg-gray-300 flex items-center justify-center transition-colors duration-200">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <span className="text-sm font-semibold text-gray-400 group-hover:text-gray-500 transition-colors duration-200">
        Start New Project
      </span>
    </button>
  );
}