import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Avatar from "./Avatar.jsx";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { IconImage, IconX, IconChart, IconSmile } from "./Icons.jsx";
import EmojiPicker from "./EmojiPicker.jsx";
import MentionDropdown from "./MentionDropdown.jsx";
import { useMentionAutocomplete } from "../lib/useMentionAutocomplete.js";
import { compressImage } from "../lib/compressImage.js";

const DRAFT_KEY = "bluds_draft";

export default function ComposeBox({ onPosted }) {
  const { user } = useAuth();
  const [content, setContent] = useState(() => localStorage.getItem(DRAFT_KEY) || "");
  const [images, setImages] = useState([]); // File[]
  const [previews, setPreviews] = useState([]); // string[]
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [focused, setFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const { suggestions, showDropdown, selectMention } = useMentionAutocomplete(content, setContent, textareaRef);

  // Salva o texto como rascunho local (sem imagens/enquete — não dá pra serializar File no localStorage)
  useEffect(() => {
    const handle = setTimeout(() => {
      if (content.trim()) localStorage.setItem(DRAFT_KEY, content);
      else localStorage.removeItem(DRAFT_KEY);
    }, 400);
    return () => clearTimeout(handle);
  }, [content]);

  function insertEmoji(emoji) {
    const el = textareaRef.current;
    if (!el) {
      setContent((c) => c + emoji);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const next = content.slice(0, start) + emoji + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + emoji.length;
    });
  }

  async function handlePickImages(e) {
    const files = Array.from(e.target.files || []).slice(0, 4 - images.length);
    if (files.length === 0) return;
    // Mostra a prévia (original) na hora, e comprime em segundo plano antes do envio
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))].slice(0, 4));
    const compressed = await Promise.all(files.map((f) => compressImage(f)));
    setImages((prev) => [...prev, ...compressed].slice(0, 4));
  }

  function removeImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePollOption(index, value) {
    setPollOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  function addPollOption() {
    if (pollOptions.length < 4) setPollOptions((prev) => [...prev, ""]);
  }

  function togglePoll() {
    setShowPoll((v) => !v);
    if (images.length > 0) {
      setImages([]);
      setPreviews([]);
    }
  }

  const validPollOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
  const canSubmit = content.trim() || images.length > 0 || (showPoll && validPollOptions.length >= 2);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("content", content);
      images.forEach((img) => formData.append("images", img));
      if (showPoll && validPollOptions.length >= 2) {
        formData.append("pollOptions", JSON.stringify(validPollOptions));
      }

      const { data } = await api.post("/api/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setContent("");
      localStorage.removeItem(DRAFT_KEY);
      setImages([]);
      setPreviews([]);
      setShowPoll(false);
      setPollOptions(["", ""]);
      onPosted?.(data);
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao publicar");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  return (
    <motion.form
      onSubmit={handleSubmit}
      animate={{
        boxShadow: focused
          ? "0 0 0 1px rgba(167,139,250,0.35), 0 0 28px rgba(94,234,212,0.18)"
          : "0 0 0 1px rgba(255,255,255,0)",
      }}
      transition={{ duration: 0.3 }}
      className="m-4 p-4 rounded-3xl bg-mist-surface border border-mist-border"
    >
      <div className="flex gap-3">
        <Avatar user={user} />
        <div className="flex-1 min-w-0 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Solta o papo pros seus bluds..."
            maxLength={280}
            rows={3}
            className="w-full bg-transparent outline-none resize-none text-lg placeholder-hush"
          />

          {showDropdown && <MentionDropdown suggestions={suggestions} onSelect={selectMention} />}

          {previews.length > 0 && (
            <div className={`grid gap-2 mb-3 mt-1 ${previews.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {previews.map((src, i) => (
                <div key={i} className="relative rounded-2xl overflow-hidden border border-mist-border">
                  <img src={src} alt="Prévia" className="w-full h-32 object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1.5 right-1.5 bg-mist/80 backdrop-blur p-1 rounded-full text-ghost"
                  >
                    <IconX size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showPoll && (
            <div className="mb-3 mt-1 p-3 rounded-2xl border border-mist-border flex flex-col gap-2">
              {pollOptions.map((opt, i) => (
                <input
                  key={i}
                  value={opt}
                  onChange={(e) => updatePollOption(i, e.target.value)}
                  placeholder={`Opção ${i + 1}`}
                  maxLength={40}
                  className="bg-mist border border-mist-border rounded-lg px-3 py-2 text-sm outline-none focus:border-aurora/50"
                />
              ))}
              <div className="flex items-center justify-between">
                {pollOptions.length < 4 ? (
                  <button
                    type="button"
                    onClick={addPollOption}
                    className="text-aurora-soft text-sm hover:underline"
                  >
                    + Adicionar opção
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={togglePoll}
                  className="text-hush text-sm hover:text-bloom"
                >
                  Remover enquete
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-bloom text-sm mb-2">{error}</p>}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={showPoll || images.length >= 4}
                className="text-aurora-soft hover:text-aurora p-2 rounded-full hover:bg-mist-hover transition-colors disabled:opacity-30"
                title="Adicionar imagem"
              >
                <IconImage size={19} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePickImages}
              />
              <button
                type="button"
                onClick={togglePoll}
                disabled={images.length > 0}
                className={`p-2 rounded-full hover:bg-mist-hover transition-colors disabled:opacity-30 ${
                  showPoll ? "text-aurora" : "text-aurora-soft hover:text-aurora"
                }`}
                title="Criar enquete"
              >
                <IconChart size={19} />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setEmojiOpen((v) => !v)}
                  className="text-aurora-soft hover:text-aurora p-2 rounded-full hover:bg-mist-hover transition-colors"
                  title="Emoji"
                >
                  <IconSmile size={19} />
                </button>
                {emojiOpen && <EmojiPicker onSelect={insertEmoji} onClose={() => setEmojiOpen(false)} />}
              </div>
              <span className="text-xs text-hush ml-1">
                {content.length}/280{content.trim() && !busy ? " · rascunho salvo" : ""}
              </span>
            </div>

            <button
              type="submit"
              disabled={!canSubmit || busy}
              className="bg-gradient-to-r from-aurora to-aurora-teal disabled:opacity-40 disabled:cursor-not-allowed text-mist font-bold px-5 py-2 rounded-full transition-opacity hover:opacity-90"
            >
              Postar
            </button>
          </div>
        </div>
      </div>
    </motion.form>
  );
}
