import { useState } from "react";
import { motion } from "framer-motion";
import api from "../api.js";
import { IconX } from "./Icons.jsx";

const REASONS = ["Spam", "Assédio ou bullying", "Discurso de ódio", "Informação falsa", "Outro"];

export default function ReportModal({ targetType, targetId, onClose }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.stopPropagation();
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await api.post("/api/reports", { targetType, targetId, reason });
      setSent(true);
      setTimeout(onClose, 1200);
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-mist/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-mist-surface border border-mist-border rounded-3xl w-full max-w-sm shadow-card"
      >
        <div className="flex justify-between items-center p-4 border-b border-mist-border">
          <span className="text-hush text-sm font-medium">
            Denunciar {targetType === "post" ? "post" : "perfil"}
          </span>
          <button onClick={onClose} className="text-hush hover:text-ghost p-1 rounded-full">
            <IconX size={18} />
          </button>
        </div>

        {sent ? (
          <p className="p-6 text-sm text-aurora-soft text-center">Denúncia enviada. Obrigado por ajudar.</p>
        ) : (
          <form onSubmit={handleSubmit} className="p-4">
            <div className="flex flex-col gap-2 mb-4">
              {REASONS.map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-2.5 text-sm p-2.5 rounded-xl hover:bg-mist-hover cursor-pointer"
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-aurora"
                  />
                  {r}
                </label>
              ))}
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-gradient-to-r from-aurora to-aurora-teal disabled:opacity-40 text-mist font-bold py-2.5 rounded-full transition-opacity hover:opacity-90"
            >
              Enviar denúncia
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
