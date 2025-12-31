import { TrophyIcon } from "@heroicons/react/24/outline";

const CurrentRank = () => {
  const rank = 5;
  const totalUsers = 120;

  return (
    <div className="w-[320px] h-40 bg-white rounded-2xl border border-gray-200 p-4 flex flex-col items-center justify-center">
      
      {/* Icon */}
      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-black mb-2">
        <TrophyIcon className="w-5 h-5 text-white" />
      </div>

      {/* Title */}
      <h2 className="text-gray-800 font-bold text-lg">
        Current Rank
      </h2>

      {/* Rank Display */}
      <p className="text-2xl font-bold text-black mt-1">
        #{rank}
      </p>

      {/* Subtitle */}
      <p className="text-xs text-gray-500 mt-1">
        out of {totalUsers} students
      </p>
    </div>
  );
};

export default CurrentRank;
