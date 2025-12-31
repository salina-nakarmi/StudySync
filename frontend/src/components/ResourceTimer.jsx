import { BookOpenIcon } from "@heroicons/react/24/outline";

const ResourceTime = () => {
  const resources = [
    { id: 1, name: "DSA Notes", time: 120 },
    { id: 2, name: "Operating System", time: 90 },
    { id: 3, name: "Computer Networks", time: 60 },
  ];

  return (
    <div className="w-[320px] bg-white rounded-2xl border border-gray-200 p-4">
      
      <h2 className="text-gray-800 font-bold text-lg mb-3">
        Time Spent on Resources
      </h2>

      <div className="space-y-3">
        {resources.map((item) => {
          const hours = Math.floor(item.time / 60);
          const minutes = item.time % 60;

          return (
            <div
              key={item.id}
              className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <BookOpenIcon className="w-5 h-5 text-gray-700" />
                <span className="text-sm font-medium">
                  {item.name}
                </span>
              </div>

              <span className="text-sm text-gray-600">
                {hours}h {minutes}m
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResourceTime;
