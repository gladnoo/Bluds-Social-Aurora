import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Avatar from "./Avatar.jsx";
import QuoteModal from "./QuoteModal.jsx";
import ReportModal from "./ReportModal.jsx";
import Poll from "./Poll.jsx";
import Lightbox from "./Lightbox.jsx";
import MentionDropdown from "./MentionDropdown.jsx";
import { useMentionAutocomplete } from "../lib/useMentionAutocomplete.js";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { renderContentWithHashtags } from "../lib/text.jsx";
import { resolveImageUrl } from "../lib/media.js";
import {
  IconHeart,
  IconMessageCircle,
  IconRepeat,
  IconQuote,
  IconBookmark,
  IconTrash,
  IconEdit,
  IconPin,
  IconShare,
  IconCheck,
  IconFlag,
  IconVerified,
} from "./Icons.jsx";

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function ImageGrid({ images }) {
  const [zoomIndex, setZoomIndex] = useState(null);
  if (!images || images.length === 0) return null;
  const cols = images.length === 1 ? "grid-cols-1" : "grid-cols-2";

  return (
    <>
      <div className={`grid ${cols} gap-1.5 mt-3 rounded-2xl overflow-hidden`}>
        {images.map((url, i) => (
          <img
            key={i}
            src={resolveImageUrl(url)}
            alt=""
            loading="lazy"
            decoding="async"
            onClick={(e) => {
              e.stopPropagation();
              setZoomIndex(i);
            }}
            className={`w-full object-cover border border-mist-border cursor-zoom-in ${images.length === 1 ? "max-h-96" : "h-40"}`}
          />
        ))}
      </div>

      {zoomIndex !== null && (
        <div onClick={(e) => e.stopPropagation()}>
          <Lightbox images={images} index={zoomIndex} onClose={() => setZoomIndex(null)} onNavigate={setZoomIndex} />
        </div>
      )}
    </>
  );
}

function QuotedPreview({ post }) {
  if (!post) return null;
  return (
    <Link
      to={`/post/${post.id}`}
      onClick={(e) => e.stopPropagation()}
      className="block mt-3 border border-mist-border rounded-2xl p-3 hover:border-aurora/40 transition-colors"
    >
      <div className="flex items-center gap-2">
        <Avatar user={post.author} size="w-5 h-5" />
        <span className="font-semibold text-sm">{post.author.displayName}</span>
        {post.author.isVerified && <IconVerified size={13} className="text-aurora-soft" />}
        <span className="text-hush text-sm">@{post.author.username}</span>
      </div>
      <p className="mt-1 text-sm whitespace-pre-wrap break-words text-ghost/85">
        {renderContentWithHashtags(post.content)}
      </p>
      <ImageGrid images={post.images} />
    </Link>
  );
}

