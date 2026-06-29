import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  ArrowUpRightIcon,
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
} from "@heroicons/react/24/outline";
import { useUser } from "@clerk/clerk-react";
import Navbar from "../components/Navbar";

const PRIMARY_BLUE = "#2C76BA";

const friends = [
  {
    id: "maya",
    name: "Avi",
    role: "Study partner",
    status: "Online now",
    statusColor: "bg-green-500",
    avatar: "MK",
    avatarColor: "bg-blue-100 text-blue-700",
    preview: "Shared the new project outline.",
    lastSeen: "2m ago",
    messages: [
      { from: "Avi", text: "Are you free for a quick revision round?", time: "09:14 AM" },
      { from: "me", text: "Yes, I can join after class.", time: "09:16 AM" },
      { from: "Avi", text: "Great. I also sent the notes file.", time: "09:18 AM" },
    ],
  },
  {
    id: "ali",
    name: "Ali ",
    role: "Project teammate",
    status: "Typing...",
    statusColor: "bg-yellow-400",
    avatar: "AR",
    avatarColor: "bg-emerald-100 text-emerald-700",
    preview: "Voice note: check the backend demo.",
    lastSeen: "18m ago",
    messages: [
      { from: "ali", text: "I pushed the latest build to the branch.", time: "Yesterday" },
      { from: "me", text: "I'll review it tonight.", time: "Yesterday" },
      { from: "ali", text: "Perfect. Send feedback in the chat.", time: "Yesterday" },
    ],
  },
  {
    id: "sara",
    name: "Sara Karki",
    role: "Course mate",
    status: "Away",
    statusColor: "bg-gray-300",
    avatar: "SA",
    avatarColor: "bg-orange-100 text-orange-700",
    preview: "Uploaded a reference PDF.",
    lastSeen: "1h ago",
    messages: [
      { from: "sara", text: "Can you share the slide deck?", time: "Monday" },
      { from: "me", text: "Uploading it here now.", time: "Monday" },
      { from: "sara", text: "Thanks, got it.", time: "Monday" },
    ],
  },
];

const INITIAL_GROUPS = [
  {
    id: "group-cs",
    name: "CS Study Group",
    type: "group",
    members: ["Avi", "Ali", "Sara Karki"],
    avatar: "CS",
    avatarColor: "bg-purple-100 text-purple-700",
    preview: "Let's meet tomorrow at 5pm",
    lastSeen: "1h ago",
    messages: [
      { from: "Avi", text: "Hey everyone, chapter 5 quiz is tomorrow!", time: "10:00 AM" },
      { from: "me", text: "I'm ready, been revising all morning.", time: "10:05 AM" },
      { from: "Ali", text: "Let's do a quick call at 4?", time: "10:08 AM" },
    ],
  },
];

const quickReplies = ["I'm on it.", "Let's do a call.", "Sending the file now.", "Voice note coming up."];

