import { useState } from "react";
import { motion } from "framer-motion";
import Avatar from "./Avatar.jsx";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { IconX } from "./Icons.jsx";

export default function QuoteModal({ post, onClose, onQuoted }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("quoteOfId", post.id);
      const { data } = await api.post("/api/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onQuoted(data);
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao citar post");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-mist/70 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-mist-surface backdrop-blur-xl border border-mist-border rounded-3xl w-full max-w-lg mt-16 sm:mt-0 shadow-card"
      >
        <div className="flex justify-between items-center p-4 border-b border-mist-border">
          <button onClick={onClose} className="text-hush hover:text-ghost p-1.5 rounded-full">
            <IconX size={18} />
          </button>
          <span className="text-hush text-sm font-medium">Citar post</span>
          <div className="w-8" />
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex gap-3">
            <Avatar user={user} />
            <div className="flex-1">
              <textarea
                autoFocus
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Adicione um comentário!"
                maxLength={280}
                rows={3}
                className="w-full bg-transparent outline-none resize-none text-lg placeholder-hush"
              />

              <div className="border border-mist-border rounded-2xl p-3 mb-2">
                <div className="flex items-center gap-2">
                  <Avatar user={post.author} size="w-5 h-5" />
                  <span className="font-semibold text-sm">{post.author.displayName}</span>
                  <span className="text-hush text-sm">@{post.author.username}</span>
                </div>
                <p className="mt-1 text-sm whitespace-pre-wrap break-words text-ghost/80">{post.content}</p>
              </div>

              {error && <p className="text-bloom text-sm mb-2">{error}</p>}

              <div className="flex items-center justify-between">
                <span className="text-xs text-hush">{content.length}/280</span>
                <button
                  type="submit"
                  disabled={!content.trim() || busy}
                  className="bg-gradient-to-r from-aurora to-aurora-teal disabled:opacity-40 text-mist font-bold px-5 py-2 rounded-full transition-opacity hover:opacity-90"
                >
                  Postar
                </button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