export default function PostCard({ post, onChange, repostedBy = null, pinned = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busyLike, setBusyLike] = useState(false);
  const [busyRepost, setBusyRepost] = useState(false);
  const [busyBookmark, setBusyBookmark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const editTextareaRef = useRef(null);
  const { suggestions: editSuggestions, showDropdown: showEditDropdown, selectMention: selectEditMention } =
    useMentionAutocomplete(editContent, setEditContent, editTextareaRef);
  const [busyEdit, setBusyEdit] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function toggleLike(e) {
    e.stopPropagation();
    if (!user || busyLike) return;
    setBusyLike(true);
    try {
      const { data } = await api.post(`/api/posts/${post.id}/like`);
      onChange?.(data);
    } finally {
      setBusyLike(false);
    }
  }

  async function toggleRepost(e) {
    e.stopPropagation();
    if (!user || busyRepost) return;
    setMenuOpen(false);
    setBusyRepost(true);
    try {
      const { data } = await api.post(`/api/posts/${post.id}/repost`);
      onChange?.(data);
    } finally {
      setBusyRepost(false);
    }
  }

  async function toggleBookmark(e) {
    e.stopPropagation();
    if (!user || busyBookmark) return;
    setBusyBookmark(true);
    try {
      const { data } = await api.post(`/api/posts/${post.id}/bookmark`);
      onChange?.(data);
    } finally {
      setBusyBookmark(false);
    }
  }

  async function togglePin(e) {
    e.stopPropagation();
    setMenuOpen(false);
    await api.post(`/api/posts/${post.id}/pin`);
    onChange?.({ ...post, __pinChanged: true });
  }

  function startEdit(e) {
    e.stopPropagation();
    setMenuOpen(false);
    setEditContent(post.content);
    setEditing(true);
  }

  async function saveEdit(e) {
    e.stopPropagation();
    if (!editContent.trim() || busyEdit) return;
    setBusyEdit(true);
    try {
      const { data } = await api.patch(`/api/posts/${post.id}`, { content: editContent });
      onChange?.(data);
      setEditing(false);
    } finally {
      setBusyEdit(false);
    }
  }

  async function handleShare(e) {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;

    // No celular, abre o menu nativo de compartilhamento (WhatsApp, Instagram, etc).
    // No desktop (ou se o navegador não suportar), cai pra copiar o link.
    if (navigator.share) {
      try {
        await navigator.share({ title: `Post de ${post.author.displayName} no Bluds`, url });
      } catch (err) {
        // usuário cancelou o compartilhamento — não faz nada
      }
      return;
    }

    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function openQuote(e) {
    e.stopPropagation();
    setMenuOpen(false);
    setQuoteOpen(true);
  }

  function handleReply(e) {
    e.stopPropagation();
    navigate(`/post/${post.id}`);
  }

  async function handleDelete(e) {
    e.stopPropagation();
    setMenuOpen(false);
    if (!confirm("Apagar este post?")) return;
    await api.delete(`/api/posts/${post.id}`);
    onChange?.(null);
  }

  function handleQuoted(newQuotePost) {
    setQuoteOpen(false);
    navigate(`/post/${newQuotePost.id}`);
  }

  function handlePollChange(updated) {
    onChange?.(updated);
  }

  const isMine = user?.username === post.author.username;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={() => !editing && navigate(`/post/${post.id}`)}
      className="mx-4 mb-3 p-4 rounded-2xl bg-mist-surface border border-mist-border hover:border-aurora/25 hover:bg-mist-hover transition-colors cursor-pointer"
    >
      {pinned && (
        <div className="flex items-center gap-2 text-hush text-sm mb-3 ml-8">
          <IconPin size={13} filled className="text-aurora-soft" />
          <span>Fixado no perfil</span>
        </div>
      )}
      {repostedBy && !pinned && (
        <div className="flex items-center gap-2 text-hush text-sm mb-3 ml-8">
          <IconRepeat size={14} className="text-aurora-soft" />
          <span>{repostedBy.displayName} repostou</span>
        </div>
      )}

      <div className="flex gap-3">
        <Link to={`/profile/${post.author.username}`} onClick={(e) => e.stopPropagation()}>
          <Avatar user={post.author} />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <Link
              to={`/profile/${post.author.username}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold hover:underline truncate"
            >
              {post.author.displayName}
            </Link>
            {post.author.isVerified && <IconVerified size={14} className="text-aurora-soft" />}
            <span className="text-hush text-sm truncate">@{post.author.username}</span>
            <span className="text-hush text-sm">· {timeAgo(post.createdAt)}</span>
            {post.editedAt && <span className="text-hush text-xs">· editado</span>}

            {user && (
              <div className="relative ml-auto" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((v) => !v);
                  }}
                  className="text-hush hover:text-ghost p-1 rounded-full transition-colors text-lg leading-none"
                  title="Mais opções"
                >
                  ···
                </button>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute z-30 top-full mt-1 right-0 bg-mist-surface backdrop-blur-lg border border-mist-border rounded-2xl shadow-card py-1 w-44 overflow-hidden"
                  >
                    {isMine ? (
                      <>
                        <button onClick={startEdit} className="w-full text-left px-4 py-2.5 text-sm hover:bg-mist-hover flex items-center gap-2.5">
                          <IconEdit size={15} /> Editar
                        </button>
                        <button onClick={togglePin} className="w-full text-left px-4 py-2.5 text-sm hover:bg-mist-hover flex items-center gap-2.5">
                          <IconPin size={15} /> {pinned ? "Desafixar" : "Fixar no perfil"}
                        </button>
                        <button onClick={handleDelete} className="w-full text-left px-4 py-2.5 text-sm hover:bg-mist-hover flex items-center gap-2.5 text-bloom">
                          <IconTrash size={15} /> Apagar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                          setReportOpen(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-mist-hover flex items-center gap-2.5 text-bloom"
                      >
                        <IconFlag size={15} /> Denunciar
                      </button>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {editing ? (
            <div onClick={(e) => e.stopPropagation()} className="mt-1 relative">
              <textarea
                autoFocus
                ref={editTextareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={280}
                rows={3}
                className="w-full bg-mist border border-mist-border rounded-xl p-2.5 outline-none focus:border-aurora/50 resize-none"
              />
              {showEditDropdown && <MentionDropdown suggestions={editSuggestions} onSelect={selectEditMention} />}
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={saveEdit}
                  disabled={!editContent.trim() || busyEdit}
                  className="bg-gradient-to-r from-aurora to-aurora-teal disabled:opacity-40 text-mist font-bold px-4 py-1.5 rounded-full text-sm transition-opacity hover:opacity-90"
                >
                  Salvar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(false);
                  }}
                  className="border border-mist-border px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-mist-hover transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              {post.content && (
                <p className="mt-1 whitespace-pre-wrap break-words leading-relaxed">
                  {renderContentWithHashtags(post.content)}
                </p>
              )}
              <ImageGrid images={post.images} />
              {post.poll && <Poll postId={post.id} poll={post.poll} onChange={handlePollChange} />}
              <QuotedPreview post={post.quoteOf} />
            </>
          )}

          <div className="flex items-center gap-5 mt-3 text-hush max-w-md">
            <button
              onClick={handleReply}
              className="flex items-center gap-1.5 text-sm hover:text-aurora-soft transition-colors"
              title="Responder"
            >
              <IconMessageCircle size={17} />
              <span>{post.replyCount || ""}</span>
            </button>

            <div className="relative">
              <button
                onClick={toggleRepost}
                disabled={busyRepost || !user}
                className={`flex items-center gap-1.5 text-sm transition-colors ${
                  post.repostedByMe ? "text-aurora-teal" : "hover:text-aurora-teal"
                }`}
                title="Repostar"
              >
                <IconRepeat size={17} />
                <span>{post.repostCount || ""}</span>
              </button>
            </div>

            <button
              onClick={openQuote}
              className="flex items-center gap-1.5 text-sm hover:text-aurora-teal transition-colors"
              title="Citar"
            >
              <IconQuote size={16} />
            </button>

            <button
              onClick={toggleLike}
              disabled={!user}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                post.likedByMe ? "text-bloom" : "hover:text-bloom"
              }`}
              title="Curtir"
            >
              <motion.span whileTap={{ scale: 0.7 }} className="inline-flex">
                <IconHeart size={17} filled={post.likedByMe} />
              </motion.span>
              <span>{post.likeCount || ""}</span>
            </button>

            <button
              onClick={toggleBookmark}
              disabled={!user}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                post.bookmarkedByMe ? "text-aurora-soft" : "hover:text-aurora-soft"
              }`}
              title="Salvar"
            >
              <IconBookmark size={17} filled={post.bookmarkedByMe} />
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-sm ml-auto hover:text-aurora-soft transition-colors"
              title="Copiar link"
            >
              {copied ? <IconCheck size={16} className="text-aurora-soft" /> : <IconShare size={16} />}
            </button>
          </div>
        </div>
      </div>

      {quoteOpen && (
        <div onClick={(e) => e.stopPropagation()}>
          <QuoteModal post={post} onClose={() => setQuoteOpen(false)} onQuoted={handleQuoted} />
        </div>
      )}

      {reportOpen && (
        <div onClick={(e) => e.stopPropagation()}>
          <ReportModal targetType="post" targetId={post.id} onClose={() => setReportOpen(false)} />
        </div>
      )}
    </motion.article>
  );
}
