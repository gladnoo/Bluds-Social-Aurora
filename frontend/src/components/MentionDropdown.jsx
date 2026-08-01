import { motion } from "framer-motion";
import Avatar from "./Avatar.jsx";

export default function MentionDropdown({ suggestions, onSelect }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute z-30 bottom-full mb-1 left-0 w-64 bg-mist-surface backdrop-blur-lg border border-mist-border rounded-2xl shadow-card py-1 overflow-hidden"
    >
      {suggestions.map((u) => (
        <button
          key={u.id}
          type="button"
          // onMouseDown (não onClick) pra selecionar antes do textarea perder o foco
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(u.username);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-mist-hover text-left transition-colors"
        >
          <Avatar user={u} size="w-7 h-7" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{u.displayName}</p>
            <p className="text-hush text-xs truncate">@{u.username}</p>
          </div>
        </button>
      ))}
    </motion.div>
  );
}