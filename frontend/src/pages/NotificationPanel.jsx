// NotificationPanel.jsx
import React, { useEffect, useState } from "react";
import {
  CheckCircleIcon,
  LinkIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useUser } from "@clerk/clerk-react";

const PRIMARY_BLUE = "#1E78CA";

const ICONS = {
  task: CheckCircleIcon,
  resource: LinkIcon,
  group: UserGroupIcon,
};

export default function NotificationPanel({ onClose }) {
  const { user, isLoaded } = useUser(); // Clerk hook
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  // Only run when user is loaded
  useEffect(() => {
    if (!isLoaded || !user) return;

    const userId = user.id;

    // Fetch initial notifications
    fetch(`http://localhost:8000/notifications/${userId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch notifications");
        return res.json();
      })
      .then(setNotifications)
      .catch((err) => setError(err.message));

    // Setup WebSocket
    const ws = new WebSocket(
      `ws://localhost:8000/notifications/ws/${userId}`
    );

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "notification") {
          setNotifications((prev) => [msg.data, ...prev]);
        }
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
    };

    ws.onerror = (err) => console.error("WebSocket error:", err);

    return () => ws.close();
  }, [isLoaded, user]);

  // Mark all notifications as read
  const markAllRead = async () => {
    if (!user) return;
    try {
      await Promise.all(
        notifications
          .filter((n) => !n.is_read)
          .map((n) =>
            fetch(`http://localhost:8000/notifications/read/${n.id}`, {
              method: "PUT",
            })
          )
      );
      setNotifications((n) => n.map((i) => ({ ...i, is_read: true })));
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
  };

  // Show loading if user is not ready
  if (!isLoaded) return <p>Loading notifications...</p>;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/5" onClick={onClose} />

      <div className="relative w-full sm:w-[380px] h-full bg-white shadow-2xl border-l flex flex-col">
        {/* Header */}
        <div className="flex justify-between px-6 py-5 border-b">
          <h2 className="text-xl font-medium">Notifications</h2>
          <button onClick={onClose}>
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm px-5 py-3">{error}</p>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 && !error && (
            <p className="text-gray-400 text-sm px-5 py-3">
              No notifications yet
            </p>
          )}

          {notifications.map((n) => {
            const Icon = ICONS[n.type] || CheckCircleIcon;
            return (
              <div
                key={n.id}
                className={`flex gap-4 p-5 border-b cursor-pointer transition-colors hover:bg-gray-50 ${
                  n.is_read ? "opacity-60" : ""
                }`}
              >
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center relative">
                  <Icon className="w-5 h-5 text-gray-500" />
                  {!n.is_read && (
                    <span
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white"
                      style={{ backgroundColor: PRIMARY_BLUE }}
                    ></span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <h3 className="text-sm font-medium">{n.title}</h3>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{n.message}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-5 border-t">
          <button
            onClick={markAllRead}
            className="w-full py-3 rounded-xl text-white transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ backgroundColor: PRIMARY_BLUE }}
          >
            Mark all as read
          </button>
        </div>
      </div>
    </div>
  );
}
