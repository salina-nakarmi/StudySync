import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookmarkIcon,
  ChatBubbleLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
  FireIcon,
  HeartIcon,
  ShareIcon,
  UsersIcon,
  ClockIcon,
  DocumentTextIcon,
  FolderIcon,
  PlayIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import {
  BookmarkIcon as BookmarkIconSolid,
  HeartIcon as HeartIconSolid,
} from "@heroicons/react/24/solid";
import Navbar from "../components/Navbar";

const filterOptions = [
  { key: "all", label: "All Activity" },
  { key: "friends", label: "Friends" },
  { key: "groups", label: "Groups" },
  { key: "achievements", label: "Achievements" },
  { key: "sessions", label: "Study Sessions" },
];

const statuses = [
  { name: "Salina", status: "Studying DSA 📚", initials: "SA", accent: "bg-slate-900" },
  { name: "Melina", status: "In Pomodoro 🍅", initials: "ME", accent: "bg-slate-700" },
  { name: "Kristina", status: "Pomodoro 🍅", initials: "KR", accent: "bg-zinc-800" },
  { name: "Jebisha", status: "Exam Prep 😭", initials: "JE", accent: "bg-neutral-900" },
];

const studyItems = [
  {
    id: 1,
    period: "Today",
    category: "sessions",
    user: "Salina Nakarmi",
    avatar: "SA",
    time: "12m ago",
    group: "Mathematics",
    title: "completed a 2-hour Mathematics session",
    meta: ["📚 Mathematics", "⏱ 2 hours", "🔥 Focus score: 92%"],
    likes: 24,
    comments: 5,
    saved: false,
    liked: false,
    type: "session",
  },
  {
    id: 2,
    period: "Today",
    category: "achievements",
    user: "Melina Pomu",
    avatar: "ME",
    time: "1h ago",
    group: "Engineering Club",
    title: "reached a 7-day study streak 🔥",
    badge: "7 Day Streak",
    likes: 31,
    comments: 8,
    saved: false,
    liked: true,
    type: "streak",
  },
  {
    id: 3,
    period: "Yesterday",
    category: "sessions",
    user: "Kristina ",
    avatar: "KR",
    time: "Yesterday",
    group: "Focus Lab",
    title: "finished 4 Pomodoro sessions 🍅",
    indicators: ["done", "done", "done", "done"],
    likes: 19,
    comments: 2,
    saved: false,
    liked: false,
    type: "pomodoro",
  },
  {
    id: 4,
    period: "This Week",
    category: "friends",
    user: "Jebisha Bariya",
    avatar: "JE",
    time: "This week",
    group: "Networking Group",
    title: "uploaded notes for Computer Networks",
    fileName: "computer_networks_notes.pdf",
    likes: 12,
    comments: 3,
    saved: true,
    liked: false,
    type: "notes",
  },
  {
    id: 5,
    period: "This Week",
    category: "groups",
    user: "Salina Nakarmi",
    avatar: "SA",
    time: "This week",
    group: "Flutter Study Group",
    title: "joined Flutter Study Group",
    members: 48,
    likes: 8,
    comments: 1,
    saved: false,
    liked: false,
    type: "group",
  },
  {
    id: 6,
    period: "Today",
    category: "friends",
    user: "Dinisha Uprety",
    avatar: "ME",
    time: "2h ago",
    group: "Self Study",
    title: "started a quiet coding sprint",
    likes: 15,
    comments: 4,
    saved: false,
    liked: false,
    type: "simple",
  },
];

const onlineFriends = [
  { name: "Salina Nakarmi", initials: "SA", status: "Studying DSA" },
  { name: "Melina Pomu", initials: "ME", status: "In Pomodoro" },
  { name: "Kristina ", initials: "KR", status: "Pomodoro" },
  { name: "Jebisha Bariya", initials: "JE", status: "Exam Prep" },
];

const groupSessions = [
  { title: "Tonight's DSA sprint", time: "8:00 PM" },
  { title: "Flutter build room", time: "Tomorrow · 6:30 PM" },
  { title: "Networks revision", time: "Fri · 7:00 PM" },
];

const motionItem = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.45, ease: "easeOut" },
};

