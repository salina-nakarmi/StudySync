import React, { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, UserPlus, UserCheck, UserX, MessageCircle, MoreHorizontal, Clock, Trash2 } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import Navbar from "../components/Navbar";

export default function Friends() {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const [tab, setTab] = useState(location.state?.tab || "friends");
  const [query, setQuery] = useState("");

  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);

  // Setup Axios configurations with middleware compatibility headers
  const apiOptions = useMemo(() => {
    return {
      headers: {
        "user_id": user?.id || "",
        "email": user?.primaryEmailAddress?.emailAddress || "",
      }
    };
  }, [user]);

  // Fetch all categories from backend
  const fetchAllFriendsData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [friendsRes, receivedRes, sentRes] = await Promise.all([
        axios.get("/api/friends/my-friends", apiOptions),
        axios.get("/api/friends/requests/received", apiOptions),
        axios.get("/api/friends/requests/sent", apiOptions)
      ]);
      setFriends(friendsRes.data);
      setRequests(receivedRes.data);
      setSent(sentRes.data);
    } catch (error) {
      console.error("Error retrieving friend contexts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFriendsData();
  }, [user, apiOptions]);

  const filteredFriends = useMemo(() => {
    return friends.filter((f) =>
      (f.full_name || "").toLowerCase().includes(query.toLowerCase())
    );
  }, [friends, query]);

  const acceptRequest = async (requestId) => {
    try {
      await axios.post(`/api/friends/request/${requestId}/accept`, {}, apiOptions);
      fetchAllFriendsData(); // Refresh UI instantly
    } catch (error) {
      alert("Failed to accept friend request.");
    }
  };

  const declineRequest = async (requestId) => {
    try {
      await axios.post(`/api/friends/request/${requestId}/reject`, {}, apiOptions);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      alert("Failed to decline request.");
    }
  };

  const removeFriend = async (friendId) => {
    if (!window.confirm("Are you sure you want to remove this friend?")) return;
    try {
      await axios.delete(`/api/friends/${friendId}`, apiOptions);
      setFriends((prev) => prev.filter((f) => f.user_id !== friendId));
    } catch (error) {
      alert("Failed to remove friend.");
    }
  };

  // Safe shorthand helper for string initials
  const getInitials = (name) => {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        {/* Header Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex border-b border-gray-100 w-full sm:w-auto">
            <button
              onClick={() => setTab("friends")}
              className={`px-4 py-2 font-semibold text-sm ${tab === "friends" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400"}`}
            >
              All Friends ({friends.length})
            </button>
            <button
              onClick={() => setTab("requests")}
              className={`px-4 py-2 font-semibold text-sm ${tab === "requests" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400"}`}
            >
              Pending Requests ({requests.length})
            </button>
            <button
              onClick={() => setTab("sent")}
              className={`px-4 py-2 font-semibold text-sm ${tab === "sent" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400"}`}
            >
              Sent ({sent.length})
            </button>
          </div>

          {tab === "friends" && (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search friends..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-12">Loading profiles...</p>
        ) : (
          <>
            {/* Friends Tab */}
            {tab === "friends" && (
              filteredFriends.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No friends found.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFriends.map((f) => (
                    <div key={f.user_id} className="p-4 border rounded-xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-full text-white flex items-center justify-center font-bold">
                          {getInitials(f.full_name)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{f.full_name}</p>
                          <p className="text-xs text-gray-400">{f.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate("/messages", { state: { dmUserId: f.user_id } })}
                          className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFriend(f.user_id)}
                          className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Received Requests Tab */}
            {tab === "requests" && (
              requests.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No incoming friend requests.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {requests.map((r) => (
                    <div key={r.id} className="p-4 border rounded-xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-zinc-700 rounded-full text-white flex items-center justify-center font-bold">
                          {getInitials(r.sender_name)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{r.sender_name}</p>
                          <p className="text-xs text-gray-400">Wants to connect</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptRequest(r.id)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => declineRequest(r.id)}
                          className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Sent Requests Tab */}
            {tab === "sent" && (
              sent.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No sent requests pending.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sent.map((s) => (
                    <div key={s.id} className="p-4 border rounded-xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-400 rounded-full text-white flex items-center justify-center font-bold">
                          {getInitials(s.receiver_name)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{s.receiver_name}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Outgoing Request
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </main>
    </div>
  );
}