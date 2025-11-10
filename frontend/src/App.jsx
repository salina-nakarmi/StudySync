// import { ClerkProviderWithRoutes } from '../auth/ClerkProviderWithRoutes.jsx'

// import { Routes, Route } from 'react-router-dom'
// import { AuthenticationPage } from './auth/AuthenticationPage.jsx'
// import { Layout } from './layout/layout.jsx'
// import  Dashboard  from './pages/Dashboard.jsx'
// import './App.css'

// function App() {
//   return <ClerkProviderWithRoutes>
//     <Routes>
//       <Route path="/sign-in/*" element={<AuthenticationPage/>} />
//       <Route path="/sign-up" element={<AuthenticationPage/>} />
//       <Route element={<Layout />}>
//                 <Route path="/" element={<Dashboard />}/>
//             </Route>
//       </Routes>
//   </ClerkProviderWithRoutes>
// }

// export default App

import React, { useState } from "react";
import barImg from "./assets/bar.png";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";



function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white  sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Logo + Name */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-xl">S</span>
              </div>
              <span className="text-lg sm:text-xl font-semibold text-gray-900">
                StudySync
              </span>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-3xl text-black focus:outline-none"
            >
              ☰
            </button>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-900 hover:text-gray-600 font-medium">
                Home
              </a>
              <a href="#features" className="text-gray-500 hover:text-gray-900">
                Features
              </a>
              <a href="#about" className="text-gray-500 hover:text-gray-900">
                About
              </a>

               <Link
                to="/login"
                className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
              >
                Login
              </Link>
             
              <button className="px-5 py-2 text-gray-900 hover:text-gray-600 font-medium">
                Sign up
              </button>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          {menuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <a
                href="#home"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Home
              </a>
              <a
                href="#features"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Features
              </a>
              <a
                href="#about"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                About
              </a>
           
                 <Link
                to="/login"
                className="block w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Login
              </Link>
             
              <button className="w-full text-left px-4 py-2 text-gray-900 hover:bg-gray-100 rounded">
                Sign up
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-50 rounded-3xl py-16 sm:py-20 lg:py-24 px-4 sm:px-8 relative overflow-hidden">
            <div className="text-center relative z-10">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-3">
                Master Your Studies.
              </h1>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-400 mb-6 sm:mb-8">
                Track Your Progress
              </h2>
              <p className="text-base sm:text-lg text-gray-700 mb-8 sm:mb-10 max-w-xl mx-auto">
                Efficiently manage your task and boost productivity.
              </p>
              <button className="px-8 py-3 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700 transition">
                Get Started
              </button>
            </div>

            {/* Floating icons - Top Left Calendar */}
            <div className="hidden lg:block absolute top-16 left-12 w-24 h-24 bg-white rounded-2xl shadow-xl p-4 transform -rotate-6">
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                <rect x="10" y="20" width="80" height="70" stroke="black" strokeWidth="3" fill="white"/>
                <line x1="10" y1="35" x2="90" y2="35" stroke="black" strokeWidth="3"/>
                <circle cx="30" cy="50" r="3" fill="black"/>
                <circle cx="50" cy="50" r="3" fill="black"/>
                <circle cx="70" cy="50" r="3" fill="black"/>
                <circle cx="30" cy="65" r="3" fill="black"/>
                <circle cx="50" cy="65" r="3" fill="black"/>
                <circle cx="70" cy="65" r="3" fill="black"/>
                <circle cx="30" cy="80" r="3" fill="black"/>
                <circle cx="50" cy="80" r="3" fill="black"/>
              </svg>
            </div>

            {/* Floating icons - Top Right Clock */}
            <div className="hidden lg:block absolute top-20 right-12 w-28 h-28 bg-white rounded-full shadow-xl p-5">
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="45" stroke="#3B82F6" strokeWidth="8" fill="white"/>
                <text x="50" y="25" textAnchor="middle" fontSize="12" fill="#3B82F6" fontWeight="bold">02:35</text>
                <text x="50" y="80" textAnchor="middle" fontSize="8" fill="#9CA3AF">Time Tracked</text>
                <circle cx="50" cy="50" r="3" fill="#3B82F6"/>
                <line x1="50" y1="50" x2="50" y2="30" stroke="#3B82F6" strokeWidth="2"/>
                <line x1="50" y1="50" x2="65" y2="50" stroke="#3B82F6" strokeWidth="2"/>
              </svg>
            </div>

            {/* Floating icons - Bottom Left Goal Card */}
            <div className="hidden lg:block absolute bottom-10 left-16 w-40 h-28 bg-white rounded-xl shadow-xl p-4" style={{ transform: 'rotate(330deg)' }}>
              <div className="text-xs font-semibold text-blue-600 mb-1">Today's Focus Goal</div>
              <div className="text-lg font-bold text-gray-900 mb-2"></div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: '60%'}}></div>
              </div>
              <div className="text-xs text-gray-500">60% completed</div>
            </div>

            {/* Floating icons - Bottom Right Bar Chart */}
            <div className="hidden lg:block absolute bottom-0 right-16 w-48 h-32 bg-white  shadow-xl p-4">
              <div className="flex items-end justify-around h-full space-x-2">
                <div className="flex flex-col items-center flex-1">
                 <img src={barImg} alt="Study illustration" className="w-60 h-auto rounded-2xl " />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Features
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to organize your studies, track progress, and
              achieve your academic goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div className="bg-white/40 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg p-8 sm:p-10 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:bg-white/60">
              <div className="flex flex-col items-center text-center">
                <div className="w-48 h-48 sm:w-56 sm:h-56 mb-6 relative flex items-center justify-center">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    <circle cx="100" cy="100" r="90" stroke="#E5E7EB" strokeWidth="12" fill="none"/>
                    <circle 
                      cx="100" 
                      cy="100" 
                      r="90" 
                      stroke="#3B82F6" 
                      strokeWidth="12" 
                      fill="none"
                      strokeDasharray="565.48"
                      strokeDashoffset="282.74"
                      transform="rotate(-90 100 100)"
                    />
                    <circle 
                      cx="100" 
                      cy="100" 
                      r="90" 
                      stroke="#F97316" 
                      strokeWidth="12" 
                      fill="none"
                      strokeDasharray="565.48"
                      strokeDashoffset="169.64"
                      transform="rotate(90 100 100)"
                    />
                    <text x="100" y="95" textAnchor="middle" fontSize="32" fontWeight="bold" fill="#1F2937">50%</text>
                    <text x="100" y="115" textAnchor="middle" fontSize="14" fill="#6B7280">of weekly</text>
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  Time Tracking
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Monitor study sessions and understand how you spend your time across different subjects.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/40 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg p-8 sm:p-10 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:bg-white/60">
              <div className="flex flex-col items-center text-center">
                <div className="w-48 h-48 sm:w-56 sm:h-56 mb-6 relative flex items-end justify-center px-4">
                  <div className="flex items-end justify-around w-full h-full">
                    <div className="flex flex-col items-center" style={{width: '12%'}}>
                      <div className="w-full bg-gray-900 rounded-t-sm" style={{height: '40px'}}></div>
                      <span className="text-xs mt-2 text-gray-600">S</span>
                    </div>
                    <div className="flex flex-col items-center" style={{width: '12%'}}>
                      <div className="w-full bg-gray-900 rounded-t-sm" style={{height: '80px'}}></div>
                      <span className="text-xs mt-2 text-gray-600">M</span>
                    </div>
                    <div className="flex flex-col items-center" style={{width: '12%'}}>
                      <div className="w-full bg-gray-900 rounded-t-sm" style={{height: '110px'}}></div>
                      <span className="text-xs mt-2 text-gray-600">T</span>
                    </div>
                    <div className="flex flex-col items-center" style={{width: '12%'}}>
                      <div className="w-full bg-gray-900 rounded-t-sm" style={{height: '60px'}}></div>
                      <span className="text-xs mt-2 text-gray-600">W</span>
                    </div>
                    <div className="flex flex-col items-center" style={{width: '12%'}}>
                      <div className="w-full bg-gray-900 rounded-t-sm" style={{height: '90px'}}></div>
                      <span className="text-xs mt-2 text-gray-600">T</span>
                    </div>
                    <div className="flex flex-col items-center" style={{width: '12%'}}>
                      <div className="w-full bg-orange-500 rounded-t-sm" style={{height: '130px'}}></div>
                      <span className="text-xs mt-2 text-gray-600">F</span>
                    </div>
                    <div className="flex flex-col items-center" style={{width: '12%'}}>
                      <div className="w-full bg-gray-900 rounded-t-sm" style={{height: '45px'}}></div>
                      <span className="text-xs mt-2 text-gray-600">S</span>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  Performance Ranking
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Monitor study sessions and understand how you spend your time across different subjects.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/40 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg p-8 sm:p-10 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:bg-white/60">
              <div className="flex flex-col items-center text-center">
                <div className="w-48 h-48 sm:w-56 sm:h-56 mb-6 relative flex items-end justify-center px-4">
                  <div className="flex items-end justify-around w-full h-full">
                    <div className="flex flex-col items-center" style={{width: '12%'}}>
                      <div className="w-full bg-gray-900 rounded-t-sm" style={{height: '70px'}}></div>
                      <span className="text-xs mt-2 text-gray-600">S</span>
                    </div>
                    <div className="flex flex-col items-center" style={{width: '12%'}}>
                      <div className="w-full bg-gray-900 rounded-t-sm" style={{height: '50px'}}></div>
                      <span className="text-xs mt-2 text-gray-600">M</span>
                    </div>
                    <div className="flex flex-col items-center" style={{width: '12%'}}>
                      <div className="w-full bg-gray-900 rounded-t-sm" style={{height: '90px'}}></div>
                      <span className="text-xs mt-2 text-gray-600">T</span>
                    </div>
                    <div className="flex flex-col items-center" style={{width: '12%'}}>
                      <div className="w-full bg-gray-900 rounded-t-sm" style={{height: '110px'}}></div>
                      <span className="text-xs mt-2 text-gray-600">W</span>
                    </div>
                    <div className="flex flex-col items-center" style={{width: '12%'}}>
                      <div className="w-full bg-gray-900 rounded-t-sm" style={{height: '65px'}}></div>
                      <span className="text-xs mt-2 text-gray-600">T</span>
                    </div>
                    <div className="flex flex-col items-center" style={{width: '12%'}}>
                      <div className="w-full bg-gray-900 rounded-t-sm" style={{height: '85px'}}></div>
                      <span className="text-xs mt-2 text-gray-600">F</span>
                    </div>
                    <div className="flex flex-col items-center" style={{width: '12%'}}>
                      <div className="w-full bg-orange-500 rounded-t-sm" style={{height: '120px'}}></div>
                      <span className="text-xs mt-2 text-gray-600">S</span>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  Progress Reports
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Get detailed insights into your study patterns and identify areas for improvement.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white/40 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg p-8 sm:p-10 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:bg-white/60">
              <div className="flex flex-col items-center text-center">
                <div className="w-48 h-48 sm:w-56 sm:h-56 mb-6 relative flex items-center justify-center">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    {/* Target/Goal Icon */}
                    <circle cx="100" cy="100" r="85" stroke="#E5E7EB" strokeWidth="3" fill="none"/>
                    <circle cx="100" cy="100" r="65" stroke="#D1D5DB" strokeWidth="3" fill="none"/>
                    <circle cx="100" cy="100" r="45" stroke="#9CA3AF" strokeWidth="3" fill="none"/>
                    <circle cx="100" cy="100" r="25" fill="#3B82F6"/>
                    <text x="100" y="160" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#1F2937">GOAL</text>
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  Goal Setting
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Set and achieve your academic goals with personalized study plans and reminders.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free Trial Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Ready to Transform Your Study Habits?
          </h2>
          <p className="text-base sm:text-lg text-gray-300 mb-8 sm:mb-10">
            Join thousands of students already using StudySync to achieve their academic goals.
          </p>
          <button className="px-8 py-3 bg-white text-gray-900 text-base font-medium rounded-lg hover:bg-gray-100 transition">
            Start Your Free Trial
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="bg-white border-t border-gray-200 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-gray-900 font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#features" className="text-gray-500 hover:text-gray-900 transition text-sm">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-500 hover:text-gray-900 transition text-sm">
                    Security
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-gray-900 font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#about" className="text-gray-500 hover:text-gray-900 transition text-sm">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-500 hover:text-gray-900 transition text-sm">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-gray-900 font-semibold mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-500 hover:text-gray-900 transition text-sm">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-500 hover:text-gray-900 transition text-sm">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />   {/* Home Page */}
        <Route path="/login" element={<LoginPage />} /> {/* Login Page */}
      </Routes>
    </BrowserRouter>
  );
}


export default App;
