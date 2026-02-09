import React, { useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import OverallProgress from "../components/OveralProgress";
import TotalHours from "../components/TotalHours";
import TodayProgressCard from "../components/TodayProgressCard";
import { TasksDone, AverageScore } from "../components/ProgressStats";

import {
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

import { useStreaks, useResources, useResourceProgress } from "../utils/api";

/* ----------------------- Resource Card ----------------------- */

const ResourceProgressCard = React.memo(function ResourceProgressCard({
  resource,
  onUpdate,
  onToggle,
  onComplete,
}) {
  const [sliderValue, setSliderValue] = useState(
    resource.progress.progress_percentage
  );

  const statusStyles = {
    completed: "bg-green-500",
    in_progress: "bg-orange-500",
    paused: "bg-yellow-500",
    not_started: "bg-gray-400",
  };

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "—";

  const handleRelease = () => {
    if (sliderValue !== resource.progress.progress_percentage) {
      onUpdate(resource.id, sliderValue);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${statusStyles[resource.progress.status]}`}
          />
          <span className="text-xs font-semibold uppercase text-gray-600">
            {resource.progress.status.replace("_", " ")}
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-900">
          {resource.title}
        </h3>

        <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
          {resource.resource_type}
        </span>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1 font-medium">
            <span>Progress</span>
            <span>{sliderValue}%</span>
          </div>

          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
              style={{ width: `${sliderValue}%` }}
            />
          </div>

          {resource.progress.status !== "completed" && (
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={(e) => setSliderValue(+e.target.value)}
              onMouseUp={handleRelease}
              onTouchEnd={handleRelease}
              className="w-full mt-2 accent-orange-500"
            />
          )}
        </div>

        <div className="mt-4 pt-4 border-t text-[11px] text-gray-400 flex justify-between">
          <span>Started: {formatDate(resource.progress.started_at)}</span>
          <span>Updated: {formatDate(resource.progress.last_updated)}</span>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        {resource.progress.status !== "completed" ? (
          <button
            onClick={() => onComplete(resource.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800"
          >
            <CheckCircleIcon className="w-4 h-4" />
            Done
          </button>
        ) : (
          <span className="flex-1 text-sm font-bold text-green-600">
            ✓ Completed
          </span>
        )}

        {resource.progress.status !== "completed" && (
          <button
            onClick={() => onToggle(resource)}
            className="p-2 border rounded-xl hover:bg-gray-50"
          >
            {resource.progress.status === "in_progress" ? (
              <PauseIcon className="w-5 h-5 text-gray-600" />
            ) : (
              <PlayIcon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        )}
      </div>
    </div>
  );
});

/* ----------------------- Page ----------------------- */

export default function ProgressTrackingPage() {
  const [filter, setFilter] = useState(null);

  const { allResources, isLoading: resourcesLoading } = useResources();
  const {
    getAllProgress,
    updateProgress,
    markCompleted,
  } = useResourceProgress();

  // ✅ Fetch ONCE
  const { data: progressData, isLoading: progressLoading } =
    getAllProgress(null);

  // ✅ Combine once
  const resourcesWithProgress = useMemo(() => {
    if (!allResources || !progressData) return [];

    const map = new Map(progressData.map((p) => [p.resource_id, p]));

    return allResources
      .map((r) => ({ ...r, progress: map.get(r.id) }))
      .filter((r) => r.progress);
  }, [allResources, progressData]);

  // ✅ Filter instantly
  const filteredResources = useMemo(() => {
    if (!filter) return resourcesWithProgress;
    return resourcesWithProgress.filter(
      (r) => r.progress.status === filter
    );
  }, [resourcesWithProgress, filter]);

  const handleUpdate = (id, percent) => {
    updateProgress.mutate({
      resourceId: id,
      status:
        percent === 0
          ? "not_started"
          : percent === 100
          ? "completed"
          : "in_progress",
      progress_percentage: percent,
    });
  };

  const togglePlayPause = (resource) => {
    const next =
      resource.progress.status === "in_progress"
        ? "paused"
        : "in_progress";

    updateProgress.mutate({
      resourceId: resource.id,
      status: next,
      progress_percentage: resource.progress.progress_percentage,
    });
  };

  const tabs = [
    { id: null, label: "All" },
    { id: "in_progress", label: "In Progress" },
    { id: "completed", label: "Completed" },
    { id: "paused", label: "Paused" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 mt-28 pb-20 space-y-10">
        {/* Header */}
        <div className="grid lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4">
            <h1 className="text-3xl font-extrabold">
              Detailed Progress Overview
            </h1>
            <p className="text-gray-500 mt-2 text-lg">
              Track your learning performance
            </p>
          </div>

          <div className="lg:col-span-8 grid sm:grid-cols-2 gap-2">
            <OverallProgress />
            <TotalHours />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
          <TodayProgressCard />
          <TasksDone />
          <AverageScore />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-5 py-2 rounded-full font-bold text-sm ${
                filter === t.id
                  ? "bg-black text-white"
                  : "border text-gray-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {resourcesLoading || progressLoading ? (
          <div className="flex justify-center py-16">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredResources.length === 0 ? (
          <p className="text-center text-gray-500 py-16">
            No tracked resources yet
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredResources.map((r) => (
              <ResourceProgressCard
                key={r.id}
                resource={r}
                onUpdate={handleUpdate}
                onToggle={togglePlayPause}
                onComplete={(id) =>
                  markCompleted.mutate({ resourceId: id })
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
