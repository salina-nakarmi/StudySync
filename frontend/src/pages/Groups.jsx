import React, { useState, useEffect } from "react";
import {
  UsersIcon,
  PlusIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  LinkIcon,
  Bars3Icon,
  XMarkIcon,
  Cog6ToothIcon,
  BellIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { groupService } from "../services/group_services";
import AddResourceModal from "../components/AddResourceModal";
import { resourceService } from "../services/resource_services";
import Navbar from "../components/Navbar";

const PRIMARY_BLUE = "#2C76BA";

export default function Groups() {
  const { getToken, isSignedIn } = useAuth();
  useUser();
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeTab, setActiveTab] = useState("Resources");
  const [modalOpen, setModalOpen] = useState(false);
  // const [menuOpen, setMenuOpen] = useState(false); // For Mobile Nav
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resources, setResources] = useState([]);
  const [addResourceModalOpen, setAddResourceModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // const navItems = ["Dashboard", "Resources", "Progress Tracking", "Groups"];

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

  // --- LOGIC (UNTOUCHED) ---
  useEffect(() => {
    if (isSignedIn) {
      loadGroups();
    } else {
      navigate("/sign-in");
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (activeGroup) {
      loadGroupDetails(activeGroup.id);
      if (activeTab === "Resources") {
        loadGroupResources(activeGroup.id);
      }
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
        await resourceService.uploadFile(token, resourceData.file, groupId, resourceData.description ?? null);
      }
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
      await loadGroups();
      setActiveGroup(newGroup);
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
    if (!formData.group_name.trim()) {
      alert("Please enter the group name");
      return;
    }
    try {
      setSubmitting(true);
      const token = await getToken();
      const groupsFound = await groupService.getPublicGroups(token, { search: formData.group_name.trim() });
      if (!groupsFound.length) {
        alert("No group found with that name");
        return;
      }
      const group = groupsFound[0];
      await groupService.joinGroup(token, group.id, formData.invite_code?.trim() || null);
      await loadGroups();
      resetForm();
      setModalOpen(false);
      setIsJoinMode(false);
      alert("Successfully joined the group!");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    try {
      const token = await getToken();
      await groupService.leaveGroup(token, groupId);
      await loadGroups();
      if (activeGroup?.id === groupId) setActiveGroup(null);
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

  const handleNavClick = (item) => {
    if (item === "Dashboard") navigate("/dashboard");
    if (item === "Groups") navigate("/groups");
    if (item === "Progress Tracking") navigate("/progress-tracking");
  };

  // --- UI COMPONENTS ---
  const NavButton = ({ item }) => {
    const isActive = location.pathname.includes(item.toLowerCase().replace(" ", "-")) || (item === "Groups" && location.pathname === "/groups");
    return (
      <button
        onClick={() => handleNavClick(item)}
        className={`px-4 py-2 rounded-full transition-all text-sm font-medium ${
          isActive
            ? "bg-gray-800 text-white shadow-md hover:bg-gray-900"
            : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        {item}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border[#2C76BA] mx-auto mb-4"></div>
      </div>
    );
  }

  return (
     <>
      <Navbar />
    <div className="min-h-screen bg-white">
      {/* NAVBAR (Cloned from Dashboard) */}
      {/* <nav className="bg-white fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-xl">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">StudySync</span>
            </div>

            <div className="hidden md:flex flex-1 justify-center mx-10">
              <div className="flex space-x-1 p-1 bg-gray-100 rounded-full border border-gray-200">
                {navItems.map((item) => (
                  <NavButton key={item} item={item} />
                ))}
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-2">
              <button className="flex items-center space-x-2 px-4 py-2 rounded-full text-gray-700 hover:bg-gray-100 border border-gray-200">
                <Cog6ToothIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Settings</span>
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 border border-gray-200">
                <BellIcon className="w-6 h-6 text-gray-700" />
              </button>
              <button onClick={() => navigate("/profile")} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300">
                <UserIcon className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-full text-gray-800 hover:bg-gray-100">
                {menuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden px-4 pb-4 space-y-2 border-t border-gray-100 bg-white">
            <div className="flex flex-col space-y-1 p-2 bg-gray-50 rounded-lg">
              {navItems.map((item) => (
                <button
                  key={item}
                  onClick={() => { handleNavClick(item); setMenuOpen(false); }}
                  className={`px-3 py-2 rounded-lg text-left text-base font-medium ${
                    location.pathname.includes(item.toLowerCase()) ? "bg[#2C76BA] text-white" : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav> */}

      {/* MAIN CONTENT AREA */}
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
                    <span className="text[#2C76BA] font-medium">View Group →</span>
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
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{activeGroup.group_name}</h2>
                  <p className="text-gray-500 mt-1 max-w-2xl">{activeGroup.description}</p>
                  <div className="flex gap-4 mt-4 text-xs font-medium text-gray-600">
                    <span className="bg-gray-100 px-3 py-1 rounded-full">{activeGroup.member_count} Members</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-full capitalize">{activeGroup.visibility}</span>
                    {activeGroup.invite_code && (
                      <span className="bg-blue-50 text-blue[#2C76BA] px-3 py-1 rounded-full">Code: {activeGroup.invite_code}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {currentUserIsLeader ? (
                    <button onClick={() => handleDeleteGroup(activeGroup.id)} className="px-4 py-2 text-sm font-bold text-red-600 border border-red-100 rounded-lg hover:bg-red-50">
                      Delete
                    </button>
                  ) : (
                    <button onClick={() => handleLeaveGroup(activeGroup.id)} className="px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                      Leave
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
                      activeTab === tab ? "text-gray-900 border-b-2 border-[#2C76BA]" : "text-gray-400 hover:text-gray-600"
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
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <a href={res.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#2C76BA] hover:underline">Open</a>
                              <button onClick={() => handleDeleteResource(res.id)} className="p-1.5 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">
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
        onSubmit={resourceData => handleAddResource({ ...resourceData, groupId: activeGroup?.id })}
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
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring[#2C76BA] outline-none text-sm transition"
              />
              {!isJoinMode ? (
                <>
                  <textarea
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring[#2C76BA] outline-none text-sm h-24 transition"
                  />
                  <select
                    value={formData.group_type}
                    onChange={(e) => setFormData({ ...formData, group_type: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring[#2C76BA] outline-none text-sm transition"
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring [#2C76BA] outline-none text-sm transition"
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
                onClick={isJoinMode ? handleJoinGroup : handleCreateGroup} 
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
