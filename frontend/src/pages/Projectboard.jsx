// // pages/ProjectBoard.jsx
// import React, { useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import Navbar from "../components/Navbar";
// import ProjectSidebar from "../components/Projects/ProjectSidebar";

// // ── Dummy data keyed by project id ──────────────────────────────────────────
// const PROJECT_DATA = {
//   1: {
//     id: 1,
//     name: "Thesis: AI in Ethics",
//     subtitle: "Research Paper • Solo Project",
//     iconBg: "#e0f7f4",
//     icon: "📄",
//     status: "Delayed",
//   },
//   2: {
//     id: 2,
//     name: "Project Alpha",
//     subtitle: "Education App Dev",
//     iconBg: "#1a3a2f",
//     icon: "🅐",
//     status: "Active",
//   },
// };

// const INITIAL_COLUMNS = {
//   todo: {
//     id: "todo",
//     label: "TO DO",
//     tasks: [
//       {
//         id: "t1",
//         title: "Fix authentication redirect bug",
//         priority: "HIGH",
//         priorityColor: "bg-red-100 text-red-600",
//         comments: 2,
//         avatar: "https://i.pravatar.cc/32?img=3",
//         hasAttachment: true,
//       },
//     ],
//   },
//   inprogress: {
//     id: "inprogress",
//     label: "IN PROGRESS",
//     tasks: [
//       {
//         id: "t3",
//         title: "Develop API endpoints for Project sync",
//         priority: "MEDIUM",
//         priorityColor: "bg-emerald-100 text-emerald-600",
//         deadline: "Aug 24",
//         avatar: "https://i.pravatar.cc/32?img=7",
//         progress: 40,
//       },
//     ],
//   },
//   done: {
//     id: "done",
//     label: "DONE",
//     tasks: [
//       {
//         id: "t4",
//         title: "Project proposal submission",
//         done: true,
//         avatar: "https://i.pravatar.cc/32?img=9",
//       },
//     ],
//   },
// };

// // ── Task Card ────────────────────────────────────────────────────────────────
// function TaskCard({ task }) {
//   if (task.done) {
//     return (
//       <div className="bg-white border border-gray-100 rounded-xl px-4 w-64 h-40 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
//         <p className="text-sm text-gray-400 line-through">{task.title}</p>
//         <div className="flex items-center gap-2">
//           <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
//             <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
//               <polyline points="20 6 9 17 4 12" />
//             </svg>
//           </div>
//           {task.avatar && (
//             <img src={task.avatar} alt="" className="w-6 h-6 rounded-full border-2 border-white object-cover" />
//           )}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white border border-gray-100 rounded-xl p-4 w-64 h-40 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between">
//       {task.priority && (
//         <span className={`self-start text-[10px] font-bold px-2 py-0.5 rounded-md ${task.priorityColor}`}>
//           {task.priority}
//         </span>
//       )}

//       <p className="text-sm font-semibold text-gray-800 leading-snug">{task.title}</p>

//       {/* Progress bar */}
//       {task.progress !== undefined && (
//         <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
//           <div
//             className="h-full bg-gray-800 rounded-full"
//             style={{ width: `${task.progress}%` }}
//           />
//         </div>
//       )}

//       {/* Footer */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-3">
//           {task.hasAttachment && (
//             <span className="text-gray-400">
//               <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
//               </svg>
//             </span>
//           )}
//           {task.comments && (
//             <span className="flex items-center gap-1 text-xs text-gray-400">
//               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
//               </svg>
//               {task.comments}
//             </span>
//           )}
//           {task.deadline && (
//             <span className="flex items-center gap-1 text-xs text-gray-400">
//               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
//                 <line x1="16" y1="2" x2="16" y2="6" />
//                 <line x1="8" y1="2" x2="8" y2="6" />
//                 <line x1="3" y1="10" x2="21" y2="10" />
//               </svg>
//               {task.deadline}
//             </span>
//           )}
//         </div>
//         {task.avatar && (
//           <img src={task.avatar} alt="" className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm" />
//         )}
//       </div>
//     </div>
//   );
// }

