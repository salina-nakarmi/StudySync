// Dashboard page
import React, { useState } from "react";
import { SignedIn, SignedOut, RedirectToSignIn} from "@clerk/clerk-react";
import {
  Cog6ToothIcon,
  BellIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
 
  const [activeTab, setActiveTab] = useState("Dashboard"); 

  const navItems = [
    "Dashboard",
    "Progress Tracking",
    "Resources",
    "Achievement",
  ];

  
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

    <>
      <SignedIn>

    <div className="min-h-screen bg-white flex flex-col">
      
      <nav className="bg-white **fixed top-0 left-0 right-0** z-50 **shadow-lg**">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand Name */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-xl">
                  S
                </span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                StudySync
              </span>
            </div>

           
            <div className="hidden md:flex flex-1 justify-center mx-10">
              
              <div className="flex space-x-1 p-1 bg-gray-100 rounded-full border border-gray-200">
                {navItems.map((item) => (
                  <NavButton key={item} item={item} />
                ))}
              </div>
            </div>

           
            <div className="hidden md:flex items-center space-x-2">
              
              <button className="flex items-center space-x-2 px-4 py-2 rounded-full transition text-gray-700 hover:bg-gray-100 border border-gray-200">
                <Cog6ToothIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Settings</span>
              </button>

              {/* Notification Bell */}
              <button className="p-2 rounded-full transition text-gray-700 hover:bg-gray-100 border border-gray-200">
                <BellIcon className="w-6 h-6" />
              </button>

              {/* User Profile */}
              <button className="p-2 rounded-full transition bg-gray-200 hover:bg-gray-300">
                <UserIcon className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* Mobile Menu Button (Hamburger) */}
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

        {/* Mobile Menu Dropdown */}
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
                  className={`
                    px-3 py-2 rounded-lg text-left text-base font-medium transition
                    ${
                      activeTab === item
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-200"
                    }
                  `}
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
      
      <div className="h-16"></div> 
      
      
      <main className="flex-1 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
        
        <div className="text-2xl font-semibold text-gray-800">
          Content for: **{activeTab}**
        </div>
        <div className="mt-4 p-8 bg-white rounded-xl shadow-lg h-96">
            <p className="text-gray-600">Your StudySync dashboard content goes here.</p>
        </div>
      </main>
    </div>

  </SignedIn>
  <SignedOut>
      <RedirectToSignIn />
    </SignedOut>
  </>
  );
}

export default Dashboard;