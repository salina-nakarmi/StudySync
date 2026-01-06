// Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useApi } from "../utils/api";
import { useUser, RedirectToSignIn } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  Cog6ToothIcon,
  BellIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import fireIcon from "../assets/fire.png";
import CalendarComponent from "../components/CalendarComponent";
import PomodoroTimer from "../components/PomodoroTimer";
import ProgressCard from "../components/Progresscard";
import SharedLinkItem from "../components/SharedLinkItem";
import Mytask from "../components/Mytask";
import ContributionGraph from "../components/ContributionGraph";

export default function Dashboard() {
  // ----------------- STATE -----------------
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [dashboardData, setDashboardData] = useState(null);
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contributions, setContributions] = useState([]);

  const { user, isLoaded, isSignedIn } = useUser();
  const { makeRequest } = useApi();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = ["Dashboard", "Resources", "Progress Tracking"];

  const screenTimeData = [
    { day: "S", hours: 2 },
    { day: "M", hours: 4 },
    { day: "T", hours: 5.5 },
    { day: "W", hours: 3 },
    { day: "T", hours: 4.5 },
    { day: "F", hours: 6 },
    { day: "S", hours: 1.5 },
  ];

  // ----------------- EFFECTS -----------------
  // Set active tab based on URL
  useEffect(() => {
    if (location.pathname === "/progress-tracking") setActiveTab("Progress Tracking");
    else if (location.pathname === "/dashboard") setActiveTab("Dashboard");
  }, [location.pathname]);

  // Fetch dashboard & streak data
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (!isLoaded || !isSignedIn) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [dashboard, streak] = await Promise.all([
          makeRequest("dashboard"),
          makeRequest("streaks/me"),
        ]);

        if (isMounted) {
          setDashboardData(dashboard);
          setStreakData(streak);
          setContributions(dashboard.contributions || []);
          console.log("✅ Data loaded:", { dashboard, streak });
        }
      } catch (err) {
        console.error("❌ Data fetch error:", err);
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
    return () => (isMounted = false);
  }, [isLoaded, isSignedIn]);

  // ----------------- HANDLERS -----------------
  const handleNewActivity = (dayIndex) => {
    setContributions((prev) => {
      const updated = [...prev];
      updated[dayIndex] = Math.min((updated[dayIndex] || 0) + 1, 4);
      return updated;
    });
  };

  const handleNavClick = (item) => {
    setActiveTab(item);
    if (item === "Progress Tracking") navigate("/progress-tracking");
    if (item === "Dashboard") navigate("/dashboard");
  };

  // ----------------- NAV BUTTON COMPONENT -----------------
  const NavButton = ({ item }) => {
    const isActive = activeTab === item;
    return (
      <button
        onClick={() => handleNavClick(item)}
        className={`px-4 py-2 rounded-full transition-all text-sm font-medium ${
          isActive
            ? "bg-gray-800 text-white shadow-md hover:bg-gray-900"
            : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        {item}
      </button>
    );
  };

  // ----------------- LOADING / ERROR STATES -----------------
  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) return <RedirectToSignIn />;

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

  if (!dashboardData || !streakData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  // ----------------- MAIN RENDER -----------------
  return (
    <div className="min-h-screen bg-white">
      {/* NAVBAR */}
      <nav className="bg-white fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-xl">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">StudySync</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex flex-1 justify-center mx-10">
              <div className="flex space-x-1 p-1 bg-gray-100 rounded-full border border-gray-200">
                {navItems.map((item) => (
                  <NavButton key={item} item={item} />
                ))}
              </div>
            </div>

            {/* Desktop Icons */}
            <div className="hidden md:flex items-center space-x-2">
              <button className="flex items-center space-x-2 px-4 py-2 rounded-full text-gray-700 hover:bg-gray-100 border border-gray-200">
                <Cog6ToothIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Settings</span>
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 border border-gray-200">
                <BellIcon className="w-6 h-6 text-gray-700" />
              </button>
              <button
                           onClick={() => navigate("/profile")}
                           className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
                         >
                           <UserIcon className="w-6 h-6 text-gray-700" />
                         </button>
                       
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-full text-gray-800 hover:bg-gray-100"
              >
                {menuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div className="md:hidden px-4 pb-4 space-y-2 border-t border-gray-100 bg-white">
            <div className="flex flex-col space-y-1 p-2 bg-gray-50 rounded-lg">
              {navItems.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    handleNavClick(item);
                    setMenuOpen(false);
                  }}
                  className={`px-3 py-2 rounded-lg text-left text-base font-medium ${
                    activeTab === item ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
              <button className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-3 py-2 text-gray-700 w-1/3 justify-center">
                <Cog6ToothIcon className="w-5 h-5" />
              </button>
              <button className="hover:bg-gray-100 rounded-lg p-2 text-gray-700 w-1/3 flex justify-center">
                <BellIcon className="w-6 h-6" />
              </button>
              <button
               onClick={() => navigate("/profile")}
               className="hover:bg-gray-100 rounded-lg p-2 text-gray-700 w-1/3 flex justify-center">
                <UserIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* MAIN CONTENT */}
      <div className="px-4 sm:px-6 lg:px-40 mt-28 flex flex-col lg:flex-row gap-6 items-start">
        {/* Greeting */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {dashboardData.user.first_name || user.firstName}! 👋
          </h1>
        </div>

        {/* Streak Badge */}
        <div className="absolute left-6 sm:left-20 lg:left-40 top-[150px] w-[111px] h-[29px] bg-[#303030] rounded-[27px] flex items-center justify-center">
          <img src={fireIcon} className="absolute left-2 w-3.5 h-3.5" alt="fire" />
          <span className="absolute left-[29px] text-[12px] text-[#F6F6F6]">Streaks</span>
          <span className="absolute left-[79px] text-[12px] font-bold text-[#F6F6F6]">
            {streakData.current_streak}
          </span>
        </div>

        {/* Timer & Focus Goal */}
        <div className="flex flex-col lg:flex-row gap-2 mt-4 lg:mt-0 -mr-7">
          <PomodoroTimer />
          <div className="w-[300px] bg-white rounded-2xl border border-gray-200 p-4 flex flex-col items-center justify-center">
            <h2 className="text-gray-800 font-bold text-lg">Today's Focus Goal</h2>
            <h3 className="text-[#2C76BA] text-sm text-center">Finish 3 lab simulation task</h3>
            <div className="w-[200px] flex flex-col items-center mt-2">
              <div className="w-full h-3 bg-gray-200 rounded-2xl">
                <div className="h-3 bg-[#2C76BA] rounded-2xl" style={{ width: "50%" }}></div>
              </div>
              <p className="text-gray-600 text-xs mt-1 text-center">50% completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar, ProgressCard, Shared Links, Tasks */}
      <div className="mt-2 mx-auto sm:ml-20 lg:ml-40 w-fit flex flex-col lg:flex-row gap-2">
        <CalendarComponent
          streakDays={[...Array(streakData?.current_streak || 0).keys()].map((i) => i + 1)}
        />

        <div className="w-[300px] h-[240px] bg-white rounded-2xl border border-gray-200 p-5">
          <ProgressCard screenTime={screenTimeData} title="Progress" />
        </div>

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

        <div className="p-6">
          <Mytask />
        </div>
      </div>

      {/* Activity Contribution Graph */}
      <div className="-mt-66 mx-auto sm:ml-20 lg:ml-40 w-fit flex flex-col lg:flex-row gap-2">
        <div className="w-[608px] h-[240px] p-3 bg-white rounded-2xl border border-gray-200 flex flex-col mx-auto">
          <h2 className="text-lg font-semibold mb-2">Activity Contributions</h2>
          <ContributionGraph contributions={contributions} />
        </div>
      </div>
    </div>
  );
}
