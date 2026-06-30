import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BellIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import NotificationPanel from "../pages/NotificationPanel"; // make sure this exists

const Navbar = () => {
  const location = useLocation();

  const getActiveTabFromPath = (pathname) => {
    if (pathname === "/progress-tracking") return "Progress Tracking";
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname === "/resources") return "Resources";
    if (pathname === "/groups") return "Groups";
    if (pathname === "/feed") return "Communities";
    if (pathname === "/projects") return "Projects";
    return "";
    
  };

  const [activeTab, setActiveTab] = useState(() => getActiveTabFromPath(location.pathname));
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = ["Dashboard", "Resources", "Progress Tracking", "Groups", "Communities", "Projects"];
  const navigate = useNavigate();
  const isMessagesActive = location.pathname === "/messages";

  // Set active tab based on URL
  useEffect(() => {
    setActiveTab(getActiveTabFromPath(location.pathname));
  }, [location.pathname]);

  const handleNavClick = (item) => {
    setActiveTab(item);
    if (item === "Progress Tracking") navigate("/progress-tracking");
    else if (item === "Dashboard") navigate("/dashboard");
    else if (item === "Resources") navigate("/resources");
    else if (item === "Groups") navigate("/groups");
    else if (item === "Communities") navigate("/feed");
    else if (item === "Projects") navigate("/projects");
  };

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

  return (
    <>
      {/* TOP NAVBAR */}
      <nav className="bg-white fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-xl">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">StudySync</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex flex-1 justify-center mx-10">
              <div className="flex space-x-1 p-1 bg-gray-100 rounded-full border border-gray-200">
                {navItems.map((item) => (
                  <NavButton key={item} item={item} />
                ))}
              </div>
            </div>

            {/* Icons */}
            <div className="flex items-center space-x-2 z-50 relative">
              {/* Bell Icon */}
              <button
                onClick={() => setShowNotifications(true)}
                className={`p-2 rounded-full transition-colors relative z-50 ${
                  showNotifications
                    ? "bg-gray-100 hover:bg-gray-200"
                    : "hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <BellIcon className="w-6 h-6 text-gray-700" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Message Icon */}
              <button
                type="button"
                onClick={() => navigate("/messages")}
                className={`p-2 rounded-full transition-colors relative z-50 ${
                  isMessagesActive
                    ? "bg-gray-100 hover:bg-gray-200"
                    : "hover:bg-gray-100 border border-gray-200"
                }`}
                aria-label="Messages"
                title="Messages"
              >
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-gray-700" />
              </button>

              {/* Profile */}
              <button
                onClick={() => navigate("/profile")}
                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                <UserIcon className="w-6 h-6 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* FLOATING MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-60 w-[90%] max-w-100">
        <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-full px-4 py-3 flex items-center justify-around shadow-2xl">
          {/* Home Icon */}
          <button
            onClick={() => handleNavClick("Dashboard")}
            className={`p-2 rounded-full transition-colors ${
              activeTab === "Dashboard" ? "bg-gray-100 text-black" : "text-gray-400"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </button>

          {navItems.filter(item => item !== "Dashboard").map((item) => (
            <button
              key={item}
              onClick={() => handleNavClick(item)}
              className={`text-[12px] font-medium transition-all px-2 ${
                activeTab === item ? "text-black scale-105" : "text-gray-400"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="fixed top-16 right-4 z-50">
          <NotificationPanel onClose={() => setShowNotifications(false)} />
        </div>
      )}
    </>
  );
};

export default Navbar;
