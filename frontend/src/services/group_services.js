
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
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  };

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

export const groupService = {
  createGroup: async (token, groupData) => {
    return apiCall('/api/groups', token, {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  },

  getGroups: async (token, params = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v != null)
    ).toString();
    return apiCall(`/api/groups${queryString ? `?${queryString}` : ''}`, token);
  },

  getMyGroups: async (token, params = {}) => {
    return groupService.getGroups(token, { ...params, only_joined: true });
  },

  getPublicGroups: async (token, params = {}) => {
    return groupService.getGroups(token, { ...params, only_joined: false });
  },

  getGroup: async (token, groupId) => {
    return apiCall(`/api/groups/${groupId}`, token);
  },

  updateGroup: async (token, groupId, updateData) => {
    return apiCall(`/api/groups/${groupId}`, token, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  },

  deleteGroup: async (token, groupId) => {
    return apiCall(`/api/groups/${groupId}`, token, {
      method: 'DELETE',
    });
  },

  joinGroup: async (token, groupId, inviteCode = null) => {
    return apiCall(`/api/groups/${groupId}/join`, token, {
      method: 'POST',
      body: JSON.stringify({ invite_code: inviteCode }),
    });
  },

  leaveGroup: async (token, groupId) => {
    return apiCall(`/api/groups/${groupId}/leave`, token, {
      method: 'DELETE',
    });
  },

  getGroupMembers: async (token, groupId) => {
    return apiCall(`/api/groups/${groupId}/members`, token);
  },

  updateMemberRole: async (token, groupId, userId, newRole) => {
    return apiCall(`/api/groups/${groupId}/members/role`, token, {
      method: 'PATCH',
      body: JSON.stringify({ user_id: userId, new_role: newRole }),
    });
  },

  removeMember: async (token, groupId, userId) => {
    return apiCall(`/api/groups/${groupId}/members/${userId}`, token, {
      method: 'DELETE',
    });
  },

  inviteUser: async (token, groupId, invitedUserId, message = null) => {
    return apiCall(`/api/groups/${groupId}/invite`, token, {
      method: 'POST',
      body: JSON.stringify({
        invited_user_id: invitedUserId,
        invitation_message: message,
      }),
    });
  },

  getMyInvitations: async (token, status = null) => {
    const queryString = status ? `?status=${status}` : '';
    return apiCall(`/api/groups/invitations/me${queryString}`, token);
  },

  respondToInvitation: async (token, invitationId, accept) => {
    return apiCall(`/api/groups/invitations/${invitationId}/respond`, token, {
      method: 'POST',
      body: JSON.stringify({ accept }),
    });
  },

  checkResourcePermissions: async (token, groupId) => {
    return apiCall(`/api/groups/${groupId}/can-manage-resources`, token);
  },
};

export default groupService;