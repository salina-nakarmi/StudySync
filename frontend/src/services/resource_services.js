// ============================================================================
// FIXED Resource Service
// frontend/src/services/resource_services.js
// ============================================================================

const API_BASE = "http://localhost:8000/api";

export const resourceService = {
  // ========================================================================
  // CREATE - Upload File (FIXED VERSION)
  // ========================================================================
  uploadFile: async (token, file, groupId, description = null, parentFolderId = null) => {
    console.log("=" . repeat(60));
    console.log("📤 UPLOADING FILE");
    console.log("File:", file?.name);
    console.log("Group ID:", groupId, "Type:", typeof groupId);
    console.log("Description:", description);
    console.log("=" . repeat(60));

    const formData = new FormData();
    formData.append("file", file);
    
    // ⚠️ CRITICAL FIX: Convert null to string "null"
    // Backend expects string "null" for personal resources
    formData.append("group_id", groupId === null ? "null" : String(groupId));
    
    if (description) {
      formData.append("description", description);
    }
    
    if (parentFolderId) {
      formData.append("parent_folder_id", String(parentFolderId));
    }

    // Debug: Log FormData contents
    console.log("📦 FormData contents:");
    for (let pair of formData.entries()) {
      console.log(`  ${pair[0]}:`, pair[1]);
    }

    const response = await fetch(`${API_BASE}/resources/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // ⚠️ DO NOT set Content-Type - browser sets it automatically with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Upload failed" }));
      console.error("❌ Upload failed:", error);
      throw new Error(error.detail || "Upload failed");
    }

    const result = await response.json();
    console.log("✅ Upload successful:", result);
    return result;
  },

  // ========================================================================
  // CREATE - Link Resource
  // ========================================================================
  createResource: async (token, resourceData) => {
    console.log("🔗 Creating link resource:", resourceData);
    
    const response = await fetch(`${API_BASE}/resources`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(resourceData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to create resource" }));
      throw new Error(error.detail);
    }

    return response.json();
  },

  // ========================================================================
  // READ - Get Personal Resources
  // ========================================================================
  getPersonalResources: async (token, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/resources/personal`, {
      headers: { Authorization: `Bearer ${token}` },
    });
1323
    if (!response.ok) {
      throw new Error("Failed to fetch personal resources");
    }

    return response.json();
  },

  // ========================================================================
  // READ - Get Group Resources
  // ========================================================================
  getGroupResources: async (token, groupId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/resources/group/${groupId}?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch group resources");
    }

    return response.json();
  },

  // ========================================================================
  // READ - Get Single Resource
  // ========================================================================
  getResource: async (token, resourceId) => {
    const response = await fetch(`${API_BASE}/resources/${resourceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch resource");
    }

    return response.json();
  },

  // ========================================================================
  // UPDATE - Modify Resource
  // ========================================================================
  updateResource: async (token, resourceId, updateData) => {
    const response = await fetch(`${API_BASE}/resources/${resourceId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Update failed" }));
      throw new Error(error.detail);
    }

    return response.json();
  },

  // ========================================================================
  // DELETE - Remove Resource
  // ========================================================================
  deleteResource: async (token, resourceId) => {
    const response = await fetch(`${API_BASE}/resources/${resourceId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Failed to delete resource");
    }

    // 204 No Content - no body to parse
    return true;
  },

  // ========================================================================
  // PROGRESS TRACKING
  // ========================================================================
  updateProgress: async (token, resourceId, progressData) => {
    const response = await fetch(`${API_BASE}/resources/${resourceId}/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(progressData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to update progress" }));
      throw new Error(error.detail);
    }

    return response.json();
  },

  getMyProgress: async (token, resourceId) => {
    const response = await fetch(`${API_BASE}/resources/${resourceId}/progress/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch progress");
    }

    return response.json();
  },

  getAllMyProgress: async (token, status = null) => {
    const query = status ? `?status=${status}` : "";
    const response = await fetch(`${API_BASE}/resources/my-progress${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch progress list");
    }

    return response.json();
  },

  markCompleted: async (token, resourceId, notes = null) => {
    const query = notes ? `?notes=${encodeURIComponent(notes)}` : "";
    const response = await fetch(`${API_BASE}/resources/${resourceId}/mark-completed${query}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Failed to mark as completed");
    }

    return response.json();
  },

  markStarted: async (token, resourceId, notes = null) => {
    const query = notes ? `?notes=${encodeURIComponent(notes)}` : "";
    const response = await fetch(`${API_BASE}/resources/${resourceId}/mark-started${query}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Failed to mark as started");
    }

    return response.json();
  },

  // ========================================================================
  // SHARE - Share Personal Resource to Group
  // ========================================================================
  shareResourceToGroup: async (token, resourceId, groupId) => {
    const response = await fetch(`${API_BASE}/resources/${resourceId}/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ group_id: groupId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to share resource" }));
      throw new Error(error.detail || "Failed to share resource");
    }

    return response.json();
  },

  // ========================================================================
  // STATISTICS
  // ========================================================================
  getMyStats: async (token) => {
    const response = await fetch(`${API_BASE}/resources/stats/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch stats");
    }

    return response.json();
  },

  getProgressStats: async (token) => {
    const response = await fetch(`${API_BASE}/resources/progress/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch progress stats");
    }

    return response.json();
  },
};