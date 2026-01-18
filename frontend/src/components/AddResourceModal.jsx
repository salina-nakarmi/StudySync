import React, { useState } from "react";
import { XMarkIcon, LinkIcon, DocumentIcon, CloudArrowUpIcon } from "@heroicons/react/24/outline";

export default function AddResourceModal({ isOpen, onClose, onSubmit, groupId }) {
  const [resourceType, setResourceType] = useState('link'); // 'link' or 'file'
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    parentFolderId: null,
    file: null
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, file });
    }
  };

  const handleSubmit = () => {
    if (!groupId) {
      alert("Select a group first to add resources.");
      return;
    }

    if (resourceType === 'file' && !formData.file) {
      alert("Please select a file to upload.");
      return;
    }

    if (resourceType === 'link' && (!formData.title || !formData.url)) {
      alert("Please enter a title and URL for the link.");
      return;
    }

    onSubmit({
      type: resourceType,
      file: formData.file,
      title: formData.title,
      url: formData.url,
      description: formData.description,
      parentFolderId: formData.parentFolderId,
      groupId // automatically attach to the active group
    });

    // Reset form
    setFormData({ title: '', url: '', description: '', file: null, parentFolderId: null });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-11/12 max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Resource</h2>
          <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-600" /></button>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            className={`flex-1 py-2 rounded-lg ${resourceType === 'link' ? 'bg-gray-800 text-white' : 'border'}`}
            onClick={() => setResourceType('link')}
          >
            Link
          </button>
          <button
            className={`flex-1 py-2 rounded-lg ${resourceType === 'file' ? 'bg-gray-800 text-white' : 'border'}`}
            onClick={() => setResourceType('file')}
          >
            File
          </button>
        </div>

        {resourceType === 'link' ? (
          <>
            <input
              type="text"
              name="title"
              placeholder="Title"
              value={formData.title}
              onChange={handleChange}
              className="w-full mb-3 px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              name="url"
              placeholder="URL"
              value={formData.url}
              onChange={handleChange}
              className="w-full mb-3 px-3 py-2 border rounded-lg"
            />
          </>
        ) : (
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full mb-3"
          />
        )}

        <textarea
          name="description"
          placeholder="Description (optional)"
          value={formData.description}
          onChange={handleChange}
          className="w-full mb-3 px-3 py-2 border rounded-lg"
          rows={3}
        />

        <button
          onClick={handleSubmit}
          className="w-full py-2 rounded-lg bg-[#1E78CA] text-white hover:bg-[#1664AB]"
        >
          Add Resource
        </button>
      </div>
    </div>
  );
}
