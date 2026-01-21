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
  const { makeRequest, loading, error } = useApi();

  //get current users streak
  const getMyStreak = useCallback(async () => {
    return await makeRequest("streaks/me");
  }, [makeRequest]);
   
  // get any user's streak (public)
  const getUserStreak = useCallback(async (userId) => {
    return await makeRequest(`streaks/user/${userId}`);
    }, [makeRequest]);

  //update/check streak manually
  const updateStreak = useCallback(async () =>{
    return await makeRequest("streaks/update", {
      method: "POST",
    });
  }, [makeRequest]);    

  //get calender data for current month
  const getCalendar = useCallback(async (year, month) => {
      const params = year && month ? `?year=${year}&month=${month}` : '';
      return  await makeRequest(`streaks/calendar/me${params}`);
    },[makeRequest]);

    //get comprehensive streak stats
  const getStreakStats = useCallback(async () => {
    return await makeRequest("streaks/stats/me");
  }, [makeRequest]);

  return {
    getMyStreak,
    getUserStreak,
    updateStreak,
    getCalendar,
    getStreakStats,
    loading,
    error,
  };
};

// ============================================================================
// STUDY SESSIONS API
// ============================================================================

export const useStudySessions = () => {
  const { makeRequest, loading, error } = useApi();

  // Create/log a completed session
  const createSession = useCallback(async (sessionData) => {
    return await makeRequest('study-sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
    // sessionData = { duration_seconds, group_id?, session_notes? }
  }, [makeRequest]);


  // Get all user's sessions with filters
  const getSessions = useCallback(async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.group_id) params.append('group_id', filters.group_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.skip) params.append('skip', filters.skip);
    if (filters.limit) params.append('limit', filters.limit);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return await makeRequest(`study-sessions${query}`);
  }, [makeRequest]);

  // Get specific session by ID
  const getSession = useCallback(async (sessionId) => {
    return await makeRequest(`study-sessions/${sessionId}`);
  }, [makeRequest]);

  // Update session notes
  const updateSession = useCallback(async (sessionId, notes) => {
    return await makeRequest(`study-sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ session_notes: notes }),
    });
  }, [makeRequest]);

  // Delete session
  const deleteSession = useCallback(async (sessionId) => {
    return await makeRequest(`study-sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }, [makeRequest]);

  // Get daily analytics
  const getDailyStats = useCallback(async (date) => {
    const params = date ? `?target_date=${date}` : '';
    return await makeRequest(`study-sessions/analytics/daily${params}`);
  }, [makeRequest]);

  // Get weekly analytics
  const getWeeklyStats = useCallback(async (weekStart) => {
    const params = weekStart ? `?week_start=${weekStart}` : '';
    return await makeRequest(`study-sessions/analytics/weekly${params}`);
  }, [makeRequest]);

  // Get monthly analytics
  const getMonthlyStats = useCallback(async (year, month) => {
    const params = year && month ? `?year=${year}&month=${month}` : '';
    return await makeRequest(`study-sessions/analytics/monthly${params}`);
  }, [makeRequest]);

  // Get comprehensive analytics
  const getComprehensiveStats = useCallback(async (groupId) => {
    const params = groupId ? `?group_id=${groupId}` : '';
    return await makeRequest(`study-sessions/analytics/comprehensive${params}`);
  }, [makeRequest]);

  // Get study time by group
  const getGroupBreakdown = useCallback(async () => {
    return await makeRequest('study-sessions/analytics/by-group');
  }, [makeRequest]);

  // Get group leaderboard
  const getGroupLeaderboard = useCallback(async (groupId, period = 'all_time') => {
    return await makeRequest(`study-sessions/leaderboards/group/${groupId}?period=${period}`);
  }, [makeRequest]);

  // Get global leaderboard
  const getGlobalLeaderboard = useCallback(async (period = 'all_time', limit = 50) => {
    return await makeRequest(`study-sessions/leaderboards/global?period=${period}&limit=${limit}`);
  }, [makeRequest]);

  // Get today's summary
  const getTodaySummary = useCallback(async () => {
    return await makeRequest('study-sessions/summary/today');
  }, [makeRequest]);

  // Get week summary
  const getWeekSummary = useCallback(async () => {
    return await makeRequest('study-sessions/summary/week');
  }, [makeRequest]);

  return {
    // Session CRUD
    createSession,
    getSessions,
    getSession,
    updateSession,
    deleteSession,
    // Analytics
    getDailyStats,
    getWeeklyStats,
    getMonthlyStats,
    getComprehensiveStats,
    getGroupBreakdown,
    // Leaderboards
    getGroupLeaderboard,
    getGlobalLeaderboard,
    // Quick summaries
    getTodaySummary,
    getWeekSummary,
    loading,
    error,
  };
};

// ============================================================================
// RESOURCES API
// ============================================================================


// ============================================================================
// 6. BEST PRACTICES & TIPS
// ============================================================================

/*
✅ DO:
- Use Promise.all() to fetch multiple endpoints simultaneously
- Handle loading and error states in components
- Use useCallback to prevent unnecessary re-renders
- Add try-catch in async functions
- Log successful fetches for debugging

❌ DON'T:
- Forget to await getToken() before making requests
- Make API calls directly without the useApi hook
- Ignore error handling
- Fetch data on every render (use useEffect with dependencies)
- Store sensitive data in localStorage

🎯 PATTERN:
1. Create custom hook for each API module (useStreaks, useStudySessions, etc.)
2. Use useCallback for all API functions
3. Return { ...functions, loading, error } from hooks
4. Use hooks in components with useEffect
5. Handle loading/error states in UI
*/