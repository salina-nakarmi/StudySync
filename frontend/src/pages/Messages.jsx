import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  ArrowPathIcon,
  CameraIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentIcon,
  EllipsisVerticalIcon,
  BellSlashIcon,
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
  PhoneXMarkIcon,
  VideoCameraSlashIcon,
} from "@heroicons/react/24/outline";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import { Room, RoomEvent, Track } from "livekit-client";
import Navbar from "../components/Navbar";

const PRIMARY_BLUE = "#2C76BA";
const QUICK_REPLIES = ["I'm on it.", "Let's do a call.", "Sending the file now.", "Voice note coming up."];
const INITIAL_GROUPS = [];
// TODO: point this at your actual LiveKit server URL (e.g. wss://your-project.livekit.cloud)
const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || "";

export default function Messages() {
  const { user } = useUser();
  const myUserId = user?.id || "";

  // Dynamic State
  const [conversations, setConversations] = useState([]);
  const [rawFriendsList, setRawFriendsList] = useState([]);
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

  // Call state
  const [activeCall, setActiveCall] = useState(null); // { roomName, kind: 'audio' | 'video', status: 'connecting' | 'connected' }
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [remoteParticipants, setRemoteParticipants] = useState([]); // [{ sid, identity, videoTrack, audioTrack }]

  // Derive if active screen is a group context.
  // Real, backend-persisted groups use "group-<id>"; groups created client-side
  // only (no backend group-creation endpoint exists yet) use "local-group-<ts>"
  // so the two never collide.
  const isGroup =
    typeof selectedFriendId === "string" &&
    (selectedFriendId.startsWith("group-") || selectedFriendId.startsWith("local-group-"));
  const isBackendGroup = typeof selectedFriendId === "string" && selectedFriendId.startsWith("group-");
  const numericGroupId = isBackendGroup ? parseInt(selectedFriendId.replace("group-", ""), 10) : null;

  // Persistent WebSocket Reference
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const livekitRoomRef = useRef(null);
  const localVideoRef = useRef(null);

  // --- 1. FETCH CONVERSATIONS & ALL FRIENDS ---
  useEffect(() => {
    const fetchChatData = async () => {
      if (!myUserId) return;

      try {
        setLoadingConversations(true);
        const apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

        const [conversationsRes, friendsRes] = await Promise.all([
          axios.get(`${apiBase}/api/chat/conversations`, {
            params: { user_id: myUserId },
          }).catch(() => ({ data: [] })),
          axios.get(`${apiBase}/api/friends/my-friends`, {
            params: { user_id: myUserId },
          }).catch(() => ({ data: [] })),
        ]);

        const activeConversations = conversationsRes.data || [];
        const allFriends = friendsRes.data || [];

        setRawFriendsList(allFriends);

        const conversationMap = new Map();
        activeConversations.forEach((conv) => {
          conversationMap.set(conv.friend_id, conv);
        });

        const mergedList = [...activeConversations];

        allFriends.forEach((friend) => {
          const friendId = friend.friend_id || friend.user_id || friend.id;

          if (!conversationMap.has(friendId)) {
            mergedList.push({
              friend_id: friendId,
              username:
                friend.username ||
                `${friend.first_name || ""} ${friend.last_name || ""}`.trim() ||
                friend.email ||
                "Friend",
              email: friend.email || "",
              latest_message_preview: null,
              latest_message_time: null,
            });
          }
        });

        setConversations(mergedList);

        if (mergedList.length > 0 && !selectedFriendId) {
          setSelectedFriendId(mergedList[0].friend_id);
        }
      } catch (error) {
        console.error("Error fetching chat data:", error);
        pushBanner("Failed to load friend list.");
      } finally{
        setLoadingConversations(false);
      }
    };

    fetchChatData();
  }, [myUserId]);

  // --- 1b. FETCH JOINED GROUPS ---
  useEffect(() => {
    const fetchGroups = async () => {
      if (!myUserId) return;
      try {
        const apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
        const res = await axios.get(`${apiBase}/api/groups`, {
          params: { only_joined: true },
        });

        // NOTE: adjust these field names to match whatever your /api/groups
        // response actually returns (checked against Groups model: group_name, etc).
        const backendGroups = (res.data || []).map((g) => ({
          id: `group-${g.id}`,
          rawId: g.id,
          name: g.group_name || g.name || "Group",
          type: "group",
          members: g.members || [],
          avatar: (g.group_name || g.name || "GR").slice(0, 2).toUpperCase(),
          avatarColor: "bg-indigo-100 text-indigo-700",
          preview: g.latest_message_preview || "No messages yet",
          lastSeen: g.latest_message_time || null,
        }));

        // Keep any local-only groups (created client-side, not yet backed by
        // a real group on the server) and replace the backend-sourced ones.
        setGroups((prev) => [...backendGroups, ...prev.filter((g) => g.id.startsWith("local-group-"))]);
      } catch (error) {
        console.error("Error fetching groups:", error);
      }
    };

    fetchGroups();
  }, [myUserId]);

  // --- 2. WEBSOCKET MESSAGE SYNC PIPELINE (DMs + real groups) ---
  useEffect(() => {
    if (!selectedFriendId || !myUserId) return;
    // Local-only groups have no backend counterpart to connect to.
    if (isGroup && !isBackendGroup) return;

    const apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
    const wsBase = apiBase.replace(/^http/, "ws");
    const wsUrl = isBackendGroup
      ? `${wsBase}/api/ws/group/${myUserId}/${numericGroupId}`
      : `${wsBase}/api/ws/dm/${myUserId}/${selectedFriendId}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log(`Connected to live sync node: ${wsUrl}`);
      // Unlike the DM endpoint, the group endpoint doesn't auto-send history
      // on connect, so we ask for it explicitly.
      if (isBackendGroup) {
        ws.send(JSON.stringify({ action: "load_history", payload: { group_id: numericGroupId } }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "history") {
          setChatMessages(data.messages || []);
        } else if (data.type === "message") {
          setChatMessages((prev) => [...prev, data.message]);

          if (isBackendGroup) {
            setGroups((prevList) => {
              const index = prevList.findIndex((g) => g.id === selectedFriendId);
              if (index === -1) return prevList;
              const updated = [...prevList];
              updated[index] = {
                ...updated[index],
                preview: data.message.content,
                lastSeen: data.message.created_at || new Date().toISOString(),
              };
              const [movedItem] = updated.splice(index, 1);
              return [movedItem, ...updated];
            });
          } else {
            setConversations((prevList) => {
              const index = prevList.findIndex((c) => c.friend_id === selectedFriendId);
              if (index === -1) return prevList;
              const updated = [...prevList];
              updated[index] = {
                ...updated[index],
                latest_message_preview: data.message.content,
                latest_message_time: data.message.created_at || new Date().toISOString(),
              };
              const [movedItem] = updated.splice(index, 1);
              return [movedItem, ...updated];
            });
          }
        }
      } catch (err) {
        console.error("Error parsing incoming socket frame:", err);
      }
    };

    ws.onerror = (error) => console.error("WebSocket Error:", error);
    ws.onclose = () => console.log("Disconnected from live sync node.");

    return () => {
      ws.close();
    };
  }, [selectedFriendId, myUserId, isGroup, isBackendGroup, numericGroupId]);

  // --- CLEANUP ANY ACTIVE CALL ON UNMOUNT ---
  useEffect(() => {
    return () => {
      if (livekitRoomRef.current) {
        livekitRoomRef.current.disconnect();
      }
    };
  }, []);

  // --- 3. AUTO SCROLL TO BOTTOM ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // --- 4. COMPUTED PROPERTIES ---
  const selectedFriend = useMemo(() => {
    if (isGroup) {
      return groups.find((g) => g.id === selectedFriendId) || null;
    }
    return conversations.find((f) => f.friend_id === selectedFriendId) || null;
  }, [selectedFriendId, conversations, groups, isGroup]);

  const visibleFriends = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const localGroupItems = groups.map((g) => ({
      friend_id: g.id,
      username: g.name,
      latest_message_preview: g.preview,
      latest_message_time: g.lastSeen,
    }));

    const unifiedList = [...localGroupItems, ...conversations];

    const sortedList = unifiedList.sort((a, b) => {
      if (a.latest_message_time && b.latest_message_time) {
        return new Date(b.latest_message_time) - new Date(a.latest_message_time);
      }
      if (a.latest_message_time) return -1;
      if (b.latest_message_time) return 1;

      return (a.username || "").localeCompare(b.username || "");
    });

    if (!q) return sortedList;

    return sortedList.filter((f) =>
      [f.username, f.latest_message_preview].join(" ").toLowerCase().includes(q)
    );
  }, [searchQuery, conversations, groups]);

  const isMuted = selectedFriend
    ? mutedConversations.includes(selectedFriend.friend_id || selectedFriend.id)
    : false;

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

    // Local-only groups (client-side only, no backend group yet) still fall
    // back to an optimistic in-memory message.
    if (isGroup && !isBackendGroup) {
      const localMsg = {
        sender_id: myUserId,
        content: text || `Shared file: ${uploadedFile?.name}`,
        created_at: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, localMsg]);
      setDraftMessage("");
      setUploadedFile(null);
      return;
    }

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      pushBanner("Chat disconnected. Restoring connection...");
      return;
    }

    const messageContent = text || `Shared file: ${uploadedFile?.name}`;
    const payload = isBackendGroup
      ? {
          action: "send_message",
          payload: { group_id: numericGroupId, content: messageContent, type: "text" },
        }
      : {
          action: "send_message",
          payload: { receiver_id: selectedFriendId, content: messageContent, type: "text" },
        };

    socketRef.current.send(JSON.stringify(payload));
    setDraftMessage("");
    setUploadedFile(null);
    setSelectedMessageMenuIndex(null);
  };

  const handleVoiceMessage = () => {
    if (isGroup && !isBackendGroup) {
      setChatMessages((prev) => [
        ...prev,
        { sender_id: myUserId, content: "Voice message", created_at: new Date().toISOString() },
      ]);
      return;
    }
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    const payload = isBackendGroup
      ? { action: "send_message", payload: { group_id: numericGroupId, content: "Voice message", type: "text" } }
      : { action: "send_message", payload: { receiver_id: selectedFriendId, content: "Voice message", type: "text" } };
    socketRef.current.send(JSON.stringify(payload));
  };

  // --- CALLING (LiveKit) ---
  const getCallRoomName = () => {
    if (isBackendGroup) return `group-${numericGroupId}`;
    if (!isGroup && selectedFriendId) return `dm-${[myUserId, selectedFriendId].sort().join("-")}`;
    return null; // local-only groups have nothing to call into yet
  };

  const fetchLiveKitToken = async (roomName) => {
    const apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
    // TODO: confirm this matches your actual token-issuing route.
    const res = await axios.get(`${apiBase}/api/livekit/token`, {
      params: { room: roomName, identity: myUserId, name: user?.fullName || myUserId },
    });
    return res.data.token;
  };

  const attachRemoteTrack = (participant, track) => {
    setRemoteParticipants((prev) => {
      const existing = prev.find((p) => p.sid === participant.sid);
      const field = track.kind === Track.Kind.Video ? "videoTrack" : "audioTrack";
      if (existing) {
        return prev.map((p) => (p.sid === participant.sid ? { ...p, [field]: track } : p));
      }
      return [
        ...prev,
        {
          sid: participant.sid,
          identity: participant.identity,
          videoTrack: track.kind === Track.Kind.Video ? track : null,
          audioTrack: track.kind === Track.Kind.Audio ? track : null,
        },
      ];
    });
  };

  const endCallCleanup = () => {
    livekitRoomRef.current = null;
    setActiveCall(null);
    setRemoteParticipants([]);
    setMicEnabled(true);
    setCamEnabled(true);
  };

  const startCall = async (kind) => {
    if (activeCall) {
      pushBanner("You're already in a call.");
      return;
    }
    const roomName = getCallRoomName();
    if (!roomName) {
      pushBanner("This group isn't backed by the server yet, so it can't be called.");
      return;
    }
    if (!LIVEKIT_URL) {
      pushBanner("LiveKit URL isn't configured (set VITE_LIVEKIT_URL).");
      return;
    }

    setActiveCall({ roomName, kind, status: "connecting" });

    try {
      const token = await fetchLiveKitToken(roomName);
      const room = new Room({ adaptiveStream: true, dynacast: true });
      livekitRoomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
        attachRemoteTrack(participant, track);
      });
      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((el) => el.remove());
      });
      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        setRemoteParticipants((prev) => prev.filter((p) => p.sid !== participant.sid));
      });
      room.on(RoomEvent.Disconnected, () => {
        endCallCleanup();
      });

      await room.connect(LIVEKIT_URL, token);
      await room.localParticipant.setMicrophoneEnabled(true);

      if (kind === "video") {
        await room.localParticipant.setCameraEnabled(true);
        const camPub = Array.from(room.localParticipant.videoTrackPublications.values())[0];
        if (camPub?.track && localVideoRef.current) {
          camPub.track.attach(localVideoRef.current);
        }
      }

      setMicEnabled(true);
      setCamEnabled(kind === "video");
      setActiveCall({ roomName, kind, status: "connected" });
    } catch (error) {
      console.error("Failed to start call:", error);
      pushBanner("Could not start the call. Check your LiveKit setup.");
      livekitRoomRef.current = null;
      setActiveCall(null);
    }
  };

  const endCall = () => {
    if (livekitRoomRef.current) {
      livekitRoomRef.current.disconnect();
    }
    endCallCleanup();
  };

  const toggleMic = async () => {
    if (!livekitRoomRef.current) return;
    const next = !micEnabled;
    await livekitRoomRef.current.localParticipant.setMicrophoneEnabled(next);
    setMicEnabled(next);
  };

  const toggleCam = async () => {
    if (!livekitRoomRef.current) return;
    const next = !camEnabled;
    await livekitRoomRef.current.localParticipant.setCameraEnabled(next);
    setCamEnabled(next);
    if (next) {
      const camPub = Array.from(livekitRoomRef.current.localParticipant.videoTrackPublications.values())[0];
      if (camPub?.track && localVideoRef.current) camPub.track.attach(localVideoRef.current);
    }
  };

  const handleDeleteMessage = () => {
    pushBanner("Message deletion requires backend socket action.");
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
    setDraftMessage(`${text} \n`);
    pushBanner("Reply loaded into composer.");
    setSelectedMessageMenuIndex(null);
  };

  const handleMuteConversation = () => {
    if (!selectedFriend) return;
    const currentTargetId = selectedFriend.friend_id || selectedFriend.id;
    setMutedConversations((prev) =>
      prev.includes(currentTargetId)
        ? prev.filter((id) => id !== currentTargetId)
        : [...prev, currentTargetId]
    );
    pushBanner(isMuted ? "Conversation unmuted." : "Conversation muted.");
    setShowConversationMenu(false);
  };

  const handleAddMember = (memberName) => {
    if (isGroup) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === selectedFriend?.id && !g.members.includes(memberName)
            ? { ...g, members: [...g.members, memberName] }
            : g
        )
      );
      pushBanner(`${memberName} added to ${selectedFriend?.name}.`);
    } else if (selectedFriend) {
      const id = `local-group-${Date.now()}`;
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
    const id = `local-group-${Date.now()}`;
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
    setSelectedFriendId(id);
    setChatMessages([]);
    setShowCreateGroup(false);
    pushBanner(`Group "${name}" created.`);
  };

  return (
    <div className="h-screen overflow-hidden bg-white">
      <Navbar />

      <main className="h-[calc(100vh-64px)] mt-16 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            <p className="text-sm text-gray-500">Direct messages with your study network</p>
          </div>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 rounded-xl hover:bg-black text-white text-xs font-bold transition"
          >
            <UserGroupIcon className="h-4 w-4" /> Create Group
          </button>
        </div>

        <div className="flex-1 min-h-0 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] pb-4">
          <aside className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow-sm min-h-0">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {loadingConversations ? (
                <div className="flex items-center justify-center py-10">
                  <ArrowPathIcon className="h-6 w-6 text-gray-400 animate-spin" />
                </div>
              ) : visibleFriends.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
                  No active chats or friends found.
                </div>
              ) : (
                visibleFriends.map((friend) => {
                  const isActive = friend.friend_id === selectedFriendId;
                  return (
                    <button
                      key={friend.friend_id}
                      onClick={() => {
                        setSelectedFriendId(friend.friend_id);
                        setChatMessages([]);
                      }}
                      className={`w-full text-left rounded-xl p-3 transition-all border ${
                        isActive
                          ? "border-[#2C76BA] bg-blue-50/60"
                          : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="h-11 w-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold border border-gray-200">
                            {(friend.username || "??").substring(0, 2).toUpperCase()}
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
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {friend.latest_message_preview || "Start a new conversation"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
            {selectedFriend ? (
              <>
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold border border-gray-200">
                      {(selectedFriend.username || selectedFriend.name || "??").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-gray-900">{selectedFriend.username || selectedFriend.name}</h2>
                        <StarIcon className="h-4 w-4 text-amber-400" />
                        {isMuted && (
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">MUTED</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {isGroup ? `${selectedFriend.members?.length || 0} participants` : selectedFriend.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isGroup && (
                      <button
                        onClick={() => setShowAddMember(true)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                      >
                        <UserPlusIcon className="h-3.5 w-3.5" /> Invite
                      </button>
                    )}
                    <button
                      onClick={() => startCall("audio")}
                      disabled={(isGroup && !isBackendGroup) || !!activeCall}
                      title={isGroup && !isBackendGroup ? "This group isn't backed by the server yet" : "Start voice call"}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <PhoneIcon className="h-3.5 w-3.5" /> Call
                    </button>
                    <button
                      onClick={() => startCall("video")}
                      disabled={(isGroup && !isBackendGroup) || !!activeCall}
                      title={isGroup && !isBackendGroup ? "This group isn't backed by the server yet" : "Start video call"}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-white hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ backgroundColor: PRIMARY_BLUE }}
                    >
                      <VideoCameraIcon className="h-3.5 w-3.5" /> Video
                    </button>

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
                            <BellSlashIcon className="h-4 w-4 text-gray-400" /> {isMuted ? "Unmute Thread" : "Mute Notifications"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {actionBanner && (
                  <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm text-gray-600">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 shrink-0" />
                    {actionBanner}
                  </div>
                )}

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
                        placeholder={`Message ${selectedFriend.username || selectedFriend.name}...`}
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
                          <span className="text-xs text-gray-500 truncate max-w-30">{uploadedFile.name}</span>
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
                <p className="text-sm">Select an active chat thread or friend to start talking.</p>
              </div>
            )}
          </section>
        </div>
      </main>

      {showAddMember && (
        <AddMemberModal
          friends={rawFriendsList}
          existingMembers={isGroup ? (selectedFriend?.members || []) : [selectedFriend?.username || ""]}
          onAdd={handleAddMember}
          onClose={() => setShowAddMember(false)}
        />
      )}

      {showCreateGroup && (
        <CreateGroupModal
          friends={rawFriendsList}
          onCreate={handleCreateGroup}
          onClose={() => setShowCreateGroup(false)}
        />
      )}

      {activeCall && (
        <CallOverlay
          activeCall={activeCall}
          remoteParticipants={remoteParticipants}
          localVideoRef={localVideoRef}
          micEnabled={micEnabled}
          camEnabled={camEnabled}
          onToggleMic={toggleMic}
          onToggleCam={toggleCam}
          onEndCall={endCall}
          title={selectedFriend?.username || selectedFriend?.name || "Call"}
        />
      )}
    </div>
  );
}

// --- CALL OVERLAY ---
function CallOverlay({
  activeCall,
  remoteParticipants,
  localVideoRef,
  micEnabled,
  camEnabled,
  onToggleMic,
  onToggleCam,
  onEndCall,
  title,
}) {
  const tileCount = Math.max(1, Math.min(remoteParticipants.length + 1, 4));

  return (
    <div className="fixed inset-0 z-[60] bg-gray-950 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 text-white">
        <div>
          <p className="text-sm text-gray-400">{activeCall.status === "connecting" ? "Connecting…" : "In call"}</p>
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
      </div>

      <div
        className="flex-1 grid gap-3 p-4"
        style={{ gridTemplateColumns: `repeat(${tileCount}, minmax(0, 1fr))` }}
      >
        {activeCall.kind === "video" && (
          <div className="relative rounded-2xl overflow-hidden bg-gray-900 flex items-center justify-center">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded-full">You</span>
          </div>
        )}

        {remoteParticipants.map((p) => (
          <RemoteTile key={p.sid} participant={p} showVideo={activeCall.kind === "video"} />
        ))}

        {remoteParticipants.length === 0 && activeCall.status === "connected" && (
          <div className="flex items-center justify-center text-gray-500 text-sm rounded-2xl border border-dashed border-gray-700">
            Waiting for others to join…
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 py-6">
        <button
          onClick={onToggleMic}
          className={`h-12 w-12 rounded-full flex items-center justify-center transition ${
            micEnabled ? "bg-gray-800 text-white" : "bg-red-600 text-white"
          }`}
          title={micEnabled ? "Mute" : "Unmute"}
        >
          <MicrophoneIcon className="h-5 w-5" />
        </button>

        {activeCall.kind === "video" && (
          <button
            onClick={onToggleCam}
            className={`h-12 w-12 rounded-full flex items-center justify-center transition ${
              camEnabled ? "bg-gray-800 text-white" : "bg-red-600 text-white"
            }`}
            title={camEnabled ? "Turn camera off" : "Turn camera on"}
          >
            {camEnabled ? <VideoCameraIcon className="h-5 w-5" /> : <VideoCameraSlashIcon className="h-5 w-5" />}
          </button>
        )}

        <button
          onClick={onEndCall}
          className="h-12 w-12 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition"
          title="Leave call"
        >
          <PhoneXMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function RemoteTile({ participant, showVideo }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (showVideo && participant.videoTrack && videoRef.current) {
      participant.videoTrack.attach(videoRef.current);
    }
    return () => {
      if (participant.videoTrack) participant.videoTrack.detach();
    };
  }, [participant.videoTrack, showVideo]);

  useEffect(() => {
    if (participant.audioTrack && audioRef.current) {
      participant.audioTrack.attach(audioRef.current);
    }
    return () => {
      if (participant.audioTrack) participant.audioTrack.detach();
    };
  }, [participant.audioTrack]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gray-900 flex items-center justify-center">
      {showVideo ? (
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      ) : (
        <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold">
          {(participant.identity || "?").slice(0, 2).toUpperCase()}
        </div>
      )}
      <audio ref={audioRef} autoPlay />
      <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded-full">
        {participant.identity}
      </span>
    </div>
  );
}

// --- CREATE GROUP MODAL ---
function CreateGroupModal({ friends, onCreate, onClose }) {
  const [groupName, setGroupName] = useState("");
  const [selected, setSelected] = useState([]);

  const toggle = (name) =>
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));

  const handleSubmit = () => {
    if (!groupName.trim() || selected.length < 1) return;
    onCreate(groupName.trim(), selected);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
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

          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Add members</label>
            <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto">
              {friends.map((f) => {
                const friendName = f.username || f.name || f.email;
                const checked = selected.includes(friendName);
                return (
                  <button
                    key={f.friend_id || f.user_id || f.id}
                    onClick={() => toggle(friendName)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${
                      checked
                        ? "border-[#2C76BA] bg-blue-50/60"
                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold border shrink-0">
                      {(friendName || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{friendName}</p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                        checked ? "border-[#2C76BA] bg-[#2C76BA]" : "border-gray-300"
                      }`}
                    >
                      {checked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-100 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!groupName.trim() || selected.length < 1}
            className="px-4 py-2 text-sm font-bold bg-gray-900 text-white rounded-xl hover:bg-black disabled:opacity-50 transition"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

// --- ADD MEMBER MODAL ---
function AddMemberModal({ friends, existingMembers, onAdd, onClose }) {
  const [selected, setSelected] = useState("");

  const availableFriends = friends.filter((f) => {
    const friendName = f.username || f.name || f.email;
    return !existingMembers.includes(friendName);
  });

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
          <label className="text-xs font-bold text-gray-500 mb-1.5 block">Select a friend</label>
          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
            {availableFriends.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No available friends to add.</p>
            ) : (
              availableFriends.map((f) => {
                const friendName = f.username || f.name || f.email;
                const isSelected = selected === friendName;
                return (
                  <button
                    key={f.friend_id || f.user_id || f.id}
                    onClick={() => setSelected(friendName)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${
                      isSelected
                        ? "border-[#2C76BA] bg-blue-50/60"
                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold border shrink-0">
                      {(friendName || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold text-gray-800 flex-1">{friendName}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-100 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => selected && onAdd(selected)}
            disabled={!selected}
            className="px-4 py-2 text-sm font-bold bg-gray-900 text-white rounded-xl hover:bg-black disabled:opacity-50 transition"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}