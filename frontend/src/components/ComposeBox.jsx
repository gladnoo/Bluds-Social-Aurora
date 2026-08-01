import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Avatar from "./Avatar.jsx";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { IconImage, IconX, IconChart, IconSmile, IconPlus, IconGif } from "./Icons.jsx";
import EmojiPicker from "./EmojiPicker.jsx";
import GifPicker from "./GifPicker.jsx";
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
  const [threadParts, setThreadParts] = useState([]); // string[] — posts extras encadeados
  const [selectedGif, setSelectedGif] = useState(null); // URL do GIF (Tenor)
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
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
    setSelectedGif(null);
    setShowPoll(false);
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
    setSelectedGif(null);
  }

  function handleSelectGif(url) {
    setSelectedGif(url);
    setGifPickerOpen(false);
    setImages([]);
    setPreviews([]);
    setShowPoll(false);
  }

  const validPollOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
  const canSubmit = content.trim() || images.length > 0 || !!selectedGif || (showPoll && validPollOptions.length >= 2);

  function addThreadPart() {
    if (threadParts.length < 9) setThreadParts((prev) => [...prev, ""]);
  }

  function updateThreadPart(index, value) {
    setThreadParts((prev) => prev.map((t, i) => (i === index ? value : t)));
  }

  function removeThreadPart(index) {
    setThreadParts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("content", content);
      images.forEach((img) => formData.append("images", img));
      if (selectedGif) formData.append("gifUrl", selectedGif);
      if (showPoll && validPollOptions.length >= 2) {
        formData.append("pollOptions", JSON.stringify(validPollOptions));
      }

      const { data: firstPost } = await api.post("/api/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Publica cada parte extra do fio, uma respondendo a anterior
      let previousId = firstPost.id;
      const parts = threadParts.map((t) => t.trim()).filter(Boolean);
      for (const part of parts) {
        const partForm = new FormData();
        partForm.append("content", part);
        partForm.append("replyToId", previousId);
        const { data: nextPost } = await api.post("/api/posts", partForm, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        previousId = nextPost.id;
      }

      setContent("");
      localStorage.removeItem(DRAFT_KEY);
      setImages([]);
      setPreviews([]);
      setShowPoll(false);
      setPollOptions(["", ""]);
      setThreadParts([]);
      setSelectedGif(null);
      onPosted?.(firstPost);
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

          {selectedGif && (
            <div className="relative mb-3 mt-1 rounded-2xl overflow-hidden border border-mist-border inline-block">
              <img src={selectedGif} alt="GIF selecionado" className="max-h-48 rounded-2xl" />
              <button
                type="button"
                onClick={() => setSelectedGif(null)}
                className="absolute top-1.5 right-1.5 bg-mist/80 backdrop-blur p-1 rounded-full text-ghost"
              >
                <IconX size={14} />
              </button>
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

          {threadParts.map((part, i) => (
            <div key={i} className="mt-3 pt-3 border-t border-dashed border-mist-border flex gap-2">
              <span className="text-hush text-xs mt-2.5 w-4 flex-shrink-0">{i + 2}</span>
              <div className="flex-1">
                <textarea
                  value={part}
                  onChange={(e) => updateThreadPart(i, e.target.value)}
                  placeholder="Continue o fio..."
                  maxLength={280}
                  rows={2}
                  className="w-full bg-transparent outline-none resize-none text-base placeholder-hush"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-hush">{part.length}/280</span>
                  <button
                    type="button"
                    onClick={() => removeThreadPart(i)}
                    className="text-hush hover:text-bloom text-xs flex items-center gap-1"
                  >
                    <IconX size={12} /> Remover
                  </button>
                </div>
              </div>
            </div>
          ))}

          {error && <p className="text-bloom text-sm mb-2 mt-2">{error}</p>}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={showPoll || images.length >= 4 || !!selectedGif}
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
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setGifPickerOpen((v) => !v)}
                  disabled={showPoll || images.length > 0}
                  className={`p-2 rounded-full hover:bg-mist-hover transition-colors disabled:opacity-30 ${
                    selectedGif ? "text-aurora" : "text-aurora-soft hover:text-aurora"
                  }`}
                  title="Adicionar GIF"
                >
                  <IconGif size={19} />
                </button>
                {gifPickerOpen && <GifPicker onSelect={handleSelectGif} onClose={() => setGifPickerOpen(false)} />}
              </div>
              <button
                type="button"
                onClick={togglePoll}
                disabled={images.length > 0 || !!selectedGif}
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
              <button
                type="button"
                onClick={addThreadPart}
                disabled={threadParts.length >= 9}
                className="text-aurora-soft hover:text-aurora p-2 rounded-full hover:bg-mist-hover transition-colors disabled:opacity-30"
                title="Adicionar ao fio"
              >
                <IconPlus size={19} />
              </button>
              <span className="text-xs text-hush ml-1">
                {content.length}/280{content.trim() && !busy ? " · rascunho salvo" : ""}
              </span>
            </div>

            <button
              type="submit"
              disabled={!canSubmit || busy}
              className="bg-gradient-to-r from-aurora to-aurora-teal disabled:opacity-40 disabled:cursor-not-allowed text-mist font-bold px-5 py-2 rounded-full transition-opacity hover:opacity-90"
            >
              {busy ? "Postando..." : threadParts.length > 0 ? `Postar fio (${threadParts.length + 1})` : "Postar"}
            </button>
          </div>
        </div>
      </div>
    </motion.form>
  );
}
