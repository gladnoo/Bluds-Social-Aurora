import { useState } from "react";
import { motion } from "framer-motion";
import api from "../api.js";
import { IconUserPlus, IconUserCheck } from "./Icons.jsx";

// Botão de seguir/deixar de seguir. Lida com o estado "pending" (conta privada
// que ainda não aprovou seu pedido). `compact` usa só o ícone (listas menores).
export default function FollowButton({ username, followedByMe, pending = false, onChange, compact = false }) {
  const [busy, setBusy] = useState(false);

  async function handleClick(e) {
    e.stopPropagation();
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/api/users/${username}/follow`);
      onChange?.(data.followedByMe, data.pending);
    } finally {
      setBusy(false);
    }
  }

  const active = followedByMe || pending;
  const label = pending ? "Solicitado" : followedByMe ? "Seguindo" : "Seguir";

  if (compact) {
    return (
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleClick}
        disabled={busy}
        className={`p-2 rounded-full transition-colors ${
          active ? "text-aurora-soft bg-mist-hover" : "text-hush hover:text-aurora-soft hover:bg-mist-hover"
        }`}
        title={label}
      >
        {active ? <IconUserCheck size={16} /> : <IconUserPlus size={16} />}
      </motion.button>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={handleClick}
      disabled={busy}
      className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
        active
          ? "border border-mist-border text-ghost hover:border-bloom/50 hover:text-bloom"
          : "bg-gradient-to-r from-aurora to-aurora-teal text-mist hover:opacity-90"
      }`}
    >
      {active ? <IconUserCheck size={15} /> : <IconUserPlus size={15} />}
      {label}
    </motion.button>
  );
}
