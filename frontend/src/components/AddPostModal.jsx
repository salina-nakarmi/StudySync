import React, { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@clerk/clerk-react";
import { communityService } from "../services/community_services";

const POST_TYPES = [
  { value: "question", label: "Question" },
  { value: "link", label: "Link" },
  { value: "assignment", label: "Assignment" },
  { value: "resource", label: "Resource" },
];

const AddPostModal = ({ isOpen, onClose, onCreated, groupId = null }) => {
  const { getToken } = useAuth();

  const [postType, setPostType] = useState("question");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkSnippet, setLinkSnippet] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [myResources, setMyResources] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || postType !== "resource") return;
    const loadResources = async () => {
      try {
        const token = await getToken();
        const data = await communityService.getMyResourcesForPost(token);
        setMyResources(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load resources", err);
      }
    };
    loadResources();
  }, [isOpen, postType, getToken]);

  const resetForm = () => {
    setPostType("question");
    setTitle("");
    setText("");
    setLinkUrl("");
    setLinkTitle("");
    setLinkSnippet("");
    setResourceId("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setError("");

    if (!title.trim()) {
      setError("Please add a title.");
      return;
    }
    if (postType === "link" && !linkUrl.trim()) {
      setError("Please add a link URL.");
      return;
    }
    if (postType === "resource" && !resourceId) {
      setError("Please choose a resource to share.");
      return;
    }

    try {
      setSubmitting(true);
      const token = await getToken();

      const payload = {
        postType,
        title: title.trim(),
        text: text.trim() || null,
        groupId,
      };

      if (postType === "link") {
        payload.linkData = {
          link_title: linkTitle.trim() || title.trim(),
          link_url: linkUrl.trim(),
          link_snippet: linkSnippet.trim() || null,
        };
      }
      if (postType === "resource") {
        payload.resourceId = Number(resourceId);
      }

      const created = await communityService.createPost(token, payload);
      onCreated?.(created);
      handleClose();
    } catch (err) {
      setError(err.message || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100]">
      <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Create Post</h2>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {POST_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setPostType(t.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                postType === t.value
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 outline-none"
          />

          <textarea
            placeholder={postType === "question" ? "What do you want to ask?" : "Description (optional)"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 outline-none"
          />

          {postType === "link" && (
            <>
              <input
                type="text"
                placeholder="Link URL *"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 outline-none"
              />
              <input
                type="text"
                placeholder="Link display title (optional)"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 outline-none"
              />
              <input
                type="text"
                placeholder="Short snippet (optional)"
                value={linkSnippet}
                onChange={(e) => setLinkSnippet(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 outline-none"
              />
            </>
          )}

          {postType === "resource" && (
            <select
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 outline-none"
            >
              <option value="">Select a resource to share *</option>
              {myResources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.resource_type})
                </option>
              ))}
            </select>
          )}
        </div>

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 text-sm font-bold bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPostModal;