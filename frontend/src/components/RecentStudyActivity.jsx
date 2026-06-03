import React from "react";
import { Clock, BookOpen, Zap } from "lucide-react";
import { useDashboard } from "../utils/api";

export default function RecentStudyActivity() {
  const { data: dashboardData, isLoading } = useDashboard();

  const recentSessions = dashboardData?.recent_sessions || [];

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const sessionTime = new Date(timestamp);
    const diffMs = now - sessionTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getSessionIcon = (duration) => {
    if (duration >= 3600) return Zap;
    if (duration >= 1500) return BookOpen;
    return Clock;
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0) return `${hours}h ${remainingMins}m`;
    return `${mins} mins`;
  };

  const formatBadge = (seconds) => {
    const mins = Math.floor(seconds / 60);
    return mins >= 60 ? `${Math.floor(mins / 60)}H` : `${mins}M`;
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-2xl border border-gray-100 p-5 shadow-sm h-full min-h-[320px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 p-5 shadow-sm h-full min-h-[320px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900 font-bold text-base">Recent Activity</h2>
        <span className="text-[10px] text-gray-400 font-semibold tracking-widest uppercase">
          Last 5 Sessions
        </span>
      </div>

      {/* Session List */}
      <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
        {recentSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Clock className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm font-medium">No study sessions yet</p>
            <p className="text-gray-300 text-xs mt-1">Start a timer to see your activity here</p>
          </div>
        ) : (
          recentSessions.slice(0, 5).map((session, index) => {
            const SessionIcon = getSessionIcon(session.duration_seconds);
            return (
              <div
                key={index}
                className="flex items-center gap-3 py-3 px-1"
              >
                {/* Circular icon */}
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center">
                    <SessionIcon className="w-4 h-4 text-indigo-400" strokeWidth={1.8} />
                  </div>
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
                    {session.session_notes || "Study Session"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-gray-400">
                      {formatDuration(session.duration_seconds)}
                    </span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(session.created_at)}
                    </span>
                  </div>
                </div>

                {/* Minute badge */}
                <div className="flex-shrink-0">
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 rounded-md px-2 py-1">
                    {formatBadge(session.duration_seconds)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {recentSessions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-400">Total study time:</span>
          <span className="text-sm font-bold text-gray-800">
            {formatDuration(
              recentSessions.reduce((acc, s) => acc + s.duration_seconds, 0)
            )}
          </span>
        </div>
      )}
    </div>
  );
}