const Feed = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setItems(studyItems);
      setLoading(false);
    }, 200);

    return () => window.clearTimeout(timer);
  }, []);

  const filteredItems = items.filter((item) => activeFilter === "all" || item.category === activeFilter);

  const toggleReaction = (id, field) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              liked: field === "liked" ? !item.liked : item.liked,
              saved: field === "saved" ? !item.saved : item.saved,
              likes: field === "liked" ? item.likes + (item.liked ? -1 : 1) : item.likes,
            }
          : item
      )
    );
  };

  const FeedCard = ({ item }) => (
    <motion.article
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
      {...motionItem}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-900 text-sm font-semibold text-white">
              {item.avatar}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="truncate font-semibold text-slate-900">{item.user}</p>
              <span className="text-sm text-slate-400">•</span>
              <p className="text-sm text-slate-500">{item.time}</p>
            </div>
            <div className="mt-1 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              {item.group}
            </div>
          </div>
        </div>
        <button className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
          <EllipsisHorizontalIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-sm leading-6 text-slate-800 sm:text-[15px]">
          <span className="font-semibold text-slate-950">{item.user}</span> {item.title}
        </p>

        {item.type === "session" && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
              {item.meta.map((entry) => (
                <span key={entry} className="rounded-full bg-white px-3 py-1 shadow-sm">
                  {entry}
                </span>
              ))}
            </div>
          </div>
        )}

        {item.type === "streak" && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <FireIcon className="h-4 w-4" />
              {item.badge}
            </div>
          </div>
        )}

        {item.type === "pomodoro" && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex gap-2">
              {item.indicators.map((state, index) => (
                <div
                  key={index}
                  className={`h-3 flex-1 rounded-full ${state === "done" ? "bg-emerald-400" : "bg-slate-200"}`}
                />
              ))}
            </div>
            <p className="mt-3 text-xs font-medium text-slate-500">Mini completion indicators</p>
          </div>
        )}

        {item.type === "notes" && (
          <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm">
              <DocumentTextIcon className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{item.fileName}</p>
              <p className="mt-1 text-xs text-slate-500">File preview thumbnail</p>
            </div>
          </div>
        )}

        {item.type === "group" && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                  <UsersIcon className="h-4 w-4" />
                  Group preview
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">Flutter Study Group</p>
                <p className="mt-1 text-xs text-slate-500">{item.members} members online and sharing updates.</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                <FolderIcon className="h-7 w-7" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <button
            onClick={() => toggleReaction(item.id, "liked")}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 transition-colors ${
              item.liked ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
            }`}
          >
            {item.liked ? <HeartIconSolid className="h-4 w-4" /> : <HeartIcon className="h-4 w-4" />}
            React
            <span className="text-xs font-semibold">{item.likes}</span>
          </button>
          <button className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-slate-600 transition-colors hover:bg-slate-200">
            <ChatBubbleLeftIcon className="h-4 w-4" />
            Comment
            <span className="text-xs font-semibold">{item.comments}</span>
          </button>
          <button className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-slate-600 transition-colors hover:bg-slate-200">
            <UsersIcon className="h-4 w-4" />
            Study together
          </button>
        </div>
        <button
          onClick={() => toggleReaction(item.id, "saved")}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${
            item.saved ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {item.saved ? <BookmarkIconSolid className="h-4 w-4" /> : <BookmarkIcon className="h-4 w-4" />}
          Save
        </button>
      </div>
    </motion.article>
  );

  const StatusCircle = ({ item }) => (
    <button className="group min-w-22 text-center">
      <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full p-0.5 transition-transform duration-200 group-hover:scale-105">
        <div className="status-ring flex h-full w-full items-center justify-center rounded-full bg-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white shadow-sm">
            {item.initials}
          </div>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-slate-900">{item.name}</p>
      <p className="text-xs text-slate-500">{item.status}</p>
    </button>
  );

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Study Feed</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              See what your friends are up to 📚
            </h1>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
          <section className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                    activeFilter === filter.key
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Stories</h2>
                  <p className="mt-1 text-sm text-slate-500">Status updates from friends</p>
                </div>
                <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                  <SparklesIcon className="h-4 w-4" />
                  Add Status
                </button>
              </div>
              <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
                {statuses.map((item) => (
                  <motion.button
                    key={item.name}
                    whileHover={{ y: -2 }}
                    className="group min-w-23 text-center"
                  >
                    <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full border-2 border-slate-200 bg-white p-0.5 transition-all group-hover:border-slate-300">
                      <div className={`status-ring flex h-full w-full items-center justify-center rounded-full ${item.accent} text-sm font-semibold text-white shadow-sm`}>
                        {item.initials}
                      </div>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.status}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                <span>Today</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              {loading ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <div className="inline-block h-10 w-10 animate-spin rounded-full border-b-2 border-slate-900" />
                  <p className="mt-4 text-sm text-slate-500">Loading feed...</p>
                </div>
              ) : (
                filteredItems
                  .filter((item) => item.period === "Today")
                  .map((item) => <FeedCard key={item.id} item={item} />)
              )}

              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                <span>Yesterday</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              {filteredItems
                .filter((item) => item.period === "Yesterday")
                .map((item) => <FeedCard key={item.id} item={item} />)}

              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                <span>This Week</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              {filteredItems
                .filter((item) => item.period === "This Week")
                .map((item) => <FeedCard key={item.id} item={item} />)}
            </div>
          </section>

          <aside className="space-y-4 xl:sticky xl:top-24">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Online Friends</h3>
                <span className="text-xs text-slate-500">Live</span>
              </div>
              <div className="space-y-3">
                {onlineFriends.map((friend) => (
                  <div key={friend.name} className="flex items-center gap-3 rounded-2xl px-1 py-1">
                    <div className="relative">
                      <div className="status-ring flex h-10 w-10 items-center justify-center rounded-full bg-white p-0.5">
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                          {friend.initials}
                        </div>
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">{friend.name}</p>
                      <p className="truncate text-xs text-slate-500">{friend.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Upcoming group sessions</h3>
                <ChevronRightIcon className="h-4 w-4 text-slate-400" />
              </div>
              <div className="space-y-3">
                {groupSessions.map((session) => (
                  <div key={session.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-sm font-medium text-slate-900">{session.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{session.time}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Current study timer</h3>
                <ClockIcon className="h-4 w-4 text-slate-400" />
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-3xl font-semibold tracking-tight text-slate-950">24:00</p>
                <p className="mt-1 text-xs text-slate-500">Focused session running</p>
                <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700">
                  <PlayIcon className="h-4 w-4" />
                  Resume
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <style>{`
        .status-ring {
          background: linear-gradient(135deg, rgba(15,23,42,0.12), rgba(15,23,42,0.02));
          animation: ringPulse 3.6s ease-in-out infinite;
        }

        @keyframes ringPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(15, 23, 42, 0.12); }
          50% { box-shadow: 0 0 0 6px rgba(15, 23, 42, 0.02); }
        }
      `}</style>
    </div>
  );
};

export default Feed;
