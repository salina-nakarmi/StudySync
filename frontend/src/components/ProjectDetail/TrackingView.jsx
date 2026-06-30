// components/ProjectDetail/TrackingView.jsx
import { useState } from "react";
import {
  GitCommitHorizontalIcon,
  GitBranchIcon,
  GitMergeIcon,
  GitPullRequestIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  XCircleIcon,
  ClockIcon,
  ChevronRightIcon,
  CodeIcon,
} from "lucide-react";

// ─── Static data ───────────────────────────────────────────────────────────────

const CONTRIBUTORS = [
  { name: "abc", avatar: "https://i.pravatar.cc/40?img=47", color: "#2C76BA" },
  { name: "xyz", avatar: "https://i.pravatar.cc/40?img=32", color: "#14b8a6" },
  { name: "123", avatar: "https://i.pravatar.cc/40?img=12", color: "#f87171" },
  { name: "456", avatar: "https://i.pravatar.cc/40?img=25", color: "#a78bfa" },
];

const COMMITS = [
  {
    id: "a3f9c2e",
    message: "fix: authentication redirect on mobile after login",
    author: "abc",
    branch: "main",
    time: "2 hours ago",
    date: "Today",
    additions: 12,
    deletions: 4,
  },
  {
    id: "d81b07a",
    message: "feat: add task board board collapsible rows",
    author: "xyz",
    branch: "feat/taskboard-ui",
    time: "5 hours ago",
    date: "Today",
    additions: 87,
    deletions: 23,
  },
  {
    id: "7c3e91f",
    message: "docs: update API endpoint documentation",
    author: "123",
    branch: "main",
    time: "Yesterday",
    date: "Jun 19",
    additions: 34,
    deletions: 8,
  },
  {
    id: "2b5ad40",
    message: "feat: integrate Clerk authentication with backend",
    author: "abc",
    branch: "feat/auth",
    time: "Jun 18",
    date: "Jun 18",
    additions: 156,
    deletions: 42,
  },
  {
    id: "9f1c83b",
    message: "style: responsive ribbon toolbar in Docs editor",
    author: "456",
    branch: "feat/docs-editor",
    time: "Jun 17",
    date: "Jun 17",
    additions: 61,
    deletions: 19,
  },
  {
    id: "e47d29c",
    message: "fix: sidebar overlap on small screens",
    author: "xyz",
    branch: "fix/sidebar",
    time: "Jun 16",
    date: "Jun 16",
    additions: 18,
    deletions: 7,
  },
  {
    id: "3a8f61d",
    message: "chore: update dependencies and remove unused packages",
    author: "123",
    branch: "main",
    time: "Jun 15",
    date: "Jun 15",
    additions: 0,
    deletions: 214,
  },
  {
    id: "c92e74b",
    message: "feat: project card click navigation to detail page",
    author: "abc",
    branch: "feat/project-nav",
    time: "Jun 14",
    date: "Jun 14",
    additions: 44,
    deletions: 6,
  },
];

const BRANCHES = [
  { name: "main",             ahead: 0,  behind: 0,  author: "abc", updated: "2 hours ago",   isDefault: true  },
  { name: "feat/taskboard-ui",   ahead: 3,  behind: 1,  author: "xyz", updated: "5 hours ago",   isDefault: false },
  { name: "feat/auth",        ahead: 7,  behind: 2,  author: "abc", updated: "2 days ago",    isDefault: false },
  { name: "feat/docs-editor", ahead: 5,  behind: 4,  author: "456", updated: "3 days ago",    isDefault: false },
  { name: "fix/sidebar",      ahead: 1,  behind: 1,  author: "xyz", updated: "4 days ago",    isDefault: false },
];

const PULL_REQUESTS = [
  {
    id: 14,
    title: "feat: task board board collapsible rows with horizontal scroll",
    status: "open",
    author: "xyz",
    branch: "feat/taskboard-ui → main",
    comments: 3,
    time: "5 hours ago",
  },
  {
    id: 13,
    title: "feat: embed Docs editor inside ProjectDetail page",
    status: "merged",
    author: "456",
    branch: "feat/docs-editor → main",
    comments: 5,
    time: "2 days ago",
  },
  {
    id: 12,
    title: "fix: authentication redirect bug on mobile devices",
    status: "open",
    author: "abc",
    branch: "feat/auth → main",
    comments: 2,
    time: "3 days ago",
  },
  {
    id: 11,
    title: "chore: clean up unused imports and update deps",
    status: "closed",
    author: "123",
    branch: "chore/cleanup → main",
    comments: 0,
    time: "5 days ago",
  },
];

