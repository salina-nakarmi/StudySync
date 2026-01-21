import { useAuth, useUser } from "@clerk/clerk-react";
import { useCallback } from "react";

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
// STREAKS API
// ============================================================================

export const useStreaks = () => {
  const { makeRequest } = useApi();

  const getMyStreak = useCallback(
    () => makeRequest("streaks/me"),
    [makeRequest]
  );

  const updateStreak = useCallback(
    () =>
      makeRequest("streaks/update", {
        method: "POST",
      }),
    [makeRequest]
  );

  const getCalendar = useCallback(
    (year, month) => {
      const params =
        year && month ? `?year=${year}&month=${month}` : "";
      return makeRequest(`streaks/calendar/me${params}`);
    },
    [makeRequest]
  );

  const getStreakStats = useCallback(
    () => makeRequest("streaks/stats/me"),
    [makeRequest]
  );

  return {
    getMyStreak,
    updateStreak,
    getCalendar,
    getStreakStats,
  };
};

// ============================================================================
// STUDY SESSIONS API
// ============================================================================

export const useStudySessions = () => {
  const { makeRequest } = useApi();

  const createSession = useCallback(
    (sessionData) =>
      makeRequest("study-sessions", {
        method: "POST",
        body: JSON.stringify(sessionData),
      }),
    [makeRequest]
  );

  const getTodaySummary = useCallback(
    () => makeRequest("study-sessions/summary/today"),
    [makeRequest]
  );

  return {
    createSession,
    getTodaySummary,
  };
};

// ============================================================================
// RESOURCES API
// ============================================================================

export const useResources = () => {
  const { makeRequest } = useApi();

  const getPersonalResources = useCallback(
    (filters = {}) => {
      const params = new URLSearchParams(filters);
      const query = params.toString() ? `?${params}` : "";
      return makeRequest(`resources/personal${query}`);
    },
    [makeRequest]
  );

  return { getPersonalResources };
};
