import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownTrayIcon,
  BookmarkIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
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
  UserPlusIcon,
  UsersIcon,
  XMarkIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  BookmarkIcon as BookmarkIconSolid,
  HeartIcon as HeartIconSolid,
} from "@heroicons/react/24/solid";
import { useAuth, useUser } from "@clerk/clerk-react";
import Navbar from "../components/Navbar";
import { communityService } from "../services/community_services";
import { friendsService } from "../services/friends_service";
import AddPostModal from "../components/AddPostModal";

const MotionArticle = motion.article;
const MotionDiv = motion.div;

/* ─── Static UI config ─── */
const communityFilters = ["All", "Resource", "Question", "Link", "Assignment"];

const TYPE_META = {
  resource: { label: "Resource", color: "#2563eb", bg: "#eff6ff" },
  question: { label: "Question", color: "#d97706", bg: "#fffbeb" },
  link: { label: "Link", color: "#059669", bg: "#ecfdf5" },
  assignment: { label: "Assignment", color: "#7c3aed", bg: "#f5f3ff" },
};

const AVATAR_COLORS = ["#1e3a5f", "#1a3a2a", "#3a1a2a", "#1a1a3a", "#3a2a1a"];

/* ─── Helpers ─── */
const getInitials = (name) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

const avatarColor = (name) =>
  AVATAR_COLORS[(name || "?").charCodeAt(0) % AVATAR_COLORS.length];

const getAuthorName = (author) => {
  if (!author) return "Unknown";
  return author.username || `${author.first_name || ""} ${author.last_name || ""}`.trim() || "Unknown";
};

const isPostOwner = (post, currentUserId) =>
  !!currentUserId && post.author?.user_id === currentUserId;

const isCommentOwner = (comment, currentUserId) =>
  !!currentUserId && comment.author?.user_id === currentUserId;

