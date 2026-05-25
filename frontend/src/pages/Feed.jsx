import React, { useState, useEffect } from "react";
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import Navbar from "../components/Navbar";

const Feed = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch real feed data from backend
    const mockFeedItems = [
      {
        id: 1,
        userName: "Sarah Ahmed",
        userAvatar: "SA",
        action: "completed a study session",
        details: "Studied Mathematics for 2 hours",
        timestamp: "2 hours ago",
        likes: 12,
        comments: 3,
        liked: false,
        groupName: "Math Study Group",
      },
      {
        id: 2,
        userName: "Alex Khan",
        userAvatar: "AK",
        action: "achieved a 7-day streak",
        details: "Keep up the great work!",
        timestamp: "4 hours ago",
        likes: 28,
        comments: 5,
        liked: true,
        groupName: "Engineering Club",
      },
      {
        id: 3,
        userName: "Emma Wilson",
        userAvatar: "EW",
        action: "shared a resource",
        details: "Advanced Python Tutorials - Complete Guide",
        timestamp: "6 hours ago",
        likes: 15,
        comments: 2,
        liked: false,
        groupName: "Programming Group",
      },
      {
        id: 4,
        userName: "James Park",
        userAvatar: "JP",
        action: "started a study session",
        details: "Physics - Quantum Mechanics",
        timestamp: "8 hours ago",
        likes: 8,
        comments: 1,
        liked: false,
        groupName: "Science Hub",
      },
    ];

    setFeedItems(mockFeedItems);
    setLoading(false);
  }, []);

  const toggleLike = (id) => {
    setFeedItems(
      feedItems.map((item) =>
        item.id === id
          ? {
              ...item,
              liked: !item.liked,
              likes: item.liked ? item.likes - 1 : item.likes + 1,
            }
          : item
      )
    );
  };

  const FeedCard = ({ item }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
            {item.userAvatar}
          </div>
          <div className="flex-1">
            <div className="flex items-baseline space-x-2">
              <p className="font-semibold text-gray-900">{item.userName}</p>
              <p className="text-sm text-gray-600">{item.action}</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">{item.timestamp}</p>
          </div>
        </div>
        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
          {item.groupName}
        </span>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-gray-700 mb-2">{item.details}</p>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 text-gray-600 text-sm">
            <SparklesIcon className="w-4 h-4" />
            <span>Check out this activity</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => toggleLike(item.id)}
          className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors group"
        >
          {item.liked ? (
            <HeartIconSolid className="w-5 h-5 text-red-500" />
          ) : (
            <HeartIcon className="w-5 h-5 group-hover:text-red-500" />
          )}
          <span className="text-sm text-gray-600">{item.likes}</span>
        </button>

        <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors">
          <ChatBubbleLeftIcon className="w-5 h-5" />
          <span className="text-sm text-gray-600">{item.comments}</span>
        </button>

        <button className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors">
          <ShareIcon className="w-5 h-5" />
          <span className="text-sm text-gray-600">Share</span>
        </button>
      </div>
    </div>
  );

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
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === "all"
                ? "bg-black text-white hover:bg-gray-800"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setActiveFilter("following")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === "following"
                ? "bg-black text-white hover:bg-gray-800"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Following
          </button>
          <button
            onClick={() => setActiveFilter("mygroups")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === "mygroups"
                ? "bg-black text-white hover:bg-gray-800"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            My Groups
          </button>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <p className="text-gray-600 mt-4">Loading feed...</p>
          </div>
        ) : feedItems.length > 0 ? (
          <div>
            {feedItems.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No activity yet. Start studying to see updates!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;