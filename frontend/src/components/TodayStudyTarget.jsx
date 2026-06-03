import React, { useState } from "react";
import {
  Target,
  TrendingUp,
  CheckCircle,
  Flame,
  Edit3,
  Check,
} from "lucide-react";
import { useStudySessions } from "../utils/api";

export default function TodayStudyTarget() {
  const { todaySummary, isLoading } = useStudySessions();

  // ✅ Default goal = 120 mins (2 hours)
  const [goal, setGoal] = useState(120);
  const [isEditing, setIsEditing] = useState(false);
  const [tempGoal, setTempGoal] = useState(goal);

  const studiedToday = todaySummary?.today?.total_minutes || 0;

  const progress = Math.min((studiedToday / goal) * 100, 100);

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
        message: "Almost there!",
        subMessage: `${goal - studiedToday} mins left`,
        color: "text-orange-600",
        bgColor: "bg-orange-600",
        icon: TrendingUp,
      };
    } else if (progress > 0) {
      return {
        message: "Keep going!",
        subMessage: `${goal - studiedToday} mins remaining`,
        color: "text-blue-600",
        bgColor: "bg-blue-600",
        icon: Target,
      };
    } else {
      return {
        message: "Start your day strong!",
        subMessage: `Target: ${(goal / 60).toFixed(1)} hours total`,
        color: "text-gray-600",
        bgColor: "bg-gray-600",
        icon: Flame,
      };
    }
  };

  const motivationData = getMotivationData();
  const MotivationIcon = motivationData.icon;

  const saveGoal = () => {
    const value = Number(tempGoal);
    if (!isNaN(value) && value > 0) {
      setGoal(value);
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex items-center justify-center min-h-[240px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800" />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col min-h-[240px]">

      {/* Header (matches screenshot style) */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-gray-900 font-bold text-lg">
            Today's Study Goal
          </h2>
          <p className="text-xs text-gray-400 font-semibold tracking-wide">
            FOCUS MODE
          </p>
        </div>

        {/* Goal edit */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                value={tempGoal}
                onChange={(e) => setTempGoal(e.target.value)}
                className="w-16 px-2 py-1 text-sm border rounded-md outline-none"
              />
              <button onClick={saveGoal}>
                <Check className="w-4 h-4 text-green-600" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setTempGoal(goal);
                setIsEditing(true);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main display (big number like screenshot) */}
      <div className="flex flex-col items-center justify-center flex-1">

        <div className="flex items-end gap-2">
          <span className="text-6xl font-black text-gray-900">
            {studiedToday}
          </span>

          <span className="text-xl font-semibold text-gray-400 mb-2">
            / {goal} mins
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 h-2 rounded-full mt-5 overflow-hidden">
          <div
            className={`h-full ${motivationData.bgColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Small caption like screenshot */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          {motivationData.message} • {motivationData.subMessage}
        </p>
      </div>
    </div>
  );
}