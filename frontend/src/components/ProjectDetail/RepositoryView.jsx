// components/ProjectDetail/RepositoryView.jsx
import { useState } from "react";
import {
  FolderIcon,
  FileIcon,
  GitBranchIcon,
  GitCommitHorizontalIcon,
  TagIcon,
  StarIcon,
  EyeIcon,
  ClockIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CodeIcon,
  CopyIcon,
  DownloadIcon,
} from "lucide-react";

// ─── Static data ────────────────────────────────────────────────────────────────

const REPO_META = {
  name: "studysync",
  description: "A collaborative study management platform built with React and Node.js.",
  branch: "main",
  branches: 5,
  tags: 2,
  commits: 62,
  stars: 8,
  watchers: 4,
  language: "JavaScript",
  lastCommit: "2 hours ago",
  lastMessage: "fix: authentication redirect on mobile after login",
  lastAuthor: "abc",
  cloneUrl: "https://github.com/org/studysync.git",
};

const LANGUAGES = [
  { name: "JavaScript", pct: 58, color: "#f1e05a" },
  { name: "CSS",        pct: 22, color: "#563d7c" },
  { name: "HTML",       pct: 12, color: "#e34c26" },
  { name: "Shell",      pct:  8, color: "#89e051" },
];

const FILE_TREE = [
  {
    type: "folder",
    name: "frontend",
    commit: "feat: add task board collapsible rows",
    author: "xyz",
    time: "5 hours ago",
    children: [
      { type: "folder", name: "src",      commit: "fix: authentication redirect", author: "abc", time: "2 hours ago" },
      { type: "folder", name: "public",   commit: "chore: update favicon",        author: "123", time: "3 days ago"  },
      { type: "file",   name: "index.html", commit: "init: project setup",        author: "abc", time: "10 days ago" },
      { type: "file",   name: "package.json", commit: "chore: update deps",       author: "123", time: "5 days ago"  },
      { type: "file",   name: "vite.config.js", commit: "feat: configure vite",   author: "abc", time: "8 days ago"  },
    ],
  },
  {
    type: "folder",
    name: "backend",
    commit: "feat: integrate Clerk authentication",
    author: "abc",
    time: "Jun 18",
    children: [
      { type: "folder", name: "routes",      commit: "feat: add project routes",    author: "xyz", time: "Jun 17"  },
      { type: "folder", name: "models",      commit: "feat: user and project schema", author: "abc", time: "Jun 15" },
      { type: "folder", name: "middleware",  commit: "feat: auth middleware",        author: "123", time: "Jun 14"  },
      { type: "file",   name: "server.js",   commit: "init: express server setup",  author: "abc", time: "Jun 12"  },
      { type: "file",   name: "package.json", commit: "chore: backend deps",        author: "456", time: "Jun 12"  },
    ],
  },
  { type: "file", name: ".gitignore",  commit: "init: add gitignore",          author: "abc", time: "Jun 10" },
  { type: "file", name: "README.md",   commit: "docs: update README",          author: "xyz", time: "Jun 16" },
  { type: "file", name: "docker-compose.yml", commit: "feat: add docker setup", author: "123", time: "Jun 13" },
];

const README = `# StudySync

A collaborative study management platform for students and teams.

## Features

- **Task Board** — Organize work across To Do, In Progress, In Review, Done
- **Docs Editor** — Rich text documentation with real-time collaboration
- **Tracking** — GitHub-style commit and activity tracking
- **Team** — Manage project members and roles
- **Groups** — Study group coordination and chat

## Tech Stack

- **Frontend** — React 18, Vite, Tailwind CSS
- **Backend** — Node.js, Express, MongoDB
- **Auth** — Clerk
- **Realtime** — WebSockets

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Start dev server
npm run dev
\`\`\`
`;

// ─── Components ─────────────────────────────────────────────────────────────────

