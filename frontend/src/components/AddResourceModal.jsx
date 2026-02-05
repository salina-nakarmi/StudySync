// ============================================================================
// AddResourceModal Component
// frontend/src/components/AddResourceModal.jsx
// ============================================================================

import React, { useState } from "react";
import { XMarkIcon, DocumentArrowUpIcon, LinkIcon } from "@heroicons/react/24/outline";

export default function AddResourceModal({ isOpen, onClose, onSubmit, groupId }) {
  const [activeTab, setActiveTab] = useState("file"); // "file" or "link"
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    description: "",
  });

  // ========================================================================
  // Handle File Selection
  // ========================================================================
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    console.log("📁 File selected:", file.name, file.type, file.size);

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      alert("File is too large! Maximum size is 50MB.");
      e.target.value = ""; // Clear input
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }

    // Auto-fill title from filename
    if (!formData.title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setFormData({ ...formData, title: nameWithoutExt });
    }
  };

  // ========================================================================
  // Handle Form Submit
  // ========================================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (activeTab === "file") {
      // ====================================================================
      // FILE UPLOAD
      // ====================================================================
      if (!selectedFile) {
        alert("Please select a file to upload");
        return;
      }

      try {
        setUploading(true);

        await onSubmit({
          type: "file",
          file: selectedFile,
          description: formData.description || null,
          groupId: groupId,
        });

        // Reset on success
        handleClose();
      } catch (err) {
        console.error("Upload error:", err);
        alert(`Upload failed: ${err.message}`);
      } finally {
        setUploading(false);
      }
    } else {
      // ====================================================================
      // LINK CREATION
      // ====================================================================
      if (!formData.title || !formData.url) {
        alert("Please enter both title and URL");
        return;
      }

      // Validate URL format
      try {
        new URL(formData.url);
      } catch {
        alert("Please enter a valid URL (e.g., https://example.com)");
        return;
      }

      try {
        setUploading(true);

        await onSubmit({
          type: "link",
          title: formData.title,
          url: formData.url,
          description: formData.description || "",
          groupId: groupId,
        });

        // Reset on success
        handleClose();
      } catch (err) {
        console.error("Link creation error:", err);
        alert(`Failed to create link: ${err.message}`);
      } finally {
        setUploading(false);
      }
    }
  };

  // ========================================================================
  // Handle Close (with reset)
  // ========================================================================
  const handleClose = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFormData({ title: "", url: "", description: "" });
    setActiveTab("file");
    setUploading(false);
    onClose();
  };

  // ========================================================================
  // Get File Icon and Info
  // ========================================================================
  const getFileIcon = () => {
    if (!selectedFile) return null;

    const type = selectedFile.type;
    const name = selectedFile.name.toLowerCase();

    if (type.startsWith("image/")) return "🖼️";
    if (type.startsWith("video/")) return "🎥";
    if (type.includes("pdf") || name.endsWith(".pdf")) return "📄";
    if (type.includes("word") || name.endsWith(".doc") || name.endsWith(".docx")) return "📝";
    if (type.includes("excel") || name.endsWith(".xls") || name.endsWith(".xlsx")) return "📊";
    if (type.includes("powerpoint") || name.endsWith(".ppt") || name.endsWith(".pptx")) return "📽️";
    return "📎";
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100]">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* ================================================================
            HEADER
        ================================================================ */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900">Add Resource</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={uploading}
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* ================================================================
            TABS
        ================================================================ */}
        <div className="px-6 pt-4">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("file")}
              disabled={uploading}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                activeTab === "file"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <DocumentArrowUpIcon className="w-4 h-4" />
              Upload File
            </button>
            <button
              onClick={() => setActiveTab("link")}
              disabled={uploading}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                activeTab === "link"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              Add Link
            </button>
          </div>
        </div>

        {/* ================================================================
            FORM
        ================================================================ */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {activeTab === "file" ? (
            <>
              {/* ===========================================================
                  FILE UPLOAD TAB
              =========================================================== */}
              
              {/* File Input (Hidden) */}
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
              />

              {/* File Upload Area */}
              <div>
                <label
                  htmlFor="file-upload"
                  className={`
                    flex flex-col items-center justify-center 
                    w-full h-48 border-2 border-dashed rounded-xl
                    cursor-pointer transition-all
                    ${selectedFile 
                      ? "border-blue-300 bg-blue-50" 
                      : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                    }
                    ${uploading ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {selectedFile ? (
                    // File Selected Preview
                    <div className="text-center space-y-3">
                      {filePreview ? (
                        // Image Preview
                        <img
                          src={filePreview}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-lg mx-auto border-2 border-blue-200"
                        />
                      ) : (
                        // File Icon
                        <div className="text-5xl">{getFileIcon()}</div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-gray-900 truncate max-w-xs mx-auto">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                      <p className="text-xs text-blue-600 font-medium">
                        Click to choose a different file
                      </p>
                    </div>
                  ) : (
                    // No File Selected
                    <div className="text-center space-y-2">
                      <DocumentArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-sm font-bold text-gray-700">
                          Click to browse files
                        </p>
                        <p className="text-xs text-gray-500">
                          or drag and drop here
                        </p>
                      </div>
                      <p className="text-xs text-gray-400">
                        Max size: 50MB • Images, Videos, PDFs, Documents
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {/* Description (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={uploading}
                  placeholder="Add a note about this file..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition resize-none"
                />
              </div>
            </>
          ) : (
            <>
              {/* ===========================================================
                  LINK TAB
              =========================================================== */}
              
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={uploading}
                  placeholder="e.g., Study Guide, Tutorial Video, Documentation"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL *
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  disabled={uploading}
                  placeholder="https://example.com"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must start with http:// or https://
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={uploading}
                  placeholder="What is this link about?"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition resize-none"
                />
              </div>
            </>
          )}

          {/* ================================================================
              FOOTER BUTTONS
          ================================================================ */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || (activeTab === "file" && !selectedFile)}
              className="flex-1 py-3 text-sm font-bold bg-gray-800 text-white rounded-xl hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading...
                </span>
              ) : (
                activeTab === "file" ? "Upload File" : "Add Link"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}