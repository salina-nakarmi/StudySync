// TasksDone and AverageScore components (Widened)
export function TasksDone({ tasks = 23 }) {
  return (
    /* Increased width from 180px-240px to 240px-320px */
    <div className="w-full sm:w-[240px] md:w-[280px] lg:w-[320px] h-60 flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-200 bg-white">
      <h2 className="text-green-900 text-sm font-semibold ">Tasks Done</h2>
      <p className="text-2xl font-bold text-gray-900">{tasks}</p>
      <p className="text-[10px] text-gray-400 mt-1">From your tracked resources</p>
    </div>
  );
}

export function AverageScore({ score = 53.5 }) {
  return (
    /* Matches the widened TasksDone width */
    <div className="w-full sm:w-[240px] md:w-[280px] lg:w-[320px] h-60 flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-200 bg-white">
      <h2 className="text-blue-900 text-sm font-semibold">Completion Rate</h2>
      <p className="text-2xl font-bold text-gray-900">{score}%</p>
      {/* Added a small progress bar for visual flair */}
      <div className="w-32 h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
        <div 
          className="bg-blue-500 h-full transition-all duration-500" 
          style={{ width: `${score}%` }} 
        />
      </div>
    </div>
  );
}