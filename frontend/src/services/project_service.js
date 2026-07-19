// services/project_service.js
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../utils/api';

// ============================================================================
// TEAM MEMBER ONBOARDING
// ============================================================================
export const useTeamMember = ({ fetchProfile = true } = {}) => {
  const { makeRequest } = useApi();
  const queryClient = useQueryClient();

  // 404 if not onboarded yet — caller checks error.message or isError to show the onboarding form
  const getMyProfile = useQuery({
    queryKey: ['team-members', 'me'],
    queryFn: () => makeRequest('team-members/me'),
    retry: false, // don't retry a 404 — it just means "not onboarded", not a transient failure
    enabled: fetchProfile, // callers that only need `onboard`/`updateProfile` (e.g. OnboardingPrompt) can skip this fetch
  });

  const onboard = useMutation({
    mutationFn: (data) => makeRequest('team-members/onboard', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['team-members']);
    },
  });

  const updateProfile = useMutation({
    mutationFn: (data) => makeRequest('team-members/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['team-members']);
    },
  });

  return {
    profile: getMyProfile.data,
    isLoading: getMyProfile.isLoading,
    isOnboarded: !getMyProfile.isError,
    error: getMyProfile.error,
    onboard,
    updateProfile,
  };
};


// ============================================================================
// PROJECTS
// ============================================================================
export const useProjects = (options = {}) => {
  const { makeRequest } = useApi();
  const queryClient = useQueryClient();

  // enabled defaults to true so existing callers don't break — pass
  // { enabled: isOnboarded } to avoid firing this before we know the
  // user has a TeamMember profile (otherwise every page load triggers
  // a guaranteed 404 + DB rollback before the onboarding check resolves).
  const getProjects = useQuery({
    queryKey: ['projects'],
    queryFn: () => makeRequest('projects'),
    enabled: options.enabled ?? true,
  });

  // Single project detail (members, task counts, etc.)
  const getProject = (projectId) => useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => makeRequest(`projects/${projectId}`),
    enabled: !!projectId,
  });

  const createProject = useMutation({
    mutationFn: (data) => makeRequest('projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
    },
  });

  const updateProject = useMutation({
    mutationFn: ({ projectId, ...data }) => makeRequest(`projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries(['projects']);
      queryClient.invalidateQueries(['projects', projectId]);
    },
  });

  const deleteProject = useMutation({
    mutationFn: (projectId) => makeRequest(`projects/${projectId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
    },
  });

  const transferOwnership = useMutation({
    mutationFn: ({ projectId, newOwnerMemberId }) =>
      makeRequest(`projects/${projectId}/transfer-ownership/${newOwnerMemberId}`, {
        method: 'POST',
      }),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries(['projects', projectId]);
    },
  });

  return {
    projects: getProjects.data,
    isLoading: getProjects.isLoading,
    error: getProjects.error,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    transferOwnership,
  };
};

// ============================================================================
// PROJECT MEMBERS
// ============================================================================
export const useProjectMembers = (projectId) => {
  const { makeRequest } = useApi();
  const queryClient = useQueryClient();

  const getMembers = useQuery({
    queryKey: ['projects', projectId, 'members'],
    queryFn: () => makeRequest(`projects/${projectId}/members`),
    enabled: !!projectId,
  });

  const updateMemberRole = useMutation({
    mutationFn: ({ targetMemberId, role }) =>
      makeRequest(`projects/${projectId}/members/${targetMemberId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects', projectId, 'members']);
    },
  });

  const removeMember = useMutation({
    mutationFn: (targetMemberId) =>
      makeRequest(`projects/${projectId}/members/${targetMemberId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects', projectId, 'members']);
    },
  });

  return {
    members: getMembers.data,
    isLoading: getMembers.isLoading,
    error: getMembers.error,
    updateMemberRole,
    removeMember,
  };
};


// ============================================================================
// TASKS
// ============================================================================
export const useTasks = (projectId) => {
  const { makeRequest } = useApi();
  const queryClient = useQueryClient();

  // Tasks tab: full kanban for the project
  const getTasks = useQuery({
    queryKey: ['projects', projectId, 'tasks'],
    queryFn: () => makeRequest(`projects/${projectId}/tasks`),
    enabled: !!projectId,
  });

  // My Tasks tab: server-side filter via ?only_mine=true — same endpoint, different query key
  const getMyTasks = useQuery({
    queryKey: ['projects', projectId, 'tasks', 'mine'],
    queryFn: () => makeRequest(`projects/${projectId}/tasks?only_mine=true`),
    enabled: !!projectId,
  });

  const invalidateTasks = () => {
    queryClient.invalidateQueries(['projects', projectId, 'tasks']);
  };

  const createTask = useMutation({
    mutationFn: (data) => makeRequest(`projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: invalidateTasks,
  });

  const updateTask = useMutation({
    mutationFn: ({ taskId, ...data }) => makeRequest(`tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    onSuccess: invalidateTasks,
  });

  const deleteTask = useMutation({
    mutationFn: (taskId) => makeRequest(`tasks/${taskId}`, {
      method: 'DELETE',
    }),
    onSuccess: invalidateTasks,
  });

  return {
    tasks: getTasks.data,
    myTasks: getMyTasks.data,
    isLoading: getTasks.isLoading,
    isLoadingMine: getMyTasks.isLoading,
    error: getTasks.error,
    createTask,
    updateTask,
    deleteTask,
  };
};

// Single task detail — separate hook since it's not always needed alongside the full list
export const useTask = (taskId) => {
  const { makeRequest } = useApi();

  return useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => makeRequest(`tasks/${taskId}`),
    enabled: !!taskId,
  });
};


