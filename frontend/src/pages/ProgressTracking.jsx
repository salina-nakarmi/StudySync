import Navbar from "../components/Navbar";
import OverallProgress from "../components/OveralProgress";
import TotalHours from "../components/TotalHours";
import CurrentRank from "../components/CurrentRank";

export default function ProgressTrackingPage() {
  return (
    <>
      <Navbar />
      <div className="px-4 sm:px-6 lg:px-40 mt-28 flex flex-col lg:flex-row items-start gap-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Detailed Progress <br /> Overview
          </h1>
        </div>
        <div className="flex flex-col lg:flex-row items-start gap-2 ml-5">
        <OverallProgress />
         <TotalHours/>
          <CurrentRank/>
</div>
        
      </div>


      
    </>
  );
}
