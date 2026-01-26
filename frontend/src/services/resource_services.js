const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiCall = async (endpoint, token, options = {}) => {
  if (!token) {
    throw new Error('Not authenticated - please sign in');
  }
  console.log('📤 Sending request:', {
    url: `${API_BASE_URL}${endpoint}`,
    method: options.method || 'GET',
    body: options.body,
  });
  const config = {
    ...options,
    headers: {
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`,
    },
  };

  // Don't set Content-Type for FormData - browser will set it with boundary
  if (!(options.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Not authenticated - please sign in');
    }
    
    const error = await response.json().catch(() => ({ 
      detail: `HTTP error! status: ${response.status}` 
    }));
    throw new Error(error.detail || 'An error occurred');
  }
  
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
};

export const resourceService = {
  // Get group resources
  getGroupResources: async (token, groupId, params = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v != null)
    ).toString();
    return apiCall(
      `/api/resources/group/${groupId}${queryString ? `?${queryString}` : ''}`,
      token
    );
  },

  // Create resource (URL/link)
  createResource: async (token, resourceData) => {
    // Ensure optional integer fields are null instead of string "null" or undefined
    const payload = {
      ...resourceData,
      group_id: resourceData.group_id ?? null,
      parent_folder_id: resourceData.parent_folder_id ?? null,
      file_size: resourceData.file_size ?? 0,
    };

    return apiCall('/api/resources', token, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Upload file resource
  uploadFile: async (token, file, groupId, description = null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('group_id', String(groupId));
    if (description) formData.append('description', description);
    console.log(groupId);
    return apiCall('/api/resources/upload', token, {
      method: 'POST',
      body: formData,
    });
  },

  // Delete resource
  deleteResource: async (token, resourceId) => {
    return apiCall(`/api/resources/${resourceId}`, token, {
      method: 'DELETE',
    });
  },

  // Update resource
  updateResource: async (token, resourceId, updateData) => {
    return apiCall(`/api/resources/${resourceId}`, token, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  },
};

export default resourceService;