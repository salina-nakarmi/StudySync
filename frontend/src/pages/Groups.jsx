import React, { useState, useEffect, useRef } from "react";
import {
  UsersIcon,
  PlusIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  LinkIcon,
  XMarkIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import AddResourceModal from "../components/AddResourceModal";
import Navbar from "../components/Navbar";
import { createGroupHandlers } from "../handlers/groupHandlers";
import { useGroupChat } from "../hooks/UseGroupChat";

const PRIMARY_BLUE = "#2C76BA";

export default function Groups() {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const chatContainerRef = useRef(null);

  // State
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeTab, setActiveTab] = useState("Resources");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resources, setResources] = useState([]);
  const [addResourceModalOpen, setAddResourceModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isJoinMode, setIsJoinMode] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [resourceProgressById, setResourceProgressById] = useState({});
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

  // WebSocket chat integration
  const handleNewMessage = (message) => {
    setChatMessages((prev) => [...prev, {
      id: `${Date.now()}-${message.sender_id}`,
      sender_id: message.sender_id,
      sender: message.sender_id === user?.id ? "You" : getMemberUsername(message.sender_id),
      text: message.content,
      type: message.type,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }]);

    // Auto-scroll to bottom
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleHistoryLoaded = (history) => {
    const formattedMessages = history.map((msg) => ({
      id: `${msg.sender_id}-${Date.now()}-${Math.random()}`,
      sender_id: msg.sender_id,
      sender: msg.sender_id === user?.id ? "You" : getMemberUsername(msg.sender_id),
      text: msg.content,
      type: msg.type,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }));

    setChatMessages(formattedMessages);

    // Auto-scroll to bottom
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  const { isConnected, sendMessage } = useGroupChat(
    activeGroup?.id,
    user?.id,
    getToken,
    handleNewMessage,
    handleHistoryLoaded
  );

  const getMemberUsername = (userId) => {
    const member = activeGroup?.members?.find(m => m.user_id === userId);
    return member?.username || "Unknown User";
  };

  const currentMember = activeGroup?.members?.find(
    (member) => member.user_id === user?.id
  );
  const currentUserIsLeader = currentMember?.role === "leader";
  const currentUserIsMember = Boolean(currentMember);

  // Effects
  useEffect(() => {
    if (isSignedIn) {
      handlers.loadGroups();
    } else {
      navigate("/sign-in");
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (activeGroup) {
      handlers.loadGroupDetails(activeGroup.id);
      if (activeTab === "Resources") {
        handlers.loadGroupResources(activeGroup.id);
      }
    }
  }, [activeGroup?.id, activeTab]);

  // Clear chat when switching groups
  useEffect(() => {
    if (activeGroup) {
      setChatMessages([]);
      setChatInput("");
    }
  }, [activeGroup?.id]);

  const handleSendChat = () => {
    if (!activeGroup || !chatInput.trim()) return;

    const success = sendMessage(chatInput.trim(), 'text');
    
    if (success) {
      setChatInput("");
    } else {
      console.error("Failed to send message - WebSocket not connected");
    }
  };

  const handleResourceProgressChange = (resourceId, value) => {
    setResourceProgressById((prev) => ({
      ...prev,
      [resourceId]: value,
    }));
  };

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

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {!activeGroup ? (
            /* GROUP GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.length === 0 ? (
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
              <div className="min-h-[400px]">
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
                                      <span>Progress</span>
                                      <span>{resourceProgressById[res.id] || 0}%</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0"
                                      max="100"
                                      step="1"
                                      value={resourceProgressById[res.id] || 0}
                                      onChange={(e) => handleResourceProgressChange(res.id, Number(e.target.value))}
                                      className="w-62 accent-[#2C76BA]"
                                      aria-label={`Progress for ${res.title || "resource"}`}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <a href={res.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#2C76BA] hover:underline">Open</a>
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

        {/* CHAT WIDGET - Only show when group is active and user is a member */}
        {activeGroup && currentUserIsMember && (
          <div className="fixed bottom-24 right-6 z-50">
            {!chatOpen ? (
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => setChatOpen(true)}
                  className="w-12 h-12 rounded-full bg-gray-900 text-white text-sm font-bold shadow-lg hover:bg-gray-800 transition flex items-center justify-center relative"
                  aria-label="Open group chat"
                  title="Group Chat"
                >
                  💬
                  {!isConnected && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </button>
                <span className="text-[10px] font-bold text-gray-600 bg-white border border-gray-200 rounded-full px-2 py-0.5 shadow-sm">
                  Group Chat
                </span>
              </div>
            ) : (
              <div className="w-80 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{activeGroup.group_name}</p>
                    <p className="text-[10px] text-gray-500 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </p>
                  </div>
                  <button
                    onClick={() => setChatOpen(false)}
                    className="text-xs font-bold text-gray-400 hover:text-gray-600"
                  >
                    Close
                  </button>
                </div>

                <div 
                  ref={chatContainerRef}
                  className="h-56 px-4 py-3 overflow-y-auto bg-gray-50"
                >
                  {chatMessages.length === 0 ? (
                    <p className="text-xs text-gray-400">No messages yet. Start the conversation.</p>
                  ) : (
                    <div className="space-y-3">
                      {chatMessages.map((msg) => {
                        const isSelf = msg.sender === "You";
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col gap-1 ${isSelf ? "items-end" : "items-start"}`}
                          >
                            <div className={`flex items-center gap-2 ${isSelf ? "flex-row-reverse" : ""}`}>
                              <span className="text-[10px] font-bold text-gray-500">{msg.sender}</span>
                              <span className="text-[10px] text-gray-400">{msg.time}</span>
                            </div>
                            <div
                              className={`rounded-lg px-3 py-2 text-xs max-w-[85%] break-words ${
                                isSelf
                                  ? "bg-[#2C76BA] text-white"
                                  : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="px-3 py-3 border-t border-gray-100 bg-white">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChat();
                        }
                      }}
                      placeholder={isConnected ? "Type a message..." : "Connecting..."}
                      disabled={!isConnected}
                      className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C76BA] disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={!isConnected || !chatInput.trim()}
                      className="px-3 py-2 text-xs font-bold text-white bg-[#2C76BA] rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODALS */}
        <AddResourceModal
          isOpen={addResourceModalOpen}
          onClose={() => setAddResourceModalOpen(false)}
          onSubmit={resourceData => handlers.handleAddResource({ ...resourceData, groupId: activeGroup?.id })}
          groupId={activeGroup?.id}
        />

        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100]">
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
      </div>
    </>
  );
}