const formatRelativeTime = (value) => {
  if (!value) return "";
  const hasZone = /Z$|[+-]\d{2}:?\d{2}$/.test(value);
  const date = new Date(hasZone ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
};

const formatJoinDate = (value) => {
  if (!value) return "";
  const hasZone = /Z$|[+-]\d{2}:?\d{2}$/.test(value);
  const date = new Date(hasZone ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};

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
    .cm-btn-dark:disabled { opacity: 0.5; cursor: not-allowed; }
    .cm-btn-ghost { background: transparent; color: #475569; border: 1px solid #e2e8f0; }
    .cm-btn-ghost:hover { background: #fff; }
    .cm-reaction { display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: 999px; font-size: 13px; font-weight: 500; cursor: pointer;
      border: 1px solid #e2e8f0; transition: all 0.15s ease; background: transparent; color: #475569; }
    .cm-reaction:hover { background: #fff; }
    .cm-reaction:disabled { opacity: 0.6; cursor: not-allowed; }
    .cm-reaction-active-like { background: #fff1f2; color: #e11d48; border-color: #fecdd3; }
    .cm-reaction-active-save { background: #0f172a; color: #fff; border-color: #0f172a; }
    .cm-input {
      width: 100%; border: 1px solid #e2e8f0; border-radius: 14px;
      padding: 12px 16px; font-size: 14px;
      outline: none; transition: border-color 0.15s ease; background: #fff; color: #0f172a;
    }
    .cm-input:focus { border-color: #94a3b8; }
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
    .cm-author-trigger {
      background: none; border: none; padding: 0; cursor: pointer;
      font: inherit; text-align: left;
    }
    .cm-author-trigger:hover .cm-author-name { text-decoration: underline; }
    .cm-dialog-overlay {
      position: fixed; inset: 0; background: rgba(15,23,42,0.45);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 20px;
    }
    .cm-dialog {
      background: #fff; border-radius: 20px; padding: 32px;
      width: 100%; max-width: 380px; box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    }
    .cm-friend-checkbox {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; padding: 11px 16px; border-radius: 12px; font-size: 14px;
      font-weight: 600; cursor: pointer; border: 1.5px solid #0f172a;
      background: #0f172a; color: #fff; transition: all 0.15s ease;
    }
    .cm-friend-checkbox:disabled { cursor: default; }
    .cm-friend-checkbox-sent {
      background: #f0fdf4; color: #15803d; border-color: #bbf7d0;
    }
    .cm-friend-checkbox-tick {
      width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid currentColor;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
  `;
  document.head.appendChild(el);
};

/* ── PostHeader ── */
const PostHeader = ({ post, currentUserId, onDeletePost, onOpenProfile }) => {
  const typeMeta = TYPE_META[post.post_type] || TYPE_META.resource;
  const authorName = getAuthorName(post.author);
  const isSelf = !!currentUserId && post.author?.user_id === currentUserId;
  const [menuOpen, setMenuOpen] = useState(false);
  const canDelete = isPostOwner(post, currentUserId);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <button
        type="button"
        className="cm-author-trigger"
        onClick={() => onOpenProfile?.(post.author)}
        disabled={!post.author?.user_id || isSelf}
        style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0, cursor: post.author?.user_id && !isSelf ? "pointer" : "default" }}
      >
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div
            className="cm-avatar"
            style={{ width: 44, height: 44, fontSize: 13, background: avatarColor(authorName) }}
          >
            {getInitials(authorName)}
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 8px" }}>
            <span className="cm-author-name" style={{ fontWeight: 600, fontSize: 15, color: "#0f172a" }}>{authorName}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>{formatRelativeTime(post.created_at)}</span>
            <span
              className="cm-pill"
              style={{ background: typeMeta.bg, color: typeMeta.color, padding: "3px 10px", fontSize: 11 }}
            >
              {typeMeta.label}
            </span>
            {post.community_name && (
              <span
                className="cm-pill"
                style={{ background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", padding: "3px 10px", fontSize: 11 }}
              >
                {post.community_name}
              </span>
            )}
          </div>
        </div>
      </button>

      {canDelete && (
        <div style={{ position: "relative" }} ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#94a3b8", padding: 6, borderRadius: "50%",
            }}
          >
            <EllipsisHorizontalIcon style={{ width: 20, height: 20 }} />
          </button>
          {menuOpen && (
            <div
              style={{
                position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 10,
                background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)", minWidth: 140, overflow: "hidden",
              }}
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDeletePost(post.id);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%",
                  padding: "10px 14px", background: "none", border: "none",
                  cursor: "pointer", color: "#dc2626", fontSize: 13, fontWeight: 500,
                }}
              >
                <TrashIcon style={{ width: 15, height: 15 }} />
                Delete post
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── ReactionBar ── */
const ReactionBar = ({ post, onToggleReaction, onToggleDiscussion, onShare }) => (
  <div
    style={{
      display: "flex", flexWrap: "wrap", alignItems: "center",
      justifyContent: "space-between", gap: 8, paddingTop: 16,
      borderTop: "1px solid #f1f5f9", marginTop: 20,
    }}
  >
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      <button
        onClick={() => onToggleReaction(post.id, "liked")}
        className={`cm-reaction ${post.liked_by_me ? "cm-reaction-active-like" : ""}`}
      >
        {post.liked_by_me
          ? <HeartIconSolid style={{ width: 15, height: 15 }} />
          : <HeartIcon style={{ width: 15, height: 15 }} />}
        {post.post_type === "question" ? "Upvote" : "Like"}
        <span style={{ fontSize: 12, fontWeight: 600 }}>{post.like_count}</span>
      </button>
      <button onClick={() => onToggleDiscussion(post.id)} className="cm-reaction">
        <ChatBubbleLeftRightIcon style={{ width: 15, height: 15 }} />
        {post.post_type === "resource" ? "Discuss" : "Comment"}
        <span style={{ fontSize: 12, fontWeight: 600 }}>{post.comment_count}</span>
      </button>
      <button className="cm-reaction" onClick={() => onShare(post.id)}>
        <ShareIcon style={{ width: 15, height: 15 }} />
        Share
        {post.share_count > 0 && (
          <span style={{ fontSize: 12, fontWeight: 600 }}>{post.share_count}</span>
        )}
      </button>
    </div>
    <button
      onClick={() => onToggleReaction(post.id, "saved")}
      className={`cm-reaction ${post.saved_by_me ? "cm-reaction-active-save" : ""}`}
    >
      {post.saved_by_me
        ? <BookmarkIconSolid style={{ width: 15, height: 15 }} />
        : <BookmarkIcon style={{ width: 15, height: 15 }} />}
      Save
      <span style={{ fontSize: 12, fontWeight: 600 }}>{post.save_count}</span>
    </button>
  </div>
);

/* ── CommentItem ── */
const CommentItem = ({ comment, currentUserId, onDeleteComment }) => (
  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <div
        className="cm-avatar"
        style={{ width: 34, height: 34, fontSize: 11, background: avatarColor(getAuthorName(comment.author)) }}
      >
        {getInitials(getAuthorName(comment.author))}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
              {getAuthorName(comment.author)}
            </span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{formatRelativeTime(comment.created_at)}</span>
          </div>
          {isCommentOwner(comment, currentUserId) && (
            <button
              onClick={() => onDeleteComment(comment.id)}
              title="Delete comment"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#cbd5e1", padding: 4, borderRadius: 6, flexShrink: 0,
                display: "flex", alignItems: "center",
              }}
            >
              <TrashIcon style={{ width: 14, height: 14 }} />
            </button>
          )}
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
            key={reply.id}
            style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 12px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                {getAuthorName(reply.author)}
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{formatRelativeTime(reply.created_at)}</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>{reply.text}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

/* ── DiscussionSection ── */
const DiscussionSection = ({
  post,
  isExpanded,
  postComments,
  isLoadingComments,
  replyDraft,
  isSendingReply,
  currentUserId,
  onToggleDiscussion,
  onReplyChange,
  onSendReply,
  onDeleteComment,
}) => (
  <div style={{ marginTop: 16 }}>
    <button
      onClick={() => onToggleDiscussion(post.id)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", background: "#fff", border: "1px solid #e2e8f0",
        borderRadius: 14, padding: "10px 16px", cursor: "pointer",
      }}
    >
      <div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Discussion</span>
        <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 8 }}>
          {post.comment_count} thread{post.comment_count !== 1 ? "s" : ""}
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
            {isLoadingComments ? (
              <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>
                Loading comments...
              </p>
            ) : postComments.length === 0 ? (
              <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>
                No comments yet. Be the first to reply.
              </p>
            ) : (
              postComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  onDeleteComment={(commentId) => onDeleteComment(post.id, commentId)}
                />
              ))
            )}

            <div className="cm-thread-input-wrap">
              <div className="cm-avatar" style={{ width: 30, height: 30, fontSize: 10, background: "#1e293b" }}>
                You
              </div>
              <input
                className="cm-thread-input"
                placeholder="Add a reply…"
                value={replyDraft}
                onChange={(e) => onReplyChange(post.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSendReply(post.id, replyDraft);
                }}
              />
              <button
                className="cm-btn cm-btn-dark"
                style={{ padding: "6px 14px" }}
                onClick={() => onSendReply(post.id, replyDraft)}
                disabled={isSendingReply || !replyDraft.trim()}
              >
                <PaperAirplaneIcon style={{ width: 14, height: 14 }} />
                {isSendingReply ? "Sending..." : "Reply"}
              </button>
            </div>
          </div>
        </MotionDiv>
      )}
    </AnimatePresence>
  </div>
);

/* ── Post body renderers ── */
const ResourceBlock = ({ post, onToggleReaction }) => {
  const resource = post.resource;
  const fileLabel = resource?.resource_type?.toUpperCase() || "FILE";

  return (
    <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "140px 1fr", gap: 14 }}>
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
          borderRadius: 14, padding: 16, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 10,
        }}
      >
        <DocumentTextIcon style={{ width: 36, height: 36, color: "rgba(255,255,255,0.9)" }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em" }}>{fileLabel}</span>
      </div>
      <div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {resource?.total_pages && (
            <span style={{ background: "#f1f5f9", color: "#475569", fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 999 }}>
              {resource.total_pages} pages
            </span>
          )}
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 14, color: "#334155", lineHeight: 1.6 }}>{post.text}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button
            className="cm-btn cm-btn-dark"
            onClick={() => resource?.url && window.open(resource.url, "_blank")}
          >
            <ArrowDownTrayIcon style={{ width: 14, height: 14 }} />
            {resource ? "View Resource" : "Resource unavailable"}
          </button>
          <button className="cm-btn cm-btn-ghost" onClick={() => onToggleReaction(post.id, "saved")}>
            <BookmarkIcon style={{ width: 14, height: 14 }} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const QuestionBlock = ({ post, postComments, onToggleDiscussion, onToggleReaction }) => {
  const previewAnswers = postComments.slice(0, 2);

  return (
    <div style={{ marginTop: 16, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#d97706", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Question
      </span>
      <p style={{ margin: "8px 0 12px", fontSize: 14, color: "#334155", lineHeight: 1.6 }}>{post.text}</p>

      {previewAnswers.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Top answers
          </p>
          {previewAnswers.map((answer) => (
            <div key={answer.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{getAuthorName(answer.author)} </span>
              <span style={{ fontSize: 13, color: "#475569" }}>{answer.text}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button className="cm-btn cm-btn-dark" onClick={() => onToggleDiscussion(post.id)}>
          <ChatBubbleLeftRightIcon style={{ width: 14, height: 14 }} />
          Answer
        </button>
        <button className="cm-btn cm-btn-ghost" onClick={() => onToggleReaction(post.id, "liked")}>
          <HeartIcon style={{ width: 14, height: 14 }} />
          Upvote
        </button>
      </div>
    </div>
  );
};

const LinkBlock = ({ post, onToggleReaction }) => {
  const data = post.type_data || {};
  return (
    <div style={{ marginTop: 16, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}>
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
          <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{data.link_title}</p>
          <p style={{ margin: "0 0 6px", fontSize: 12, color: "#059669" }}>{data.link_url}</p>
          <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{data.link_snippet}</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          className="cm-btn cm-btn-dark"
          onClick={() => {
            const url = data.link_url?.startsWith("http") ? data.link_url : `https://${data.link_url}`;
            window.open(url, "_blank");
          }}
        >
          Open Link
        </button>
        <button className="cm-btn cm-btn-ghost" onClick={() => onToggleReaction(post.id, "saved")}>
          Save
        </button>
      </div>
    </div>
  );
};

const AssignmentBlock = ({ post, onToggleDiscussion }) => (
  <div style={{ marginTop: 16, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}>
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
      <button className="cm-btn cm-btn-dark" onClick={() => onToggleDiscussion(post.id)}>
        Comment
      </button>
    </div>
  </div>
);

/* ── PostCard ── */
const PostCard = ({
  post,
  isExpanded,
  postComments,
  isLoadingComments,
  replyDraft,
  isSendingReply,
  currentUserId,
  onToggleReaction,
  onToggleDiscussion,
  onShare,
  onReplyChange,
  onSendReply,
  onDeletePost,
  onDeleteComment,
  onOpenProfile,
}) => (
  <MotionArticle
    className="cm-card"
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.1 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
  >
    <PostHeader post={post} currentUserId={currentUserId} onDeletePost={onDeletePost} onOpenProfile={onOpenProfile} />
    <div style={{ marginTop: 16 }}>
      <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a", lineHeight: 1.4 }}>
        {post.title}
      </p>
    </div>
    {post.post_type === "resource" && (
      <ResourceBlock post={post} onToggleReaction={onToggleReaction} />
    )}
    {post.post_type === "question" && (
      <QuestionBlock
        post={post}
        postComments={postComments}
        onToggleDiscussion={onToggleDiscussion}
        onToggleReaction={onToggleReaction}
      />
    )}
    {post.post_type === "link" && (
      <LinkBlock post={post} onToggleReaction={onToggleReaction} />
    )}
    {post.post_type === "assignment" && (
      <AssignmentBlock post={post} onToggleDiscussion={onToggleDiscussion} />
    )}
    <ReactionBar
      post={post}
      onToggleReaction={onToggleReaction}
      onToggleDiscussion={onToggleDiscussion}
      onShare={onShare}
    />
    <DiscussionSection
      post={post}
      isExpanded={isExpanded}
      postComments={postComments}
      isLoadingComments={isLoadingComments}
      replyDraft={replyDraft}
      isSendingReply={isSendingReply}
      currentUserId={currentUserId}
      onToggleDiscussion={onToggleDiscussion}
      onReplyChange={onReplyChange}
      onSendReply={onSendReply}
      onDeleteComment={onDeleteComment}
    />
  </MotionArticle>
);

/* ── Sidebar ── */
const Sidebar = ({ recentUploads, topContributors }) => (
  <aside style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 96 }}>
    <div style={{ background: "#fff", border: "1px solid #e8eaed", borderRadius: 20, padding: 24, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Recent Uploads
        </span>
        <DocumentTextIcon style={{ width: 16, height: 16, color: "#cbd5e1" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {recentUploads.length === 0 ? (
          <p style={{ fontSize: 12, color: "#94a3b8" }}>No uploads yet.</p>
        ) : (
          recentUploads.map((item, i) => (
            <div
              key={item.post_id}
              style={{ padding: "12px 0", borderBottom: i < recentUploads.length - 1 ? "1px solid #f1f5f9" : "none" }}
            >
              <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{item.title}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{item.meta}</p>
            </div>
          ))
        )}
      </div>
    </div>

    <div style={{ background: "#fff", border: "1px solid #e8eaed", borderRadius: 20, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Top Contributors
        </span>
        <UsersIcon style={{ width: 16, height: 16, color: "#cbd5e1" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {topContributors.length === 0 ? (
          <p style={{ fontSize: 12, color: "#94a3b8" }}>Not enough activity yet.</p>
        ) : (
          topContributors.map((c) => (
            <div
              key={c.user_id}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderRadius: 12,
                background: c.rank === 1 ? "#0f172a" : "#fff",
                border: c.rank === 1 ? "none" : "1px solid #e2e8f0",
              }}
            >
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: c.rank === 1 ? "#fff" : "#1e293b" }}>
                  {c.username}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: c.rank === 1 ? "rgba(255,255,255,0.55)" : "#94a3b8" }}>
                  {c.contributions} contribution{c.contributions !== 1 ? "s" : ""}
                </p>
              </div>
              <div
                className="cm-avatar"
                style={{
                  width: 34, height: 34, fontSize: 12,
                  background: c.rank === 1 ? "rgba(255,255,255,0.15)" : avatarColor(c.username),
                }}
              >
                {getInitials(c.username)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </aside>
);

/* ── UserProfileDialog ── */
const UserProfileDialog = ({
  isOpen,
  profile,
  isLoadingProfile,
  friendStatus,
  isSendingRequest,
  errorMessage,
  onClose,
  onSendRequest,
}) => {
  if (!isOpen) return null;

  const name = getAuthorName(profile);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  let buttonLabel = "Add Friend";
  let buttonDisabled = isSendingRequest;
  let buttonClass = "cm-friend-checkbox";
  let showTick = false;

  if (friendStatus === "friends") {
    buttonLabel = "Already Friends";
    buttonDisabled = true;
    buttonClass += " cm-friend-checkbox-sent";
    showTick = true;
  } else if (friendStatus === "pending") {
    buttonLabel = "Request Sent";
    buttonDisabled = true;
    buttonClass += " cm-friend-checkbox-sent";
    showTick = true;
  } else if (isSendingRequest) {
    buttonLabel = "Sending...";
  }

  return (
    <div className="cm-dialog-overlay" onMouseDown={handleOverlayClick}>
      <div className="cm-dialog">
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}
          >
            <XMarkIcon style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {isLoadingProfile ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: 13 }}>
            Loading profile...
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: -8 }}>
              <div
                className="cm-avatar"
                style={{ width: 72, height: 72, fontSize: 22, background: avatarColor(name) }}
              >
                {getInitials(name)}
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{name}</p>
                {profile?.username && (
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: "#94a3b8" }}>@{profile.username}</p>
                )}
              </div>

              {profile?.created_at && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, color: "#64748b", fontSize: 12 }}>
                  <CalendarDaysIcon style={{ width: 14, height: 14 }} />
                  Joined {formatJoinDate(profile.created_at)}
                </div>
              )}
            </div>

            {errorMessage && (
              <div style={{ marginTop: 16, padding: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#b91c1c", fontSize: 12, textAlign: "center" }}>
                {errorMessage}
              </div>
            )}

            {friendStatus !== "self" && (
              <button
                type="button"
                className={buttonClass}
                disabled={buttonDisabled}
                onClick={onSendRequest}
                style={{ marginTop: 22 }}
              >
                <span className="cm-friend-checkbox-tick">
                  {showTick && <CheckIcon style={{ width: 13, height: 13 }} />}
                </span>
                {!showTick && !isSendingRequest && <UserPlusIcon style={{ width: 15, height: 15 }} />}
                {buttonLabel}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* ─── Main Component ─── */
const Communities = () => {
  injectStyles();
  const { getToken } = useAuth();
  const { user } = useUser();
  const currentUserId = user?.id;

  const [addPostModalOpen, setAddPostModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedPosts, setExpandedPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [commentsLoading, setCommentsLoading] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replySending, setReplySending] = useState({});

  const [recentUploads, setRecentUploads] = useState([]);
  const [topContributors, setTopContributors] = useState([]);

  const reactionInFlight = useRef({});

  const [friendIds, setFriendIds] = useState(new Set());
  const [sentRequestIds, setSentRequestIds] = useState(new Set());
  const [profileDialog, setProfileDialog] = useState({
    open: false,
    author: null,
    profile: null,
    loading: false,
    sending: false,
    error: "",
  });

  const loadComments = useCallback(async (postId) => {
    setCommentsLoading((cur) => ({ ...cur, [postId]: true }));
    try {
      const token = await getToken();
      const data = await communityService.getComments(token, postId);
      setComments((cur) => ({ ...cur, [postId]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      console.error("Failed to load comments", err);
      setComments((cur) => ({ ...cur, [postId]: [] }));
    } finally {
      setCommentsLoading((cur) => ({ ...cur, [postId]: false }));
    }
  }, [getToken]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = await getToken();

      const params = { skip: 0, limit: 50 };
      if (activeFilter !== "All") params.postType = activeFilter.toLowerCase();
      if (query.trim()) params.search = query.trim();

      const data = await communityService.getPosts(token, params);
      const fetchedPosts = Array.isArray(data?.posts) ? data.posts : [];
      setPosts(fetchedPosts);

      const questionPosts = fetchedPosts.filter((p) => p.post_type === "question");
      questionPosts.forEach((p) => {
        setComments((cur) => {
          if (cur[p.id] === undefined) loadComments(p.id);
          return cur;
        });
      });
    } catch (err) {
      setError(err.message || "Failed to load posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, query, getToken, loadComments]);

  useEffect(() => {
    const timer = setTimeout(fetchPosts, 300);
    return () => clearTimeout(timer);
  }, [fetchPosts]);

  useEffect(() => {
    const loadSidebar = async () => {
      try {
        const token = await getToken();
        const [uploads, contributors] = await Promise.all([
          communityService.getRecentUploads(token, 5),
          communityService.getTopContributors(token, 3),
        ]);
        setRecentUploads(Array.isArray(uploads) ? uploads : []);
        setTopContributors(Array.isArray(contributors) ? contributors : []);
      } catch (err) {
        console.error("Failed to load sidebar data", err);
      }
    };
    loadSidebar();
  }, [getToken]);

  useEffect(() => {
    const loadFriendData = async () => {
      try {
        const token = await getToken();
        const [friends, sent] = await Promise.all([
          friendsService.getMyFriends(token),
          friendsService.getSentRequests(token),
        ]);
        setFriendIds(new Set((Array.isArray(friends) ? friends : []).map((f) => f.user_id)));
        setSentRequestIds(
          new Set(
            (Array.isArray(sent) ? sent : [])
              .filter((r) => r.status === "pending")
              .map((r) => r.receiver_id)
          )
        );
      } catch (err) {
        console.error("Failed to load friend data", err);
      }
    };
    loadFriendData();
  }, [getToken]);

  const handleOpenProfile = useCallback(async (author) => {
    if (!author?.user_id) return;

    setProfileDialog({
      open: true,
      author,
      profile: author,
      loading: true,
      sending: false,
      error: "",
    });

    try {
      const token = await getToken();
      const fullProfile = await friendsService.getUserProfile(token, author.user_id);
      setProfileDialog((cur) =>
        cur.author?.user_id === author.user_id ? { ...cur, profile: fullProfile, loading: false } : cur
      );
    } catch (err) {
      console.error("Failed to load user profile", err);
      setProfileDialog((cur) =>
        cur.author?.user_id === author.user_id ? { ...cur, loading: false } : cur
      );
    }
  }, [getToken]);

  const handleCloseProfileDialog = useCallback(() => {
    setProfileDialog((cur) => ({ ...cur, open: false }));
  }, []);

  const handleSendFriendRequest = useCallback(async () => {
    const receiverId = profileDialog.author?.user_id;
    if (!receiverId || profileDialog.sending) return;

    setProfileDialog((cur) => ({ ...cur, sending: true, error: "" }));

    try {
      const token = await getToken();
      await friendsService.sendFriendRequest(token, receiverId);
      setSentRequestIds((cur) => new Set(cur).add(receiverId));
      setProfileDialog((cur) => ({ ...cur, sending: false }));
    } catch (err) {
      const message = err.message || "Failed to send friend request";
      if (/already exists/i.test(message)) {
        setSentRequestIds((cur) => new Set(cur).add(receiverId));
        setProfileDialog((cur) => ({ ...cur, sending: false }));
      } else if (/already friends/i.test(message)) {
        setFriendIds((cur) => new Set(cur).add(receiverId));
        setProfileDialog((cur) => ({ ...cur, sending: false }));
      } else {
        console.error("Failed to send friend request", err);
        setProfileDialog((cur) => ({ ...cur, sending: false, error: message }));
      }
    }
  }, [getToken, profileDialog.author, profileDialog.sending]);

  const profileFriendStatus = (() => {
    const authorId = profileDialog.author?.user_id;
    if (!authorId) return "none";
    if (authorId === currentUserId) return "self";
    if (friendIds.has(authorId)) return "friends";
    if (sentRequestIds.has(authorId)) return "pending";
    return "none";
  })();

  const toggleReaction = useCallback(async (postId, field) => {
    const flightKey = `${postId}-${field}`;
    if (reactionInFlight.current[flightKey]) return;
    reactionInFlight.current[flightKey] = true;

    try {
      const token = await getToken();
      const action = field === "liked" ? communityService.toggleLike : communityService.toggleSave;
      const result = await action(token, postId);

      setPosts((cur) =>
        cur.map((p) => {
          if (p.id !== postId) return p;
          if (field === "liked") {
            return { ...p, liked_by_me: result.active, like_count: result.like_count ?? p.like_count };
          }
          return { ...p, saved_by_me: result.active, save_count: result.save_count ?? p.save_count };
        })
      );
    } catch (err) {
      console.error(`Failed to toggle ${field}`, err);
    } finally {
      reactionInFlight.current[flightKey] = false;
    }
  }, [getToken]);

  const handleShare = useCallback(async (postId) => {
    try {
      const token = await getToken();
      const result = await communityService.sharePost(token, postId);
      setPosts((cur) =>
        cur.map((p) => (p.id === postId ? { ...p, share_count: result.share_count } : p))
      );
      if (result.share_url) {
        navigator.clipboard.writeText(window.location.origin + result.share_url).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to share post", err);
    }
  }, [getToken]);

  const toggleDiscussion = useCallback((postId) => {
    setExpandedPosts((cur) => {
      const isOpen = cur.includes(postId);
      return isOpen ? cur.filter((x) => x !== postId) : [...cur, postId];
    });
    setComments((cur) => {
      if (cur[postId] === undefined) loadComments(postId);
      return cur;
    });
  }, [loadComments]);

  const handleReplyChange = useCallback((postId, value) => {
    setReplyDrafts((cur) => ({ ...cur, [postId]: value }));
  }, []);

  const handleSendReply = useCallback(async (postId, rawText) => {
    const text = (rawText || "").trim();
    if (!text || replySending[postId]) return;

    setReplySending((s) => ({ ...s, [postId]: true }));
    try {
      const token = await getToken();
      await communityService.addComment(token, postId, { text });
      setReplyDrafts((d) => ({ ...d, [postId]: "" }));
      await loadComments(postId);
      setPosts((p) =>
        p.map((post) => (post.id === postId ? { ...post, comment_count: post.comment_count + 1 } : post))
      );
    } catch (err) {
      console.error("Failed to add comment", err);
    } finally {
      setReplySending((s) => ({ ...s, [postId]: false }));
    }
  }, [getToken, loadComments, replySending]);

  const handleDeletePost = useCallback(async (postId) => {
    const confirmed = window.confirm("Delete this post? This can't be undone.");
    if (!confirmed) return;

    const previousPosts = posts;
    setPosts((cur) => cur.filter((p) => p.id !== postId));

    try {
      const token = await getToken();
      await communityService.deletePost(token, postId);
    } catch (err) {
      console.error("Failed to delete post", err);
      setPosts(previousPosts);
    }
  }, [getToken, posts]);

  const handleDeleteComment = useCallback(async (postId, commentId) => {
    const confirmed = window.confirm("Delete this comment? This can't be undone.");
    if (!confirmed) return;

    const previousComments = comments[postId] || [];
    setComments((cur) => ({
      ...cur,
      [postId]: previousComments.filter((c) => c.id !== commentId),
    }));
    setPosts((cur) =>
      cur.map((p) => (p.id === postId ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p))
    );

    try {
      const token = await getToken();
      await communityService.deleteComment(token, postId, commentId);
    } catch (err) {
      console.error("Failed to delete comment", err);
      setComments((cur) => ({ ...cur, [postId]: previousComments }));
      setPosts((cur) =>
        cur.map((p) => (p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p))
      );
    }
  }, [getToken, comments]);

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "112px 24px 80px" }}>
        <div style={{ marginBottom: 32 }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em" }}>
            Communities
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, marginBottom: 20, alignItems: "center" }}>
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
              style={{ border: "none", background: "transparent", flex: 1, fontSize: 14, color: "#334155", outline: "none" }}
            />
          </div>
          <button className="cm-btn cm-btn-dark" style={{ padding: "10px 20px" }} onClick={() => setAddPostModalOpen(true)}>
            <PlusIcon style={{ width: 15, height: 15 }} />
            Create Post
          </button>
        </div>

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

        {error && (
          <div style={{ marginBottom: 20, padding: 14, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, color: "#b91c1c", fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 0, alignItems: "start" }}>
          <div style={{ paddingRight: 32, borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 20 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>Loading posts...</div>
            ) : posts.length === 0 ? (
              <div style={{ background: "#fff", border: "1px dashed #e2e8f0", borderRadius: 20, padding: 48, textAlign: "center" }}>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>No posts match your current filter.</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isExpanded={expandedPosts.includes(post.id)}
                  postComments={comments[post.id] || []}
                  isLoadingComments={!!commentsLoading[post.id]}
                  replyDraft={replyDrafts[post.id] || ""}
                  isSendingReply={!!replySending[post.id]}
                  currentUserId={currentUserId}
                  onToggleReaction={toggleReaction}
                  onToggleDiscussion={toggleDiscussion}
                  onShare={handleShare}
                  onReplyChange={handleReplyChange}
                  onSendReply={handleSendReply}
                  onDeletePost={handleDeletePost}
                  onDeleteComment={handleDeleteComment}
                  onOpenProfile={handleOpenProfile}
                />
              ))
            )}
          </div>

          <div style={{ paddingLeft: 32 }}>
            <Sidebar recentUploads={recentUploads} topContributors={topContributors} />
          </div>
        </div>

        <AddPostModal
          isOpen={addPostModalOpen}
          onClose={() => setAddPostModalOpen(false)}
          onCreated={(newPost) => setPosts((cur) => [newPost, ...cur])}
        />

        <UserProfileDialog
          isOpen={profileDialog.open}
          profile={profileDialog.profile}
          isLoadingProfile={profileDialog.loading}
          friendStatus={profileFriendStatus}
          isSendingRequest={profileDialog.sending}
          errorMessage={profileDialog.error}
          onClose={handleCloseProfileDialog}
          onSendRequest={handleSendFriendRequest}
        />
      </main>
    </div>
  );
};

export default Communities;