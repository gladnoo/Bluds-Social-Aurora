import { useState } from "react";
import { motion } from "framer-motion";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { IconCheck } from "./Icons.jsx";

export default function Poll({ postId, poll, onChange }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const hasVoted = poll.votedOptionId !== null;

  async function vote(optionId, e) {
    e.stopPropagation();
    if (!user || hasVoted || busy) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/api/posts/${postId}/poll/vote`, { optionId });
      onChange?.(data);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
      {poll.options.map((opt) => {
        const pct = poll.totalVotes > 0 ? Math.round((opt.voteCount / poll.totalVotes) * 100) : 0;
        const isMine = poll.votedOptionId === opt.id;

        if (!hasVoted) {
          return (
            <button
              key={opt.id}
              onClick={(e) => vote(opt.id, e)}
              disabled={!user || busy}
              className="text-left px-4 py-2.5 rounded-xl border border-mist-border hover:border-aurora/50 hover:bg-mist-hover transition-colors text-sm font-medium disabled:opacity-60"
            >
              {opt.text}
            </button>
          );
        }

        return (
          <div key={opt.id} className="relative overflow-hidden rounded-xl border border-mist-border">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`absolute inset-y-0 left-0 ${isMine ? "bg-aurora/25" : "bg-mist-hover"}`}
            />
            <div className="relative flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                {isMine && <IconCheck size={14} className="text-aurora-soft" />}
                {opt.text}
              </span>
              <span className="text-hush">{pct}%</span>
            </div>
          </div>
        );
      })}
      <p className="text-hush text-xs mt-1">
        {poll.totalVotes} {poll.totalVotes === 1 ? "voto" : "votos"}
      </p>
    </div>
  );
}
