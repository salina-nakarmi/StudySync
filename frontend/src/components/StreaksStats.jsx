import { useStreaks } from "../utils/api";

export function CurrentStreak() {
  const { streak, isLoading, error } = useStreaks();
  
  const currentStreak = streak?.current_streak ?? 0;

  return (
    <div className="w-full h-56 sm:h-60 flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white">
      <h2 className="text-green-600 text-xs sm:text-xs font-bold uppercase tracking-wider">
        Current Streaks
      </h2>
      <p className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mt-1">
        {isLoading ? "—" : `${currentStreak} days`}
      </p>

      {error && (
        <p className="text-xs text-red-500 mt-1">
          Failed to load streak
        </p>
      )}
      
    </div>
  );
}


/* ---------------- Longest Streak ---------------- */


export function LongestStreak() {
  const { streak, isLoading, error } = useStreaks();

  const longestStreak = streak?.longest_streak ?? 0;

  return (
    <div className="w-full h-56 sm:h-60 flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white">
      <h2 className="text-[#2C76BA] text-xs font-bold uppercase tracking-wider">
        Longest Streak
      </h2>

      <p className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mt-1">
        {isLoading ? "—" : `${longestStreak} days`}
      </p>


      <p className="text-xs text-gray-400 mt-2 text-center">
        Best continuous study streak
      </p>

      {error && (
        <p className="text-xs text-red-500 mt-1">
          Failed to load streak
        </p>
      )}
    </div>
  );
}
