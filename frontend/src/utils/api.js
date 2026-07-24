import { useAuth, useUser } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from "react";

const RAW_API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_BASE = RAW_API_URL.replace(/\/$/, "");
const API_PREFIX = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

// ============================================================================
// CORE API HOOK
// ============================================================================

export const useApi = () => {
  const { getToken } = useAuth();
  const { user } = useUser();

  const makeRequest = useCallback(async (endpoint, options = {}) => {
    const token = await getToken();

    const userHeaders = {};
    if (user) {
      userHeaders["X-User-Email"] =
        user.primaryEmailAddress?.emailAddress || "";
      userHeaders["X-User-First-Name"] = user.firstName || "";
      userHeaders["X-User-Last-Name"] = user.lastName || "";
      userHeaders["X-User-Username"] = user.username || "";
    }

    const response = await fetch(
      `${API_PREFIX}/${endpoint}`,
      {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...userHeaders,
          ...options.headers,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      if (response.status === 429) {
        throw new Error("Daily quota exceeded");
      }
      throw new Error(errorData?.detail || "An error occurred");
    }

    return response.json();
  }, [getToken, user]);

  return { makeRequest };
};

// ============================================================================
// DASHBOARD
// ============================================================================
export const useDashboard = () => {
    const { makeRequest } = useApi();
  
    return useQuery({
      queryKey: ['dashboard'],
      queryFn: () => makeRequest('dashboard'),
    });
  };

// ============================================================================
// STREAKS
// ============================================================================
export const useStreaks = () => {
    const { makeRequest } = useApi();
    const queryClient = useQueryClient();
  
    const getMyStreak = useQuery({
      queryKey: ['streaks', 'me'],
      queryFn: () => makeRequest('streaks/me'),
    });
  
    const updateStreak = useMutation({
      mutationFn: () => makeRequest('streaks/update', { method: 'POST' }),
      onSuccess: () => {
        queryClient.invalidateQueries(['streaks']);
      },
    });
  
    return {
      streak: getMyStreak.data,
      isLoading: getMyStreak.isLoading,
      error: getMyStreak.error,
      updateStreak,
    };
  };
  
 // ============================================================================
// STUDY SESSIONS
// ============================================================================
export const useStudySessions = () => {
    const { makeRequest } = useApi();
    const queryClient = useQueryClient();
  
    const createSession = useMutation({
      mutationFn: (data) => makeRequest('study-sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      onSuccess: () => {
        // Invalidate queries to refetch fresh data
        queryClient.invalidateQueries(['study-sessions']);
        queryClient.invalidateQueries(['streaks']);
        queryClient.invalidateQueries(['dashboard']);
        queryClient.invalidateQueries(['contributions']);
      },
    });
  
    const getTodaySummary = useQuery({
      queryKey: ['study-sessions', 'summary', 'today'],
      queryFn: () => makeRequest('study-sessions/summary/today'),
    });
  
    const getWeeklySummary = useQuery({
      queryKey: ['study-sessions', 'summary', 'week'],
      queryFn: () => makeRequest('study-sessions/summary/week'),
    });
  
    return {
      createSession,
      todaySummary: getTodaySummary.data,
      weeklySummary: getWeeklySummary.data,
      isLoading: getTodaySummary.isLoading || getWeeklySummary.isLoading,
    };
  };

// ============================================================================
// NEW: CONTRIBUTIONS
// ============================================================================
export const useContributions = () => {
  const { data: dashboardData, isLoading, error } = useDashboard();

  return {
    data: dashboardData ? { contributions: dashboardData.contributions || [] } : null,
    isLoading,
    error,
  };
};


// ===========================================================================
// RESOURCES - Full CRUD + Progress Tracking
// ============================================================================
export const useResources = () => {
  const { makeRequest } = useApi();
  const queryClient = useQueryClient();

  // Get all personal resources
  const getPersonalResources = useQuery({
    queryKey: ['resources', 'personal'],
    queryFn: () => makeRequest('resources/personal'),
  });

  // Get resources from a specific group
  const getGroupResources = (groupId) => useQuery({
    queryKey: ['resources', 'group', groupId],
    queryFn: () => makeRequest(`resources/group/${groupId}`),
    enabled: !!groupId,
  });

  // Get all resources (personal + all groups)
  const getAllResources = useQuery({
    queryKey: ['resources', 'all'],
    queryFn: () => makeRequest('resources/all'),
  });

  // Get single resource
  const getResource = (resourceId) => useQuery({
    queryKey: ['resources', resourceId],
    queryFn: () => makeRequest(`resources/${resourceId}`),
    enabled: !!resourceId,
  });

  // Create resource
  const createResource = useMutation({
    mutationFn: (data) => makeRequest('resources', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['resources']);
    },
  });

  // Update resource
  const updateResource = useMutation({
    mutationFn: ({ resourceId, ...data }) => makeRequest(`resources/${resourceId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['resources']);
    },
  });

  // Delete resource
  const deleteResource = useMutation({
    mutationFn: (resourceId) => makeRequest(`resources/${resourceId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['resources']);
    },
  });

  // Get resource stats
  const getResourceStats = useQuery({
    queryKey: ['resources', 'stats', 'me'],
    queryFn: () => makeRequest('resources/stats/me'),
  });

  return {
    personalResources: getPersonalResources.data,
    allResources: getAllResources.data,
    resourceStats: getResourceStats.data,
    getGroupResources,
    getResource,
    createResource,
    updateResource,
    deleteResource,
    isLoading: getPersonalResources.isLoading || getAllResources.isLoading,
  };
};

