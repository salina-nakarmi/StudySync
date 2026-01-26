import { groupService } from "../services/group_services";
import { resourceService } from "../services/resource_services";

export const createGroupHandlers = ({
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
  refetch,
}) => {
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
      await refetch();
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
      await refetch();
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
    const { invite_code } = formData;

    try {
      setSubmitting(true);
      const token = await getToken();

      // 1️⃣ PRIVATE GROUP JOIN (invite code only)
      if (invite_code?.trim()) {
        await groupService.joinGroupByInviteCode(token, invite_code.trim());
        await refetch();
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
      await refetch();
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
      await refetch();
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

  return {
    loadGroupDetails,
    loadGroupResources,
    handleAddResource,
    handleDeleteResource,
    handleDeleteGroup,
    handleCreateGroup,
    handleJoinGroup,
    handleLeaveGroup,
    resetForm,
    handleNavClick,
  };
};