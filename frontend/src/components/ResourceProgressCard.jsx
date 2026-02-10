// ============================================================================
// NEW FILE: frontend/src/components/ResourceProgressCard.jsx
// Reusable component for resources with progress tracking
// ============================================================================

import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { FileText, Video, Link as LinkIcon, CheckCircle } from "lucide-react";
import { resourceService } from "../services/resource_services";

const ResourceProgressCard = ({ resource, onDelete, onRefresh }) => {
  const { getToken } = useAuth();
  
  // Progress state - EACH USER HAS THEIR OWN
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStatus, setProgressStatus] = useState("not_started");
  const [progressNotes, setProgressNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Icon mapping
  const cardIcons = {
    file: FileText,
    video: Video,
    link: LinkIcon,
  };
  const Icon = cardIcons[resource.resource_type] || FileText;

  // ============================================================================
  // LOAD USER'S PROGRESS FOR THIS RESOURCE
  // ============================================================================
  useEffect(() => {
    const loadProgress = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const progress = await resourceService.getMyProgress(token, resource.id);
        
        setProgressPercent(progress.progress_percentage || 0);
        setProgressStatus(progress.status || "not_started");
        setProgressNotes(progress.notes || "");
      } catch (err) {
        console.error("Failed to load progress:", err);
        // Default values if no progress exists
        setProgressPercent(0);
        setProgressStatus("not_started");
        setProgressNotes("");
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [resource.id, getToken]);

  // ============================================================================
  // SAVE PROGRESS WHEN SLIDER CHANGES
  // ============================================================================
  const handleProgressChange = async (newPercent) => {
    setProgressPercent(newPercent);
    
    // Auto-save after user stops dragging (debounced)
    if (window.progressSaveTimeout) {
      clearTimeout(window.progressSaveTimeout);
    }

    window.progressSaveTimeout = setTimeout(async () => {
      try {
        setSaving(true);
        const token = await getToken();
        
        // Determine status based on percentage
        let newStatus = "in_progress";
        if (newPercent === 0) newStatus = "not_started";
        if (newPercent === 100) newStatus = "completed";

        await resourceService.updateProgress(token, resource.id, {
          status: newStatus,
          progress_percentage: newPercent,
          notes: progressNotes,
        });

        setProgressStatus(newStatus);
      } catch (err) {
        console.error("Failed to save progress:", err);
      } finally {
        setSaving(false);
      }
    }, 500); // Save 500ms after user stops dragging
  };

  // ============================================================================
  // QUICK MARK AS COMPLETE
  // ============================================================================
  const handleMarkComplete = async () => {
    try {
      setSaving(true);
      const token = await getToken();
      await resourceService.markCompleted(token, resource.id, progressNotes);
      
      setProgressPercent(100);
      setProgressStatus("completed");
    } catch (err) {
      console.error("Failed to mark complete:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg transition flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-gray-600" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 px-2 py-1 rounded text-gray-600">
            {resource.resource_type}
          </span>
          {saving && (
            <span className="text-[10px] text-blue-500 animate-pulse">
              Saving...
            </span>
          )}
        </div>
      </div>

      {/* Title & Description */}
      <h3 className="font-bold text-gray-900 mb-1">
        {resource.title || "Untitled"}
      </h3>
      <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
        {resource.description || "No description provided."}
      </p>

      {/* Progress Section */}
      <div className="space-y-3">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
            <span>Your Progress</span>
            <span className={`font-bold ${
              progressStatus === "completed" ? "text-green-600" : "text-blue-600"
            }`}>
              {progressPercent}%
            </span>
          </div>
          
          {/* Visual Progress Bar */}
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-300 ${
                progressStatus === "completed" 
                  ? "bg-green-500" 
                  : "bg-blue-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Slider */}
          {!loading && (
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={progressPercent}
              onChange={(e) => handleProgressChange(Number(e.target.value))}
              disabled={saving}
              className="w-full accent-[#2C76BA] cursor-pointer disabled:opacity-50"
              aria-label={`Progress for ${resource.title || "resource"}`}
            />
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
            progressStatus === "completed" 
              ? "bg-green-50 text-green-700"
              : progressStatus === "in_progress"
              ? "bg-blue-50 text-blue-700"
              : "bg-gray-50 text-gray-500"
          }`}>
            {progressStatus === "completed" && "✓ "}
            {progressStatus.replace("_", " ").toUpperCase()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 mt-4 border-t border-gray-100 flex items-center gap-2">
        {resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="flex-1 text-center px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition"
          >
            Open
          </a>
        )}
        
        {progressStatus !== "completed" && (
          <button
            onClick={handleMarkComplete}
            disabled={saving}
            className="px-3 py-2 border border-gray-200 text-xs font-bold text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 flex items-center gap-1"
            title="Mark as Complete"
          >
            <CheckCircle className="w-3 h-3" />
            Done
          </button>
        )}
      </div>
    </div>
  );
};

export default ResourceProgressCard;