export default function Messages() {
  const { user } = useUser();
  const [selectedFriendId, setSelectedFriendId] = useState(friends[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [chatMessagesByFriend, setChatMessagesByFriend] = useState(
    Object.fromEntries([...friends, ...INITIAL_GROUPS].map((f) => [f.id, f.messages]))
  );
  const [selectedMessageMenuIndex, setSelectedMessageMenuIndex] = useState(null);
  const [showConversationMenu, setShowConversationMenu] = useState(false);
  const [mutedConversations, setMutedConversations] = useState([]);
  const [actionBanner, setActionBanner] = useState(null);
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const selectedFriend = useMemo(
    () => friends.find((f) => f.id === selectedFriendId) || groups.find((g) => g.id === selectedFriendId) || friends[0],
    [selectedFriendId, groups]
  );
  const isGroup = selectedFriend?.type === "group";

  const visibleFriends = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((f) =>
      [f.name, f.role, f.status, f.preview].join(" ").toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const selectedMessages = useMemo(
    () => chatMessagesByFriend[selectedFriend.id] || [],
    [chatMessagesByFriend, selectedFriend.id]
  );
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedMessages, selectedFriendId]);
  const isMuted = mutedConversations.includes(selectedFriend.id);

  const pushBanner = (msg) => {
    setActionBanner(msg);
    setTimeout(() => setActionBanner(null), 3000);
  };

  const updateSelectedFriendMessages = (updater) => {
    setChatMessagesByFriend((prev) => ({
      ...prev,
      [selectedFriend.id]: updater(prev[selectedFriend.id] || []),
    }));
  };

  const handleSendMessage = () => {
    const text = draftMessage.trim();
    if (!text && !uploadedFile) {
      pushBanner("Add a message or file before sending.");
      return;
    }
    const next = [...selectedMessages];
    if (text) next.push({ from: "me", text, time: "Just now" });
    if (uploadedFile) next.push({ from: "me", text: `Shared file: ${uploadedFile.name}`, time: "Just now" });
    setChatMessagesByFriend((prev) => ({ ...prev, [selectedFriend.id]: next }));
    setDraftMessage("");
    setUploadedFile(null);
    setSelectedMessageMenuIndex(null);
    pushBanner(`Message sent to ${selectedFriend.name}.`);
  };

  const handleCallAction = (type) => pushBanner(`${type} started with ${selectedFriend.name}.`);
  const handleVoiceMessage = () => {
    const next = [...selectedMessages, { from: "me", text: "🎙 Voice message", time: "Just now" }];
    setChatMessagesByFriend((prev) => ({ ...prev, [selectedFriend.id]: next }));
    pushBanner(`Voice message sent to ${selectedFriend.name}.`);
  };

  const handleDeleteMessage = (idx) => {
    updateSelectedFriendMessages((msgs) => msgs.filter((_, i) => i !== idx));
    setSelectedMessageMenuIndex(null);
    pushBanner("Message deleted.");
  };

  const handleCopyMessage = async (text) => {
    try { await navigator.clipboard.writeText(text); pushBanner("Copied to clipboard."); }
    catch { pushBanner("Could not copy in this browser."); }
    finally { setSelectedMessageMenuIndex(null); }
  };

  const handleReplyToMessage = (text) => {
    setDraftMessage(`↩ ${text} `);
    pushBanner("Reply loaded into composer.");
    setSelectedMessageMenuIndex(null);
  };

  const handleMuteConversation = () => {
    setMutedConversations((prev) =>
      prev.includes(selectedFriend.id) ? prev.filter((id) => id !== selectedFriend.id) : [...prev, selectedFriend.id]
    );
    pushBanner(isMuted ? "Conversation unmuted." : "Conversation muted.");
    setShowConversationMenu(false);
  };

  const handleDeleteConversation = () => {
    setChatMessagesByFriend((prev) => ({ ...prev, [selectedFriend.id]: [] }));
    pushBanner("Conversation cleared.");
    setShowConversationMenu(false);
  };

  const handleArchiveConversation = () => {
    pushBanner(`Conversation with ${selectedFriend.name} archived.`);
    setShowConversationMenu(false);
  };

  const handleMarkUnread = () => {
    pushBanner(`Marked unread.`);
    setShowConversationMenu(false);
  };

  const handlePinConversation = () => {
    pushBanner(`Conversation pinned.`);
    setShowConversationMenu(false);
  };

  const handleAddMember = (memberName) => {
    if (isGroup) {
      // Add to existing group
      setGroups((prev) =>
        prev.map((g) =>
          g.id === selectedFriend.id && !g.members.includes(memberName)
            ? { ...g, members: [...g.members, memberName] }
            : g
        )
      );
      pushBanner(`${memberName} added to ${selectedFriend.name}.`);
    } else {
      // Convert DM into a group
      const id = `group-${Date.now()}`;
      const newGroup = {
        id,
        name: `${selectedFriend.name}, ${memberName}`,
        type: "group",
        members: [selectedFriend.name, memberName],
        avatar: selectedFriend.avatar,
        avatarColor: "bg-indigo-100 text-indigo-700",
        preview: "Group created",
        lastSeen: "Just now",
        messages: chatMessagesByFriend[selectedFriend.id] || [],
      };
      setGroups((prev) => [...prev, newGroup]);
      setChatMessagesByFriend((prev) => ({ ...prev, [id]: newGroup.messages }));
      setSelectedFriendId(id);
      pushBanner(`Group created with ${selectedFriend.name} and ${memberName}.`);
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
      <Navbar />

      <main className="h-[calc(100vh-64px)] mt-16 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex justify-between items-center py-3 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            <p className="text-sm text-gray-500">Direct messages with your study network</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              {friends.filter(f => f.status === "Online now").length} online
            </span>
          </div>
        </div>

        {/* Layout */}
        <div className="flex-1 min-h-0 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] pb-4">

          {/* Sidebar */}
          <aside className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow-sm min-h-0">
            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-scroll p-3 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">

              {/* Direct Messages section */}
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Direct Messages</p>
              {visibleFriends.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
                  No friends match your search.
                </div>
              ) : visibleFriends.map((friend) => {
                const isActive = friend.id === selectedFriend.id;
                return (
                  <button
                    key={friend.id}
                    onClick={() => setSelectedFriendId(friend.id)}
                    className={`w-full text-left rounded-xl p-3 transition-all border ${
                      isActive ? "border-[#2C76BA] bg-blue-50/60" : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className={`h-11 w-11 rounded-full ${friend.avatarColor} flex items-center justify-center text-sm font-bold border border-gray-200`}>
                          {friend.avatar}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${friend.statusColor}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-bold text-sm text-gray-900 truncate">{friend.name}</p>
                          <span className="text-[10px] text-gray-400 shrink-0">{friend.lastSeen}</span>
                        </div>
                        <p className="text-[11px] text-gray-500">{friend.role}</p>
                        <p className="text-xs text-gray-600 truncate mt-0.5">{friend.preview}</p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Groups section */}
              <div className="flex items-center justify-between px-1 pt-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Groups</p>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="flex items-center gap-1 text-[10px] font-bold text-[#2C76BA] hover:text-blue-700 transition-colors"
                >
                  <PlusIcon className="h-3 w-3" /> New Group
                </button>
              </div>
              {groups.filter(g => !searchQuery || g.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
                  No groups yet.
                </div>
              ) : groups.filter(g => !searchQuery || g.name.toLowerCase().includes(searchQuery.toLowerCase())).map((group) => {
                const isActive = group.id === selectedFriend.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => setSelectedFriendId(group.id)}
                    className={`w-full text-left rounded-xl p-3 transition-all border ${
                      isActive ? "border-[#2C76BA] bg-blue-50/60" : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-full ${group.avatarColor} flex items-center justify-center text-sm font-bold border border-gray-200 shrink-0`}>
                        {group.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-bold text-sm text-gray-900 truncate">{group.name}</p>
                          <span className="text-[10px] text-gray-400 shrink-0">{group.lastSeen}</span>
                        </div>
                        <p className="text-[11px] text-gray-500">{group.members.length} members</p>
                        <p className="text-xs text-gray-600 truncate mt-0.5">{group.preview}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Chat Panel */}
          <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow-sm min-h-0">

            {/* Chat Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`h-12 w-12 rounded-full ${selectedFriend.avatarColor} flex items-center justify-center text-sm font-bold border border-gray-200`}>
                    {isGroup ? <UserGroupIcon className="h-5 w-5" /> : selectedFriend.avatar}
                  </div>
                  {!isGroup && <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${selectedFriend.statusColor}`} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-gray-900">{selectedFriend.name}</h2>
                    {!isGroup && <StarIcon className="h-4 w-4 text-amber-400" />}
                    {isGroup && <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">GROUP</span>}
                    {isMuted && <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">MUTED</span>}
                  </div>
                  <p className="text-xs text-gray-500">
                    {isGroup ? `${selectedFriend.members.join(", ")}` : `${selectedFriend.role} · ${selectedFriend.status}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCallAction("Voice call")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  <PhoneIcon className="h-3.5 w-3.5" />
                  Call
                </button>
                <button
                  onClick={() => handleCallAction("Video call")}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-white hover:opacity-90 transition"
                  style={{ backgroundColor: PRIMARY_BLUE }}
                >
                  <VideoCameraIcon className="h-3.5 w-3.5" />
                  Video
                </button>

                {/* Overflow menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowConversationMenu((p) => !p)}
                    className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-50 transition"
                  >
                    <EllipsisVerticalIcon className="h-4 w-4" />
                  </button>
                  {showConversationMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowConversationMenu(false)} />
                      <div className="absolute right-0 top-11 z-20 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                        {[
                          { label: isMuted ? "Unmute" : "Mute conversation", MenuIcon: BellSlashIcon, action: handleMuteConversation },
                          { label: "Pin conversation", MenuIcon: BookmarkIcon, action: handlePinConversation },
                          { label: "Mark unread", MenuIcon: ChatBubbleLeftEllipsisIcon, action: handleMarkUnread },
                          { label: "Archive chat", MenuIcon: ArchiveBoxIcon, action: handleArchiveConversation },
                        ].map(({ label, MenuIcon, action }) => (
                          <button key={label} onClick={action} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50">
                            {React.createElement(MenuIcon, { className: "h-4 w-4 text-gray-400" })} {label}
                          </button>
                        ))}
                        <div className="border-t border-gray-100" />
                        <button
                          onClick={() => { setShowAddMember(true); setShowConversationMenu(false); }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <UserPlusIcon className="h-4 w-4 text-gray-400" /> Add member
                        </button>
                        <button
                          onClick={() => { setShowCreateGroup(true); setShowConversationMenu(false); }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <UserGroupIcon className="h-4 w-4 text-gray-400" /> Create group
                        </button>
                        <div className="border-t border-gray-100" />
                        <button onClick={handleDeleteConversation} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50">
                          <TrashIcon className="h-4 w-4" /> Delete conversation
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Toast banner */}
            {actionBanner && (
              <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm text-gray-600">
                <CheckCircleIcon className="h-4 w-4 text-green-500 shrink-0" />
                {actionBanner}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-scroll px-5 py-4 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              {selectedMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-16">
                  <ChatBubbleLeftRightIcon className="h-10 w-10 mb-3 text-gray-200" />
                  <p className="text-sm font-medium">No messages yet</p>
                  <p className="text-xs mt-1">Start the conversation below</p>
                </div>
              ) : selectedMessages.map((message, index) => {
                const isMine = message.from === "me";
                const isMenuOpen = selectedMessageMenuIndex === index;

                return (
                  <div key={`${selectedFriend.id}-${index}`} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className="group relative max-w-[75%]">
                      {/* Message options trigger */}
                      <button
                        onClick={() => setSelectedMessageMenuIndex(isMenuOpen ? null : index)}
                        className={`absolute ${isMine ? "-left-8" : "-right-8"} top-2 rounded-full border border-gray-200 bg-white p-1.5 text-gray-400 opacity-0 shadow-sm transition group-hover:opacity-100`}
                      >
                        <EllipsisVerticalIcon className="h-3.5 w-3.5" />
                      </button>

                      {/* Context menu */}
                      {isMenuOpen && (
                        <div className={`absolute top-0 z-20 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl ${isMine ? "right-full mr-2" : "left-full ml-2"}`}>
                          {[
                                { label: "Reply", MenuIcon: ArrowUturnLeftIcon, action: () => handleReplyToMessage(message.text) },
                                { label: "Copy", MenuIcon: ClipboardDocumentIcon, action: () => handleCopyMessage(message.text) },
                              ].map(({ label, MenuIcon, action }) => (
                                <button key={label} onClick={action} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                                  {React.createElement(MenuIcon, { className: "h-3.5 w-3.5 text-gray-400" })} {label}
                                </button>
                              ))}
                          <div className="border-t border-gray-100" />
                          <button onClick={() => handleDeleteMessage(index)} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                            <TrashIcon className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      )}

                      <div className={`rounded-2xl px-4 py-2.5 ${
                        isMine
                          ? "text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-800 rounded-bl-sm"
                      }`} style={isMine ? { backgroundColor: PRIMARY_BLUE } : {}}>
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <p className={`mt-1 text-[10px] ${isMine ? "text-blue-100" : "text-gray-400"}`}>{message.time}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50/50">
              {/* Quick replies */}
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((reply) => (
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
                {/* Text area */}
                <div className="flex-1 rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
                  <textarea
                    rows={1}
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder={`Message ${selectedFriend.name}...`}
                    className="w-full resize-none bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                  />

                  <div className="mt-1.5 flex items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-100 transition">
                      <PaperClipIcon className="h-3.5 w-3.5" />
                      Attach
                      <input type="file" className="hidden" onChange={(e) => setUploadedFile(e.target.files?.[0] || null)} />
                    </label>
                    <button onClick={handleVoiceMessage} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-100 transition">
                      <MicrophoneIcon className="h-3.5 w-3.5" />
                      Voice
                    </button>
                    <button onClick={() => pushBanner("Camera ready.")} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-100 transition">
                      <CameraIcon className="h-3.5 w-3.5" />
                      Camera
                    </button>
                    {uploadedFile && (
                      <span className="text-xs text-gray-500 truncate max-w-30">📎 {uploadedFile.name}</span>
                    )}
                  </div>
                </div>

                {/* Send button */}
                <button
                  onClick={handleSendMessage}
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-sm hover:opacity-90 transition"
                  style={{ backgroundColor: "#0f172a" }}
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                  Send
                </button>
              </div>

              {/* Footer info */}
              <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
                <span>Signed in as {user?.fullName || user?.username || "StudySync user"}</span>
                <span>{selectedMessages.length} messages{isMuted ? " · muted" : ""}</span>
              </div>
            </div>
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
    </div>
  );
}
