import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import OverallProgress from "../components/OveralProgress";
import TotalHours from "../components/TotalHours";
import TodayProgressCard from "../components/TodayProgressCard";
import { TasksDone, AverageScore } from "../components/ProgressStats";

import {
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
} from "@heroicons/react/24/outline";

export default function ProgressTrackingPage() {
  const [resources, setResources] = useState([]);
  const [filter, setFilter] = useState(null);

  useEffect(() => {
    setResources([
      {
        id: 1,
        title: "Chapter 5 Notes",
        status: "in_progress",
        progress_percentage: 80,
        notes: "Review diagrams",
        startedOn: "2026-01-01",
        lastUpdated: "2026-01-09",
      },
      {
        id: 2,
        title: "Lecture 12 Video",
        status: "in_progress",
        progress_percentage: 50,
        notes: "",
        startedOn: "2026-01-05",
        lastUpdated: "2026-01-08",
      },
      {
        id: 3,
        title: "Practice Problems",
        status: "not_started",
        progress_percentage: 0,
        notes: "Focus on recursion",
        startedOn: null,
        lastUpdated: null,
      },
    ]);
  }, []);

  const handleUpdate = (id, percent) => {
    setResources((prev) =>
      prev.map((res) =>
        res.id === id
          ? {
              ...res,
              progress_percentage: percent,
              status: percent === 100 ? "completed" : "in_progress",
            }
          : res
      )
    );
  };

  const togglePlayPause = (id) => {
    setResources((prev) =>
      prev.map((res) =>
        res.id === id
          ? {
              ...res,
              status: res.status === "in_progress" ? "paused" : "in_progress",
            }
          : res
      )
    );
  };

  const filteredResources =
    filter === null ? resources : resources.filter((r) => r.status === filter);

  const tabs = [
    { id: null, label: "All" },
    { id: "in_progress", label: "In Progress" },
    { id: "completed", label: "Completed" },
    { id: "paused", label: "Paused" },
  ];

  const ResourceProgressCard = ({ resource }) => {
    const statusStyles = {
      completed: "bg-green-500",
      in_progress: "bg-orange-500",
      paused: "bg-yellow-500",
      not_started: "bg-gray-400",
    };

    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${statusStyles[resource.status]}`}
            />
            <span className="text-xs font-semibold uppercase text-gray-600">
              {resource.status.replace("_", " ")}
            </span>
          </div>

          <h3 className="text-lg font-bold text-gray-900 leading-tight">
            {resource.title}
          </h3>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1 font-medium">
              <span>Progress</span>
              <span>{resource.progress_percentage}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-700"
                style={{ width: `${resource.progress_percentage}%` }}
              />
            </div>
          </div>

          {resource.notes && (
            <p className="mt-3 text-sm text-gray-600 italic">"{resource.notes}"</p>
          )}

          <div className="mt-4 pt-4 border-t border-gray-50 text-[11px] text-gray-400 flex justify-between">
            <span>Started: {resource.startedOn || "—"}</span>
            <span>Updated: {resource.lastUpdated || "—"}</span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          {resource.status !== "completed" ? (
            <button
              onClick={() => handleUpdate(resource.id, 100)}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition shadow-sm"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Done
            </button>
          ) : (
            <span className="flex-1 text-sm font-bold text-green-600 py-2">
              ✓ Completed
            </span>
          )}

          <button
            onClick={() => togglePlayPause(resource.id)}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            title={resource.status === "in_progress" ? "Pause" : "Resume"}
          >
            {resource.status === "in_progress" ? (
              <PauseIcon className="w-5 h-5 text-gray-600" />
            ) : (
              <PlayIcon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-28 pb-20 space-y-10">
        
        {/* Row 1: Title & Top Two Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-4">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Detailed Progress Overview
            </h1>
            <p className="text-gray-500 mt-2 text-lg">
              Track your learning performance
            </p>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <OverallProgress />
            <TotalHours />
          </div>
        </div>

        {/* Row 2: Three Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 -mt-8">
          <TodayProgressCard />
          <TasksDone />
          <AverageScore />
        </div>

        {/* Row 3: Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                filter === tab.id
                  ? "bg-black text-white shadow-md scale-105"
                  : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Row 4: Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredResources.map((resource) => (
            <ResourceProgressCard key={resource.id} resource={resource} />
          ))}
        </div>

      </main>
    </div>
  );
}