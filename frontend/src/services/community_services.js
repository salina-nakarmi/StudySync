const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Generic API call helper that accepts token
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
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  };

  if (!(options.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Not authenticated - please sign in');
    }

    const error = await response.json().catch(() => ({
      detail: `HTTP error! status: ${response.status}`,
    }));
    throw new Error(error.detail || 'An error occurred');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  const str = query.toString();
  return str ? `?${str}` : '';
};

export const communityService = {
  // ========================================================================
  // POSTS
  // ========================================================================

  getPosts: async (token, { postType, groupId, search, skip = 0, limit = 20 } = {}) => {
    const qs = buildQueryString({
      post_type: postType,
      group_id: groupId,
      search,
      skip,
      limit,
    });
    return apiCall(`/api/community/posts${qs}`, token);
  },

  getPost: async (token, postId) => {
    return apiCall(`/api/community/posts/${postId}`, token);
  },

  createPost: async (token, data) => {
    // data: { postType, title, text, groupId, resourceId, linkData }
    return apiCall('/api/community/posts', token, {
      method: 'POST',
      body: JSON.stringify({
        post_type: data.postType,
        title: data.title,
        text: data.text ?? null,
        group_id: data.groupId ?? null,
        resource_id: data.resourceId ?? null,
        link_data: data.linkData ?? null,
      }),
    });
  },

  updatePost: async (token, postId, data) => {
    // data: { title, text }
    return apiCall(`/api/community/posts/${postId}`, token, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deletePost: async (token, postId) => {
    return apiCall(`/api/community/posts/${postId}`, token, {
      method: 'DELETE',
    });
  },

  // ========================================================================
  // REACTIONS: like / save / share
  // ========================================================================

  toggleLike: async (token, postId) => {
    return apiCall(`/api/community/posts/${postId}/like`, token, {
      method: 'POST',
    });
  },

  toggleSave: async (token, postId) => {
    return apiCall(`/api/community/posts/${postId}/save`, token, {
      method: 'POST',
    });
  },

  sharePost: async (token, postId) => {
    return apiCall(`/api/community/posts/${postId}/share`, token, {
      method: 'POST',
    });
  },

  // ========================================================================
  // COMMENTS
  // ========================================================================

  getComments: async (token, postId) => {
    return apiCall(`/api/community/posts/${postId}/comments`, token);
  },

  addComment: async (token, postId, { text, parentCommentId = null } = {}) => {
    return apiCall(`/api/community/posts/${postId}/comments`, token, {
      method: 'POST',
      body: JSON.stringify({
        text,
        parent_comment_id: parentCommentId,
      }),
    });
  },

  deleteComment: async (token, commentId) => {
    return apiCall(`/api/community/comments/${commentId}`, token, {
      method: 'DELETE',
    });
  },

  // ========================================================================
  // SIDEBAR
  // ========================================================================

  getRecentUploads: async (token, limit = 5) => {
    const qs = buildQueryString({ limit });
    return apiCall(`/api/community/sidebar/recent-uploads${qs}`, token);
  },

  getTopContributors: async (token, limit = 3) => {
    const qs = buildQueryString({ limit });
    return apiCall(`/api/community/sidebar/top-contributors${qs}`, token);
  },

  // ========================================================================
  // POST CREATION HELPERS
  // ========================================================================

  createPostResource: async (token, { title, resourceId, groupId, text }) => {
    return communityService.createPost(token, {
      postType: 'resource',
      title,
      text,
      resourceId,
      groupId,
    });
  },

  getMyResourcesForPost: async (token) => {
    return apiCall('/api/community/my-resources-for-post', token);
  },
};

export default communityService;