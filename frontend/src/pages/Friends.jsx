import React, { useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Search, UserPlus, UserCheck, UserX, MessageCircle, MoreHorizontal, Clock } from "lucide-react";
import Navbar from "../components/Navbar";

// ─────────────────────────────────────────────────────────
// Mock data — swap these for your real hooks, e.g.
// useFriends(), useFriendRequests(), useSentRequests()
// ─────────────────────────────────────────────────────────
const MOCK_FRIENDS = [
  { id: 1, name: "Sanjita Shrestha", mutual: 12, initials: "SS" },
  { id: 2, name: "Bikash Tamang", mutual: 4, initials: "BT" },
  { id: 3, name: "Anisha Rai", mutual: 27, initials: "AR" },
  { id: 4, name: "Prashant Gurung", mutual: 9, initials: "PG" },
  { id: 5, name: "Kriti Maharjan", mutual: 1, initials: "KM" },
  { id: 6, name: "Rojan Shakya", mutual: 15, initials: "RS" },
];

const MOCK_REQUESTS = [
  { id: 101, name: "Nisha Basnet", mutual: 6, initials: "NB" },
  { id: 102, name: "Aayush Koirala", mutual: 3, initials: "AK" },
  { id: 103, name: "Sujata Lama", mutual: 18, initials: "SL" },
];

const MOCK_SENT = [
  { id: 201, name: "Manish Dhakal", initials: "MD", sentDaysAgo: 2 },
  { id: 202, name: "Priya Shah", initials: "PS", sentDaysAgo: 5 },
];

const AVATAR_COLORS = [
  "bg-zinc-900",
  "bg-blue-600",
  "bg-blue-500",
  "bg-zinc-700",
];

function colorFor(id) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function Avatar({ initials, id, size = "w-14 h-14" }) {
  return (
    <div
      className={`${size} ${colorFor(id)} rounded-full flex items-center justify-center shrink-0`}
    >
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
      {active && (
        <span className="absolute left-0 -bottom-px h-0.5 w-full bg-blue-600 rounded-full" />
      )}
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

export default function Friends() {
  const location = useLocation();
  // Lets the navbar badge deep-link straight into a tab, e.g.
  // navigate("/friends", { state: { tab: "requests" } })
  const [tab, setTab] = useState(location.state?.tab || "friends"); // "friends" | "requests" | "sent"
  const [query, setQuery] = useState("");

  const [friends, setFriends] = useState(MOCK_FRIENDS);
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  const [sent, setSent] = useState(MOCK_SENT);

  const filteredFriends = useMemo(
    () =>
      friends.filter((f) => f.name.toLowerCase().includes(query.toLowerCase())),
    [friends, query]
  );

  const acceptRequest = (req) => {
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    setFriends((prev) => [{ ...req }, ...prev]);
  };

  const declineRequest = (id) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const cancelSent = (id) => {
    setSent((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              Friends
            </h1>
            <p className="text-gray-400 mt-1 text-sm font-medium">
              {friends.length} friend{friends.length !== 1 ? "s" : ""} &middot;{" "}
              {requests.length} pending request{requests.length !== 1 ? "s" : ""}
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

        {/* Tabs */}
        <div className="flex border-b border-gray-100 mb-6">
          <TabButton
            label="Friends"
            count={friends.length}
            active={tab === "friends"}
            onClick={() => setTab("friends")}
          />
          <TabButton
            label="Friend Requests"
            count={requests.length}
            active={tab === "requests"}
            onClick={() => setTab("requests")}
          />
          <TabButton
            label="Sent Requests"
            count={sent.length}
            active={tab === "sent"}
            onClick={() => setTab("sent")}
          />
        </div>

        {/* Friends list */}
        {tab === "friends" && (
          filteredFriends.length === 0 ? (
            <EmptyState text={query ? "No friends match that search." : "You don't have any friends yet."} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFriends.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <Avatar initials={f.initials} id={f.id} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate">{f.name}</p>
                    <p className="text-xs text-gray-400 font-medium">
                      {f.mutual} mutual friend{f.mutual !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
                    title="More"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {/* Friend requests */}
        {tab === "requests" && (
          requests.length === 0 ? (
            <EmptyState text="No pending friend requests." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar initials={r.initials} id={r.id} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 truncate">{r.name}</p>
                      <p className="text-xs text-gray-400 font-medium">
                        {r.mutual} mutual friend{r.mutual !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptRequest(r)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg py-2.5 hover:bg-blue-700 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Confirm
                    </button>
                    <button
                      onClick={() => declineRequest(r.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg py-2.5 hover:bg-gray-100 transition-colors"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Sent requests */}
        {tab === "sent" && (
          sent.length === 0 ? (
            <EmptyState text="You haven't sent any friend requests." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sent.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <Avatar initials={s.initials} id={s.id} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate">{s.name}</p>
                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Sent {s.sentDaysAgo}d ago
                    </p>
                  </div>
                  <button
                    onClick={() => cancelSent(s.id)}
                    className="text-xs font-bold text-gray-600 bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}