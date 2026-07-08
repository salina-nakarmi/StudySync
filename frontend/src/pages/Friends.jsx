import React, { useState, useMemo } from "react";
// TODO: adjust this import path to wherever useDashboard/useResources/etc actually live
import { useFriends } from "../utils/api";
import { useLocation } from "react-router-dom";
import { Search, UserPlus, UserCheck, UserX, MoreHorizontal, Clock, Loader2 } from "lucide-react";
import Navbar from "../components/Navbar";

function initialsFor(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}useFriends

const AVATAR_COLORS = ["bg-zinc-900", "bg-blue-600", "bg-blue-500", "bg-zinc-700"];

function colorForId(id) {
  // hash the (string) id into a stable color bucket
  const str = String(id);
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({ initials, id, size = "w-14 h-14" }) {
  return (
    <div className={`${size} ${colorForId(id)} rounded-full flex items-center justify-center shrink-0`}>
      <span className="text-white font-bold text-sm tracking-wide">{initials}</span>
    </div>
  );
}

function TabButton({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-1 pb-3 mr-8 text-sm font-semibold transition-colors ${
        active ? "text-zinc-900" : "text-gray-400 hover:text-gray-600"
      }`}
    >
      {label}
      {count > 0 && (
        <span
          className={`ml-2 text-[11px] font-bold rounded-md px-1.5 py-0.5 ${
            active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
          }`}
        >
          {count}
        </span>
      )}
      {active && <span className="absolute left-0 -bottom-px h-0.5 w-full bg-blue-600 rounded-full" />}
    </button>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <UserPlus className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-gray-400 text-sm font-medium">{text}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16 text-gray-400">
      <Loader2 className="w-5 h-5 animate-spin mr-2" />
      <span className="text-sm font-medium">Loading…</span>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-red-500 text-sm font-medium mb-3">{message}</p>
      <button
        onClick={onRetry}
        className="text-xs font-bold text-gray-600 bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

function daysAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export default function Friends() {
  const location = useLocation();

  // Lets the navbar badge deep-link straight into a tab, e.g.
  // navigate("/friends", { state: { tab: "requests" } })
  const [tab, setTab] = useState(location.state?.tab || "friends"); // "friends" | "requests" | "sent"
  const [query, setQuery] = useState("");
  const [actionError, setActionError] = useState(null);

  const {
    friends,
    receivedRequests: requests,
    sentRequests: sent,
    isLoading,
    error,
    refetchAll,
    acceptRequest: acceptRequestMutation,
    rejectRequest: rejectRequestMutation,
    removeFriend: removeFriendMutation,
  } = useFriends();

  const pendingIds = new Set([
    ...(acceptRequestMutation.isPending ? [acceptRequestMutation.variables] : []),
    ...(rejectRequestMutation.isPending ? [rejectRequestMutation.variables] : []),
    ...(removeFriendMutation.isPending ? [removeFriendMutation.variables] : []),
  ]);

  const runAction = (mutation, id) => {
    setActionError(null);
    mutation.mutate(id, {
      onError: (err) => setActionError(err.message || "Something went wrong."),
    });
  };

  const acceptRequest = (req) => runAction(acceptRequestMutation, req.id);
  const declineRequest = (req) => runAction(rejectRequestMutation, req.id);
  const removeFriend = (friend) => runAction(removeFriendMutation, friend.user_id);

  // No "cancel a pending sent request" endpoint exists yet on the backend —
  // only accept/reject exist, and those are receiver-only actions. Wire this
  // up once a DELETE /api/friends/request/{id} (sender-cancels) route exists.
  const cancelSent = () => refetchAll();

  const filteredFriends = useMemo(
    () => friends.filter((f) => f.full_name.toLowerCase().includes(query.toLowerCase())),
    [friends, query]
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">Friends</h1>
            <p className="text-gray-400 mt-1 text-sm font-medium">
              {friends.length} friend{friends.length !== 1 ? "s" : ""} &middot; {requests.length} pending
              request{requests.length !== 1 ? "s" : ""}
            </p>
          </div>

          {tab === "friends" && (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search friends"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
              />
            </div>
          )}
        </div>

        {actionError && (
          <div className="mb-4 text-xs font-medium text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {actionError}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-100 mb-6">
          <TabButton label="Friends" count={friends.length} active={tab === "friends"} onClick={() => setTab("friends")} />
          <TabButton
            label="Friend Requests"
            count={requests.length}
            active={tab === "requests"}
            onClick={() => setTab("requests")}
          />
          <TabButton label="Sent Requests" count={sent.length} active={tab === "sent"} onClick={() => setTab("sent")} />
        </div>

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error.message || "Failed to load friends."} onRetry={refetchAll} />
        ) : (
          <>
            {/* Friends list */}
            {tab === "friends" &&
              (filteredFriends.length === 0 ? (
                <EmptyState text={query ? "No friends match that search." : "You don't have any friends yet."} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFriends.map((f) => (
                    <div
                      key={f.user_id}
                      className="flex items-center gap-3 rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
                    >
                      <Avatar initials={initialsFor(f.full_name)} id={f.user_id} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate">{f.full_name}</p>
                        <p className="text-xs text-gray-400 font-medium truncate">{f.email}</p>
                      </div>
                      <button
                        onClick={() => removeFriend(f)}
                        disabled={pendingIds.has(f.user_id)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors disabled:opacity-40"
                        title="Remove friend"
                      >
                        {pendingIds.has(f.user_id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ))}

            {/* Friend requests */}
            {tab === "requests" &&
              (requests.length === 0 ? (
                <EmptyState text="No pending friend requests." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {requests.map((r) => (
                    <div key={r.id} className="rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar initials={initialsFor(r.sender_name)} id={r.sender_id} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 truncate">{r.sender_name}</p>
                          <p className="text-xs text-gray-400 font-medium truncate">{r.sender_email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptRequest(r)}
                          disabled={pendingIds.has(r.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg py-2.5 hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {pendingIds.has(r.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                          Confirm
                        </button>
                        <button
                          onClick={() => declineRequest(r)}
                          disabled={pendingIds.has(r.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg py-2.5 hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          {pendingIds.has(r.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            {/* Sent requests */}
            {tab === "sent" &&
              (sent.length === 0 ? (
                <EmptyState text="You haven't sent any friend requests." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sent.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
                    >
                      <Avatar initials={initialsFor(s.receiver_name)} id={s.receiver_id} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate">{s.receiver_name}</p>
                        <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Sent {daysAgo(s.created_at)}d ago
                        </p>
                      </div>
                      <button
                        onClick={() => cancelSent(s)}
                        disabled={pendingIds.has(s.id)}
                        className="text-xs font-bold text-gray-600 bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors shrink-0 disabled:opacity-50"
                      >
                        {pendingIds.has(s.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Cancel"}
                      </button>
                    </div>
                  ))}
                </div>
              ))}
          </>
        )}
      </main>
    </div>
  );
}