import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownTrayIcon,
  BookmarkIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  EllipsisHorizontalIcon,
  HeartIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PlusIcon,
  ShareIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import {
  BookmarkIcon as BookmarkIconSolid,
  HeartIcon as HeartIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
} from "@heroicons/react/24/solid";
import Navbar from "../components/Navbar";

const communityFilters = ["All", "Resources", "Questions", "Notes", "Groups", "Recent"];

// Sidebar widgets removed for now (right-side component disabled)

const initialPosts = [
  {
    id: 1,
    type: "resource",
    title: "Operating Systems Unit 4 Notes",
    text: "Covers deadlock, scheduling, and memory management.",
    user: "Melina",
    department: "Computer Science · Operating Systems",
    time: "12 min ago",
    community: "Computer Networks",
    avatar: "SA",
    fileSize: "4.2 MB",
    pages: 18,
    subject: "OS",
    likes: 42,
    discussionCount: 11,
    saves: 24,
    shares: 7,
    liked: true,
    saved: false,
    comments: [
      {
        user: "Rizwan",
        text: "Can you explain page replacement?",
        time: "8m",
        replies: [{ user: "Melina", text: "Look at page 12", time: "6m" }],
      },
    ],
  },
  {
    id: 2,
    type: "question",
    title: "Can someone explain deadlock prevention simply?",
    text: "Jebisha asked in the DSA Group community.",
    user: "Jebisha",
    department: "Information Technology · Theory",
    time: "34 min ago",
    community: "DSA Group",
    avatar: "AK",
    likes: 18,
    discussionCount: 16,
    saves: 9,
    shares: 3,
    liked: false,
    saved: true,
    answersPreview: [
      { user: "Kristina", text: "Avoid at least one of the four conditions for deadlock." },
      { user: "Salina", text: "Think of it as rules that stop circular waiting." },
    ],
    comments: [
      {
        user: "Kristina",
        text: "I usually remember it as: no hold and wait, no circular wait.",
        time: "22m",
        replies: [{ user: "Jebisha", text: "That helps a lot, thanks.", time: "20m" }],
      },
    ],
  },
  {
    id: 3,
    type: "link",
    title: "Best DSA practice resource",
    text: "I have shared a high-quality practice site with topic-wise problem sets and notes.",
    user: "Dinisha",
    department: "Software Engineering · Algorithms",
    time: "1 hour ago",
    community: "Flutter Learners",
    avatar: "EA",
    linkTitle: "DSA Mastery Practice Hub",
    linkUrl: "practice.example.com",
    linkSnippet: "Curated problems for arrays, graphs, and dynamic programming.",
    likes: 28,
    discussionCount: 6,
    saves: 21,
    shares: 14,
    liked: false,
    saved: false,
    comments: [],
  },
  {
  
    id: 5,
    type: "assignment",
    title: "Database assignment solution attempt",
    text: "Dinisha uploaded a draft solution and invited suggestions.",
    user: "Salina",
    department: "Databases · Assignment support",
    time: "3 hours ago",
    community: "Semester Projects",
    avatar: "DU",
    likes: 35,
    discussionCount: 19,
    saves: 17,
    shares: 5,
    liked: true,
    saved: false,
    comments: [
      {
        user: "Jebisha",
        text: "Your relational diagram looks solid. Check normalization on page 2.",
        time: "1h",
        replies: [{ user: "Salina", text: "Noted. I will revise that section.", time: "58m" }],
      },
    ],
  },
];

const cardMotion = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.45, ease: "easeOut" },
};

const MotionArticle = motion.article;

