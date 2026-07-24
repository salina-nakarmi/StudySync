import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  UsersIcon,
  PlusIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  LinkIcon,
  XMarkIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import AddResourceModal from "../components/AddResourceModal";
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
  const navigate = useNavigate();

  // State
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [viewMode, setViewMode] = useState("mine"); // "mine" | "discover"
  const [publicGroups, setPublicGroups] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState(null);
  const [activeTab, setActiveTab] = useState("Resources");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resources, setResources] = useState([]); // Group resources
  const [personalResources, setPersonalResources] = useState([]); // ADD THIS
  const [resourceFilter, setResourceFilter] = useState("all"); // ADD THIS
  const [addResourceModalOpen, setAddResourceModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isJoinMode, setIsJoinMode] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [isGroupChatOpen, setIsGroupChatOpen] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [resourceProgress, setResourceProgress] = useState({}); // { [resourceId]: { percent, status } }
  const latestSeqRef = useRef(0);
  const messagesEndRef = useRef(null);
  const isGroupChatOpenRef = useRef(false);
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
  }, [getToken, navigate, setError, setGroups, setLoading]);

  const loadPublicGroups = useCallback(async () => {
    try {
      setDiscoverLoading(true);
      const token = await getToken();
      const data = await groupService.getPublicGroups(token); // needs backend support
      setPublicGroups(data);
    } catch (err) {
      console.error("Error loading public groups:", err);
      setPublicGroups([]);
    } finally {
      setDiscoverLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (!activeGroup && viewMode === "discover") {
      loadPublicGroups();
    }
  }, [activeGroup, viewMode, loadPublicGroups]);

  const joinedGroupIds = new Set(groups.map((g) => g.id));
  const discoverableGroups = publicGroups.filter((g) => !joinedGroupIds.has(g.id));

  const loadGroupDetails = useCallback(async (groupId) => {
    try {
      const token = await getToken();
      const data = await groupService.getGroup(token, groupId);
      setActiveGroup(data);
    } catch (err) {
      console.error("Error loading group details:", err);
    }
  }, [getToken, setActiveGroup]);

  const handleQuickJoinGroup = async (groupId, e) => {
    e?.stopPropagation();
    try {
      setJoiningGroupId(groupId);
      setError(null);
      const token = await getToken();
      await groupService.joinGroup(token, groupId); // no invite code needed for public groups
      await loadGroups();
      setPublicGroups((prev) => prev.filter((g) => g.id !== groupId));
      if (activeGroup?.id === groupId) {
        loadGroupDetails(groupId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setJoiningGroupId(null);
    }
  };

  const loadGroupResources = useCallback(async (groupId) => {
    try {
      const token = await getToken();
      const data = await resourceService.getGroupResources(token, groupId);
      setResources(data);
    } catch (err) {
      console.error("Error loading resources:", err);
      setResources([]);
    }
  }, [getToken, setResources]);

  // WebSocket chat integration
  const getMemberDisplayName = (member) => {
    return member?.username || member?.full_name || member?.name || "Unknown User";
  };

  const getMessageTimestamp = (message) => {
    const rawTimestamp = message?.created_at || message?.timestamp || message?.sent_at || message?.time;
    const parsedTimestamp = rawTimestamp ? new Date(rawTimestamp) : new Date();
    return Number.isNaN(parsedTimestamp.getTime()) ? Date.now() : parsedTimestamp.getTime();
  };

  const getMemberUsername = (userId) => {
    const member = activeGroup?.members?.find((m) => m.user_id === userId);
    return getMemberDisplayName(member);
  };

  const handleNewMessage = (message) => {
    const createdAt = getMessageTimestamp(message);
    const isSelfMessage = message.sender_id === user?.id;

    setChatMessages((prev) => [...prev, {
      id: `${Date.now()}-${message.sender_id}`,
      sender_id: message.sender_id,
      sender: message.sender_id === user?.id ? "You" : getMemberUsername(message.sender_id),
      text: message.content,
      type: message.type,
      createdAt,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }]);

    if (!isSelfMessage && !isGroupChatOpenRef.current) {
      setUnreadCount((prev) => prev + 1);
    }
  };

  const handleHistoryLoaded = (history) => {
    const formattedMessages = (history || []).map((msg) => ({
      id: `${msg.sender_id}-${Date.now()}-${Math.random()}`,
      sender_id: msg.sender_id,
      sender: msg.sender_id === user?.id ? "You" : getMemberUsername(msg.sender_id),
      text: msg.content,
      type: msg.type,
      createdAt: getMessageTimestamp(msg),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }));

    setChatMessages(formattedMessages);
  };

  const { isConnected, sendMessage } = useGroupChat(
    activeGroup?.id,
    user?.id,
    getToken,
    handleNewMessage,
    handleHistoryLoaded
  );

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!messageInput.trim()) return;

    setSendingMessage(true);
    const success = sendMessage(messageInput.trim(), "text");
    if (success) {
      setMessageInput("");
    }
    setSendingMessage(false);
  };

  const currentMember = activeGroup?.members?.find(
    (member) => member.user_id === user?.id
  );
  const currentUserIsLeader = currentMember?.role === "leader";
  const currentUserIsMember = Boolean(currentMember);

  // Effects
  useEffect(() => {
    if (isSignedIn) {
      loadGroups();
    } else {
      navigate("/sign-in");
    }
  }, [isSignedIn, loadGroups, navigate]);

  useEffect(() => {
    if (activeGroup?.id) {
      loadGroupDetails(activeGroup.id);
      if (activeTab === "Resources") {
        loadGroupResources(activeGroup.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroup?.id, activeTab, loadGroupDetails, loadGroupResources]);

  // Clear chat when switching groups
  useEffect(() => {
    if (activeGroup?.id) {
      setChatMessages([]);
      setUnreadCount(0);
      setIsGroupChatOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroup?.id]);

  useEffect(() => {
    isGroupChatOpenRef.current = isGroupChatOpen;
    if (isGroupChatOpen) {
      setUnreadCount(0);
    }
  }, [isGroupChatOpen]);

  // Auto-scroll chat to the latest message
  useEffect(() => {
    if (isGroupChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isGroupChatOpen]);

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
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
        <div className="px-4 sm:px-6 lg:px-40 mt-28 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeGroup ? activeGroup.group_name : "My Groups"}
            </h1>
            {!activeGroup && (
              <button
                onClick={() => { setModalOpen(true); setIsJoinMode(false); }}
                className="px-4 py-2 bg-gray-800 text-white rounded-full text-sm font-medium shadow-md hover:bg-gray-900 transition flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" /> Create / Join
              </button>
            )}
          </div>

          {!activeGroup && (
            <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
              <button
                onClick={() => setViewMode("mine")}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
                  viewMode === "mine" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                My Groups
              </button>
              <button
                onClick={() => setViewMode("discover")}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
                  viewMode === "discover" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                Discover Public Groups
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {!activeGroup ? (
            /* GROUP GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {viewMode === "mine" ? (
                groups.length === 0 ? (
                  <div className="col-span-full text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">You haven't joined any groups yet.</p>
                  </div>
                ) : (
                  groups.map((group) => (
                    <div
                      key={group.id}
                      onClick={() => setActiveGroup(group)}
                      className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg transition cursor-pointer flex flex-col h-full"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          <UsersIcon className="w-6 h-6 text-gray-600" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 px-2 py-1 rounded text-gray-600">
                          {group.group_type}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1">{group.group_name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                        {group.description || "No description provided."}
                      </p>
                      <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                        <span>{group.member_count} Members</span>
                        <span className="text-[#2C76BA] font-medium">View Group →</span>
                      </div>
                    </div>
                  ))
                )
              ) : discoverLoading ? (
                <div className="col-span-full flex justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#2C76BA]"></div>
                </div>
              ) : discoverableGroups.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No new public groups to discover right now.</p>
                </div>
              ) : (
                discoverableGroups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => setActiveGroup(group)}
                    className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg transition cursor-pointer flex flex-col h-full"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        <UsersIcon className="w-6 h-6 text-gray-600" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 px-2 py-1 rounded text-gray-600">
                        {group.group_type}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{group.group_name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                      {group.description || "No description provided."}
                    </p>
                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 mb-3">
                      <span>{group.member_count} Members</span>
                      <span className="capitalize">{group.group_type?.replace("_", " ")}</span>
                    </div>
                    <button
                      onClick={(e) => handleQuickJoinGroup(group.id, e)}
                      disabled={joiningGroupId === group.id}
                      className="w-full py-2 text-sm font-bold text-white bg-[#2C76BA] rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {joiningGroupId === group.id ? "Joining..." : "Join Group"}
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* ACTIVE GROUP DETAIL VIEW */
            <div className="flex flex-col gap-6">

              {/* Header Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 relative">
                <button 
                  onClick={() => setActiveGroup(null)} 
                  className="text-xs font-bold text-gray-400 hover:text-gray-600 mb-4 block"
                >
                  ← BACK TO ALL GROUPS
                </button>
                
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{activeGroup.group_name}</h2>
                    <p className="text-gray-500 mt-1 max-w-2xl">{activeGroup.description}</p>
                    
                    <div className="flex gap-4 mt-4 text-xs font-medium text-gray-600 flex-wrap">
                      <span className="bg-gray-100 px-3 py-1 rounded-full">
                        {activeGroup.member_count} Members
                      </span>
                      
                      <span className="bg-gray-100 px-3 py-1 rounded-full capitalize">
                        {activeGroup.visibility}
                      </span>
                      
                      <span className="bg-gray-100 px-3 py-1 rounded-full capitalize">
                        {activeGroup.group_type?.replace('_', ' ')}
                      </span>
                      
                      {/* WebSocket Connection Status */}
                      <span className={`px-3 py-1 rounded-full flex items-center gap-2 ${
                        isConnected ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          isConnected ? 'bg-green-500' : 'bg-gray-400'
                        }`}></span>
                        Chat {isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                      
                      {/* Invite Code Display */}
                      {activeGroup.visibility === "private" && activeGroup.invite_code && (
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                          <span className="text-blue-700 font-bold">
                            Invite Code: {activeGroup.invite_code}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(activeGroup.invite_code);
                              alert("Invite code copied to clipboard!");
                            }}
                            className="text-blue-600 hover:text-blue-800 transition"
                            title="Copy to clipboard"
                          >
                            <svg 
                              className="w-4 h-4" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Invite Code Info Box for Leaders */}
                    {activeGroup.visibility === "private" && 
                     activeGroup.invite_code && 
                     currentUserIsLeader && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <p className="text-xs text-blue-700">
                          <strong>💡 Share this code:</strong> Members can use this invite code to join your private group.
                          {activeGroup.group_type === "leader_controlled" && 
                            " Only leaders can add resources."
                          }
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {currentUserIsLeader ? (
                      <button 
                        onClick={() => handlers.handleDeleteGroup(activeGroup.id)} 
                        className="px-4 py-2 text-sm font-bold text-red-600 border border-red-100 rounded-lg hover:bg-red-50"
                      >
                        Delete Group
                      </button>
                    ) : currentUserIsMember ? (
                      <button 
                        onClick={() => handlers.handleLeaveGroup(activeGroup.id)} 
                        className="px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        Leave Group
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setModalOpen(true);
                          setIsJoinMode(true);
                        }}
                        className="px-4 py-2 text-sm font-bold text-white bg-[#2C76BA] rounded-lg hover:bg-blue-700"
                      >
                        Join Group
                      </button>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 mt-8 border-b border-gray-100">
                  {["Resources", "Members", "Leaderboard"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 text-sm font-bold transition-all ${
                        activeTab === tab 
                          ? "text-gray-900 border-b-2 border-[#2C76BA]" 
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      {tab}
                    </button>
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
                                    if (isPdfResource(res)) {
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
                <a
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

        {/* ===== FLOATING GROUP CHAT (Facebook-style) ===== */}
        {activeGroup && (
          <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
            {/* Chat Window (when open) */}
            {isGroupChatOpen && (
              <div className="mb-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Chat Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#2C76BA] text-white">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <UsersIcon className="w-5 h-5" />
                      {isConnected && (
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{activeGroup.group_name}</p>
                      <p className="text-[10px] text-blue-100">
                        {isConnected ? `${activeGroup.member_count} members • Live` : "Disconnected"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsGroupChatOpen(false)}
                    className="p-1 hover:bg-white/20 rounded-lg transition"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Messages Area */}
                <div className="h-72 overflow-y-auto p-3 space-y-2 bg-gray-50">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-xs">
                      <p>No messages yet.</p>
                      <p className="mt-1">Say hello to the group!</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, index) => {
                      const isSelf = msg.sender_id === user?.id;
                      const showSender = index === 0 || chatMessages[index - 1]?.sender_id !== msg.sender_id;
                      return (
                        <div key={msg.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] ${isSelf ? "items-end" : "items-start"} flex flex-col`}>
                            {showSender && !isSelf && (
                              <span className="text-[10px] text-gray-500 mb-0.5 ml-1">{msg.sender}</span>
                            )}
                            <div className={`px-3 py-1.5 text-xs rounded-2xl ${
                              isSelf 
                                ? "bg-[#2C76BA] text-white rounded-br-md" 
                                : "bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100"
                            }`}>
                              <p>{msg.text}</p>
                            </div>
                            <span className={`text-[9px] text-gray-400 mt-0.5 ${isSelf ? "mr-1" : "ml-1"}`}>
                              {msg.time}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-2 border-t border-gray-100 bg-white">
                  <form onSubmit={handleSendMessage} className="flex gap-1.5">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2C76BA] focus:border-transparent outline-none transition"
                      disabled={!isConnected || sendingMessage}
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim() || !isConnected || sendingMessage}
                      className="px-3 py-1.5 bg-[#2C76BA] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </form>
                  {!isConnected && (
                    <p className="text-[9px] text-red-500 mt-1 text-center">Disconnected</p>
                  )}
                </div>
              </div>
            )}

            {/* Toggle Button (when closed) */}
            {!isGroupChatOpen && (
              <button
                onClick={() => setIsGroupChatOpen(true)}
                className="flex items-center gap-2 px-4 py-3 bg-[#2C76BA] text-white rounded-full shadow-lg hover:bg-blue-700 transition hover:shadow-xl"
              >
                <div className="relative">
                  <UsersIcon className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold">Group Chat</span>
                {isConnected && (
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}