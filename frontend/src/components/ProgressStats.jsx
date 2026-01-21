export function TasksDone({ tasks = 23 }) {
  return (
    <div className="w-11/12 sm:w-[240px] md:w-[280px] lg:w-[320px] h-60 flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-200 bg-white mx-auto">
      <h2 className="text-green-900 text-sm font-semibold">Tasks Done</h2>
      <p className="text-2xl font-bold text-gray-900">{tasks}</p>
      <p className="text-[10px] text-gray-400 mt-1">From your tracked resources</p>
    </div>
  );
}

export function AverageScore({ score = 53.5 }) {
  return (
    <div className="w-11/12 sm:w-[240px] md:w-[280px] lg:w-[320px] h-60 flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-200 bg-white mx-auto">
      <h2 className="text-[#2C76BA] text-sm font-semibold">Completion Rate</h2>
      <p className="text-2xl font-bold text-gray-900">{score}%</p>

      {/* Small progress bar */}
      <div className="w-32 h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
        <div
          className="bg-[#2C76BA] h-full transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
