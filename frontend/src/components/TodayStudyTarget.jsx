import React from "react";
import { Target, TrendingUp, CheckCircle, Flame } from "lucide-react";
import { useStudySessions } from "../utils/api";

export default function TodayStudyTarget() {
  const { todaySummary, isLoading } = useStudySessions();

  // Daily goal in minutes (you can make this user-configurable later)
  const DAILY_GOAL_MINUTES = 120; // 2 hours

  // Get today's studied minutes
  const studiedToday = todaySummary?.today?.total_minutes || 0;

  // Calculate progress percentage
  const progress = Math.min((studiedToday / DAILY_GOAL_MINUTES) * 100, 100);

  // Determine motivational message and color
  const getMotivationData = () => {
    if (progress >= 100) {
      return {
        message: "Goal completed! 🎉",
        subMessage: "You're crushing it today!",
        color: "text-green-600",
        bgColor: "bg-green-600",
        icon: CheckCircle,
      };
    } else if (progress >= 50) {
      return {
        message: "Almost there! 🚀",
        subMessage: `${DAILY_GOAL_MINUTES - studiedToday} mins to goal`,
        color: "text-orange-600",
        bgColor: "bg-orange-600",
        icon: TrendingUp,
      };
    } else if (progress > 0) {
      return {
        message: "Keep going! 💪",
        subMessage: `${DAILY_GOAL_MINUTES - studiedToday} mins remaining`,
        color: "text-blue-600",
        bgColor: "bg-blue-600",
        icon: Target,
      };
    } else {
      return {
        message: "Start your day strong!",
        subMessage: `Goal: ${DAILY_GOAL_MINUTES} mins`,
        color: "text-gray-600",
        bgColor: "bg-gray-600",
        icon: Flame,
      };
    }
  };

  const motivationData = getMotivationData();
  const MotivationIcon = motivationData.icon;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex items-center justify-center min-h-[240px] h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between min-h-[240px] h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${motivationData.bgColor} bg-opacity-10`}>
            <MotivationIcon className={`w-5 h-5 ${motivationData.color}`} />
          </div>
          <h2 className="text-gray-800 font-bold text-lg">Today's Study Goal</h2>
        </div>
      </div>

      {/* Progress Display */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Time Display */}
        <div className="flex items-baseline justify-center gap-2 mb-6">
          <span className="text-5xl font-black text-gray-900">
            {studiedToday}
          </span>
          <span className="text-2xl font-bold text-gray-400">
            / {DAILY_GOAL_MINUTES}
          </span>
          <span className="text-lg font-semibold text-gray-500 ml-1">
            mins
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full ${motivationData.bgColor} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Percentage */}
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest text-center mb-4">
          {Math.round(progress)}% completed
        </p>
      </div>

      {/* Motivation Message */}
      <div className="text-center">
        <p className={`font-bold text-sm ${motivationData.color} mb-1`}>
          {motivationData.message}
        </p>
        <p className="text-xs text-gray-500">
          {motivationData.subMessage}
        </p>
      </div>

      {/* Trend Indicator (if available) */}
      {todaySummary?.trend && studiedToday > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="text-gray-500">vs yesterday</span>
            <span className={`font-bold ${
              todaySummary.trend === "up" ? "text-green-600" : "text-red-600"
            }`}>
              {todaySummary.trend === "up" ? "↗ Up" : "↘ Down"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}