// // ── Column ───────────────────────────────────────────────────────────────────
// function Column({ column, onAddTask }) {
//   const count = column.tasks.length;

//   return (
//     <div className="flex flex-col gap-3 w-64 shrink-0">
//       {/* Column header */}
//       <div className="flex items-center justify-between">
//         <span className="text-xs font-bold text-gray-500 tracking-wide uppercase">
//           {column.label} ({count})
//         </span>
//         {column.id !== "done" && (
//           <button className="text-gray-400 hover:text-gray-600 transition-colors">
//             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
//               <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
//             </svg>
//           </button>
//         )}
//       </div>

//       {/* Cards */}
//       <div className="flex flex-col gap-3">
//         {column.tasks.map((task) => (
//           <TaskCard key={task.id} task={task} />
//         ))}
//       </div>

//       {/* Add Task */}
//       {column.id === "todo" && (
//         <button
//           onClick={onAddTask}
//           className="border-2 border-dashed border-gray-200 rounded-xl py-2.5 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5"
//         >
//           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
//             <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
//           </svg>
//           Add Task
//         </button>
//       )}
//     </div>
//   );
// }

// // ── Main Page ────────────────────────────────────────────────────────────────
// export default function ProjectBoard() {
//   const { projectId } = useParams();
//   const navigate = useNavigate();
//   const project = PROJECT_DATA[Number(projectId)] || PROJECT_DATA[2];

//   const [activeTab, setActiveTab] = useState("board");
//   const [columns, setColumns] = useState(INITIAL_COLUMNS);

//   const handleAddTask = () => {
//     const title = prompt("Task title:");
//     if (!title?.trim()) return;
//     setColumns((prev) => ({
//       ...prev,
//       todo: {
//         ...prev.todo,
//         tasks: [
//           ...prev.todo.tasks,
//           {
//             id: `t${Date.now()}`,
//             title: title.trim(),
//             priority: "LOW",
//             priorityColor: "bg-gray-100 text-gray-500",
//           },
//         ],
//       },
//     }));
//   };

//   return (
//     <div className="min-h-screen bg-white font-sans">
//       <Navbar />

//       <ProjectSidebar
//         project={project}
//         activeTab={activeTab}
//         onTabChange={setActiveTab}
//       />

//       <main className="ml-44 pt-24 min-h-screen">
//         {/* Compact breadcrumb + filter bar */}
//         <div className="flex items-center justify-between px-8 pr-40 h-12">
//           <div className="flex items-center gap-2 text-sm">
//             <button
//               onClick={() => navigate("/projects")}
//               className="text-gray-400 hover:text-gray-700 transition font-medium"
//             >
//               Projects
//             </button>
//             <span className="text-gray-300">/</span>
//             <span className="font-semibold text-gray-800 truncate max-w-xs">{project.name}</span>
//           </div>

//           <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors">
//             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//               <line x1="4" y1="6" x2="20" y2="6" />
//               <line x1="8" y1="12" x2="16" y2="12" />
//               <line x1="11" y1="18" x2="13" y2="18" />
//             </svg>
//             Filter
//           </button>
//         </div>

//         {/* Board content */}
//         <div className="px-8 py-6">
//           {activeTab === "board" && (
//             <div className="flex gap-5 overflow-x-auto pb-4">
//               {Object.values(columns).map((col) => (
//                 <Column
//                   key={col.id}
//                   column={col}
//                   onAddTask={handleAddTask}
//                 />
//               ))}
//             </div>
//           )}

//           {activeTab !== "board" && (
//             <div className="mt-24 flex flex-col items-center justify-center text-gray-400">
//               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3">
//                 <rect x="3" y="3" width="18" height="18" rx="2" />
//                 <line x1="3" y1="9" x2="21" y2="9" />
//                 <line x1="9" y1="21" x2="9" y2="9" />
//               </svg>
//               <p className="text-sm font-medium capitalize">{activeTab} — coming soon</p>
//             </div>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }