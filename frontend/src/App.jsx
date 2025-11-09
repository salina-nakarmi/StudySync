// import { ClerkProviderWithRoutes } from './auth/ClerkProviderWithRoutes.jsx'
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
import calendarImg from "./assets/calendar.png";
import clockImg from "./assets/clock.png";
import barImg from "./assets/bar.png";
import goalImg from "./assets/goal.png";
import timetrackImg from "./assets/timetracker.png";
import performanceImg from "./assets/performance.png";
import graph from "./assets/graph.png";  

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* //navbar */}
      <nav className="bg-white fixed top-0 left-0 w-full z-10 ">
        <div className="flex items-center justify-between py-4 px-6 md:px-25">
          {/* Left: Logo + Name */}
          <div className="flex items-center">
            <div className="w-8 h-10  bg-black flex items-center justify-center rounded-lg shadow-2xl backdrop-blur-2xl">
              <span className="text-white font-bold">S</span>
            </div>
            <div className="text-xl md:text-2xl font-bold text-black ml-1">
              StudySync
            </div>
          </div>


         {/* //for mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-3xl text-black focus:outline-none"
            >
              ☰
            </button>
          </div>


         {/* //for desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-90">
            <ul className="flex space-x-6 text-gray-700 font-medium">

              <li className="cursor-pointer">
                <a href="#home" className="text-gray-700 hover:text-black hover:font-bold cursor-poi">
                Home
                </a>
              </li>

              <li className="cursor-pointer">
             <a href="#features" className="text-gray-700 hover:text-black hover:font-bold cursor-poi">
              Features
             </a>
              </li>


              <li className="cursor-pointer">
                <a href="#about" className="text-gray-700 hover:text-black hover:font-bold cursor-poi">       
                About
                </a>
              </li>
            </ul>

            <ul className="flex space-x-4 items-center text-gray-700 font-medium ml-6">
              <li className="bg-black text-white px-4 py-1 rounded-full hover:opacity-80 cursor-pointer">
                Login
              </li>
              <li className="hover:text-black hover:font-bold cursor-pointer">
                Signup
              </li>
            </ul>
          </div>
        </div>


       {/* //mobile menu dropdown */}
        {menuOpen && (
          <div className="md:hidden bg-white shadow-md px-6 pb-4">
            <ul className="flex flex-col space-y-3 text-gray-700 font-medium">
              <li className="hover:text-black hover:font-bold cursor-pointer">
                <li className="hover:text-black hover:font-bold cursor-pointer text-center">
                  <a href="#home">Home</a>
                  </li>
                Home
              </li>

              <li className="hover:text-black hover:font-bold cursor-pointer">
                <li className="hover:text-black hover:font-bold cursor-pointer text-center">
                  <a href="#features">Features</a>
                  </li>
                Features
              </li>

              <li className="hover:text-black hover:font-bold cursor-pointer">
                <li className="hover:text-black hover:font-bold cursor-pointer text-center">
                  <a href="#about">About</a>
                  </li>
                About
              </li>


              <li className="bg-black text-white px-4 py-1 rounded-full hover:opacity-80 cursor-pointer text-center">
                Login
              </li>
              <li className="hover:text-black hover:font-bold cursor-pointer text-center">
                Signup
              </li>
            </ul>
          </div>
        )}
      </nav>


{/* //gray rectangle for home section */}
<div className="pt-1 flex justify-center items-center min-h-screen px-25 py-5" id="home">
  
 <div className="bg-gray-50 rounded-2xl px-8 md:px-90 py-16 md:py-25 w-full max-w-9xl text-center shadow-sm">
    <div className="relative">
      {/* Floating icons (optional — match your image look) */}
    <div className="hidden md:block absolute top-[-90px] left-[-300px] w-80"> 
      <img src={calendarImg} alt="Study illustration" className="w-64 h-auto rounded-2xl " />
       </div>
       
        <div className="hidden md:block absolute top-[-40px] left-[580px] w-52">
           <img src={clockImg} alt="Study illustration" className="w-34 h-auto rounded-2xl " /> 
           </div> 
           
           <div className="hidden md:block absolute bottom-[-415px] left-[550px] w-72"> 
            <img src={barImg} alt="Study illustration" className="w-60 h-auto rounded-2xl " />
    </div>

     <div className="hidden md:block absolute bottom-[-400px] left-[-280px] w-72"> 
            <img src={goalImg} alt="Study illustration" className="w-60 h-auto rounded-2xl " />
    </div>

    </div>

    <h2 className="text-3xl md:text-6xl font-extrabold text-black mt-6">
      Master Your Studies.
    </h2>
    <h3 className="text-xl md:text-4xl font-semibold text-gray-500 mt-2">
      Track Your Progress.
    </h3>
    <p className="text-gray-700 mt-4 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
      Efficiently manage your tasks and boost productivity.
    </p>
    <div className="flex justify-center mt-8">
      <button className="bg-[#2C76BA] text-white px-8 py-3 rounded-full hover:opacity-90 text-sm md:text-base font-medium">
        Get Started
      </button>
    </div>
  </div>
</div>
      <div>

{/* //features section */}
<div className="flex justify-center items-center mt-0 px-40" id="features">
  <div className="w-full max-w-9xl text-left py-16">
    <h2 className="text-2xl md:text-4xl font-bold text-black text-center">
      Our Features
    </h2>
    <p className="text-gray-600 mt-3 text-sm md:text-base max-w-2xl mx-auto leading-relaxed text-center">
      Everything you need to organize your studies, track progress, and
      <br className="hidden md:block" />
      achieve your academic goals.
    </p>


    
