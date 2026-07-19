// src/services/friends_service.js
//
// NOTE: This mirrors the fetch/token pattern that community_services.js already
// uses elsewhere in the app (token passed in, Authorization: Bearer header sent,
// backend middleware resolves the Clerk user_id from that token). If your actual
// api client wraps requests differently (different base URL env var, a shared
// apiFetch helper, etc.), swap the internals of `request()` below to match it —
// the exported function names/signatures are what Feed.jsx relies on.

const API_BASE = import.meta.env.VITE_API_URL || "";

async function request(path, token, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (_) {
      // response wasn't JSON, keep the generic message
    }
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const friendsService = {
  // Send a friend request to receiverId. Backend rejects duplicates / existing
  // friendships with a 400 + detail message ("Friend request already exists",
  // "Users are already friends") — Feed.jsx handles those messages specifically.
  sendFriendRequest: (token, receiverId) =>
    request(`/api/friends/request`, token, {
      method: "POST",
      body: JSON.stringify({ receiver_id: receiverId }),
    }),

  acceptFriendRequest: (token, requestId) =>
    request(`/api/friends/request/${requestId}/accept`, token, { method: "POST" }),

  rejectFriendRequest: (token, requestId) =>
    request(`/api/friends/request/${requestId}/reject`, token, { method: "POST" }),

  getMyFriends: (token) => request(`/api/friends/my-friends`, token),

  getSentRequests: (token) => request(`/api/friends/requests/sent`, token),

  getReceivedRequests: (token) => request(`/api/friends/requests/received`, token),

  removeFriend: (token, friendId) =>
    request(`/api/friends/${friendId}`, token, { method: "DELETE" }),

  // Public profile lookup — used to show join date etc. in the dialog.
  getUserProfile: (token, userId) => request(`/users/${userId}`, token),
};