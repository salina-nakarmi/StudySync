import React from "react";

const ContributionGraph = ({ contributions = [] }) => {
  const colors = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];

  const getColor = (count) => colors[count] || colors[0];

  // Always show 53 weeks × 7 days
  const totalDays = 53 * 7;
  const paddedContributions = Array.from({ length: totalDays }, (_, i) => contributions[i] || 0);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 mt-6 ">
        {Array.from({ length: 53 }).map((_, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-1">
            {Array.from({ length: 7 }).map((_, dayIdx) => {
              const index = weekIdx * 7 + dayIdx;
              return (
                <div
                  key={dayIdx}
                  className="w-4 h-4 rounded-sm cursor-pointer transition-all hover:scale-110"
                  style={{ backgroundColor: getColor(paddedContributions[index]) }}
                  title={`${paddedContributions[index]} contributions`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContributionGraph;