// ─── Contribution heatmap (12 weeks × 7 days) ──────────────────────────────────
function generateHeatmap() {
  const weeks = [];
  for (let w = 0; w < 15; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const r = Math.random();
      days.push(r < 0.35 ? 0 : r < 0.6 ? 1 : r < 0.8 ? 2 : r < 0.92 ? 3 : 4);
    }
    weeks.push(days);
  }
  return weeks;
}

const HEATMAP = generateHeatmap();

const HEAT_COLOR = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
const MONTH_LABELS = ["Mar", "Apr", "May", "Jun"];

function ContributionGraph() {
  const [hovered, setHovered] = useState(null);
  const total = HEATMAP.flat().reduce((s, v) => s + v, 0) * 3;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-bold text-gray-900">{total} contributions</p>
          <p className="text-xs text-gray-400">in the last 15 weeks</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <span>Less</span>
          {HEAT_COLOR.map((c, i) => (
            <span key={i} className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: c }} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Month labels */}
      <div className="flex gap-[3px] mb-1 pl-0">
        {MONTH_LABELS.map((m, i) => (
          <span key={i} className="text-[10px] text-gray-400" style={{ width: `${(15 / MONTH_LABELS.length) * 13}px` }}>{m}</span>
        ))}
      </div>

      {/* Grid */}
      <div className="flex gap-[3px] overflow-x-auto">
        {HEATMAP.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px] shrink-0">
            {week.map((level, di) => (
              <div
                key={di}
                onMouseEnter={() => setHovered({ wi, di, level })}
                onMouseLeave={() => setHovered(null)}
                className="w-3 h-3 rounded-sm cursor-default transition-opacity"
                style={{
                  backgroundColor: HEAT_COLOR[level],
                  opacity: hovered && (hovered.wi !== wi || hovered.di !== di) ? 0.6 : 1,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Day labels */}
      <div className="flex flex-col gap-[3px] absolute left-5 top-[72px] text-[9px] text-gray-300 select-none pointer-events-none" style={{ display: "none" }} />
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function CommitHash({ hash }) {
  return (
    <span className="font-mono text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
      {hash}
    </span>
  );
}

function AuthorAvatar({ name }) {
  const c = CONTRIBUTORS.find((c) => c.name === name);
  return c ? (
    <img src={c.avatar} alt={name} className="w-5 h-5 rounded-full border border-white shadow-sm" />
  ) : (
    <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-[9px] font-bold text-white">
      {name[0]}
    </div>
  );
}

function PRStatus({ status }) {
  if (status === "open")
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
        <CircleDotIcon className="h-3 w-3" /> Open
      </span>
    );
  if (status === "merged")
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
        <GitMergeIcon className="h-3 w-3" /> Merged
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
      <XCircleIcon className="h-3 w-3" /> Closed
    </span>
  );
}

// ─── Sections ───────────────────────────────────────────────────────────────────

function CommitLog({ commits }) {
  const byDate = commits.reduce((acc, c) => {
    (acc[c.date] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <GitCommitHorizontalIcon className="h-4 w-4 text-gray-500" />
        <p className="text-sm font-bold text-gray-900">Commits</p>
        <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{commits.length}</span>
      </div>

      {Object.entries(byDate).map(([date, group]) => (
        <div key={date}>
          <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{date}</p>
          </div>
          {group.map((commit, i) => (
            <div
              key={commit.id}
              className={`flex items-start gap-3 px-5 py-3 hover:bg-gray-50/70 transition-colors ${
                i < group.length - 1 ? "border-b border-gray-50" : ""
              }`}
            >
              <div className="mt-0.5">
                <AuthorAvatar name={commit.author} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 font-medium leading-snug truncate">
                  {commit.message}
                </p>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                  <span className="font-medium">{commit.author}</span>
                  <span className="flex items-center gap-1">
                    <GitBranchIcon className="h-3 w-3" />
                    {commit.branch}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    {commit.time}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {commit.additions > 0 && (
                  <span className="text-[10px] font-bold text-green-600">+{commit.additions}</span>
                )}
                {commit.deletions > 0 && (
                  <span className="text-[10px] font-bold text-red-400">−{commit.deletions}</span>
                )}
                <CommitHash hash={commit.id} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function BranchList({ branches }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <GitBranchIcon className="h-4 w-4 text-gray-500" />
        <p className="text-sm font-bold text-gray-900">Branches</p>
        <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{branches.length}</span>
      </div>

      {branches.map((branch, i) => (
        <div
          key={branch.name}
          className={`flex items-center gap-3 px-5 py-3 hover:bg-gray-50/70 transition-colors ${
            i < branches.length - 1 ? "border-b border-gray-50" : ""
          }`}
        >
          <GitBranchIcon className="h-3.5 w-3.5 text-gray-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-medium text-gray-800 truncate">{branch.name}</span>
              {branch.isDefault && (
                <span className="text-[10px] font-bold text-gray-400 border border-gray-200 rounded-full px-1.5 py-0.5">
                  default
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-400">
              <span>{branch.author}</span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                {branch.updated}
              </span>
            </div>
          </div>
          {!branch.isDefault && (
            <div className="flex items-center gap-2 text-[10px] shrink-0">
              {branch.ahead > 0 && (
                <span className="text-green-600 font-bold">↑{branch.ahead} ahead</span>
              )}
              {branch.behind > 0 && (
                <span className="text-orange-500 font-bold">↓{branch.behind} behind</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PullRequestList({ prs }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? prs : prs.filter((p) => p.status === filter);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <GitPullRequestIcon className="h-4 w-4 text-gray-500" />
          <p className="text-sm font-bold text-gray-900">Pull Requests</p>
          <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{prs.length}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          {["all", "open", "merged", "closed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-full font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="px-5 py-8 text-center text-sm text-gray-400">No pull requests match this filter.</div>
      )}

      {filtered.map((pr, i) => (
        <div
          key={pr.id}
          className={`flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/70 transition-colors ${
            i < filtered.length - 1 ? "border-b border-gray-50" : ""
          }`}
        >
          <div className="mt-0.5">
            <AuthorAvatar name={pr.author} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 leading-snug">
              {pr.title}
            </p>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
              <span className="font-mono">{pr.branch}</span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                {pr.time}
              </span>
              {pr.comments > 0 && (
                <span>{pr.comments} comments</span>
              )}
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <PRStatus status={pr.status} />
            <span className="text-[11px] text-gray-300 font-mono">#{pr.id}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ContributorStats() {
  const stats = [
    { name: "abc", commits: 24, additions: 892, deletions: 213 },
    { name: "xyz", commits: 18, additions: 631, deletions: 187 },
    { name: "456", commits: 11, additions: 412, deletions: 94  },
    { name: "123", commits: 9,  additions: 287, deletions: 341 },
  ];
  const maxCommits = Math.max(...stats.map((s) => s.commits));

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <CodeIcon className="h-4 w-4 text-gray-500" />
        <p className="text-sm font-bold text-gray-900">Contributors</p>
      </div>
      <div className="px-5 py-4 flex flex-col gap-4">
        {stats.map((s) => {
          const c = CONTRIBUTORS.find((c) => c.name === s.name);
          return (
            <div key={s.name} className="flex items-center gap-3">
              <img src={c?.avatar} alt={s.name} className="w-7 h-7 rounded-full" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700">{s.name}</span>
                  <span className="text-[10px] text-gray-400">{s.commits} commits</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(s.commits / maxCommits) * 100}%`,
                      backgroundColor: c?.color ?? "#2C76BA",
                    }}
                  />
                </div>
                <div className="flex gap-3 mt-1 text-[10px]">
                  <span className="text-green-600 font-bold">+{s.additions.toLocaleString()}</span>
                  <span className="text-red-400 font-bold">−{s.deletions.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main export ────────────────────────────────────────────────────────────────

const TABS = ["Overview", "Commits", "Branches", "Pull Requests"];

export default function TrackingView() {
  const [tab, setTab] = useState("Overview");

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Tracking</h2>
          <p className="text-sm text-gray-400 mt-0.5">Activity, commits, branches and pull requests</p>
        </div>
        <a
          href="#"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#2C76BA] hover:underline"
        >
          View on GitHub <ChevronRightIcon className="h-3 w-3" />
        </a>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-gray-200 pb-0">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors relative ${
              tab === t
                ? "text-gray-900 bg-white border-b-2 border-gray-900"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "Overview" && (
        <div className="flex flex-col gap-5">
          <ContributionGraph />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <CommitLog commits={COMMITS.slice(0, 5)} />
            </div>
            <ContributorStats />
          </div>
        </div>
      )}

      {tab === "Commits" && <CommitLog commits={COMMITS} />}
      {tab === "Branches" && <BranchList branches={BRANCHES} />}
      {tab === "Pull Requests" && <PullRequestList prs={PULL_REQUESTS} />}
    </div>
  );
}
