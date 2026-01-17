import React from "react";
import { PencilIcon, ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";

const ProfileSection = ({ user, onLogout }) => {
  const username = user?.name || "User";
  const email = user?.email || "user@example.com";
  const avatarLetter = username.charAt(0).toUpperCase();
  const avatarUrl = user?.avatar || null;
  const joinedAt = user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : "N/A";

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-start pt-20 px-4">
      <div className="bg-white shadow-lg rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeftOnRectangleIcon className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-3xl font-bold text-white mb-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              avatarLetter
            )}
          </div>
          <h3 className="text-xl font-semibold text-gray-800">{username}</h3>
          <p className="text-gray-500">{email}</p>
        </div>

        <div className="space-y-4">
          <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition">
            <span>Edit Profile</span>
            <PencilIcon className="w-5 h-5 text-gray-600" />
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white transition"
          >
            <span>Logout</span>
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-4 space-y-2 text-gray-600">
          <p>
            <span className="font-semibold">Member since:</span> {joinedAt}
          </p>
          <p>
            <span className="font-semibold">Total Study Hours:</span> 120 hrs
          </p>
          <p>
            <span className="font-semibold">Achievements:</span> 5 Badges
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
