import React, { useMemo, useState, useEffect, useRef } from "react"; // Added useEffect and useRef
import {
  ArrowPathIcon,
  CameraIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentIcon,
  EllipsisVerticalIcon,
  ArchiveBoxIcon,
  BellSlashIcon,
  BookmarkIcon,
  ChatBubbleLeftEllipsisIcon,
  MicrophoneIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  PhoneIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  StarIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  UserGroupIcon,
  UserPlusIcon,
  PlusIcon,
  XMarkIcon,
  UserGroupIcon,
  UserPlusIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import Navbar from "../components/Navbar";

const PRIMARY_BLUE = "#2C76BA";
const QUICK_REPLIES = ["I'm on it.", "Let's do a call.", "Sending the file now.", "Voice note coming up."];

// Define your missing data arrays down here so the component can read them:
const INITIAL_GROUPS = []; 
const friends = []; // Added to satisfy the AddMember/CreateGroup modal props
export default function Messages() {
  const { user } = useUser();
  const myUserId = user?.id || "";

  // Dynamic State
  const [conversations, setConversations] = useState([]);
  const [selectedFriendId, setSelectedFriendId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  
  // UI Interaction States
  const [selectedMessageMenuIndex, setSelectedMessageMenuIndex] = useState(null);
  const [showConversationMenu, setShowConversationMenu] = useState(false);
  const [mutedConversations, setMutedConversations] = useState([]);
  const [actionBanner, setActionBanner] = useState(null);
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  // Persistent WebSocket Reference
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // --- 1. FETCH CONVERSATIONS SIDEBAR ---
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoadingConversations(true);
        const apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
        const response = await axios.get(`${apiBase}/api/chat/conversations`);
        setConversations(response.data);
        
        // Default select the most recently active friend
        if (response.data.length > 0) {
          setSelectedFriendId(response.data[0].friend_id);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
        pushBanner("Failed to load friend list.");
      } finally {
        setLoadingConversations(false);
      }
    };

    if (myUserId) {
      fetchConversations();
    }
  }, [myUserId]);

  // --- 2. WEBSOCKET MESSAGE SYNC PIPELINE ---
  useEffect(() => {
    if (!selectedFriendId || !myUserId) return;

    const apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
    // Convert http(s) URL scheme structure to native ws(s) matching your backend fix
    const wsBase = apiBase.replace(/^http/, "ws");
    const wsUrl = `${wsBase}/api/ws/dm/${myUserId}/${selectedFriendId}`;
    
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log(`Connected to live DM sync node: friend_${selectedFriendId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle full history payload sent immediately on connection
        if (data.type === "history") {
          setChatMessages(data.messages || []);
        } 
        // Handle incoming transient direct messages
        else if (data.type === "message") {
          setChatMessages((prev) => [...prev, data.message]);
          
          // Move the active conversation to the top of the sidebar list locally
          setConversations((prevList) => {
            const index = prevList.findIndex((c) => c.friend_id === selectedFriendId);
            if (index === -1) return prevList;
            const updated = [...prevList];
            updated[index].latest_message_preview = data.message.content;
            updated[index].latest_message_time = data.message.created_at;
            const [movedItem] = updated.splice(index, 1);
            return [movedItem, ...updated];
          });
        }
      } catch (err) {
        console.error("Error parsing incoming socket frame:", err);
      }
    };

    ws.onerror = (error) => console.error("WebSocket Error:", error);
    ws.onclose = () => console.log("Disconnected from live DM sync node.");

    return () => {
      ws.close();
    };
  }, [selectedFriendId, myUserId]);

  // --- 3. AUTO SCROLL TO BOTTOM ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // --- 4. COMPUTED PROPERTIES ---
  const selectedFriend = useMemo(() => {
    return conversations.find((f) => f.friend_id === selectedFriendId) || null;
  }, [selectedFriendId, conversations]);

  const visibleFriends = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((f) =>
      [f.username, f.latest_message_preview].join(" ").toLowerCase().includes(q)
    );
  }, [searchQuery, conversations]);

  const isMuted = selectedFriend ? mutedConversations.includes(selectedFriend.friend_id) : false;

  // --- 5. ACTION HANDLERS ---
  const pushBanner = (msg) => {
    setActionBanner(msg);
    setTimeout(() => setActionBanner(null), 3000);
  };

  const handleSendMessage = () => {
    const text = draftMessage.trim();
    if (!text && !uploadedFile) {
      pushBanner("Add a message or file before sending.");
      return;
    }

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      pushBanner("Chat disconnected. Restoring connection...");
      return;
    }

    // Assemble payload matching the backend routing architecture expect flags
    const payload = {
      action: "send_message",
      payload: {
        receiver_id: selectedFriendId,
        content: text || `Shared file: ${uploadedFile?.name}`
      }
    };

    socketRef.current.send(JSON.stringify(payload));
    setDraftMessage("");
    setUploadedFile(null);
    setSelectedMessageMenuIndex(null);
  };

  const handleCallAction = (type) => pushBanner(`${type} coordination requires WebRTC integration layer.`);
  
  const handleVoiceMessage = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({
      action: "send_message",
      payload: { receiver_id: selectedFriendId, content: "🎙 Voice message" }
    }));
  };

  const handleDeleteMessage = (idx) => {
    pushBanner("Message mutation requires action event transmission via socket framework.");
    setSelectedMessageMenuIndex(null);
  };

  const handleCopyMessage = async (text) => {
    try { 
      await navigator.clipboard.writeText(text); 
      pushBanner("Copied to clipboard."); 
    } catch { 
      pushBanner("Could not copy message."); 
    } finally { 
      setSelectedMessageMenuIndex(null); 
    }
  };

  const handleReplyToMessage = (text) => {
    setDraftMessage(`↩ ${text} \n`);
    pushBanner("Reply loaded into composer.");
    setSelectedMessageMenuIndex(null);
  };

  const handleMuteConversation = () => {
    if (!selectedFriend) return;
    setMutedConversations((prev) =>
      prev.includes(selectedFriend.friend_id) 
        ? prev.filter((id) => id !== selectedFriend.friend_id) 
        : [...prev, selectedFriend.friend_id]
    );
    pushBanner(isMuted ? "Conversation unmuted." : "Conversation muted.");
    setShowConversationMenu(false);
  };

const handleAddMember = (memberName) => {
    // Fail-safe check if isGroup or selectedFriend metadata isn't set yet
    if (typeof isGroup !== 'undefined' && isGroup) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === selectedFriend?.id && !g.members.includes(memberName)
            ? { ...g, members: [...g.members, memberName] }
            : g
        )
      );
      pushBanner(`${memberName} added to ${selectedFriend?.username}.`);
    } else if (selectedFriend) {
      const id = `group-${Date.now()}`;
      const newGroup = {
        id,
        name: `${selectedFriend.username}, ${memberName}`,
        type: "group",
        members: [selectedFriend.username, memberName],
        avatar: selectedFriend.username.slice(0, 2).toUpperCase(),
        avatarColor: "bg-indigo-100 text-indigo-700",
        preview: "Group created",
        lastSeen: "Just now",
        messages: [],
      };
      setGroups((prev) => [...prev, newGroup]);
      setSelectedFriendId(id);
      pushBanner(`Group created with ${selectedFriend.username} and ${memberName}.`);
    }
    setShowAddMember(false);
  };

  const handleCreateGroup = (name, memberNames) => {
    const id = `group-${Date.now()}`;
    const newGroup = {
      id,
      name,
      type: "group",
      members: memberNames,
      avatar: name.slice(0, 2).toUpperCase(),
      avatarColor: "bg-indigo-100 text-indigo-700",
      preview: "Group created",
      lastSeen: "Just now",
      messages: [],
    };
    setGroups((prev) => [...prev, newGroup]);
    setChatMessagesByFriend((prev) => ({ ...prev, [id]: [] }));
    setSelectedFriendId(id);
    setShowCreateGroup(false);
    pushBanner(`Group "${name}" created.`);
  };

  return (
    <div className="h-screen overflow-hidden bg-white">
    <div className="h-screen overflow-hidden bg-white">
      <Navbar />

      <main className="h-[calc(100vh-64px)] mt-16 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
      <main className="h-[calc(100vh-64px)] mt-16 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex justify-between items-center py-3 shrink-0">
        <div className="flex justify-between items-center py-3 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            <p className="text-sm text-gray-500">Direct messages with your study network</p>
          </div>
        </div>

        {/* Layout */}
        <div className="flex-1 min-h-0 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] pb-4">
        <div className="flex-1 min-h-0 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] pb-4">

          {/* Sidebar */}
          <aside className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow-sm min-h-0">
          <aside className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow-sm min-h-0">
            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search..."
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
                />
              </div>
            </div>

            {/* Friend List View */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {loadingConversations ? (
                <div className="flex items-center justify-center py-10">
                  <ArrowPathIcon className="h-6 w-6 text-gray-400 animate-spin" />
                </div>
              ) : visibleFriends.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
                  No accepted friend networks active.
                </div>
              ) : (
                visibleFriends.map((friend) => {
                  const isActive = friend.friend_id === selectedFriendId;
                  return (
                    <button
                      key={friend.friend_id}
                      onClick={() => setSelectedFriendId(friend.friend_id)}
                      className={`w-full text-left rounded-xl p-3 transition-all border ${
                        isActive
                          ? "border-[#2C76BA] bg-blue-50/60"
                          : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="h-11 w-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold border border-gray-200">
                            {friend.username.substring(0, 2).toUpperCase()}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-bold text-sm text-gray-900 truncate">{friend.username}</p>
                            {friend.latest_message_time && (
                              <span className="text-[10px] text-gray-400 shrink-0">
                                {new Date(friend.latest_message_time).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 truncate mt-0.5">
                            {friend.latest_message_preview || "No messages exchanged yet."}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Chat Panel */}
          <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
            {selectedFriend ? (
              <>
                {/* Chat Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold border border-gray-200">
                      {selectedFriend.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-gray-900">{selectedFriend.username}</h2>
                        <StarIcon className="h-4 w-4 text-amber-400" />
                        {isMuted && (
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">MUTED</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{selectedFriend.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCallAction("Voice call")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                    >
                      <PhoneIcon className="h-3.5 w-3.5" /> Call
                    </button>
                    <button
                      onClick={() => handleCallAction("Video call")}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-white hover:opacity-90 transition"
                      style={{ backgroundColor: PRIMARY_BLUE }}
                    >
                      <VideoCameraIcon className="h-3.5 w-3.5" /> Video
                    </button>

                    {/* Options Trigger */}
                    <div className="relative">
                      <button
                        onClick={() => setShowConversationMenu((p) => !p)}
                        className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-50 transition"
                      >
                        <EllipsisVerticalIcon className="h-4 w-4" />
                      </button>
                      {showConversationMenu && (
                        <div className="absolute right-0 top-11 z-20 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                          <button onClick={handleMuteConversation} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50">
                            <BellSlashIcon className="h-4 w-4 text-gray-400" /> {isMuted ? "Unmute" : "Mute conversation"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Toast Notification Banner */}
                {actionBanner && (
                  <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm text-gray-600">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 shrink-0" />
                    {actionBanner}
                  </div>
                )}

                {/* Chat Bubbles Dynamic Output */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-16">
                      <ChatBubbleLeftRightIcon className="h-10 w-10 mb-3 text-gray-200" />
                      <p className="text-sm font-medium">No messages yet</p>
                      <p className="text-xs mt-1">Start the conversation below</p>
                    </div>
                  ) : (
                    chatMessages.map((message, index) => {
                      const isMine = String(message.sender_id) === String(myUserId);
                      const isMenuOpen = selectedMessageMenuIndex === index;

                      return (
                        <div key={index} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className="group relative max-w-[75%]">
                            <button
                              onClick={() => setSelectedMessageMenuIndex(isMenuOpen ? null : index)}
                              className={`absolute ${isMine ? "-left-8" : "-right-8"} top-2 rounded-full border border-gray-200 bg-white p-1.5 text-gray-400 opacity-0 shadow-sm transition group-hover:opacity-100`}
                            >
                              <EllipsisVerticalIcon className="h-3.5 w-3.5" />
                            </button>

                            {/* Message Context Menus */}
                            {isMenuOpen && (
                              <div className={`absolute top-0 z-20 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl ${isMine ? "right-full mr-2" : "left-full ml-2"}`}>
                                <button onClick={() => handleReplyToMessage(message.content)} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                                  <ArrowUturnLeftIcon className="h-3.5 w-3.5 text-gray-400" /> Reply
                                </button>
                                <button onClick={() => handleCopyMessage(message.content)} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                                  <ClipboardDocumentIcon className="h-3.5 w-3.5 text-gray-400" /> Copy
                                </button>
                                <div className="border-t border-gray-100" />
                                <button onClick={() => handleDeleteMessage(index)} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                                  <TrashIcon className="h-3.5 w-3.5" /> Delete
                                </button>
                              </div>
                            )}

                            <div 
                              className={`rounded-2xl px-4 py-2.5 ${isMine ? "text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"}`} 
                              style={isMine ? { backgroundColor: PRIMARY_BLUE } : {}}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                              <p className={`mt-1 text-[10px] ${isMine ? "text-blue-100" : "text-gray-400"}`}>
                                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Composer Text Form */}
                <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50/50">
                  <div className="flex flex-wrap gap-2">
                    {QUICK_REPLIES.map((reply) => (
                      <button
                        key={reply}
                        onClick={() => setDraftMessage(reply)}
                        className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:border-[#2C76BA] hover:text-[#2C76BA] transition"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3 items-end">
                    <div className="flex-1 rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
                      <textarea
                        rows={1}
                        value={draftMessage}
                        onChange={(e) => setDraftMessage(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        placeholder={`Message ${selectedFriend.username}...`}
                        className="w-full resize-none bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                      />

                      <div className="mt-1.5 flex items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-100 transition">
                          <PaperClipIcon className="h-3.5 w-3.5" /> Attach
                          <input type="file" className="hidden" onChange={(e) => setUploadedFile(e.target.files?.[0] || null)} />
                        </label>
                        <button onClick={handleVoiceMessage} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-100 transition">
                          <MicrophoneIcon className="h-3.5 w-3.5" /> Voice
                        </button>
                        <button onClick={() => pushBanner("Camera initialized.")} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-100 transition">
                          <CameraIcon className="h-3.5 w-3.5" /> Camera
                        </button>
                        {uploadedFile && (
                          <span className="text-xs text-gray-500 truncate max-w-30">📎 {uploadedFile.name}</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleSendMessage}
                      className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-sm hover:opacity-90 transition"
                      style={{ backgroundColor: "#0f172a" }}
                    >
                      <PaperAirplaneIcon className="h-4 w-4" /> Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                <ChatBubbleLeftRightIcon className="h-12 w-12 mb-2 text-gray-200" />
                <p className="text-sm">Select an accepted friend thread to start talking.</p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Add Member Modal */}
      {showAddMember && (
        <AddMemberModal
          friends={friends}
          existingMembers={isGroup ? (selectedFriend.members || []) : [selectedFriend.name]}
          onAdd={handleAddMember}
          onClose={() => setShowAddMember(false)}
        />
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroupModal
          friends={friends}
          onCreate={handleCreateGroup}
          onClose={() => setShowCreateGroup(false)}
        />
      )}
    </div>
  );
}

function CreateGroupModal({ friends, onCreate, onClose }) {
  const [groupName, setGroupName] = useState("");
  const [selected, setSelected] = useState([]);

  const toggle = (name) =>
    setSelected((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);

  const handleSubmit = () => {
    if (!groupName.trim()) return;
    if (selected.length < 1) return;
    onCreate(groupName.trim(), selected);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-gray-500" />
            <h3 className="text-base font-bold text-gray-900">Create Group</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <XMarkIcon className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Group name */}
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Group name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. CS Study Group"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#2C76BA] transition-colors"
            />
          </div>

          {/* Member selection */}
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Add members</label>
            <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              {friends.map((f) => {
                const checked = selected.includes(f.name);
                return (
                  <button
                    key={f.id}
                    onClick={() => toggle(f.name)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${
                      checked ? "border-[#2C76BA] bg-blue-50/60" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-full ${f.avatarColor} flex items-center justify-center text-xs font-bold border border-gray-200 shrink-0`}>
                      {f.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{f.name}</p>
                      <p className="text-[11px] text-gray-400">{f.role}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                      checked ? "border-[#2C76BA] bg-[#2C76BA]" : "border-gray-300"
                    }`}>
                      {checked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {selected.length > 0 && (
              <p className="text-[11px] text-gray-400 mt-1.5">{selected.length} member{selected.length > 1 ? "s" : ""} selected</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-100 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!groupName.trim() || selected.length === 0}
            className="px-4 py-2 text-sm font-bold bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}

function AddMemberModal({ friends, existingMembers, onAdd, onClose }) {
  const available = friends.filter((f) => !existingMembers.includes(f.name));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UserPlusIcon className="h-5 w-5 text-gray-500" />
            <h3 className="text-base font-bold text-gray-900">Add Member</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <XMarkIcon className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <div className="px-5 py-4">
          {available.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">All friends are already in this group.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Select a friend to add</p>
              {available.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onAdd(f.name)}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-[#2C76BA] hover:bg-blue-50/50 transition-all text-left"
                >
                  <div className={`h-9 w-9 rounded-full ${f.avatarColor} flex items-center justify-center text-xs font-bold border border-gray-200 shrink-0`}>
                    {f.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{f.name}</p>
                    <p className="text-[11px] text-gray-400">{f.role}</p>
                  </div>
                  <PlusIcon className="h-4 w-4 text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            Close
          </button>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <AddMemberModal
          friends={friends}
          existingMembers={isGroup ? (selectedFriend.members || []) : [selectedFriend.name]}
          onAdd={handleAddMember}
          onClose={() => setShowAddMember(false)}
        />
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroupModal
          friends={friends}
          onCreate={handleCreateGroup}
          onClose={() => setShowCreateGroup(false)}
        />
      )}
    </div>
  );
}

function CreateGroupModal({ friends, onCreate, onClose }) {
  const [groupName, setGroupName] = useState("");
  const [selected, setSelected] = useState([]);

  const toggle = (name) =>
    setSelected((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);

  const handleSubmit = () => {
    if (!groupName.trim()) return;
    if (selected.length < 1) return;
    onCreate(groupName.trim(), selected);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-gray-500" />
            <h3 className="text-base font-bold text-gray-900">Create Group</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <XMarkIcon className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Group name */}
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Group name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. CS Study Group"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#2C76BA] transition-colors"
            />
          </div>

          {/* Member selection */}
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Add members</label>
            <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              {friends.map((f) => {
                const checked = selected.includes(f.name);
                return (
                  <button
                    key={f.id}
                    onClick={() => toggle(f.name)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${
                      checked ? "border-[#2C76BA] bg-blue-50/60" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-full ${f.avatarColor} flex items-center justify-center text-xs font-bold border border-gray-200 shrink-0`}>
                      {f.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{f.name}</p>
                      <p className="text-[11px] text-gray-400">{f.role}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                      checked ? "border-[#2C76BA] bg-[#2C76BA]" : "border-gray-300"
                    }`}>
                      {checked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {selected.length > 0 && (
              <p className="text-[11px] text-gray-400 mt-1.5">{selected.length} member{selected.length > 1 ? "s" : ""} selected</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-100 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!groupName.trim() || selected.length === 0}
            className="px-4 py-2 text-sm font-bold bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}

function AddMemberModal({ friends, existingMembers, onAdd, onClose }) {
  const available = friends.filter((f) => !existingMembers.includes(f.name));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UserPlusIcon className="h-5 w-5 text-gray-500" />
            <h3 className="text-base font-bold text-gray-900">Add Member</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <XMarkIcon className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <div className="px-5 py-4">
          {available.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">All friends are already in this group.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Select a friend to add</p>
              {available.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onAdd(f.name)}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-[#2C76BA] hover:bg-blue-50/50 transition-all text-left"
                >
                  <div className={`h-9 w-9 rounded-full ${f.avatarColor} flex items-center justify-center text-xs font-bold border border-gray-200 shrink-0`}>
                    {f.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{f.name}</p>
                    <p className="text-[11px] text-gray-400">{f.role}</p>
                  </div>
                  <PlusIcon className="h-4 w-4 text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

