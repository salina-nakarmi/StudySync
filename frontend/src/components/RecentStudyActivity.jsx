import React from "react";
import { Clock, BookOpen, Zap } from "lucide-react";
import { useDashboard } from "../utils/api";

export default function RecentStudyActivity() {
  const { data: dashboardData, isLoading } = useDashboard();

  // Get recent sessions from dashboard data
  const recentSessions = dashboardData?.recent_sessions || [];

  // Format time ago (e.g., "2h ago", "1d ago")
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

  // Get icon based on duration
  const getSessionIcon = (duration) => {
    if (duration >= 3600) return Zap; // 60+ mins = Deep work
    if (duration >= 1500) return BookOpen; // 25+ mins = Focus
    return Clock; // Short session
  };

  // Format duration (e.g., "45 mins", "1h 20m")
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMins}m`;
    }
    return `${mins} mins`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm h-full min-h-[320px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm h-full min-h-[320px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-800 font-bold text-lg">Recent Activity</h2>
        <span className="text-xs text-gray-500 font-semibold">
          Last 5 sessions
        </span>
      </div>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {recentSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm font-medium">No study sessions yet</p>
            <p className="text-gray-400 text-xs mt-1">Start a timer to see your activity here</p>
          </div>
        ) : (
          recentSessions.slice(0, 5).map((session, index) => {
            const SessionIcon = getSessionIcon(session.duration_seconds);
            
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <SessionIcon className="w-4 h-4 text-blue-600" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {session.session_notes || "Study Session"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-blue-600">
                      {formatDuration(session.duration_seconds)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(session.created_at)}
                    </span>
                  </div>
                </div>

                {/* Duration badge */}
                <div className="flex-shrink-0">
                  <div className="px-2 py-1 bg-white rounded-md border border-gray-200">
                    <p className="text-[10px] font-bold text-gray-600">
                      {Math.floor(session.duration_seconds / 60)}m
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Stats */}
      {recentSessions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Total time:</span>
            <span className="font-bold text-gray-800">
              {formatDuration(
                recentSessions.reduce((acc, s) => acc + s.duration_seconds, 0)
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}