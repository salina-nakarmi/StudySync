import React, { useEffect, useState } from "react";
import {
  Cog6ToothIcon,
  BellIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { LuAsterisk } from "react-icons/lu";
import fireIcon from "../assets/fire.png";
import CalendarComponent from "../components/CalendarComponent";
import TimeTracker from "../components/TimeTracker";

// Mantine Calendar



function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");

  const navItems = [
    "Dashboard",
    "Progress Tracking",
    "Resources",
    "Achievement",
  ];

  // --------- STREAK STATE ----------
  const [streak, setStreak] = useState({
    currentStreak: 0,
    longestStreak: 0,
    LastActiveDate: null,
  });

  const loadStreak = () => {
    const data = JSON.parse(localStorage.getItem("studyStreak"));
    return (
      data || {
        currentStreak: 0,
        longestStreak: 0,
        LastActiveDate: null,
      }
    );
  };

  const updateStreak = () => {
    const today = new Date().toDateString();
    let data = loadStreak();

    if (!data.LastActiveDate) {
      data = { currentStreak: 1, longestStreak: 1, LastActiveDate: today };
    } else {
      const last = new Date(data.LastActiveDate).toDateString();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (last === today) return data;

      if (last === yesterday.toDateString()) data.currentStreak += 1;
      else data.currentStreak = 1;

      if (data.currentStreak > data.longestStreak)
        data.longestStreak = data.currentStreak;

      data.LastActiveDate = today;
    }

    localStorage.setItem("studyStreak", JSON.stringify(data));
    return data;
  };

  useEffect(() => {
    const streakData = updateStreak();
    setStreak(streakData);
  }, []);

  // ---------- NAV BUTTON ----------
  const NavButton = ({ item }) => {
    const isActive = activeTab === item;
    return (
      <button
        onClick={() => setActiveTab(item)}
        className={`
          px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium
          ${
            isActive
              ? "bg-gray-800 text-white shadow-md hover:bg-gray-900"
              : "text-gray-700 hover:bg-gray-100"
          }
        `}
      >
        {item}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ---------------- NAVBAR ---------------- */}
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

            {/* Desktop Tabs */}
            <div className="hidden md:flex flex-1 justify-center mx-10">
              <div className="flex space-x-1 p-1 bg-gray-100 rounded-full border border-gray-200">
                {navItems.map((item) => (
                  <NavButton key={item} item={item} />
                ))}
              </div>
            </div>

            {/* Desktop Icons */}
            <div className="hidden md:flex items-center space-x-2">
              <button className="flex items-center space-x-2 px-4 py-2 rounded-full transition text-gray-700 hover:bg-gray-100 border border-gray-200">
                <Cog6ToothIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Settings</span>
              </button>

              <button className="p-2 rounded-full transition text-gray-700 hover:bg-gray-100 border border-gray-200">
                <BellIcon className="w-6 h-6" />
              </button>

              <button className="p-2 rounded-full transition bg-gray-200 hover:bg-gray-300">
                <UserIcon className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 transition rounded-full text-gray-800 hover:bg-gray-100"
              >
                {menuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
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
                    setActiveTab(item);
                    setMenuOpen(false);
                  }}
                  className={`px-3 py-2 rounded-lg text-left text-base font-medium transition ${
                    activeTab === item
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
              <button className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-3 py-2 text-gray-700 w-1/3 justify-center">
                <Cog6ToothIcon className="w-5 h-5" />
                <span className="text-sm">Settings</span>
              </button>
              <button className="hover:bg-gray-100 rounded-lg p-2 text-gray-700 w-1/3 flex justify-center">
                <BellIcon className="w-6 h-6" />
              </button>
              <button className="hover:bg-gray-100 rounded-lg p-2 text-gray-700 w-1/3 flex justify-center">
                <UserIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </nav>

     {/* -------- Welcome Text -------- */}
<div className="px-4 sm:px-6 lg:px-40 mt-28 flex flex-col lg:flex-row gap-6 items-start">
  {/* Welcome Text */}
  <div className="flex-1">
    <h1 className="text-2xl font-bold text-gray-900">
      Welcome Back, User
    </h1>
  </div>

  <div className="absolute left-6 sm:left-20 lg:left-40 top-[150px] w-[111px] h-[29px] bg-[#303030] rounded-[27px] flex items-center justify-center">
  <div className="absolute w-3.5 h-3.5 left-2.5 top-1.5">
    <img src={fireIcon} alt="fire icon" className="w-full h-full" />
  </div>

  <span className="absolute left-[29px] top-[7px] font-instrumentSans text-[12px] text-[#F6F6F6]">
    Streaks
  </span>

  <span className="absolute left-[79px] top-[7px] font-instrumentSans font-bold text-[12px] text-[#F6F6F6]">
    {streak.currentStreak}
  </span>
</div>


   <div className="flex gap-9 mt-4 lg:mt-0">
    {/* First Rectangle */}
   <div>
      <TimeTracker />
     
    </div>

    {/* Second Rectangle */}
    <div className="w-[290px] h-[120px] bg-white rounded-3xl border border-gray-200 border-opacity-70  p-4 flex flex-col justify-between">
      <h2 className="text-gray-800 font-bold text-sm">Todays Focus Goal</h2>
      <h3 className="text-gray-400 font-medium text-xs">12 completed</h3>
    </div>
  </div>

  </div>


{/* -------- Streak Box -------- */}

{/* -------- Calendar Below Streak -------- */}
< div className="mt-8 mx-auto sm:ml-20 lg:ml-40 w-fit flex flex-col lg:flex-row gap-23 flex flex-col">
<div >
  <CalendarComponent
    streakDays={[
      ...Array(streak.currentStreak).keys()
    ].map(i => i + 1)}
  />
</div>
<div className="w-[344px]  h-[240px] bg-white rounded-3xl border border-gray-200 border-opacity-70  p-5 flex flex-col justify-between ">
    <h2 className="text-gray-800 font-bold text-md ">Progress</h2>
    <h3 className="text-gray-400 font-medium text-sm  ">6.1h</h3>
    </div>

    <div className="w-[344px]  h-[240px] bg-white rounded-3xl border border-gray-200 border-opacity-70  p-5 flex flex-col justify-between ">
    <h2 className="text-gray-800 font-bold text-md ">Progress</h2>
    </div>

</div> 

< div className="mt-8 mx-auto sm:ml-20 lg:ml-40 w-fit flex flex-col lg:flex-row gap-23 flex flex-col">
<div className="w-[344px] h-[240px] bg-white rounded-3xl border border-gray-200 border-opacity-70  p-5 flex flex-col justify-between ">
    <h2 className="text-gray-800 font-bold text-md ">Progress</h2>
    <h3 className="text-gray-400 font-medium text-sm  ">6.1h</h3>
    </div>

    <div className="w-[785px] h-[240px] bg-white rounded-3xl border border-gray-200 border-opacity-70  p-5 flex flex-col justify-between ">
    <h2 className="text-gray-800 font-bold text-md ">Progress</h2>
    </div>



  
</div> 




    </div>
  );
}

export default Dashboard;
