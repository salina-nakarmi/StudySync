import React from "react";
import Navbar from "../components/Navbar";

const Feed = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Study Feed</h1>
          <p className="text-gray-600 mt-2">
            Stay updated with your community's study activities and achievements
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex space-x-2">
          <button className="px-4 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
            All Activity
          </button>
          <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
            Following
          </button>
          <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
            My Groups
          </button>
        </div>
      </div>
    </div>
  );
};

export default Feed;
