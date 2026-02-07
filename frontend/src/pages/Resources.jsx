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
  Video,
  Link as LinkIcon,
} from "lucide-react";
import { useState } from "react";
import Navbar from "../components/Navbar";
import AddResourceModal from "../components/AddResourceModal";

const initialResources = [
  {
    id: "1",
    title: "Artificial Intelligence",
    description: "Comprehensive slides and tutorials covering neural networks, machine learning, and deep learning fundamentals.",
    resource_type: "file",
    tags: ["Slides", "Tutorial"],
    url: "#",
  },
  {
    id: "2",
    title: "Quantum Physics",
    description: "Interactive puzzles and detailed notes on quantum mechanics, wave-particle duality, and entanglement.",
    resource_type: "file",
    tags: ["Puzzles", "Notes"],
    url: "#",
  },
  {
    id: "3",
    title: "Cybersecurity Fundamentals",
    description: "Video lectures on network security, encryption, threat modeling, and ethical hacking.",
    resource_type: "video",
    tags: ["Notes", "Quizzes"],
    url: "#",
  },
  {
    id: "4",
    title: "Linear Programming",
    description: "Practice quizzes and MCQs on optimization, simplex method, and constraint modeling.",
    resource_type: "link",
    tags: ["Quizzes", "MCQ"],
    url: "#",
  },
  {
    id: "5",
    title: "Organic Chemistry",
    description: "Structured notes and visual slides covering reaction mechanisms, stereochemistry, and functional groups.",
    resource_type: "file",
    tags: ["Notes", "Slides"],
    url: "#",
  },
  {
    id: "6",
    title: "Internet of Things",
    description: "Curated notes and self-assessment quizzes on IoT protocols, sensors, and embedded systems.",
    resource_type: "link",
    tags: ["Notes", "Quizzes"],
    url: "#",
  },
  {
    id: "7",
    title: "Differential Equations",
    description: "Multiple choice questions and presentation slides on ODEs, PDEs, and Laplace transforms.",
    resource_type: "file",
    tags: ["MCQ", "Slides"],
    url: "#",
  },
  {
    id: "8",
    title: "Object-Oriented Programming",
    description: "Step-by-step video tutorials and notes covering classes, inheritance, polymorphism, and design patterns.",
    resource_type: "video",
    tags: ["Notes", "Slides"],
    url: "#",
  },
  {
    id: "9",
    title: "Complex Numbers",
    description: "Detailed study notes on Argand diagrams, De Moivre's theorem, and applications in engineering.",
    resource_type: "file",
    tags: ["Notes"],
    url: "#",
  },
  {
    id: "10",
    title: "Statistics & Probability",
    description: "Visual slides and reference notes covering distributions, hypothesis testing, and regression analysis.",
    resource_type: "file",
    tags: ["Notes", "Slides"],
    url: "#",
  },
];

const filterOptions = [
  { label: "All", value: "all", icon: null },
  { label: "Files", value: "file", icon: FileText },
  { label: "Videos", value: "video", icon: Video },
  { label: "Links", value: "link", icon: LinkIcon },
];

const Index = () => {
  const [resources, setResources] = useState(initialResources);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredResources = resources.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = activeFilter === "all" || r.resource_type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const handleAddResource = (data) => {
    const isFile = data.type === "file";
    const title = isFile
      ? data.file?.name?.replace(/\.[^/.]+$/, "") || "New File"
      : data.title;
    const newResource = {
      id: Date.now().toString(),
      title,
      description: data.description || "",
      resource_type: isFile ? "file" : "link",
      tags: ["New"],
      url: isFile ? null : data.url,
    };
    setResources((prev) => [newResource, ...prev]);
    setAddModalOpen(false);
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
            <aside className="px-0 sm:px-0 fixed left-0 top-0 bottom-0 w-56 z-50">
              <div className="bg-gray-50/80 p-4 space-y-5 w-full h-full pt-24">
            <div>
              <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-3">
                Quick Access
              </p>
              <div className="space-y-2 mt-3">
                {[
                  { label: "My Notes", icon: FileText },
                  { label: "Assignments Due", icon: CalendarCheck },
                  { label: "Downloaded Files", icon: Download },
                  { label: "Bookmarked", icon: Bookmark },
                  { label: "Study Guides", icon: BookOpen },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-[9px] font-semibold text-gray-700 bg-white border border-gray-200 shadow-sm hover:shadow-md text-left"
                    type="button"
                  >
                    <span className="w-6 h-6 bg-gray-50 rounded-lg flex items-center justify-center">
                      <item.icon className="w-3 h-3 text-gray-600" />
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-3">
                Your Stats
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500">Resources Completed</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Hours Studied</p>
                  <p className="text-2xl font-bold text-gray-900">48</p>
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
                  {filteredResources.length} resource{filteredResources.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Section Title */}
              <h2 className="text-xl font-bold text-gray-900 mb-5">
                Your Resources
              </h2>

              {/* Resource Grid */}
              {filteredResources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Search size={48} className="text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">No resources found.</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Try adjusting your search or filters.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResources.map((resource, index) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      index={index}
                    />
                  ))}
                </div>
              )}
          </section>
        </main>
      </div>

      {/* Add Resource Modal */}
      <AddResourceModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddResource}
        groupId={null}
      />
    </div>
  );
};

export default Index;

const ResourceCard = ({ resource }) => {
  const cardIcons = {
    file: FileText,
    video: Video,
    link: LinkIcon,
  };
  const Icon = cardIcons[resource.resource_type] || FileText;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg transition flex flex-col h-full">
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
        {resource.url ? (
          <a
            href={resource.url}
            className="text-[#2C76BA] font-medium"
          >
            View Resource →
          </a>
        ) : (
          <span className="text-gray-400">No link</span>
        )}
      </div>
    </div>
  );
};
