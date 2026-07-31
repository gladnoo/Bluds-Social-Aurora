import { motion } from "framer-motion";

// Paleta curada de emojis (sem depender de biblioteca externa pesada).
const EMOJIS = [
  "😀", "😂", "😅", "😍", "🥰", "😎", "🤔", "😭", "😤", "😴",
  "🙌", "👏", "🙏", "👀", "🔥", "✨", "💜", "💛", "💚", "🩵",
  "🎉", "🎶", "☀️", "🌙", "⭐", "☕", "🍕", "🍀", "🐾", "💯",
];

export default function EmojiPicker({ onSelect, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="absolute z-30 bottom-full mb-2 left-0 bg-mist-surface backdrop-blur-lg border border-mist-border rounded-2xl shadow-card p-2 grid grid-cols-6 gap-1 w-64"
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => {
            onSelect(emoji);
            onClose();
          }}
          className="text-xl p-1.5 rounded-lg hover:bg-mist-hover transition-colors"
        >
          {emoji}
        </button>
      ))}
    </motion.div>
  );
}
