import React, { useState, useEffect } from "react";
import {
  UsersIcon,
  PlusIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  LinkIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { groupService } from "../services/group_services";
import AddResourceModal from "../components/AddResourceModal";
import {resourceService} from "../services/resource_services";

const PRIMARY_BLUE = "#2C76BA";

export default function Groups() {
  const { getToken, isSignedIn } = useAuth();
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeTab, setActiveTab] = useState("Resources");
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resources, setResources] = useState([]);
  const [addResourceModalOpen, setAddResourceModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    group_name: "",
    description: "",
    group_type: "community",
    visibility: "public",
    max_members: "",
    invite_code: "",
  });
  const [isJoinMode, setIsJoinMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const currentUserIsLeader = activeGroup?.members?.some(
  (member) => member.role === "leader"
);

  
  const navigate = useNavigate();

  // Load groups on mount
  useEffect(() => {
    if (isSignedIn) {
      loadGroups();
    } else {
      navigate("/sign-in");
    }
  }, [isSignedIn]);

  // Load full group details when active group changes
  useEffect(() => {
    if (activeGroup) {
      loadGroupDetails(activeGroup.id);
      if (activeTab === "Resources") {
        loadGroupResources(activeGroup.id);
      }
    }
  }, [activeGroup?.id, activeTab]);

  useEffect(() => {
  if (activeGroup && activeTab === "Resources") {
    loadGroupResources(activeGroup.id);
  }
}, [activeGroup?.id, activeTab]);


  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const data = await groupService.getMyGroups(token);
      setGroups(data);
    } catch (err) {
      setError(err.message);
      console.error("Error loading groups:", err);
      
      // If not authenticated, redirect to login
      if (err.message.includes("Not authenticated") || err.message.includes("401")) {
        navigate("/sign-in");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadGroupDetails = async (groupId) => {
    try {
      const token = await getToken();
      const data = await groupService.getGroup(token, groupId);
      setActiveGroup(data);
    } catch (err) {
      console.error("Error loading group details:", err);
    }
  };

  const loadGroupResources = async (groupId) => {
  try {
    const token = await getToken();
    const data = await resourceService.getGroupResources(token, groupId);

    console.log("📥 Loaded resources for group", groupId, data);
    setResources(data);
  } catch (err) {
    console.error("Error loading resources:", err);
    setResources([]);
  }
};

const handleAddResource = async (resourceData) => {
  if (!activeGroup?.id) {
    alert("No active group selected");
    return;
  }

  try {
    const token = await getToken();
    const groupId = activeGroup.id;

    if (resourceData.type === 'file') {
      await resourceService.uploadFile(
        token,
        resourceData.file,
        groupId,
        resourceData.description ?? null
      );
    }
    console.log("Uploading resource to group:", groupId);


    if (resourceData.type === 'link') {
      await resourceService.createResource(token, {
        title: resourceData.title,
        url: resourceData.url,
        description: resourceData.description ?? "",
        resource_type: "link",
        group_id: groupId,
        parent_folder_id: resourceData.parentFolderId ?? null
      });
    }

    await loadGroupResources(groupId);
  } catch (err) {
    console.error("❌ Error uploading resource:", err);
  }
};




  const handleDeleteResource = async (resourceId) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    
    try {
      const token = await getToken();
      await resourceService.deleteResource(token, resourceId);
      await loadGroupResources(activeGroup.id);
    } catch (err) {
      alert(`Failed to delete resource: ${err.message}`);
    }
  };

  const handleDeleteGroup = async (groupId) => {
  if (!confirm("This will permanently delete the group. Are you sure?")) return;

  try {
    const token = await getToken();
    await groupService.deleteGroup(token, groupId);

    alert("Group deleted successfully");

    // Refresh groups & reset UI
    await loadGroups();
    setActiveGroup(null);
  } catch (err) {
    alert(`Failed to delete group: ${err.message}`);
  }
};

  const handleCreateGroup = async () => {
    if (!formData.group_name.trim()) {
      alert("Please enter a group name");
      return;
    }

    try {
      setSubmitting(true);
      const token = await getToken();
      const groupData = {
        group_name: formData.group_name,
        description: formData.description || null,
        group_type: formData.group_type,
        visibility: formData.visibility,
        max_members: formData.max_members ? parseInt(formData.max_members) : null,
      };

      const newGroup = await groupService.createGroup(token, groupData);
      
      // Reload groups to get updated list
      await loadGroups();
      
      // Set the new group as active
      setActiveGroup(newGroup);
      
      // Reset form and close modal
      resetForm();
      setModalOpen(false);
      setIsJoinMode(false);
    } catch (err) {
      alert(`Failed to create group: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinGroup = async () => {
  const { invite_code } = formData;

  try {
    setSubmitting(true);
    const token = await getToken();

    // 1️⃣ PRIVATE GROUP JOIN (invite code only)
    if (invite_code?.trim()) {
      await groupService.joinGroupByInviteCode(token, invite_code.trim());
      await loadGroups();
      setModalOpen(false);
      resetForm();
      alert("Successfully joined the private group!");
      return;
    }

    // 2️⃣ PUBLIC GROUPS: list all public groups and let user join
    const publicGroups = await groupService.getPublicGroups(token);
    if (publicGroups.length === 0) {
      alert("No public groups available to join.");
      return;
    }

    // For demo, pick the first group (replace with a UI list if you like)
    const groupToJoin = publicGroups[0];

    const confirmJoin = window.confirm(
      `Join public group "${groupToJoin.group_name}"?`
    );
    if (!confirmJoin) return;

    await groupService.joinGroup(token, groupToJoin.id);
    await loadGroups();
    setModalOpen(false);
    resetForm();
    alert("Successfully joined the public group!");
  } catch (err) {
    alert(`Failed to join group: ${err.message}`);
  } finally {
    setSubmitting(false);
  }
};

  const handleLeaveGroup = async (groupId) => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    
    try {
      const token = await getToken();
      await groupService.leaveGroup(token, groupId);
      
      // Reload groups
      await loadGroups();
      
      // Clear active group if it was the one we left
      if (activeGroup?.id === groupId) {
        setActiveGroup(null);
      }
      
      alert("Successfully left the group");
    } catch (err) {
      alert(`Failed to leave group: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      group_name: "",
      description: "",
      group_type: "community",
      visibility: "public",
      max_members: "",
      invite_code: "",
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Loading groups...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
        <SidebarContent
          groups={groups}
          setActiveGroup={setActiveGroup}
          activeGroup={activeGroup}
          navigate={navigate}
          setModalOpen={setModalOpen}
          setIsJoinMode={setIsJoinMode}
        />
      </div>

      {/* MOBILE SIDEBAR SLIDEOVER */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-64 bg-white flex flex-col border-r border-gray-200">
            <div className="p-6 flex justify-between items-center border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900">Groups</h1>
              <button onClick={() => setSidebarOpen(false)}>
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <SidebarContent
              groups={groups}
              setActiveGroup={setActiveGroup}
              activeGroup={activeGroup}
              navigate={navigate}
              setModalOpen={setModalOpen}
              setIsJoinMode={setIsJoinMode}
            />
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6">
        <div className="flex items-center justify-between md:hidden mb-4">
          <button onClick={() => setSidebarOpen(true)}>
            <Bars3Icon className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold">Groups</h1>
          <button onClick={() => setModalOpen(true)}>
            <PlusIcon className="w-6 h-6" style={{ color: PRIMARY_BLUE }} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-center">
          <div className="w-full max-w-5xl">
            {!activeGroup ? (
              <>
                {groups.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">You haven't joined any groups yet</p>
                    <button
                      onClick={() => setModalOpen(true)}
                      className="px-6 py-3 rounded-lg text-white font-semibold hover:opacity-90"
                      style={{ backgroundColor: PRIMARY_BLUE }}
                    >
                      Create or Join a Group
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => (
                      <div
                        key={group.id}
                        onClick={() => setActiveGroup(group)}
                        className="cursor-pointer rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition"
                      >
                        <div
                          className="h-28 p-4 text-white flex flex-col justify-end"
                          style={{
                            background: `linear-gradient(135deg, ${PRIMARY_BLUE}, #5FA8F5)`,
                          }}
                        >
                          <h2 className="text-lg font-semibold">{group.group_name}</h2>
                          <p className="text-sm opacity-90">
                            {group.description || "No description"}
                          </p>
                        </div>
                        <div className="p-4 bg-white">
                          <p className="text-sm text-gray-600">
                            Members: {group.member_count}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Type: {group.group_type === "community" ? "Community" : "Leader Controlled"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveGroup(null)}
                  className="text-blue-600 hover:underline mb-4"
                  style={{ color: PRIMARY_BLUE }}
                >
                  ← Back to Groups
                </button>

                <div
                  className="text-white rounded-2xl p-6 mb-6 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${PRIMARY_BLUE}, #5FA8F5)` }}
                >
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <h1 className="text-2xl font-bold">{activeGroup.group_name}</h1>
                      <p className="opacity-90">{activeGroup.description || "No description"}</p>
                      <p className="mt-2 text-sm">
                        {activeGroup.member_count} members •{" "}
                        {activeGroup.visibility} •{" "}
                        {activeGroup.group_type === "community" ? "Community" : "Leader Controlled"}
                      </p>
                      {activeGroup.invite_code && (
                        <p className="mt-2 text-sm">
                          Invite Code: <span className="font-mono font-semibold bg-white/20 px-2 py-1 rounded">{activeGroup.invite_code}</span>
                        </p>
                      )}
                    </div>
                    {currentUserIsLeader ? (
                          <button
                            onClick={() => handleDeleteGroup(activeGroup.id)}
                            className="px-3 py-2 bg-white text-red-700 rounded-lg hover:bg-red-100 shadow-md font-medium"
                          >
                            Delete Group
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLeaveGroup(activeGroup.id)}
                            className="px-3 py-2 bg-white text-red-600 rounded-lg hover:bg-gray-100 shadow-md font-medium"
                          >
                            Leave Group
                          </button>
                        )}

                  </div>
                </div>

                <div className="flex gap-4 mb-4 border-b border-gray-200 flex-wrap">
                  {["Resources", "Members", "Leaderboard"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 -mb-1 font-medium transition ${
                        activeTab === tab
                          ? `border-b-2 text-[#2C76BA] font-semibold`
                          : "text-gray-600 hover:text-[#2C76BA]"
                      }`}
                      style={activeTab === tab ? { borderColor: PRIMARY_BLUE } : {}}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {activeTab === "Resources" && (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
    {/* Header */}
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold">
        Group Resources ({resources.length})
      </h2>
      <button
        onClick={() => setAddResourceModalOpen(true)}
        className="flex items-center gap-1 px-3 py-1 rounded-lg shadow-md text-white hover:opacity-90"
        style={{ backgroundColor: "#1E1E1E" }}
      >
        <PlusIcon className="w-4 h-4" /> Add
      </button>
    </div>

    {/* Empty state */}
    {resources.length === 0 ? (
      <p className="text-gray-500 text-center py-8">No resources yet. Add some!</p>
    ) : (
      <div className="space-y-2">
        {resources.map((resource) => {
          const type = resource.resource_type.toLowerCase(); // normalize type
          let Icon;
          if (type === "file") Icon = DocumentTextIcon;
          else if (type === "video") Icon = VideoCameraIcon;
          else Icon = LinkIcon;

          return (
            <div
              key={resource.id}
              className="flex items-center justify-between border border-gray-200 rounded-lg p-3 hover:shadow-md transition group"
            >
              {/* Resource info */}
              <div className="flex items-center gap-3 flex-1">
                <Icon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{resource.title || "Untitled"}</p>
                  {resource.description && (
                    <p className="text-sm text-gray-500 truncate">{resource.description}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm px-3 py-1 rounded hover:bg-gray-100"
                  style={{ color: PRIMARY_BLUE }}
                >
                  Open
                </a>
                <button
                  onClick={() => handleDeleteResource(resource.id)}
                  className="text-sm px-3 py-1 text-red-600 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                >
                  Delete
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
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-2 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">
                      Members ({activeGroup.members?.length || 0})
                    </h2>
                    {activeGroup.members && activeGroup.members.length > 0 ? (
                      activeGroup.members.map((member) => (
                        <div
                          key={member.user_id}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition"
                        >
                          <div className="flex items-center gap-3">
                            <UsersIcon className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="font-medium">{member.username}</p>
                              <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(member.joined_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">Loading members...</p>
                    )}
                  </div>
                )}

                {activeTab === "Leaderboard" && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 text-gray-500 shadow-sm">
                    <p>Leaderboard feature coming soon! 🏆</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ADD RESOURCE MODAL */}
      <AddResourceModal
        isOpen={addResourceModalOpen}
        onClose={() => setAddResourceModalOpen(false)}
        onSubmit={resourceData =>
          handleAddResource({ ...resourceData, groupId: activeGroup?.id })
        }
        groupId={activeGroup?.id}
      />


      {/* CREATE/JOIN MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-11/12 max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              {isJoinMode ? "Join a Group" : "Create or Join Group"}
            </h2>

            {!isJoinMode ? (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setIsJoinMode(false)}
                  className="flex-1 py-2 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: PRIMARY_BLUE }}
                >
                  Create
                </button>
                <button
                  onClick={() => setIsJoinMode(true)}
                  className="flex-1 py-2 rounded-lg font-semibold border-2"
                  style={{ borderColor: PRIMARY_BLUE, color: PRIMARY_BLUE }}
                >
                  Join
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsJoinMode(false)}
                className="text-sm mb-4"
                style={{ color: PRIMARY_BLUE }}
              >
                ← Back to Create
              </button>
            )}

            {isJoinMode ? (
              <>
                <input
                  type="text"
                  placeholder="Group Name"
                  value={formData.group_name}
                  onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                  className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Invite Code (optional for private groups)"
                  value={formData.invite_code}
                  onChange={(e) => setFormData({ ...formData, invite_code: e.target.value })}
                  className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Group Name *"
                  value={formData.group_name}
                  onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                  className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
                <select
                  value={formData.group_type}
                  onChange={(e) => setFormData({ ...formData, group_type: e.target.value })}
                  className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="community">Community (all can manage)</option>
                  <option value="leader_controlled">Leader Controlled</option>
                </select>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
                <input
                  type="number"
                  placeholder="Max Members (optional)"
                  value={formData.max_members}
                  onChange={(e) => setFormData({ ...formData, max_members: e.target.value })}
                  className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setIsJoinMode(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={isJoinMode ? handleJoinGroup : handleCreateGroup}
                disabled={submitting}
                className="px-4 py-2 rounded-lg text-white disabled:opacity-50"
                style={{ backgroundColor: PRIMARY_BLUE }}
              >
                {submitting ? "Processing..." : isJoinMode ? "Join" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// SIDEBAR CONTENT COMPONENT
function SidebarContent({ groups, setActiveGroup, activeGroup, navigate, setModalOpen, setIsJoinMode }) {
  return (
    <>
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Groups</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {groups.map((group) => (
          <div
            key={group.id}
            onClick={() => setActiveGroup(group)}
            className={`cursor-pointer px-4 py-3 hover:bg-[#2C76BA]/10 transition ${
              activeGroup?.id === group.id ? "bg-[#2C76BA]/20 border-r-4 border-[#2C76BA]" : ""
            }`}
          >
            <p className={`text-gray-800 ${activeGroup?.id === group.id ? "font-semibold" : ""}`}>
              {group.group_name}
            </p>
            <p className="text-xs text-gray-500">{group.member_count} members</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate("/dashboard")}
        className="p-4 border-t border-gray-200 text-left hover:bg-gray-100 transition font-semibold"
        style={{ color: PRIMARY_BLUE }}
      >
        ← Back to Dashboard
      </button>

      <button
        onClick={() => {
          setModalOpen(true);
          setIsJoinMode(false);
        }}
        className="m-4 px-4 py-2 rounded-lg transition bg-gray-800 text-white flex items-center justify-center gap-2 hover:bg-gray-900"
      >
        <PlusIcon className="w-5 h-5" />
        Create / Join
      </button>
    </>
  );
}