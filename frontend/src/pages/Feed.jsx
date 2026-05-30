import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  UsersIcon,
} from "@heroicons/react/24/outline";
import {
  BookmarkIcon as BookmarkIconSolid,
  HeartIcon as HeartIconSolid,
} from "@heroicons/react/24/solid";
import Navbar from "../components/Navbar";

const MotionArticle = motion.article;
const MotionDiv = motion.div;

/* ─── Data ─── */
const communityFilters = ["All", "Resources", "Questions", "Notes", "Groups", "Recent"];

const recentUploads = [
  { title: "Operating Systems Unit 4 Notes", meta: "PDF · 8 pages" },
  { title: "Deadlock prevention summary", meta: "Thread · 14 replies" },
  { title: "DSA practice link collection", meta: "Web link · 3 saves" },
];

const topContributors = [
  { name: "Melina", points: "124 contributions", rank: 1 },
  { name: "Jebisha", points: "98 contributions", rank: 2 },
  { name: "Kristina", points: "86 contributions", rank: 3 },
];

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

/* ─── Helpers ─── */
const getInitials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

const TYPE_META = {
  resource: { label: "Resource", color: "#2563eb", bg: "#eff6ff" },
  question: { label: "Question", color: "#d97706", bg: "#fffbeb" },
  link: { label: "Link", color: "#059669", bg: "#ecfdf5" },
  assignment: { label: "Assignment", color: "#7c3aed", bg: "#f5f3ff" },
  group: { label: "Group", color: "#db2777", bg: "#fdf2f8" },
};

const AVATAR_COLORS = [
  "#1e3a5f", "#1a3a2a", "#3a1a2a", "#1a1a3a", "#3a2a1a",
];
const avatarColor = (name) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

/* ─── Styles (scoped via className prefix "cm-") ─── */
const injectStyles = () => {
  if (typeof document === "undefined" || document.getElementById("cm-styles")) return;
  const el = document.createElement("style");
  el.id = "cm-styles";
  el.textContent = `
    .cm-card {
      background: #fff;
      border: 1px solid #e8eaed;
      border-radius: 20px;
      padding: 28px;
      transition: box-shadow 0.2s ease, transform 0.2s ease;
    }
    .cm-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.07); transform: translateY(-1px); }
    .cm-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 14px; border-radius: 999px; font-size: 12px; font-weight: 500; white-space: nowrap;
    }
    .cm-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 999px; font-size: 13px; font-weight: 500; cursor: pointer;
      transition: all 0.15s ease; border: none; white-space: nowrap;
    }
    .cm-btn-dark { background: #0f172a; color: #fff; }
    .cm-btn-dark:hover { background: #1e293b; }
    .cm-btn-ghost { background: transparent; color: #475569; border: 1px solid #e2e8f0; }
    .cm-btn-ghost:hover { background: #fff; }
    .cm-btn-active { background: #0f172a; color: #fff; }
    .cm-reaction { display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: 999px; font-size: 13px; font-weight: 500; cursor: pointer;
      border: 1px solid #e2e8f0; transition: all 0.15s ease; background: transparent; color: #475569; }
    .cm-reaction:hover { background: #fff; }
    .cm-reaction-active-like { background: #fff1f2; color: #e11d48; border-color: #fecdd3; }
    .cm-reaction-active-save { background: #0f172a; color: #fff; border-color: #0f172a; }
    .cm-input {
      width: 100%; border: 1px solid #e2e8f0; border-radius: 14px;
      padding: 12px 16px; font-size: 14px;
      outline: none; transition: border-color 0.15s ease; background: #fff; color: #0f172a;
    }
    .cm-input:focus { border-color: #94a3b8; }
    .cm-divider { height: 1px; background: #f1f5f9; margin: 20px 0; }
    .cm-avatar {
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%; font-weight: 600; color: #fff; flex-shrink: 0; letter-spacing: 0.5px;
    }
    .cm-thread-input-wrap {
      display: flex; align-items: center; gap: 12px;
      border: 1px solid #e2e8f0; border-radius: 14px; padding: 8px 12px; background: #fff;
    }
    .cm-thread-input {
      flex: 1; border: none; background: transparent; font-size: 13px;
      outline: none; color: #334155;
    }
  `;
  document.head.appendChild(el);
};

