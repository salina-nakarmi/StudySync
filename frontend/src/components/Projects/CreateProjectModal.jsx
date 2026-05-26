import React, { useState } from "react";

export default function CreateProjectModal({ onClose, onCreate }) {
  const [projectName, setProjectName]   = useState("");
  const [friendEmail, setFriendEmail]   = useState("");
  const [invites, setInvites]           = useState(["aria@edu.com"]);
  const [githubEnabled, setGithubEnabled] = useState(false);

  const handleAdd = () => {
    const t = friendEmail.trim();
    if (t && !invites.includes(t)) {
      setInvites([...invites, t]);
      setFriendEmail("");
    }
  };

  const handleCreate = () => {
    if (!projectName.trim()) return;
    onCreate({ name: projectName, invites, githubEnabled });
    onClose();
  };

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal panel */}
      <div
        className="bg-white rounded-2xl w-[480px] max-w-[95vw] p-7 shadow-2xl flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Create New Project</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6"  y2="18" />
              <line x1="6"  y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="border-t border-gray-100 -mt-1" />

        {/* Project Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Project Name</label>
          <input
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 bg-gray-50 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition"
            placeholder="e.g., Quantum Computing Basics"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>

        {/* Invite Friends */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">Invite Friends</label>
          <div className="flex gap-2">
            <input
              className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 bg-gray-50 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition"
              placeholder="friend@university.edu"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <button
              onClick={handleAdd}
              className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 rounded-xl transition-colors"
            >
              Add
            </button>
          </div>

          {invites.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-0.5">
              {invites.map((email) => (
                <span
                  key={email}
                  className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-600 text-xs font-medium px-3 py-1 rounded-full"
                >
                  {email}
                  <button
                    onClick={() => setInvites(invites.filter((e) => e !== email))}
                    className="text-gray-400 hover:text-gray-600 transition-colors text-base leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* GitHub Integration */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-200 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">GitHub Integration</p>
                <p className="text-xs text-gray-400">Sync code and track commits</p>
              </div>
            </div>

            {/* Toggle */}
            <button
              onClick={() => setGithubEnabled(!githubEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 outline-none ${
                githubEnabled ? "bg-teal-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                  githubEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Connect Repository — visible when toggled on */}
          {githubEnabled && (
            <button className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors duration-200">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              Connect Repository
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!projectName.trim()}
            className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}