const getInitials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const Communities = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState([]);
  const [expandedPosts, setExpandedPosts] = useState([1, 2]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPosts(initialPosts);
    }, 150);

    return () => window.clearTimeout(timer);
  }, []);

  const visiblePosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesFilter = activeFilter === "All" || post.type === activeFilter.toLowerCase();
      const searchableText = [post.title, post.text, post.user, post.community, post.department, post.linkTitle, post.linkSnippet]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [activeFilter, posts, query]);

  const toggleReaction = (postId, field) => {
    setPosts((current) =>
      current.map((post) => {
        if (post.id !== postId) {
          return post;
        }

        const liked = field === "liked" ? !post.liked : post.liked;
        const saved = field === "saved" ? !post.saved : post.saved;

        return {
          ...post,
          liked,
          saved,
          likes: field === "liked" ? post.likes + (post.liked ? -1 : 1) : post.likes,
        };
      })
    );
  };

  const toggleDiscussion = (postId) => {
    setExpandedPosts((current) =>
      current.includes(postId) ? current.filter((item) => item !== postId) : [...current, postId]
    );
  };

  const PostHeader = ({ post }) => (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="relative shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-900 text-sm font-semibold text-white shadow-sm">
            {post.avatar || getInitials(post.user)}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate font-semibold text-slate-950">{post.user}</p>
            <span className="text-sm text-slate-400">•</span>
            <p className="text-sm text-slate-500">{post.department}</p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{post.time}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
              {post.community}
            </span>
          </div>
        </div>
      </div>

      <button className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
        <EllipsisHorizontalIcon className="h-5 w-5" />
      </button>
    </div>
  );

  const ReactionBar = ({ post, onQuestion, onJoin }) => (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <button
          onClick={() => toggleReaction(post.id, "liked")}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 transition-colors ${
            post.liked ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
          }`}
        >
          {post.liked ? <HeartIconSolid className="h-4 w-4" /> : <HeartIcon className="h-4 w-4" />}
          {post.type === "question" ? "Upvote" : "Like"}
          <span className="text-xs font-semibold">{post.likes}</span>
        </button>
        <button
          onClick={onQuestion}
          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-slate-600 transition-colors hover:bg-slate-200"
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4" />
          {post.type === "resource" ? "Ask Question" : post.type === "group" ? "Discussion" : "Comment"}
          <span className="text-xs font-semibold">{post.discussionCount}</span>
        </button>
        <button className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-slate-600 transition-colors hover:bg-slate-200">
          <ShareIcon className="h-4 w-4" />
          Share
        </button>
        {post.type === "group" && (
          <button
            onClick={onJoin}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-white transition-colors hover:bg-slate-700"
          >
            <UserGroupIcon className="h-4 w-4" />
            Join
          </button>
        )}
      </div>

      <button
        onClick={() => toggleReaction(post.id, "saved")}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${
          post.saved ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`}
      >
        {post.saved ? <BookmarkIconSolid className="h-4 w-4" /> : <BookmarkIcon className="h-4 w-4" />}
        Save
        <span className="text-xs font-semibold">{post.saves}</span>
      </button>
    </div>
  );

  const DiscussionSection = ({ post }) => {
    const isExpanded = expandedPosts.includes(post.id);

    return (
      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
        <button
          onClick={() => toggleDiscussion(post.id)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900">Discussion</p>
            <p className="text-xs text-slate-500">{post.comments.length} threaded conversation{post.comments.length === 1 ? "" : "s"}</p>
          </div>
          {isExpanded ? (
            <ChevronUpIcon className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-slate-500" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-4 space-y-3">
            {post.comments.map((comment) => (
              <div key={`${post.id}-${comment.user}-${comment.time}`} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                    {getInitials(comment.user)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{comment.user}</p>
                      <span className="text-xs text-slate-400">{comment.time}</span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{comment.text}</p>
                  </div>
                </div>

                {comment.replies?.length > 0 && (
                  <div className="mt-3 space-y-2 border-l-2 border-slate-100 pl-4">
                    {comment.replies.map((reply) => (
                      <div key={`${reply.user}-${reply.time}`} className="rounded-xl bg-slate-50 px-3 py-2">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <p className="font-semibold text-slate-800">{reply.user}</p>
                          <span>{reply.time}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{reply.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                You
              </div>
              <input
                type="text"
                placeholder="Add a threaded reply..."
                className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              <button className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">
                <PaperAirplaneIcon className="h-4 w-4" />
                Reply
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderResourceCard = (post) => (
    <div className="mt-4 grid gap-4 lg:grid-cols-[160px_minmax(0,1fr)]">
      <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-slate-900 to-slate-700 p-4 text-white shadow-sm">
        <div className="flex h-24 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
          <DocumentTextIcon className="h-12 w-12 text-white/90" />
        </div>
        <p className="mt-3 text-xs uppercase tracking-[0.22em] text-white/70">PDF Preview</p>
        <p className="mt-1 text-sm font-semibold">{post.fileSize}</p>
      </div>
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-white px-2.5 py-1 font-medium shadow-sm">File size: {post.fileSize}</span>
          <span className="rounded-full bg-white px-2.5 py-1 font-medium shadow-sm">Pages: {post.pages}</span>
          <span className="rounded-full bg-white px-2.5 py-1 font-medium shadow-sm">Subject: {post.subject}</span>
        </div>
        <h3 className="mt-3 text-lg font-semibold text-slate-950">{post.title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{post.text}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">
            <ArrowDownTrayIcon className="h-4 w-4" />
            Download
          </button>
          <button className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
            <ChatBubbleLeftRightIconSolid className="h-4 w-4" />
            Ask Question
          </button>
          <button className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
            <BookmarkIcon className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>
    </div>
  );

  const renderQuestionCard = (post) => (
    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Question</p>
        <p className="mt-2 text-lg font-semibold text-slate-950">{post.title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{post.text}</p>
      </div>
      <div className="mt-4 space-y-3">
        <p className="text-sm font-semibold text-slate-900">Top answers preview</p>
        {post.answersPreview.map((answer) => (
          <div key={answer.user} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">{answer.user}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{answer.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">
          <ChatBubbleLeftRightIcon className="h-4 w-4" />
          Answer
        </button>
        <button className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
          <HeartIcon className="h-4 w-4" />
          Upvote
        </button>
        <button className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
          <BookmarkIcon className="h-4 w-4" />
          Save
        </button>
      </div>
    </div>
  );

  const renderLinkCard = (post) => (
    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <LinkIcon className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-950">{post.linkTitle}</p>
            <p className="mt-1 text-xs text-slate-500">{post.linkUrl}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{post.linkSnippet}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">
          Open
        </button>
        <button className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
          Comment
        </button>
        <button className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
          Save
        </button>
      </div>
    </div>
  );

  const renderGroupCard = (post) => (
    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-950">{post.title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{post.text}</p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              <UsersIcon className="h-4 w-4" />
              {post.participants} participants
            </div>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <UserGroupIcon className="h-8 w-8" />
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">
          Join
        </button>
        <button className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
          Discussion
        </button>
      </div>
    </div>
  );

  const renderAssignmentCard = (post) => (
    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-sm">
            <DocumentTextIcon className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-950">{post.title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{post.text}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">
          Comment
        </button>
        <button className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
          Suggest edits
        </button>
        <button className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
          Ask questions
        </button>
      </div>
    </div>
  );

  const PostCard = ({ post }) => (
    <MotionArticle
      className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
      {...cardMotion}
      whileHover={{ y: -2 }}
    >
      <PostHeader post={post} />

      <div className="mt-4 space-y-3">
        <p className="text-sm leading-6 text-slate-700 sm:text-[15px]">
          <span className="font-semibold text-slate-950">{post.user}</span> {post.type === "question" ? "asked:" : "shared:"}
        </p>
        <p className="text-base font-semibold text-slate-950">{post.title}</p>
      </div>

      {post.type === "resource" && renderResourceCard(post)}
      {post.type === "question" && renderQuestionCard(post)}
      {post.type === "link" && renderLinkCard(post)}
      {post.type === "group" && renderGroupCard(post)}
      {post.type === "assignment" && renderAssignmentCard(post)}

      <ReactionBar
        post={post}
        onQuestion={() => toggleDiscussion(post.id)}
        onJoin={() => null}
      />

      <DiscussionSection post={post} />
    </MotionArticle>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="relative mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute left-0 top-12 h-40 w-40 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-24 h-56 w-56 rounded-full bg-slate-200/70 blur-3xl" />

        <div className="relative mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Communities</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Discover resources, share materials, and learn together.
            </h1>
          </div>
        </div>

        <div className="relative mb-8 grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="flex min-w-0 items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notes, questions, PDFs, resources..."
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <button className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-700">
            <PlusIcon className="h-4 w-4" />
            Create Post
          </button>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {communityFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                activeFilter === filter
                  ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="grid gap-8">
          <section className="space-y-5">
            {visiblePosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {visiblePosts.length === 0 && (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
                <p className="text-sm font-medium text-slate-500">No posts match your current filter.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Communities;
