import React from "react";
import {
  CheckCircleIcon,
  LinkIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const PRIMARY_BLUE = "#1E78CA";

const notifications = [
  {
    id: 1,
    type: "task",
    title: "Task Completed",
    message: "You completed your Pomodoro session 🎉",
    time: "5 mins ago",
    icon: CheckCircleIcon,
    unread: true,
  },
  {
    id: 2,
    type: "resource",
    title: "New Shared Resource",
    message: "Sarah shared a React Hooks guide",
    time: "1 hour ago",
    icon: LinkIcon,
    unread: true,
  },
  {
    id: 3,
    type: "group",
    title: "Group Activity",
    message: "New discussion in DSA Study Group",
    time: "Yesterday",
    icon: UserGroupIcon,
    unread: false,
  },
];

export default function NotificationPanel({ onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Dimmed background (no blur) */}
      <div className="absolute inset-0 bg-black/5" onClick={onClose} />

      {/* Panel with shadow-2xl for that subtle depth on the left edge */}
      <div className="relative w-full sm:w-[380px] h-full bg-white shadow-2xl border-l border-gray-100 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-medium tracking-tight text-gray-900">
              Notifications
            </h2>
            <div 
              className="text-[10px] px-2 py-0.5 rounded font-bold tracking-wider" 
              style={{ backgroundColor: '#F0F7FF', color: PRIMARY_BLUE }}
            >
              {notifications.filter(n => n.unread).length} NEW
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`flex gap-4 p-5 border-b border-gray-50 transition-colors cursor-pointer hover:bg-gray-50/50 ${
                  item.unread ? "bg-white" : "opacity-75"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                    <Icon className="w-5 h-5 text-gray-500" />
                  </div>
                  {item.unread && (
                    <span 
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white"
                      style={{ backgroundColor: PRIMARY_BLUE }}
                    ></span>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-sm font-medium text-gray-900 tracking-tight">
                      {item.title}
                    </h3>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 leading-snug font-light">
                    {item.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-white">
          <button 
            className="w-full py-3 text-sm font-medium rounded-xl text-white transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ backgroundColor: PRIMARY_BLUE }}
          >
            Mark all as read
          </button>
        </div>
      </div>
    </div>
  );
}