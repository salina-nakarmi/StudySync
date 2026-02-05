// Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useUser, RedirectToSignIn } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";

import { useDashboard, useStreaks, useStudySessions } from "../utils/api"; 

import {
  Cog6ToothIcon,
  BellIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import fireIcon from "../assets/fire.png";
import Navbar from "../components/Navbar";
import NotificationPanel from "./NotificationPanel";
import CalendarComponent from "../components/CalendarComponent";
import UnifiedStudyTimer from "../components/UnifiedStudyTimer";
import ProgressCard from "../components/Progresscard";
import SharedLinkItem from "../components/SharedLinkItem";
import Mytask from "../components/Mytask";
// import ContributionGraph from "../components/ContributionGraph";
// import { DiVim } from "react-icons/di";

export default function Dashboard() {
  //react query hooks
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useDashboard();
  const { streak, isLoading: streakLoading, error: streakError } = useStreaks();
  const { todaySummary, isLoading: sessionsLoading } = useStudySessions();

  // ----------------- STATE -----------------
  // const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [showNotifications, setShowNotifications] = useState(false);


  const { user, isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();
  const location = useLocation();


  const screenTimeData = [
    { day: "S", hours: 2 },
    { day: "M", hours: 4 },
    { day: "T", hours: 5.5 },
    { day: "W", hours: 3 },
    { day: "T", hours: 4.5 },
    { day: "F", hours: 6 },
    { day: "S", hours: 1.5 },
  ];

  const refreshDashboard = () => {
    refetchDashboard();
  };

  // ----------------- EFFECTS -----------------
  // Set active tab based on URL
  useEffect(() => {
    if (location.pathname === "/progress-tracking") setActiveTab("Progress Tracking");
    else if (location.pathname === "/dashboard") setActiveTab("Dashboard");
     else if (location.pathname === "/groups")
    setActiveTab("Groups"); 
  }, [location.pathname]);


  // ----------------- HANDLERS -----------------

  const handleNavClick = (item) => {
    setActiveTab(item);
    if (item === "Progress Tracking") navigate("/progress-tracking");
    if (item === "Dashboard") navigate("/dashboard");
    if (item === "Groups") navigate("/groups");
  };

  //Use React Query loading states
  const loading = !isLoaded || dashboardLoading || streakLoading || sessionsLoading;
  const error = dashboardError || streakError;

  if (!isSignedIn) return <RedirectToSignIn />;

  // Loading state
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
          <p className="text-red-600 mb-6">{error}</p>
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


  // ----------------- MAIN RENDER -----------------
  return (
     <>
      <Navbar />
    
    <div className="min-h-screen bg-white">
      <div className="px-4 sm:px-6 lg:px-40 mt-28 flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {dashboardData.user.first_name || user.firstName}! 👋
          </h1>

            {/* Use React Query data */}
            {todaySummary && (
              <p className="text-gray-600 mt-2">
                Today: {todaySummary.today.total_minutes} minutes studied
                {todaySummary.trend === "up" && " 📈"}
                {todaySummary.trend === "down" && " 📉"}
              </p>
            )}
          </div>

          {/* Use streak from React Query */}
         <div className="absolute -left-197 top-16 mt-3 w-[111px] h-[29px] bg-[#303030] rounded-[27px] flex items-center justify-center relative">
  <img src={fireIcon} className="absolute left-2 w-3.5 h-3.5" alt="fire" />
  <span className="absolute left-[29px] text-[12px] text-[#F6F6F6]">Streaks</span>
  <span className="absolute left-[79px] text-[12px] font-bold text-[#F6F6F6]">
    {streak?.current_streak || 0}
  </span>
</div>

        {/* Timer & Focus Goal */}
     <div className="flex flex-col lg:flex-row gap-2 mt-4 lg:mt-0 w-full lg:w-auto items-center lg:items-start justify-center lg:justify-start -mr-7.5">
     <UnifiedStudyTimer onSessionComplete={refreshDashboard} />
 <div className="w-11/13 sm:w-[300px] bg-white rounded-2xl border border-gray-200 p-4 flex flex-col items-center justify-center h-40 mx-auto">
  <h2 className="text-gray-800 font-bold text-lg">Today's Focus Goal</h2>
  <h3 className="text-[#2C76BA] text-sm text-center">Finish 3 lab simulation task</h3>

  <div className="flex flex-col items-center mt-2 w-full">
  
    <div className="w-3/4 sm:w-full h-3 bg-gray-200 rounded-2xl">
   
      <div className="h-3 bg-[#2C76BA] rounded-2xl w-1/4 sm:w-1/2"></div>
    </div>
    <p className="text-gray-600 text-xs mt-1 text-center">50% completed</p>
  </div>
</div>

</div>

        </div>  
      
        {/* Calendar, ProgressCard, etc. */}
        <div className="mt-2 mx-auto sm:ml-20 lg:ml-40 w-fit flex flex-col lg:flex-row gap-2">
          <CalendarComponent/>


        <div className="w-[300px] h-[487px] p-3 bg-white rounded-2xl border border-gray-200 flex flex-col gap-2 mx-auto">
          <h2 className="text-gray-800 font-bold text-lg mb-1">Shared Links</h2>
          <div className="flex flex-col gap-2 overflow-y-auto pr-1" style={{ maxHeight: "1180px" }}>
            {/** Example SharedLinkItems */}
            <SharedLinkItem
              title="React Hooks Complete Guide"
              desc="Comprehensive tutorial on React Hooks"
              author="John Doe"
              time="2 hours ago"
              onRead={() => handleNewActivity(new Date().getDay())}
            />
            <SharedLinkItem
              title="Project Report PDF"
              desc="Semester project report in PDF format"
              author="Sarah Smith"
              time="1 day ago"
              type="pdf"
              onRead={() => handleNewActivity(new Date().getDay())}
            />
            <SharedLinkItem
              title="Tailwind Typography Basics"
              desc="Learn how to style text with Tailwind"
              author="Sarah Smith"
              time="12 mins ago"
              onRead={() => handleNewActivity(new Date().getDay())}
            />
          </div>
        </div>

  <div className="w-11/12 sm:w-auto p-6 mx-auto">
  <Mytask />
</div>

      
      </div>

{/* Activity Contribution Graph
<div className="-mt-4 sm:-mt-66 mx-auto sm:ml-20 lg:ml-40 w-11/14 sm:w-auto flex flex-col lg:flex-row gap-2">
  <div className="w-full sm:w-[608px] h-[240px] p-3 bg-white rounded-2xl border border-gray-200 flex flex-col">
    <h2 className="text-lg font-semibold mb-2">Activity Contributions</h2>
    <ContributionGraph/>
  </div>
</div> */}

{showNotifications && (
  <NotificationPanel onClose={() => setShowNotifications(false)} />
)}


    </div>
    
    </>
  );
}