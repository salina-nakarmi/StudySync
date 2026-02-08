import { useAuth, useUser } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from "react";

const API_BASE = "http://localhost:8000/api";

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
      `http://localhost:8000/api/${endpoint}`,
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
// Resource progress bar
// ============================================================================
export const useResourceProgress = () => {
  const { getToken } = useAuth();

  const updateProgress = async ({ resourceId, progress }) => {
    const token = await getToken();

    const status =
      progress === 0
        ? "not_started"
        : progress === 100
        ? "completed"
        : "in_progress";

    const res = await api.post(
      `/resources/${resourceId}/progress`,
      {
        status,
        progress_percentage: progress,
        notes: null,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;
  };

  return { updateProgress };
};