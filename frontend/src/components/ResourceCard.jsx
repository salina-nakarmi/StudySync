import React, { useState } from 'react';
import {
  LinkIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { resourceService } from '../services/resource_services';

export default function ResourceCard({
  res,
  handlers,
  resourceProgressById,
  handleResourceProgressChange,
  isPersonal,
  onOpenPDF,
  getToken,
}) {
  const [updating, setUpdating] = useState(false);
  
  const type = res.resource_type?.toLowerCase();
  let Icon = LinkIcon;
  if (type === "file") Icon = DocumentTextIcon;
  if (type === "video") Icon = VideoCameraIcon;

  // Handle opening different resource types
  const handleOpenResource = async () => {
    try {
      setUpdating(true);
      const token = await getToken();

      if (type === 'file' && res.url.includes('pdf')) {
        // PDF: Open in modal with page tracking
        onOpenPDF(res);
      } else if (type === 'video') {
        // Video: Mark as started and open
        await resourceService.updateResourceProgressPage(token, res.id, {
          current_page: 1,
          notes: 'Started watching video'
        });
        window.open(res.url, '_blank');
      } else {
        // Link/Document: Mark as opened and open
        await resourceService.updateResourceProgressPage(token, res.id, {
          current_page: 1,
          notes: 'Opened resource'
        });
        window.open(res.url, '_blank');
      }
    } catch (err) {
      console.error('Error opening resource:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Mark as completed
  const handleMarkCompleted = async () => {
    try {
      setUpdating(true);
      const token = await getToken();
      await resourceService.updateResourceProgressPage(token, res.id, {
        current_page: res.total_pages || 1,
        notes: 'Marked as completed'
      });
      handleResourceProgressChange(res.id, 100);
    } catch (err) {
      console.error('Error marking completed:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="group flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition">
      <div className="flex items-center gap-4 flex-1">
        <div className="p-2 bg-gray-100 rounded-lg text-gray-600 group-hover:bg-white transition">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-bold text-gray-900">{res.title || "Untitled"}</h4>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
              isPersonal
                ? "bg-green-50 text-green-600"
                : "bg-blue-50 text-blue-600"
            }`}>
              {isPersonal ? "Personal" : "Group"}
            </span>
            
            {/* Resource Type Badge */}
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600">
              {type === 'file' ? 'PDF' : type === 'video' ? 'Video' : type === 'link' ? 'Link' : type}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate max-w-md">{res.description}</p>
          
          {/* Progress Bar - Different for PDF vs Others */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
              <span>
                {type === 'file' && res.url.includes('pdf') 
                  ? 'Pages Read'
                  : 'Progress'
                }
              </span>
              <span className="font-semibold text-gray-700">
                {type === 'file' && res.url.includes('pdf')
                  ? `${resourceProgressById[res.id] || 0}/${res.total_pages || '?'}`
                  : `${resourceProgressById[res.id] || 0}%`
                }
              </span>
            </div>
            
            {/* PDF: Disabled slider (auto-tracked) */}
            {type === 'file' && res.url.includes('pdf') ? (
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#2C76BA] h-1.5 rounded-full transition-all"
                  style={{ 
                    width: res.total_pages 
                      ? `${Math.min((resourceProgressById[res.id] || 0) / res.total_pages * 100, 100)}%`
                      : '0%'
                  }}
                />
              </div>
            ) : (
              /* Other types: Manual slider */
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={resourceProgressById[res.id] || 0}
                onChange={(e) => handleResourceProgressChange(res.id, Number(e.target.value))}
                className="w-full accent-[#2C76BA] cursor-pointer"
                aria-label={`Progress for ${res.title || "resource"}`}
              />
            )}
          </div>

          {/* Help text for different types */}
          <div className="mt-2 text-[10px] text-gray-400">
            {type === 'file' && res.url.includes('pdf') && 
              '📄 Auto-tracking by pages while reading'}
            {type === 'video' && 
              '🎥 Drag to track viewing progress'}
            {type === 'link' && 
              '🔗 Drag to track reading progress'}
            {!['file', 'video', 'link'].includes(type) && 
              '📋 Drag to track your progress'}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Mark as Completed Button */}
        <button
          onClick={handleMarkCompleted}
          disabled={updating || (resourceProgressById[res.id] || 0) === 100}
          className="text-[10px] font-bold text-green-600 hover:text-green-700 disabled:text-gray-300 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100 transition px-2 py-1 hover:bg-green-50 rounded"
          title="Mark as completed"
        >
          ✓
        </button>

        {/* Open Resource Button */}
        <button
          onClick={handleOpenResource}
          disabled={updating}
          className="text-xs font-bold text-[#2C76BA] hover:underline whitespace-nowrap disabled:opacity-50"
        >
          {type === 'file' && res.url.includes('pdf') ? 'Read PDF' : 'Open'}
        </button>

        {/* Delete Button */}
        <button
          onClick={() => handlers.handleDeleteResource(res.id)}
          className="p-1.5 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
          disabled={updating}
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}