// ============================================================================
// TIME LOGS
// ============================================================================
export const useTimeLogs = () => {
  const { makeRequest } = useApi();
  const queryClient = useQueryClient();

  // Logs for one task (shown on a task detail view)
  const getTaskLogs = (taskId) => useQuery({
    queryKey: ['time-logs', 'task', taskId],
    queryFn: () => makeRequest(`tasks/${taskId}/time-logs`),
    enabled: !!taskId,
  });

  // All logs for a project (feeds the Tracking tab)
  const getProjectLogs = (projectId) => useQuery({
    queryKey: ['time-logs', 'project', projectId],
    queryFn: () => makeRequest(`projects/${projectId}/time-logs`),
    enabled: !!projectId,
  });

  const logTime = useMutation({
    mutationFn: ({ taskId, ...data }) => makeRequest(`tasks/${taskId}/time-logs`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries(['time-logs', 'task', taskId]);
      queryClient.invalidateQueries(['time-logs', 'project']);
      // hours_logged feeds task.total_hours_logged and the tracking tab
      queryClient.invalidateQueries(['tasks', taskId]);
      queryClient.invalidateQueries(['projects']);
    },
  });

  const deleteLog = useMutation({
    mutationFn: (logId) => makeRequest(`time-logs/${logId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['time-logs']);
      queryClient.invalidateQueries(['projects']);
    },
  });

  return {
    getTaskLogs,
    getProjectLogs,
    logTime,
    deleteLog,
  };
};


// ============================================================================
// TRACKING TAB (budget burn, per-member cost, commit activity)
// ============================================================================
export const useProjectTracking = (projectId) => {
  const { makeRequest } = useApi();

  return useQuery({
    queryKey: ['projects', projectId, 'tracking'],
    queryFn: () => makeRequest(`projects/${projectId}/tracking`),
    enabled: !!projectId,
  });
};

// ============================================================================
// GITHUB SYNC
// ============================================================================
export const useGithub = (projectId, options = {}) => {
  const { makeRequest } = useApi();
  const queryClient = useQueryClient();
  const [limit, setLimit] = useState(20);
  const [syncedOnce, setSyncedOnce] = useState(false);
 
  // Query is enabled if caller says so (project.is_github_integrated) OR
  // if we've just synced — so the UI updates immediately after first sync
  // even before the project record's is_github_integrated flag refreshes.
  const isEnabled = ((options.enabled ?? true) || syncedOnce) && !!projectId;
 
  const getCommits = useQuery({
    queryKey: ['projects', projectId, 'github', 'commits', limit],
    queryFn: () => makeRequest(
      `projects/${projectId}/github/commits?skip=0&limit=${limit}`
    ),
    enabled: isEnabled,
  });
 
  const data = getCommits.data;
  const commits = data?.commits || [];
  const total = data?.total || 0;
  const hasMore = data?.has_more || false;
 
  const syncCommits = useMutation({
    mutationFn: () => makeRequest(`projects/${projectId}/github/sync`, {
      method: 'POST',
    }),
    onSuccess: () => {
      setSyncedOnce(true); // unlock the query if it was gated
      setLimit(20);
      // Invalidate AND explicitly refetch — invalidation alone can miss
      // if the component remounts with a fresh query instance.
      queryClient.invalidateQueries(['projects', projectId, 'github']);
      queryClient.invalidateQueries(['projects', projectId, 'tracking']);
      queryClient.invalidateQueries(['projects', projectId]);
      queryClient.refetchQueries(['projects', projectId, 'github']);
    },
  });
 
  return {
    commits,
    total,
    hasMore,
    isLoading: getCommits.isLoading,
    isFetchingMore: getCommits.isFetching && !getCommits.isLoading,
    error: getCommits.error,
    loadMore: () => setLimit((l) => l + 20),
    syncCommits,
  };
};
 


// ============================================================================
// INVITATIONS
// ============================================================================
export const useProjectInvitations = (projectId) => {
  const { makeRequest } = useApi();
  const queryClient = useQueryClient();

  // Owner-only — invite someone by email. Returns invite_link since no
  // mailer is wired up yet; share it manually until that's added.
  const inviteMember = useMutation({
    mutationFn: (data) => makeRequest(`projects/${projectId}/invite`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects', projectId, 'members']);
    },
  });

  return { inviteMember };
};

// Public preview (no auth needed) — used on the /join?token=xxx landing page
// before the person logs in. Pass enabled-style usage at the call site since
// the token comes from the URL, not a prop dependency chain here.
export const useInvitationPreview = (token) => {
  const { makeRequest } = useApi();

  return useQuery({
    queryKey: ['invitations', token],
    queryFn: () => makeRequest(`invitations/${token}`),
    enabled: !!token,
    retry: false, // expired/invalid token shouldn't retry
  });
};

// Accept/decline — requires the person to be logged in already (Clerk session).
export const useInvitationResponse = () => {
  const { makeRequest } = useApi();
  const queryClient = useQueryClient();

  const acceptInvitation = useMutation({
    mutationFn: (token) => makeRequest(`invitations/${token}/accept`, {
      method: 'POST',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      queryClient.invalidateQueries(['team-members']);
    },
  });

  const declineInvitation = useMutation({
    mutationFn: (token) => makeRequest(`invitations/${token}/decline`, {
      method: 'POST',
    }),
  });

  return { acceptInvitation, declineInvitation };
};