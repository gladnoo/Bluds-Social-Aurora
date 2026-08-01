import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api.js";
import Avatar from "../components/Avatar.jsx";
import PostCard from "../components/PostCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { IconArrowLeft } from "../components/Icons.jsx";
import Poll from "../components/Poll.jsx";
import Lightbox from "../components/Lightbox.jsx";
import MentionDropdown from "../components/MentionDropdown.jsx";
import { useMentionAutocomplete } from "../lib/useMentionAutocomplete.js";
import { renderContentWithHashtags } from "../lib/text.jsx";
import { resolveImageUrl } from "../lib/media.js";

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function ReplyBox({ postId, onReplied }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [focused, setFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef(null);
  const { suggestions, showDropdown, selectMention } = useMentionAutocomplete(content, setContent, textareaRef);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("replyToId", postId);
      const { data } = await api.post("/api/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setContent("");
      onReplied(data);
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao responder");
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <p className="mx-4 mb-4 p-4 rounded-2xl border border-mist-border text-hush text-sm">
        <Link to="/login" className="text-aurora-soft hover:underline">
          Entre
        </Link>{" "}
        pra responder.
      </p>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      animate={{
        boxShadow: focused
          ? "0 0 0 1px rgba(94,234,212,0.35), 0 0 28px rgba(94,234,212,0.16)"
          : "0 0 0 1px rgba(255,255,255,0)",
      }}
      className="mx-4 mb-4 p-4 rounded-3xl bg-mist-surface border border-mist-border"
    >
      <div className="flex gap-3">
        <Avatar user={user} />
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Manda sua resposta..."
            maxLength={280}
            rows={2}
            className="w-full bg-transparent outline-none resize-none text-lg placeholder-hush"
          />
          {showDropdown && <MentionDropdown suggestions={suggestions} onSelect={selectMention} />}
          {error && <p className="text-bloom text-sm mb-2">{error}</p>}
          <div className="flex items-center justify-between">
            <span className="text-xs text-hush">{content.length}/280</span>
            <button
              type="submit"
              disabled={!content.trim() || busy}
              className="bg-gradient-to-r from-aurora-teal to-aurora disabled:opacity-40 text-mist font-bold px-5 py-2 rounded-full transition-opacity hover:opacity-90"
            >
              Responder
            </button>
          </div>
        </div>
      </div>
    </motion.form>
  );
}

export default function PostThread() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [zoomIndex, setZoomIndex] = useState(null);

  async function load() {
    const { data } = await api.get(`/api/posts/${id}`);
    setData(data);
  }

  useEffect(() => {
    setData(null);
    load();
  }, [id]);

  function handleReplyChange(replyId, updated) {
    setData((d) => {
      if (updated === null) return { ...d, replies: d.replies.filter((r) => r.id !== replyId) };
      return { ...d, replies: d.replies.map((r) => (r.id === replyId ? updated : r)) };
    });
  }

  function handleReplied(newReply) {
    setData((d) => ({
      ...d,
      replies: [...d.replies, newReply],
      post: { ...d.post, replyCount: d.post.replyCount + 1 },
    }));
  }

  if (!data) return <p className="p-8 text-hush">Carregando...</p>;

  const { post, replyTo, replies } = data;

  return (
    <div>
      <div className="flex items-center gap-4 p-4 sticky top-0 bg-mist/80 backdrop-blur-sm z-10">
        <button onClick={() => navigate(-1)} className="text-hush hover:text-ghost p-1.5 rounded-full">
          <IconArrowLeft size={20} />
        </button>
        <h1 className="font-display italic font-semibold text-xl">Post</h1>
      </div>

      {replyTo && (
        <p className="px-4 pb-2 text-hush text-sm">
          Em resposta a{" "}
          <Link to={`/profile/${replyTo.author.username}`} className="text-aurora-soft hover:underline">
            @{replyTo.author.username}
          </Link>
        </p>
      )}

      <div className="mx-4 mb-4 p-5 rounded-3xl bg-mist-surface border border-mist-border">
        <div className="flex items-center gap-2">
          <Avatar user={post.author} size="w-11 h-11" />
          <div>
            <p className="font-semibold">{post.author.displayName}</p>
            <p className="text-hush text-sm">@{post.author.username}</p>
          </div>
        </div>
        <p className="mt-3 text-xl whitespace-pre-wrap break-words leading-relaxed">
          {renderContentWithHashtags(post.content)}
        </p>
        {post.images?.length > 0 && (
          <div className={`grid gap-1.5 mt-3 rounded-2xl overflow-hidden ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {post.images.map((url, i) => (
              <img
                key={i}
                src={resolveImageUrl(url)}
                alt=""
                loading="lazy"
                decoding="async"
                onClick={() => setZoomIndex(i)}
                className={`w-full object-cover border border-mist-border cursor-zoom-in ${post.images.length === 1 ? "max-h-[28rem]" : "h-48"}`}
              />
            ))}
          </div>
        )}
        {zoomIndex !== null && (
          <Lightbox images={post.images} index={zoomIndex} onClose={() => setZoomIndex(null)} onNavigate={setZoomIndex} />
        )}
        {post.poll && <Poll postId={post.id} poll={post.poll} onChange={(updated) => setData((d) => ({ ...d, post: updated }))} />}
        {post.editedAt && <p className="text-hush text-xs mt-2">editado</p>}
        <p className="text-hush text-sm mt-3">{timeAgo(post.createdAt)}</p>

        <div className="flex items-center gap-6 mt-3 pt-3 border-t border-mist-border text-hush">
          <span className="text-sm">
            <strong className="text-ghost">{post.replyCount}</strong> respostas
          </span>
          <span className="text-sm">
            <strong className="text-ghost">{post.repostCount}</strong> reposts
          </span>
          <span className="text-sm">
            <strong className="text-ghost">{post.likeCount}</strong> curtidas
          </span>
        </div>
      </div>

      <ReplyBox postId={post.id} onReplied={handleReplied} />

      {replies.length === 0 && (
        <div className="mx-4 p-8 text-center border border-dashed border-mist-border rounded-2xl">
          <p className="text-hush text-sm">Ninguém respondeu ainda. Seja o primeiro a puxar assunto.</p>
        </div>
      )}
      <AnimatePresence initial={false}>
        {replies.map((r) => (
          <PostCard key={r.id} post={r} onChange={(updated) => handleReplyChange(r.id, updated)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
