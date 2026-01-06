// TasksDone and AverageScore components
export function TasksDone({ tasks = 12 }) {
  return (
    <div className="w-full sm:w-[180px] md:w-[200px] lg:w-[240px]  h-60 flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-200">
      <h2 className="text-green-900 text-sm">Tasks Done</h2>
      <p className="text-2xl font-bold text-gray-900">{tasks}</p>
    </div>
  );
}

export function AverageScore({ score = 88 }) {
  return (
    <div className="w-full sm:w-[180px] md:w-[200px] lg:w-[240px]  h-60  flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-200">
      <h2 className="text-blue-900 text-sm">Average Score</h2>
      <p className="text-2xl font-bold text-gray-900">{score}%</p>
    </div>
  );
}
