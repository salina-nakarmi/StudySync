import React from "react";

const ContributionGraph = ({ contributions = [] }) => {
  const colors = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];

  const getColor = (count) => colors[Math.min(count, colors.length - 1)];

  const totalDays = 53 * 7;
  const paddedContributions = Array.from(
    { length: totalDays },
    (_, i) => contributions[i] || 0
  );

  return (
    <div className="w-full overflow-x-auto">
      {/* Graph */}
      <div className="flex gap-[3px] mt-4 min-w-max">
        {Array.from({ length: 53 }).map((_, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }).map((_, dayIdx) => {
              const index = weekIdx * 7 + dayIdx;
              return (
                <div
                  key={dayIdx}
                  className="
                    rounded-[3px]
                    transition-transform
                    hover:scale-110
                    cursor-pointer
                    w-3 h-3
                    sm:w-4 sm:h-4
                  "
                  style={{ backgroundColor: getColor(paddedContributions[index]) }}
                  title={`${paddedContributions[index]} contributions`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3 text-xs text-gray-500">
        <span>Less</span>
        {colors.map((color, idx) => (
          <div
            key={idx}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

export default ContributionGraph;