// ===========================================================================
// RESOURCE PROGRESS - Track completion and status
// ============================================================================
export const useResourceProgress = () => {
  const { makeRequest } = useApi();
  const queryClient = useQueryClient();

  // Get all my progress records
  const getAllProgress = (statusFilter) => useQuery({
    queryKey: ['resource-progress', 'all', statusFilter],
    queryFn: () => {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      return makeRequest(`resources/my-progress${params}`);
    },
  });

  // Get progress for specific resource
  const getResourceProgress = (resourceId) => useQuery({
    queryKey: ['resource-progress', resourceId],
    queryFn: () => makeRequest(`resources/${resourceId}/progress/me`),
    enabled: !!resourceId,
  });

  // Update progress
  const updateProgress = useMutation({
    mutationFn: ({ resourceId, status, progress_percentage, notes }) => 
      makeRequest(`resources/${resourceId}/progress`, {
        method: 'POST',
        body: JSON.stringify({ status, progress_percentage, notes }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['resource-progress']);
      queryClient.invalidateQueries(['resources']);
    },
  });

  // Mark as completed (convenience)
  const markCompleted = useMutation({
    mutationFn: ({ resourceId, notes }) => 
      makeRequest(`resources/${resourceId}/mark-completed?notes=${notes || ''}`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['resource-progress']);
      queryClient.invalidateQueries(['resources']);
    },
  });

  // Mark as started (convenience)
  const markStarted = useMutation({
    mutationFn: ({ resourceId, notes }) => 
      makeRequest(`resources/${resourceId}/mark-started?notes=${notes || ''}`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['resource-progress']);
      queryClient.invalidateQueries(['resources']);
    },
  });

  // Reset progress
  const resetProgress = useMutation({
    mutationFn: (resourceId) => 
      makeRequest(`resources/${resourceId}/progress/me`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['resource-progress']);
    },
  });

  // Get progress stats
  const getProgressStats = useQuery({
    queryKey: ['resource-progress', 'stats'],
    queryFn: () => makeRequest('resources/progress/stats'),
  });

  return {
    getAllProgress,
    getResourceProgress,
    updateProgress,
    markCompleted,
    markStarted,
    resetProgress,
    progressStats: getProgressStats.data,
  };
};

// ============================================================================
// ACTIVITY & CALENDAR
// ============================================================================
export const useDailyActivity = () => {
  const { makeRequest } = useApi();

  return useQuery({
    queryKey: ['daily-activity'],
    queryFn: () => makeRequest('activity/history'), // Matches your new FastAPI route
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

// ============================================================================
// FRIENDS
// ============================================================================
export const useFriends = () => {
  const { makeRequest } = useApi();
  const queryClient = useQueryClient();

  const getMyFriends = useQuery({
    queryKey: ['friends', 'my-friends'],
    queryFn: () => makeRequest('friends/my-friends'),
  });

  const getReceivedRequests = useQuery({
    queryKey: ['friends', 'requests', 'received'],
    queryFn: () => makeRequest('friends/requests/received'),
  });

  const getSentRequests = useQuery({
    queryKey: ['friends', 'requests', 'sent'],
    queryFn: () => makeRequest('friends/requests/sent'),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries(['friends']);
  };

  const sendRequest = useMutation({
    mutationFn: (receiverId) => makeRequest('friends/request', {
      method: 'POST',
      body: JSON.stringify({ receiver_id: receiverId }),
    }),
    onSuccess: invalidateAll,
  });

  const acceptRequest = useMutation({
    mutationFn: (requestId) => makeRequest(`friends/request/${requestId}/accept`, {
      method: 'POST',
    }),
    onSuccess: invalidateAll,
  });

  const rejectRequest = useMutation({
    mutationFn: (requestId) => makeRequest(`friends/request/${requestId}/reject`, {
      method: 'POST',
    }),
    onSuccess: invalidateAll,
  });

  const removeFriend = useMutation({
    mutationFn: (friendId) => makeRequest(`friends/${friendId}`, {
      method: 'DELETE',
    }),
    onSuccess: invalidateAll,
  });

  return {
    friends: getMyFriends.data || [],
    receivedRequests: getReceivedRequests.data || [],
    sentRequests: getSentRequests.data || [],
    isLoading: getMyFriends.isLoading || getReceivedRequests.isLoading || getSentRequests.isLoading,
    error: getMyFriends.error || getReceivedRequests.error || getSentRequests.error,
    refetchAll: () => {
      getMyFriends.refetch();
      getReceivedRequests.refetch();
      getSentRequests.refetch();
    },
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
  };
};