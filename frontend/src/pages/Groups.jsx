import React, { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, UserPlus, UserCheck, UserX, MessageCircle, MoreHorizontal, Clock, Trash2 } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { createGroupHandlers } from "../handlers/groupHandlers";
import { useGroupChat } from "../hooks/UseGroupChat";
import { groupService } from "../services/group_services";
import { resourceService } from "../services/resource_services";
import PDFViewerWithControls from "../components/PDFViewer";

const PRIMARY_BLUE = "#2C76BA";

const isPdfResource = (resource) => {
  if (resource.resource_type === "file") {
    if (resource.url?.toLowerCase().includes(".pdf")) {
      return true;
    }
    if (resource.mime_type?.toLowerCase().includes("pdf")) {
      return true;
    }
  }
  return false;
};

export default function Groups() {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const [tab, setTab] = useState(location.state?.tab || "friends");
  const [query, setQuery] = useState("");

  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 const [resources, setResources] = useState([]); // Group resources
  const [personalResources, setPersonalResources] = useState([]); // ADD THIS
  const [resourceFilter, setResourceFilter] = useState("all"); // ADD THIS
  const [addResourceModalOpen, setAddResourceModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isJoinMode, setIsJoinMode] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [directChatPanelOpen, setDirectChatPanelOpen] = useState(true);
  const [activeDirectChatId, setActiveDirectChatId] = useState(null);
  const [unreadByContact, setUnreadByContact] = useState({});
  const [resourceProgress, setResourceProgress] = useState({}); // { [resourceId]: { percent, status } }
  const latestSeqRef = useRef(0);
  const [viewingResource, setViewingResource] = useState(null);
  const [formData, setFormData] = useState({
    group_name: "",
    description: "",
    group_type: "community",
    visibility: "public",
    max_members: "",
    invite_code: "",
  });

  // Create handlers
  const handlers = createGroupHandlers({
    getToken,
    navigate,
    setGroups,
    setActiveGroup,
    setResources,
    setLoading,
    setError,
    setModalOpen,
    setFormData,
    setSubmitting,
    setIsJoinMode,
    activeGroup,
    formData,
  });

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const data = await groupService.getMyGroups(token);
      setGroups(data);
    } catch (err) {
      setError(err.message);
      if (err.message.includes("Not authenticated") || err.message.includes("401")) {
        navigate("/sign-in");
      }
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

  // Clear chat when switching groups
  useEffect(() => {
    if (activeGroupId) {
      setChatMessages([]);
      setUnreadByContact({});
      setActiveDirectChatId(firstDirectChatMemberId);
      setDirectChatPanelOpen(true);
    }
  }, [activeGroupId, firstDirectChatMemberId, user?.id]);

  useEffect(() => {
    directChatPanelOpenRef.current = directChatPanelOpen;
  }, [directChatPanelOpen]);

  useEffect(() => {
    activeDirectChatIdRef.current = activeDirectChatId;
  }, [activeDirectChatId]);
 
  //resource tracking realted
  const progressTimeoutRef = useRef(null);

  const viewingResourceRef = useRef(null);
  useEffect(() => {
    viewingResourceRef.current = viewingResource;
  }, [viewingResource]);

  const handleAutoProgressChange = useCallback(
    (percent, page, seq, totalPages) => {
      const resource = viewingResourceRef.current;
      if (!resource) return;
      if (seq < latestSeqRef.current) return;
      latestSeqRef.current = seq;

      setResourceProgress((prev) => ({
        ...prev,
        [resource.id]: { percent, status: getStatusForPercent(percent) },
      }));

      clearTimeout(progressTimeoutRef.current);
      progressTimeoutRef.current = setTimeout(async () => {
        try {
          const token = await getToken();
          const result = await resourceService.updateProgress(token, resource.id, {
            current_page: page,
            total_pages: totalPages,
          });
          setResourceProgress((prev) => ({
            ...prev,
            [resource.id]: { percent: result.progress_percentage, status: result.status },
          }));
        } catch (err) {
          console.error("Failed to auto-update progress", err);
        }
      }, 800);
    },
    [getToken]
  );

  const getStatusForPercent = (percent) => {
    if (percent >= 100) return "completed";
    if (percent > 0) return "in_progress";
    return "not_started";
  };

  const getProgressLabel = (status) => {
    if (status === "completed") return "Completed";
    if (status === "in_progress") return "In Progress";
    if (status === "paused") return "Paused";
    return "Not Started";
  };

  useEffect(() => {
    const loadAllProgress = async () => {
      if (!resources.length) return;
      try {
        const token = await getToken();
        const entries = await Promise.all(
          resources.map(async (res) => {
            try {
              const progress = await resourceService.getMyProgress(token, res.id);
              return [
                res.id,
                {
                  percent: progress?.progress_percentage || 0,
                  status: progress?.status || "not_started",
                },
              ];
            } catch {
              return [res.id, { percent: 0, status: "not_started" }];
            }
          })
        );
        setResourceProgress(Object.fromEntries(entries));
      } catch (err) {
        console.error("Failed to load resource progress", err);
      }
    };
    loadAllProgress();
  }, [resources, getToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#2C76BA] mx-auto mb-4"></div>
      </div>
    );
  }

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
              </div>

              {/* Tab Content */}
              <div className="min-h-100">
                {activeTab === "Resources" && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-gray-900">Shared Materials</h3>
                      <button
                        onClick={() => setAddResourceModalOpen(true)}
                        className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-black transition"
                      >
                        <PlusIcon className="w-3 h-3" /> Add Resource
                      </button>
                    </div>
                    
                    {resources.length === 0 ? (
                      <div className="text-center py-12 text-gray-400 text-sm">No resources shared yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {resources.map((res) => {
                          const type = res.resource_type.toLowerCase();
                          let Icon = LinkIcon;
                          if (type === "file") Icon = DocumentTextIcon;
                          if (type === "video") Icon = VideoCameraIcon;

                          return (
                            <div key={res.id} className="group flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition">
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-600 group-hover:bg-white transition">
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-gray-900">{res.title || "Untitled"}</h4>
                                  <p className="text-xs text-gray-500 truncate max-w-md">{res.description}</p>
                                  <div className="mt-3">
                                    <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                                      <span>{getProgressLabel(resourceProgress[res.id]?.status)}</span>
                                      <span>{resourceProgress[res.id]?.percent || 0}% Complete</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden w-62">
                                      <div
                                        className="h-full bg-[#2C76BA] transition-all"
                                        style={{ width: `${resourceProgress[res.id]?.percent || 0}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => {
                                    if (isPdfResource(res)) {                        // ✅ Correct detection
                                      console.log("📄 Opening PDF in internal viewer:", res.title);
                                      setViewingResource(res);
                                    } else {
                                      console.log("🔗 Opening external resource:", res.title);
                                      window.open(res.url, "_blank");
                                    }
                                  }}
                                  className="text-xs font-bold text-[#2C76BA] hover:underline"
                                >
                                  {isPdfResource(res) ? "View PDF" : "Open"}        
                                </button>
                                <button onClick={() => handlers.handleDeleteResource(res.id)} className="p-1.5 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "Members" && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h3 className="font-bold text-gray-900 mb-6">Group Members</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeGroup.members?.map((member) => (
                        <div key={member.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{member.username}</p>
                              <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{member.role}</p>
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-400">{new Date(member.joined_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "Leaderboard" && (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-20 text-center">
                    <p className="text-gray-400 font-medium">Leaderboard rankings are being calculated... 🏆</p>
                  </div>
                )}
              </div>
              </div>
            </div>
          )}
        </div>

        {/* MODALS */}
        <AddResourceModal
          isOpen={addResourceModalOpen}
          onClose={() => setAddResourceModalOpen(false)}
          onSubmit={resourceData => handlers.handleAddResource({ ...resourceData, groupId: activeGroup?.id })}
          groupId={activeGroup?.id}
        />

        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-100">
            <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{isJoinMode ? "Join a Community" : "Create a Group"}</h2>
              
              <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                <button onClick={() => setIsJoinMode(false)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${!isJoinMode ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>Create</button>
                <button onClick={() => setIsJoinMode(true)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${isJoinMode ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>Join</button>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Group Name *"
                  value={formData.group_name}
                  onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2C76BA] outline-none text-sm transition"
                />
                {!isJoinMode ? (
                  <>
                    <textarea
                      placeholder="Description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2C76BA] outline-none text-sm h-24 transition"
                    />
                    <select
                      value={formData.group_type}
                      onChange={(e) => setFormData({ ...formData, group_type: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2C76BA] outline-none text-sm transition"
                    >
                      <option value="community">Community (Public Management)</option>
                      <option value="leader_controlled">Leader Controlled</option>
                    </select>
                  </>
                ) : (
                  <input
                    type="text"
                    placeholder="Invite Code (Required for private groups)"
                    value={formData.invite_code}
                    onChange={(e) => setFormData({ ...formData, invite_code: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2C76BA] outline-none text-sm transition"
                  />
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setModalOpen(false)} 
                  className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={isJoinMode ? handlers.handleJoinGroup : handlers.handleCreateGroup} 
                  disabled={submitting}
                  className="flex-1 py-3 text-sm font-bold bg-gray-800 text-white rounded-xl hover:bg-black transition disabled:opacity-50"
                >
                  {submitting ? "..." : isJoinMode ? "Join" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
        {viewingResource && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{viewingResource.title}</h3>
                  <p className="text-xs text-gray-500 truncate">{viewingResource.description}</p>
                </div>
                <button
                  onClick={() => setViewingResource(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0 ml-2"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              
              
              {/* PDF Viewer Component */}
              <PDFViewerWithControls
                resource={viewingResource}
                onProgressChange={handleAutoProgressChange}
              />
              
              {/* Footer */}
              <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center">
                <a                                                  // ✅ Proper opening tag
                  href={viewingResource.url}
                  download
                  className="text-xs font-bold text-gray-600 hover:text-gray-900 hover:underline transition"
                >
                  Download PDF
                </a>
                <button onClick={() => setViewingResource(null)} className="px-4 py-2 text-sm font-bold text-white bg-gray-800 rounded-lg hover:bg-black transition">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}