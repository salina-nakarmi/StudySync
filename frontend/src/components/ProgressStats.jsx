export function TasksDone({ tasks = 23 }) {
  return (
    <div className="w-full h-56 sm:h-60 flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white">
      <h2 className="text-green-600 text-xs sm:text-xs font-bold uppercase tracking-wider">Tasks Done</h2>
      <p className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mt-1">{tasks}</p>
      <p className="text-xs sm:text-[10px] text-gray-400 mt-1 text-center">
        From your tracked resources
      </p>
    </div>
  );
}

export function AverageScore({ score = 53.5 }) {
  return (
    <div className="w-full h-56 sm:h-60 flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white">
      <h2 className="text-[#2C76BA] text-xs sm:text-xs font-bold uppercase tracking-wider">
        Completion Rate
      </h2>
      <p className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mt-1">
        {score}%
      </p>
      <div className="w-20 sm:w-24 h-1.5 bg-gray-100 rounded-full mt-4 overflow-hidden">
        <div
          className="bg-[#2C76BA] h-full transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}