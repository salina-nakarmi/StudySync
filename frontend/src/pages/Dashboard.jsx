import React, { useState, useEffect } from "react";
import { useUser, RedirectToSignIn } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDashboard, useStreaks, useStudySessions } from "../utils/api"; 
import fireIcon from "../assets/fire.png";
import Navbar from "../components/Navbar";
import NotificationPanel from "./NotificationPanel";
import CalendarComponent from "../components/CalendarComponent";
import UnifiedStudyTimer from "../components/UnifiedStudyTimer";
import RecentStudyActivity from "../components/RecentStudyActivity";
import TodayStudyTarget from "../components/TodayStudyTarget";
import Mytask from "../components/Mytask";

export default function Dashboard() {
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useDashboard();
    const refreshDashboard = () => refetchDashboard();

  const { streak, isLoading: streakLoading, error: streakError } = useStreaks();
  const { todaySummary, isLoading: sessionsLoading } = useStudySessions();

  const [activeTab, setActiveTab] = useState("Dashboard");
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/progress-tracking") setActiveTab("Progress Tracking");
    else if (location.pathname === "/dashboard") setActiveTab("Dashboard");
    else if (location.pathname === "/groups") setActiveTab("Groups"); 
  }, [location.pathname]);

   const handleNavClick = (item) => {
    setActiveTab(item);
    if (item === "Progress Tracking") navigate("/progress-tracking");
    if (item === "Dashboard") navigate("/dashboard");
    if (item === "Groups") navigate("/groups");
  };

  const loading = !isLoaded || dashboardLoading || streakLoading || sessionsLoading;
  const error = dashboardError || streakError;
  const errorMessage = error instanceof Error ? error.message : error ? String(error) : "Something went wrong.";

  if (!isSignedIn) return <RedirectToSignIn />;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 max-w-md text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-red-600 mb-6">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData || !streak) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Main Container - max-w-7xl prevents stretching on ultra-wide screens */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        
        {/* Header Section */}
        
        {/* ── Top Row: Welcome | Calendar | Study Goal ── */}
        <div className="grid grid-cols-12 gap-4 mb-4 items-stretch">

          {/* Welcome — col 1-4 */}
          <div className="col-span-12 lg:col-span-4 relative flex flex-col justify-center">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              Welcome back, {dashboardData.user.first_name || user.firstName}! 👋
            </h1>
            {todaySummary && (
              <p className="text-gray-400 mt-1 text-sm font-medium">
                Today:{" "}
                <span className="text-blue-500 font-bold">
                  {todaySummary.today.total_minutes} mins
                </span>{" "}
                studied{todaySummary.trend === "up" ? " 📈" : " 📉"}
              </p>
            )}

            {/* Streak Badge — sits below welcome text on left */}
            <div className="mt-4 flex items-center bg-zinc-900 px-4 py-2.5 rounded-xl shadow-sm w-fit gap-2.5">
              <img src={fireIcon} className="w-4 h-4" alt="fire" />
              <span className="text-[11px] text-white font-bold uppercase tracking-widest">
                Streaks
              </span>
              <span className="text-sm font-bold text-white bg-zinc-700 rounded-md px-2 py-0.5 min-w-[24px] text-center">
                {streak?.current_streak || 0}
              </span>
            </div>
          </div>

          {/* Focus Calendar — col 5-8 */}
          <div className="col-span-12 lg:col-span-4 h-full">
            <CalendarComponent />
          </div>

          {/* Today's Study Goal — col 9-12 */}
          <div className="col-span-12 lg:col-span-4 h-full">
            <TodayStudyTarget />
          </div>
        </div>


        {/* Dashboard Grid System */}
      {/* ── Bottom Row: Timer | Recent Activity | Tasks ── */}
        <div className="grid grid-cols-12 gap-4 items-stretch">

          {/* Study Hub / Timer — col 1-4 */}
          <div className="col-span-12 lg:col-span-4 h-full">
            <UnifiedStudyTimer onSessionComplete={refreshDashboard} embedded={true} />
          </div>

          {/* Recent Activity — col 5-8 */}
          <div className="col-span-12 lg:col-span-4 h-full">
            <RecentStudyActivity />
          </div>

          {/* My Tasks — col 9-12 */}
          <div className="col-span-12 lg:col-span-4 h-full">
            <Mytask />
          </div>

        </div>

      </main>

      {showNotifications && (
        <NotificationPanel onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
}