<div className="mt-12 grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-x-60 gap-y-12 max-w-16xl mx-0 md:mx-auto">

{/* //1st */}
  <div className="bg-gray-300/200 border border-gray-100 rounded-2xl p-8 w-140 -ml-12 shadow-md backdrop-blur-md
                transform transition duration-300 ease-in-out 
                hover:scale-105 hover:shadow-xl hover:brightness-120 hover:backdrop-blur-xl">
        
        <div className="bg-gray-80 rounded-xl flex justify-center items-center p-6 mb-6 shadow-sm">
          <img src={timetrackImg} alt="Time Tracking" className="w-40 h-auto" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-black mb-2">
          Time Tracking
        </h3>
        <p className="text-gray-600 text-sm md:text-base leading-relaxed">
          Monitor study sessions and understand how you spend your time across
          different subjects.
        </p>
      </div>

 {/* //2nd     */}
       <div className="backdrop-blur-md bg-gray-300/200 border border-gray-100 rounded-2xl p-8 shadow-md md-w-140 -ml-8
                transform transition duration-300 ease-in-out 
                hover:scale-105 hover:shadow-xl hover:brightness-120 hover:backdrop-blur-xl">
     
     
        <div className="bg-gray-80 rounded-xl flex justify-center items-center p-6 mb-6 shadow-sm">
          <img src={performanceImg} alt="Performance tracking" className="w-75 h-auto" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-black mb-2">
          Performance Ranking
        </h3>
        <p className="text-gray-600 text-sm md:text-base leading-relaxed">
          Track your progress and analyze your performance across weekly goals
          and study targets.
        </p>
      </div>
      
{/* //3rd */}
  <div className="backdrop-blur-md bg-gray-300/200 border border-gray-100 rounded-2xl p-8 shadow-md md-w-140 -ml-12 transform transition duration-300 ease-in-out 
                hover:scale-105 hover:shadow-xl hover:brightness-120 hover:backdrop-blur-xl">
        
        <div className="bg-gray-80 rounded-xl flex justify-center items-center p-6 mb-6 shadow-md">
          <img src={graph} alt="Performance tracking" className="w-75 h-auto" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-black mb-2">
          Performance Ranking
        </h3>
        <p className="text-gray-600 text-sm md:text-base leading-relaxed">
          Track your progress and analyze your performance across weekly goals
          and study targets.
        </p>
      </div>    

{/* //4th */}
      <div className="backdrop-blur-md bg-gray-300/200 border border-gray-100 rounded-2xl p-8 shadow-md w-140 -ml-8 transform transition duration-300 ease-in-out 
                hover:scale-105 hover:shadow-xl hover:brightness-120 hover:backdrop-blur-xl">
       
        <div className="bg-gray-80 rounded-xl flex justify-center items-center p-6 mb-6 shadow-sm">
          <img src={performanceImg} alt="Performance tracking" className="w-75 h-auto" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-black mb-2">
          Performance Ranking
        </h3>
        <p className="text-gray-600 text-sm md:text-base leading-relaxed">
          Track your progress and analyze your performance across weekly goals
          and study targets.
        </p>
      </div>
    </div>
    <div>

{/* //free trial section */}
  <div className="mt-48 bg-[#08191F] h-84 w-screen relative left-1/2 right-1/2 -mx-[50vw] flex flex-col justify-center items-center text-center">
  <h1 className="text-white font-bold text-3xl md:text-5xl mb-6">
    Ready to Transform Your Study Habits?
  </h1>
  <h2 className="text-white text-base md:text-sm font-medium">
    Join StudySync today and take the first step towards academic excellence!
    </h2>
    <div className="flex justify-center mt-6">
      <button className="bg-white text-black px-8 py-3 rounded-2xl hover:opacity-90 text-sm md:text-base font-medium">
        Start your free trial
      </button>
    </div>
</div>
</div>

  {/* //about section */}
<div className="pt-30 pb-6 flex flex-col md:flex-row" id="about">
  <div className="flex items-center  relative left-[-50px]">
    <div className="w-12 h-14 bg-black flex items-center justify-center rounded-2xl backdrop-blur-xl shadow-2xl">
      <span className="text-white font-bold md:text-2xl">S</span>
    </div>
    <div className="text-sm md:text-sm font-bold text-black ml-1">
      StudySync
    </div>
  </div>

  <div className="flex flex-wrap gap-74 mt-0 ml-60">
    <div className="flex flex-col space-y-2">
      <h3 className="text-black font-bold">Product</h3>
      <ul className="text-gray-500 space-y-2">
        <li>Features</li>
        <li>Security</li>
      </ul>
    </div>

    <div className="flex flex-col space-y-2">
      <h3 className="text-black font-bold">Company</h3>
      <ul className="text-gray-500 space-y-2">
        <li>About</li>
        <li>Contact</li>
      </ul>
    </div>

    <div className="flex flex-col space-y-2">
      <h3 className="text-black font-bold">Support</h3>
      <ul className="text-gray-500 space-y-2">
        <li>Help Center</li>
        <li>Terms of Service</li>
      </ul>
    </div>
  </div>
</div>

  </div>
  </div>
</div>

  </div>
  );
}

export default App;