function LanguageBar() {
  return (
    <div>
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-2">
        {LANGUAGES.map((l) => (
          <div key={l.name} style={{ width: `${l.pct}%`, backgroundColor: l.color }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {LANGUAGES.map((l) => (
          <span key={l.name} className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
            <span className="font-semibold text-gray-700">{l.name}</span>
            <span>{l.pct}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function FileRow({ item, depth = 0 }) {
  const [open, setOpen] = useState(false);
  const isFolder = item.type === "folder";

  return (
    <>
      <div
        className={`flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
          isFolder ? "cursor-pointer" : ""
        }`}
        style={{ paddingLeft: `${16 + depth * 20}px` }}
        onClick={() => isFolder && setOpen((o) => !o)}
      >
        {/* Icon */}
        <span className="shrink-0">
          {isFolder ? (
            open
              ? <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
              : <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" />
          ) : (
            <span className="w-3.5 h-3.5 block" />
          )}
        </span>
        <span className="shrink-0">
          {isFolder
            ? <FolderIcon className="h-4 w-4 text-[#2C76BA]" />
            : <FileIcon className="h-4 w-4 text-gray-400" />
          }
        </span>

        {/* Name */}
        <span className={`text-sm font-medium min-w-0 ${isFolder ? "text-[#2C76BA]" : "text-gray-700"}`}>
          {item.name}
        </span>

        {/* Commit message */}
        <span className="flex-1 text-xs text-gray-400 truncate hidden sm:block">{item.commit}</span>

        {/* Author + time */}
        <span className="text-[11px] text-gray-400 shrink-0 hidden md:flex items-center gap-1">
          <ClockIcon className="h-3 w-3" />
          {item.time}
        </span>
      </div>

      {/* Children */}
      {isFolder && open && item.children?.map((child, i) => (
        <FileRow key={i} item={child} depth={depth + 1} />
      ))}
    </>
  );
}

function ReadmePanel() {
  const lines = README.split("\n");
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50/60">
        <FileIcon className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-bold text-gray-700">README.md</span>
      </div>
      <div className="px-6 py-5 prose prose-sm max-w-none text-gray-700 text-sm leading-relaxed">
        {lines.map((line, i) => {
          if (line.startsWith("# "))
            return <h1 key={i} className="text-xl font-extrabold text-gray-900 mb-3 mt-0">{line.slice(2)}</h1>;
          if (line.startsWith("## "))
            return <h2 key={i} className="text-base font-bold text-gray-800 mt-5 mb-2">{line.slice(3)}</h2>;
          if (line.startsWith("```"))
            return null;
          if (line.startsWith("- "))
            return <li key={i} className="text-gray-600 ml-4 text-sm list-disc">{line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}</li>;
          if (line.trim() === "")
            return <div key={i} className="h-2" />;
          // inline bold
          const parts = line.split(/\*\*(.*?)\*\*/g);
          return (
            <p key={i} className="text-sm text-gray-600">
              {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
            </p>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────────

export default function RepositoryView() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(REPO_META.cloneUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CodeIcon className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">{REPO_META.name}</h2>
            <span className="text-[11px] font-bold border border-gray-200 rounded-full px-2 py-0.5 text-gray-400">Public</span>
          </div>
          <p className="text-sm text-gray-500 max-w-lg">{REPO_META.description}</p>
        </div>

        {/* Clone bar */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <span className="font-mono text-gray-500 hidden lg:block">{REPO_META.cloneUrl}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-700 transition-colors"
              title="Copy clone URL"
            >
              <CopyIcon className="h-3.5 w-3.5" />
              <span>{copied ? "Copied!" : "Clone"}</span>
            </button>
          </div>
          <button className="flex items-center gap-1.5 text-xs bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            <DownloadIcon className="h-3.5 w-3.5" />
            ZIP
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-5 text-sm text-gray-500 flex-wrap">
        <span className="flex items-center gap-1.5">
          <GitBranchIcon className="h-4 w-4" />
          <strong className="text-gray-800">{REPO_META.branches}</strong> branches
        </span>
        <span className="flex items-center gap-1.5">
          <TagIcon className="h-4 w-4" />
          <strong className="text-gray-800">{REPO_META.tags}</strong> tags
        </span>
        <span className="flex items-center gap-1.5">
          <GitCommitHorizontalIcon className="h-4 w-4" />
          <strong className="text-gray-800">{REPO_META.commits}</strong> commits
        </span>
        <span className="flex items-center gap-1.5">
          <StarIcon className="h-4 w-4" />
          <strong className="text-gray-800">{REPO_META.stars}</strong> stars
        </span>
        <span className="flex items-center gap-1.5">
          <EyeIcon className="h-4 w-4" />
          <strong className="text-gray-800">{REPO_META.watchers}</strong> watching
        </span>
      </div>

      {/* File browser */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {/* Branch bar + last commit */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60 gap-3">
          <div className="flex items-center gap-2">
            <GitBranchIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-bold text-gray-700">{REPO_META.branch}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 min-w-0">
            <GitCommitHorizontalIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-gray-600 truncate">{REPO_META.lastMessage}</span>
            <span className="shrink-0">by <strong className="text-gray-700">{REPO_META.lastAuthor}</strong></span>
            <span className="shrink-0">{REPO_META.lastCommit}</span>
          </div>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 bg-white">
          <span className="w-3.5 shrink-0" />
          <span className="w-4 shrink-0" />
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider w-36">Name</span>
          <span className="flex-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider hidden sm:block">Last commit</span>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider hidden md:block">Updated</span>
        </div>

        {/* Files */}
        {FILE_TREE.map((item, i) => (
          <FileRow key={i} item={item} />
        ))}
      </div>

      {/* Language stats */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-sm font-bold text-gray-900 mb-3">Languages</p>
        <LanguageBar />
      </div>

      {/* README */}
      <ReadmePanel />
    </div>
  );
}