/* ─── Component ─── */
const Communities = () => {
  injectStyles();

  const [activeFilter, setActiveFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState([]);
  const [expandedPosts, setExpandedPosts] = useState([1, 2]);

  useEffect(() => {
    const t = setTimeout(() => setPosts(initialPosts), 120);
    return () => clearTimeout(t);
  }, []);

  const visiblePosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchFilter =
        activeFilter === "All" || post.type === activeFilter.toLowerCase();
      const text = [post.title, post.text, post.user, post.community, post.department]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchFilter && (!q || text.includes(q));
    });
  }, [activeFilter, posts, query]);

  const toggleReaction = (postId, field) => {
    setPosts((cur) =>
      cur.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          liked: field === "liked" ? !p.liked : p.liked,
          saved: field === "saved" ? !p.saved : p.saved,
          likes: field === "liked" ? p.likes + (p.liked ? -1 : 1) : p.likes,
        };
      })
    );
  };

  const toggleDiscussion = (postId) => {
    setExpandedPosts((cur) =>
      cur.includes(postId) ? cur.filter((x) => x !== postId) : [...cur, postId]
    );
  };

  /* ── PostHeader ── */
  const PostHeader = ({ post }) => {
    const typeMeta = TYPE_META[post.type] || TYPE_META.resource;
    return (
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              className="cm-avatar"
              style={{ width: 44, height: 44, fontSize: 13, background: avatarColor(post.user) }}
            >
              {post.avatar || getInitials(post.user)}
            </div>
            <span
              style={{
                position: "absolute", bottom: 0, right: 0,
                width: 11, height: 11, borderRadius: "50%",
                background: "#22c55e", border: "2px solid #fff",
              }}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 8px" }}>
              <span style={{ fontWeight: 600, fontSize: 15, color: "#0f172a" }}>{post.user}</span>
              <span style={{ color: "#cbd5e1", fontSize: 13 }}>·</span>
              <span style={{ fontSize: 13, color: "#64748b" }}>{post.department}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>{post.time}</span>
              <span
                className="cm-pill"
                style={{ background: typeMeta.bg, color: typeMeta.color, padding: "3px 10px", fontSize: 11 }}
              >
                {typeMeta.label}
              </span>
              <span
                className="cm-pill"
                style={{ background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", padding: "3px 10px", fontSize: 11 }}
              >
                {post.community}
              </span>
            </div>
          </div>
        </div>
        <button
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#94a3b8", padding: 6, borderRadius: "50%",
            transition: "background 0.15s",
          }}
        >
          <EllipsisHorizontalIcon style={{ width: 20, height: 20 }} />
        </button>
      </div>
    );
  };

  /* ── ReactionBar ── */
  const ReactionBar = ({ post }) => (
    <div
      style={{
        display: "flex", flexWrap: "wrap", alignItems: "center",
        justifyContent: "space-between", gap: 8, paddingTop: 16,
        borderTop: "1px solid #f1f5f9", marginTop: 20,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <button
          onClick={() => toggleReaction(post.id, "liked")}
          className={`cm-reaction ${post.liked ? "cm-reaction-active-like" : ""}`}
        >
          {post.liked
            ? <HeartIconSolid style={{ width: 15, height: 15 }} />
            : <HeartIcon style={{ width: 15, height: 15 }} />}
          {post.type === "question" ? "Upvote" : "Like"}
          <span style={{ fontSize: 12, fontWeight: 600 }}>{post.likes}</span>
        </button>
        <button
          onClick={() => toggleDiscussion(post.id)}
          className="cm-reaction"
        >
          <ChatBubbleLeftRightIcon style={{ width: 15, height: 15 }} />
          {post.type === "resource" ? "Discuss" : "Comment"}
          <span style={{ fontSize: 12, fontWeight: 600 }}>{post.discussionCount}</span>
        </button>
        <button className="cm-reaction">
          <ShareIcon style={{ width: 15, height: 15 }} />
          Share
        </button>
      </div>
      <button
        onClick={() => toggleReaction(post.id, "saved")}
        className={`cm-reaction ${post.saved ? "cm-reaction-active-save" : ""}`}
      >
        {post.saved
          ? <BookmarkIconSolid style={{ width: 15, height: 15 }} />
          : <BookmarkIcon style={{ width: 15, height: 15 }} />}
        Save
        <span style={{ fontSize: 12, fontWeight: 600 }}>{post.saves}</span>
      </button>
    </div>
  );

  /* ── DiscussionSection ── */
  const DiscussionSection = ({ post }) => {
    const isExpanded = expandedPosts.includes(post.id);
    if (!post.comments?.length && !isExpanded) return null;

    return (
      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => toggleDiscussion(post.id)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            width: "100%", background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 14, padding: "10px 16px", cursor: "pointer",
          }}
        >
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
              Discussion
            </span>
            <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 8 }}>
              {post.comments.length} thread{post.comments.length !== 1 ? "s" : ""}
            </span>
          </div>
          {isExpanded
            ? <ChevronUpIcon style={{ width: 16, height: 16, color: "#94a3b8" }} />
            : <ChevronDownIcon style={{ width: 16, height: 16, color: "#94a3b8" }} />}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <MotionDiv
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                {post.comments.map((comment) => (
                  <div
                    key={`${post.id}-${comment.user}`}
                    style={{
                      background: "#fff", border: "1px solid #e2e8f0",
                      borderRadius: 14, padding: 16,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div
                        className="cm-avatar"
                        style={{ width: 34, height: 34, fontSize: 11, background: avatarColor(comment.user) }}
                      >
                        {getInitials(comment.user)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{comment.user}</span>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>{comment.time}</span>
                        </div>
                        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                          {comment.text}
                        </p>
                      </div>
                    </div>

                    {comment.replies?.length > 0 && (
                      <div style={{ marginTop: 10, paddingLeft: 16, borderLeft: "2px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 8 }}>
                        {comment.replies.map((reply) => (
                          <div
                            key={`${reply.user}-${reply.time}`}
                            style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 12px" }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{reply.user}</span>
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>{reply.time}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>{reply.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="cm-thread-input-wrap">
                  <div
                    className="cm-avatar"
                    style={{ width: 30, height: 30, fontSize: 10, background: "#1e293b" }}
                  >
                    You
                  </div>
                  <input className="cm-thread-input" placeholder="Add a reply…" />
                  <button className="cm-btn cm-btn-dark" style={{ padding: "6px 14px" }}>
                    <PaperAirplaneIcon style={{ width: 14, height: 14 }} />
                    Reply
                  </button>
                </div>
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    );
  };

  /* ── Post body renderers ── */
  const renderResource = (post) => (
    <div
      style={{
        marginTop: 16, display: "grid",
        gridTemplateColumns: "140px 1fr", gap: 14,
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
          borderRadius: 14, padding: 16, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 10,
        }}
      >
        <DocumentTextIcon style={{ width: 36, height: 36, color: "rgba(255,255,255,0.9)" }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em" }}>PDF</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{post.fileSize}</span>
      </div>
      <div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {[`${post.pages} pages`, `${post.fileSize}`, post.subject].map((tag) => (
            <span
              key={tag}
              style={{
                background: "#f1f5f9", color: "#475569", fontSize: 11,
                fontWeight: 500, padding: "3px 10px", borderRadius: 999,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 14, color: "#334155", lineHeight: 1.6 }}>{post.text}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button className="cm-btn cm-btn-dark">
            <ArrowDownTrayIcon style={{ width: 14, height: 14 }} />
            Download
          </button>
          <button className="cm-btn cm-btn-ghost">
            <BookmarkIcon style={{ width: 14, height: 14 }} />
            Save
          </button>
        </div>
      </div>
    </div>
  );

  const renderQuestion = (post) => (
    <div
      style={{
        marginTop: 16, background: "#fff",
        border: "1px solid #e2e8f0", borderRadius: 14, padding: 16,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, color: "#d97706", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Question
      </span>
      <p style={{ margin: "8px 0 12px", fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{post.title}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Top answers
        </p>
        {post.answersPreview.map((answer) => (
          <div
            key={answer.user}
            style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px" }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{answer.user} </span>
            <span style={{ fontSize: 13, color: "#475569" }}>{answer.text}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button className="cm-btn cm-btn-dark">
          <ChatBubbleLeftRightIcon style={{ width: 14, height: 14 }} />
          Answer
        </button>
        <button className="cm-btn cm-btn-ghost">
          <HeartIcon style={{ width: 14, height: 14 }} />
          Upvote
        </button>
      </div>
    </div>
  );

  const renderLink = (post) => (
    <div
      style={{
        marginTop: 16, background: "#fff",
        border: "1px solid #e2e8f0", borderRadius: 14, padding: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: 12, background: "#166534",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <LinkIcon style={{ width: 20, height: 20, color: "#fff" }} />
        </div>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{post.linkTitle}</p>
          <p style={{ margin: "0 0 6px", fontSize: 12, color: "#059669" }}>{post.linkUrl}</p>
          <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{post.linkSnippet}</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button className="cm-btn cm-btn-dark">Open Link</button>
        <button className="cm-btn cm-btn-ghost">Save</button>
      </div>
    </div>
  );

  const renderAssignment = (post) => (
    <div
      style={{
        marginTop: 16, background: "#fff",
        border: "1px solid #e2e8f0", borderRadius: 14, padding: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: 12, background: "#6d28d9",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <DocumentTextIcon style={{ width: 20, height: 20, color: "#fff" }} />
        </div>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{post.title}</p>
          <p style={{ margin: 0, fontSize: 13, color: "#4c1d95", lineHeight: 1.6 }}>{post.text}</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button className="cm-btn cm-btn-dark">Comment</button>
        <button className="cm-btn cm-btn-ghost">Suggest Edits</button>
      </div>
    </div>
  );

  /* ── PostCard ── */
  const PostCard = ({ post }) => (
    <MotionArticle
      className="cm-card"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <PostHeader post={post} />
      <div style={{ marginTop: 16 }}>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a", lineHeight: 1.4 }}>
          {post.title}
        </p>
      </div>
      {post.type === "resource" && renderResource(post)}
      {post.type === "question" && renderQuestion(post)}
      {post.type === "link" && renderLink(post)}
      {post.type === "assignment" && renderAssignment(post)}
      <ReactionBar post={post} />
      <DiscussionSection post={post} />
    </MotionArticle>
  );

  /* ── Sidebar ── */
  const Sidebar = () => (
    <aside
      style={{
        display: "flex", flexDirection: "column", gap: 16,
        position: "sticky", top: 96,
      }}
    >
      {/* Recent Uploads */}
      <div
        style={{
          background: "#fff", border: "1px solid #e8eaed",
          borderRadius: 20, padding: 24, overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Recent Uploads
          </span>
          <DocumentTextIcon style={{ width: 16, height: 16, color: "#cbd5e1" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {recentUploads.map((item, i) => (
            <div
              key={item.title}
              style={{
                padding: "12px 0",
                borderBottom: i < recentUploads.length - 1 ? "1px solid #f1f5f9" : "none",
              }}
            >
              <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                {item.title}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{item.meta}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Contributors */}
      <div
        style={{
          background: "#fff", border: "1px solid #e8eaed",
          borderRadius: 20, padding: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Top Contributors
          </span>
          <UsersIcon style={{ width: 16, height: 16, color: "#cbd5e1" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {topContributors.map((c) => (
            <div
              key={c.name}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderRadius: 12,
                background: c.rank === 1 ? "#0f172a" : "#fff",
                border: c.rank === 1 ? "none" : "1px solid #e2e8f0",
              }}
            >
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: c.rank === 1 ? "#fff" : "#1e293b" }}>
                  {c.name}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: c.rank === 1 ? "rgba(255,255,255,0.55)" : "#94a3b8" }}>
                  {c.points}
                </p>
              </div>
              <div
                className="cm-avatar"
                style={{
                  width: 34, height: 34, fontSize: 12,
                  background: c.rank === 1 ? "rgba(255,255,255,0.15)" : avatarColor(c.name),
                }}
              >
                {getInitials(c.name)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );

  /* ── Page ── */
  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <Navbar />
      <main
        style={{
          maxWidth: 1200, margin: "0 auto",
          padding: "112px 24px 80px",
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <p
            style={{
              margin: "0 0 8px", fontSize: 11, fontWeight: 700,
              color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em",
            }}
          >
            Communities
          </p>

        </div>

        {/* Search + Create */}
        <div
          style={{
            display: "grid", gridTemplateColumns: "1fr auto",
            gap: 12, marginBottom: 20, alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#fff", border: "1px solid #e2e8f0",
              borderRadius: 999, padding: "10px 18px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <MagnifyingGlassIcon style={{ width: 18, height: 18, color: "#94a3b8", flexShrink: 0 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes, questions, PDFs…"
              style={{
                border: "none", background: "transparent", flex: 1,
                fontSize: 14, color: "#334155", outline: "none",
              }}
            />
          </div>
          <button className="cm-btn cm-btn-dark" style={{ padding: "10px 20px" }}>
            <PlusIcon style={{ width: 15, height: 15 }} />
            Create Post
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
          {communityFilters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: "7px 18px", borderRadius: 999, fontSize: 13, fontWeight: 500,
                cursor: "pointer", border: "1px solid",
                transition: "all 0.15s ease",
                background: activeFilter === f ? "#0f172a" : "#fff",
                color: activeFilter === f ? "#fff" : "#475569",
                borderColor: activeFilter === f ? "#0f172a" : "#e2e8f0",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Two-column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) 300px",
            gap: 0,
            alignItems: "start",
          }}
        >
          {/* ── Feed column ── */}
          <div
            style={{
              paddingRight: 32,
              borderRight: "1px solid #e2e8f0",
              display: "flex", flexDirection: "column", gap: 20,
            }}
          >
            {visiblePosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {visiblePosts.length === 0 && (
              <div
                style={{
                  background: "#fff", border: "1px dashed #e2e8f0",
                  borderRadius: 20, padding: 48, textAlign: "center",
                }}
              >
                <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>
                  No posts match your current filter.
                </p>
              </div>
            )}
          </div>

          {/* ── Sidebar column ── */}
          <div style={{ paddingLeft: 32 }}>
            <Sidebar />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Communities;