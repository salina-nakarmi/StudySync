import {
  Search,
  Plus,
  SlidersHorizontal,
  FileText,
  CalendarCheck,
  Download,
  Bookmark,
  BookOpen,
  Menu,
  X,
  Video,
  Link as LinkIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import Navbar from "../components/Navbar";
import AddResourceModal from "../components/AddResourceModal";
import { resourceService } from "../services/resource_services";
import { groupService } from "../services/group_services";

const filterOptions = [
  { label: "All", value: "all", icon: null },
  { label: "Files", value: "file", icon: FileText },
  { label: "Videos", value: "video", icon: Video },
  { label: "Links", value: "link", icon: LinkIcon },
];

const Index = () => {
  const { getToken } = useAuth();
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resourceScope, setResourceScope] = useState("personal");
  const [groupIdInput, setGroupIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedResource, setSelectedResource] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [progressStatus, setProgressStatus] = useState("not_started");
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressNotes, setProgressNotes] = useState("");
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressSaving, setProgressSaving] = useState(false);
  const [shareGroupId, setShareGroupId] = useState("");
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState("");

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError("");
      const token = await getToken();
      
      const query = {
        skip: 0,
        limit: 100,
      };

      if (activeFilter !== "all") {
        query.resource_type = activeFilter;
      }

      if (searchQuery.trim()) {
        query.search = searchQuery.trim();
      }

      let data = [];
      if (resourceScope === "personal") {
        data = await resourceService.getPersonalResources(token, query);
      } else if (resourceScope === "group" && groupIdInput) {
        data = await resourceService.getGroupResources(token, Number(groupIdInput), query);
      }

      setResources(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load resources");
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (resourceScope === "group" && !groupIdInput) {
        setResources([]);
        return;
      }
      fetchResources();
    }, 350);

    return () => clearTimeout(timer);
  }, [resourceScope, groupIdInput, activeFilter, searchQuery]);

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    const loadProgress = async () => {
      if (!detailOpen || !selectedResource) return;
      try {
        setProgressLoading(true);
        const token = await getToken();
        const progress = await resourceService.getMyProgress(token, selectedResource.id);
        setProgressStatus(progress?.status || "not_started");
        setProgressPercent(progress?.progress_percentage || 0);
        setProgressNotes(progress?.notes || "");
      } catch (err) {
        setProgressStatus("not_started");
        setProgressPercent(0);
        setProgressNotes("");
      } finally {
        setProgressLoading(false);
      }
    };

    loadProgress();
  }, [detailOpen, selectedResource]);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setGroupsLoading(true);
        setGroupsError("");
        const token = await getToken();
        const data = await groupService.getMyGroups(token);
        setGroups(Array.isArray(data) ? data : []);
      } catch (err) {
        setGroupsError(err.message || "Failed to load groups");
        setGroups([]);
      } finally {
        setGroupsLoading(false);
      }
    };

    if (detailOpen) {
      loadGroups();
    }
  }, [detailOpen]);

  const handleAddResource = async (data) => {
    try {
      const isFile = data.type === "file";
      const token = await getToken();
      const groupId = resourceScope === "group" && groupIdInput ? Number(groupIdInput) : null;

      if (isFile) {
        await resourceService.uploadFile(
          token,
          data.file,
          groupId,
          data.description || null,
          data.parentFolderId || null
        );
      } else {
        await resourceService.createResource(token, {
          title: data.title,
          url: data.url,
          description: data.description || "",
          resource_type: "link",
          group_id: groupId,
          parent_folder_id: data.parentFolderId || null,
        });
      }

      setAddModalOpen(false);
      await fetchResources();
    } catch (err) {
      setError(err.message || "Failed to add resource");
    }
  };

  const openDetails = (resource) => {
    setSelectedResource(resource);
    setDetailOpen(true);
    setShareGroupId("");
  };

  const closeDetails = () => {
    setDetailOpen(false);
    setSelectedResource(null);
  };

  const handleSaveProgress = async () => {
    if (!selectedResource) return;
    try {
      setProgressSaving(true);
      const token = await getToken();
      await resourceService.updateProgress(token, selectedResource.id, {
        status: progressStatus,
        progress_percentage: progressPercent,
        notes: progressNotes || null,
      });
    } catch (err) {
      setError(err.message || "Failed to save progress");
    } finally {
      setProgressSaving(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!selectedResource) return;
    try {
      setProgressSaving(true);
      const token = await getToken();
      await resourceService.markCompleted(token, selectedResource.id, progressNotes || null);
      setProgressStatus("completed");
      setProgressPercent(100);
    } catch (err) {
      setError(err.message || "Failed to mark as complete");
    } finally {
      setProgressSaving(false);
    }
  };

  const handleDeleteResource = async () => {
    if (!selectedResource || !window.confirm("Are you sure you want to delete this resource?")) {
      return;
    }
    try {
      const token = await getToken();
      await resourceService.deleteResource(token, selectedResource.id);
      closeDetails();
      await fetchResources();
    } catch (err) {
      setError(err.message || "Failed to delete resource");
    }
  };

  const handleShareToGroup = async () => {
    if (!selectedResource || !shareGroupId) {
      setError("Please select a group to share with");
      return;
    }
    try {
      const token = await getToken();
      await resourceService.shareResourceToGroup(token, selectedResource.id, Number(shareGroupId));
      await fetchResources();
      closeDetails();
    } catch (err) {
      setError(err.message || "Failed to share resource");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-24 relative">
        {sidebarOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 bg-transparent z-40"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            />
            <aside className="px-0 sm:px-0 fixed left-0 top-16 bottom-0 w-56 z-50">
              <div className="bg-gray-50/80 p-4 space-y-5 w-full h-full">
                <div>
                  <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-3">
                    Your Stats
                  </p>
                  <div className="space-y-3">
                    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                      <p className="text-[10px] font-semibold text-gray-500">Total Hours</p>
                      <p className="text-2xl font-bold text-gray-900">48</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                      <p className="text-[10px] font-semibold text-gray-500">Resources Completed</p>
                      <p className="text-2xl font-bold text-gray-900">12</p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </>
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <section>
            {/* Top bar: Search + Add */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                aria-label="Open sidebar"
              >
                <Menu size={18} />
              </button>
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates, notes, links..."
                  className="w-full pl-11 pr-5 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-shadow"
                />
              </div>
              <button
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-opacity shrink-0"
              >
                <Plus size={16} />
                Add Resource
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full p-1">
                {[
                  { label: "Personal", value: "personal" },
                  { label: "Group", value: "group" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setResourceScope(item.value)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      resourceScope === item.value
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                    type="button"
                  >
                    {item.label} Resources
                  </button>
                ))}
              </div>

              {resourceScope === "group" && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Group ID</label>
                  <input
                    value={groupIdInput}
                    onChange={(event) => setGroupIdInput(event.target.value)}
                    placeholder="Enter group ID"
                    className="w-32 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    inputMode="numeric"
                  />
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-6">
              <SlidersHorizontal size={16} className="text-gray-400 mr-1" />
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setActiveFilter(opt.value)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                    activeFilter === opt.value
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-white text-gray-500 border border-gray-200 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  {opt.icon && <opt.icon size={13} />}
                  {opt.label}
                </button>
              ))}
              <span className="ml-auto text-xs text-gray-500">
                {resources.length} resource{resources.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Section Title */}
            <h2 className="text-xl font-bold text-gray-900 mb-5">
              {resourceScope === "personal" 
                ? "Your Personal Resources" 
                : `Group Resources${groupIdInput ? ` (${groupIdInput})` : ""}`}
            </h2>

            {/* Error Message */}
            {error && (
              <div className="mb-4 py-3 px-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
                <button 
                  onClick={() => setError("")}
                  className="ml-2 underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Resource Grid */}
            {loading ? (
              <div className="py-16 text-center text-gray-500">Loading resources...</div>
            ) : resources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">
                  {resourceScope === "group" && !groupIdInput
                    ? "Enter a group ID to view group resources"
                    : "No resources found."}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {resourceScope === "group" && !groupIdInput
                    ? ""
                    : "Try adjusting your search or filters, or add your first resource."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    onSelect={openDetails}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      <ResourceDetailModal
        isOpen={detailOpen}
        resource={selectedResource}
        onClose={closeDetails}
        progressLoading={progressLoading}
        progressStatus={progressStatus}
        progressPercent={progressPercent}
        progressNotes={progressNotes}
        progressSaving={progressSaving}
        onProgressStatusChange={setProgressStatus}
        onProgressPercentChange={setProgressPercent}
        onProgressNotesChange={setProgressNotes}
        onSaveProgress={handleSaveProgress}
        onMarkComplete={handleMarkComplete}
        onDelete={handleDeleteResource}
        onShare={handleShareToGroup}
        shareGroupId={shareGroupId}
        onShareGroupIdChange={setShareGroupId}
        groups={groups}
        groupsLoading={groupsLoading}
        groupsError={groupsError}
      />

      <AddResourceModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddResource}
        groupId={resourceScope === "group" && groupIdInput ? Number(groupIdInput) : null}
      />
    </div>
  );
};

export default Index;

const ResourceCard = ({ resource, onSelect }) => {
  const cardIcons = {
    file: FileText,
    video: Video,
    link: LinkIcon,
  };
  const Icon = cardIcons[resource.resource_type] || FileText;

  return (
    <button
      type="button"
      onClick={() => onSelect(resource)}
      className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg transition flex flex-col h-full text-left"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-gray-600" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 px-2 py-1 rounded text-gray-600">
          {resource.resource_type}
        </span>
      </div>
      <h3 className="font-bold text-gray-900 mb-1">
        {resource.title || "Untitled"}
      </h3>
      <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
        {resource.description || "No description provided."}
      </p>
      <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
        <span>{resource.tags?.[0] || "Resource"}</span>
        <span className="text-[#2C76BA] font-medium">View Resource →</span>
      </div>
    </button>
  );
};

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const formatRelativeTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

const getProgressLabel = (status) => {
  if (status === "completed") return "Completed";
  if (status === "in_progress") return "In Progress";
  if (status === "paused") return "Paused";
  return "Not Started";
};

const ResourceDetailModal = ({
  isOpen,
  resource,
  onClose,
  progressLoading,
  progressStatus,
  progressPercent,
  progressNotes,
  progressSaving,
  onProgressStatusChange,
  onProgressPercentChange,
  onProgressNotesChange,
  onSaveProgress,
  onMarkComplete,
  onDelete,
  onShare,
  shareGroupId,
  onShareGroupIdChange,
  groups,
  groupsLoading,
  groupsError,
}) => {
  if (!isOpen || !resource) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 p-6 z-[80] max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {resource.title || "Untitled"}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Uploaded: {formatRelativeTime(resource.created_at) || "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 space-y-2 text-sm text-gray-600">
          <p>
            <span className="font-semibold text-gray-700">Description:</span>{" "}
            {resource.description || "No description provided."}
          </p>
          <p>
            <span className="font-semibold text-gray-700">Type:</span>{" "}
            {resource.resource_type?.toUpperCase() || "FILE"}
            {resource.file_size ? ` • Size: ${formatBytes(resource.file_size)}` : ""}
          </p>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-gray-800">Your Progress</p>
          {progressLoading ? (
            <p className="text-xs text-gray-500 mt-2">Loading progress...</p>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{progressPercent}% Complete</span>
                <span>Status: {getProgressLabel(progressStatus)}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-[#2C76BA]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={progressPercent}
                onChange={(event) => onProgressPercentChange(Number(event.target.value))}
                className="w-full accent-[#2C76BA]"
              />
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-500">Status</label>
                <select
                  value={progressStatus}
                  onChange={(event) => onProgressStatusChange(event.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1"
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Notes</label>
                <textarea
                  value={progressNotes}
                  onChange={(event) => onProgressNotesChange(event.target.value)}
                  rows={2}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-xs"
                  placeholder="Add a note..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {resource.url && (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800"
            >
              Open File
            </a>
          )}
          <button
            type="button"
            onClick={onMarkComplete}
            disabled={progressSaving}
            className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Mark Complete
          </button>
          <button
            type="button"
            onClick={onSaveProgress}
            disabled={progressSaving}
            className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {progressSaving ? "Saving..." : "Save Progress"}
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-800 mb-3">Share to Group</p>
          <div className="flex flex-wrap gap-2">
            <select
              value={shareGroupId}
              onChange={(event) => onShareGroupIdChange(event.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs"
            >
              <option value="">
                {groupsLoading ? "Loading groups..." : "Select group"}
              </option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.group_name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onShare}
              disabled={!shareGroupId || groupsLoading}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-50"
            >
              Share
            </button>
          </div>
          {groupsError && (
            <p className="mt-2 text-xs text-red-500">{groupsError}</p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onDelete}
            className="w-full px-4 py-2 rounded-lg text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50"
          >
            Delete Resource
          </button>
        </div>
      </div>
    </div>
  );
};