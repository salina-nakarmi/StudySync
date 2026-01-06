import Navbar from "../components/Navbar";
import OverallProgress from "../components/OveralProgress";
import TotalHours from "../components/TotalHours";
import CurrentRank from "../components/CurrentRank";
import ResourceTimer from "../components/ResourceTimer";
import SharedLinkItem from "../components/SharedLinkItem";
import TodayProgressCard from "../components/TodayProgressCard";

// import ProgressCard from "../components/ProgressCard";
import { TasksDone, AverageScore } from "../components/ProgressStats";



export default function ProgressTrackingPage() {
  return (
    <>
      <Navbar />

      {/* MAIN CONTAINER */}
      <div className="px-4 sm:px-6 lg:px-40 mt-28">
        
        {/* HEADER + FIRST ROW */}
        <div className="flex flex-col lg:flex-row items-start gap-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Detailed Progress <br /> Overview
            </h1>
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-2 ml-5">
            <OverallProgress />
            <TotalHours />
            <CurrentRank />
          </div>
        </div>

        {/* SECOND ROW — ALIGNED PERFECTLY */}
        <div className="flex flex-col lg:flex-row items-start gap-2 mt-2 md:mr-83 ">
          {/* <div className="w-[555px] h-60 bg-white rounded-2xl border border-gray-200 items-center justify-center p-4 "> */}
           <TodayProgressCard />
          {/* </div> */}
         <TasksDone />      
  <AverageScore />   
  

  
        </div>

      </div>
    </>
  );
}
