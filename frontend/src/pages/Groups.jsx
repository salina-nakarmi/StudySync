import React, { useState } from "react";
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

const PRIMARY_BLUE = "#2C76BA"; 

// Mock data for groups
const mockGroups = [
  {
    id: 1,
    name: "Calculus Study Group",
    description: "Let's ace this class!",
    type: "community",
    visibility: "public",
    max_members: 50,
    members: ["Dinisha", "Melina", "Jebisha", "Salina", "Kristina"],
    resources: [
      { type: "document", title: "📄 Midterm Study Guide" },
      { type: "video", title: "🎥 Professor's Lecture Recording" },
      { type: "link", title: "🔗 Practice Problems Website" },
    ],
  },
  {
    id: 2,
    name: "Web Dev ",
    description: "Web dev and algorithms",
    type: "leader_controlled",
    visibility: "private",
    max_members: 25,
    members: ["Dinisha", "Melina", "Jebisha", "Salina"],
    resources: [],
  },
  {
    id: 3,
    name: "Operating Systems",
    description: "Learn OS concepts together",
    type: "community",
    visibility: "public",
    max_members: 30,
    members: ["Dinisha", "Melina", "Jebisha"],
    resources: [],
  },
];

export default function Groups() {
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeTab, setActiveTab] = useState("Resources");
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
        <SidebarContent
          mockGroups={mockGroups}
          setActiveGroup={setActiveGroup}
          activeGroup={activeGroup}
          navigate={navigate}
          setModalOpen={setModalOpen}
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
              mockGroups={mockGroups}
              setActiveGroup={setActiveGroup}
              activeGroup={activeGroup}
              navigate={navigate}
              setModalOpen={setModalOpen}
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

        <div className="flex justify-center">
          <div className="w-full max-w-5xl">
            {!activeGroup ? (
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockGroups.map((group) => (
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
                      <h2 className="text-lg font-semibold">{group.name}</h2>
                      <p className="text-sm opacity-90">{group.description}</p>
                    </div>
                    <div className="p-4 bg-white">
                      <p className="text-sm text-gray-600">
                        Members: {group.members.length}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Type: {group.type === "community" ? "Community" : "Leader Controlled"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
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
                      <h1 className="text-2xl font-bold">{activeGroup.name}</h1>
                      <p className="opacity-90">{activeGroup.description}</p>
                      <p className="mt-2 text-sm">
                        {activeGroup.members.length} members •{" "}
                        {activeGroup.visibility.charAt(0).toUpperCase() +
                          activeGroup.visibility.slice(1)} •{" "}
                        {activeGroup.type === "community" ? "Community" : "Leader Controlled"}
                      </p>
                    </div>
                    <button
                      className="px-3 py-1 bg-white text-[#2C76BA] rounded-lg hover:bg-gray-100 shadow-md"
                      style={{ color: PRIMARY_BLUE }}
                    >
                      ⚙️
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 mb-4 border-b border-gray-200 flex-wrap">
                  {["Resources", "Members", "Leaderboard"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 -mb-1 font-medium transition ${
                        activeTab === tab
                          ? `border-b-2 border-[#2C76BA] text-[#2C76BA] font-semibold`
                          : "text-gray-600 hover:text-[#2C76BA]"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

               
                {activeTab === "Resources" && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold">
                        Group Resources ({activeGroup.resources.length})
                      </h2>
                      <button
                        className="flex items-center gap-1 px-3 py-1 rounded-lg shadow-md"
                        style={{ backgroundColor: "#1E1E1E", color: "white" }}
                      >
                        <PlusIcon className="w-4 h-4" /> Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {activeGroup.resources.map((res, i) => {
                        let Icon;
                        if (res.type === "document") Icon = DocumentTextIcon;
                        else if (res.type === "video") Icon = VideoCameraIcon;
                        else Icon = LinkIcon;
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-2 border border-gray-200 rounded-lg p-3 hover:shadow-md transition"
                          >
                            <Icon className="w-5 h-5 text-gray-600" />
                            <span>{res.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === "Members" && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-2 shadow-sm">
                    {activeGroup.members.map((member, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition"
                      >
                        <UsersIcon className="w-5 h-5 text-gray-600" />
                        <span>{member}</span>
                      </div>
                    ))}
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


      {modalOpen && (
        <div className="fixed inset-0 bg-[#1E1E1E0] flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-11/12 max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">Create or Join Group</h2>
            <input
              type="text"
              placeholder="Group Name / Code"
              className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setModalOpen(false);
                  alert("Feature not implemented yet!");
                }}
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: PRIMARY_BLUE, color: "white" }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// SIDEBAR CONTENT
function SidebarContent({ mockGroups, setActiveGroup, activeGroup, navigate, setModalOpen }) {
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        {mockGroups.map((group) => (
          <div
            key={group.id}
            onClick={() => setActiveGroup(group)}
            className={`cursor-pointer px-4 py-3 hover:bg-[#2C76BA]/10 transition rounded-r-2xl ${
              activeGroup?.id === group.id ? "bg-[#2C76BA]/20 font-semibold" : ""
            }`}
          >
            <p className="text-gray-800">{group.name}</p>
            <p className="text-xs text-gray-500">{group.members.length} members</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate("/dashboard")}
        className="p-4 border-t border-gray-200 text-left hover:bg-gray-100 transition text-[#2C76BA] font-semibold"
      >
        ← Back to Dashboard
      </button>

      <button
        onClick={() => setModalOpen(true)}
        className="m-4 px-4 py-2 rounded-lg transition bg-gray-800 text-white flex items-center justify-center gap-2 hover:bg-gray-900"
       
      >
        + Create / Join
      </button>
    </>
  );
}
