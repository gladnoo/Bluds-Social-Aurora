import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api.js";
import Avatar from "../components/Avatar.jsx";
import { IconVerified } from "../components/Icons.jsx";
import { useNotifications } from "../context/NotificationsContext.jsx";

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function Notifications() {
  const navigate = useNavigate();
  const { clearUnread } = useNotifications();
  const [notifications, setNotifications] = useState(null);

  useEffect(() => {
    api.get("/api/notifications").then(({ data }) => setNotifications(data));
    api.post("/api/notifications/read-all").then(() => clearUnread());
  }, []);

  function handleClick(n) {
    if (n.postId) navigate(`/post/${n.postId}`);
    else navigate(`/profile/${n.actor.username}`);
  }

  return (
    <div>
      <div className="p-4 sticky top-0 bg-mist/80 backdrop-blur-sm z-10">
        <h1 className="font-display italic font-semibold text-2xl">Notificações</h1>
      </div>

      {notifications === null && <p className="p-4 text-hush">Carregando...</p>}
      {notifications?.length === 0 && (
        <div className="mx-4 p-8 text-center border border-dashed border-mist-border rounded-2xl">
          <p className="text-hush text-sm">Nada por aqui ainda.</p>
        </div>
      )}

      {notifications?.map((n) => (
        <button
          key={n.id}
          onClick={() => handleClick(n)}
          className={`w-full text-left flex gap-3 mx-4 mb-2 p-4 rounded-2xl border transition-colors ${
            n.read ? "bg-mist-surface/60 border-mist-border" : "bg-aurora/5 border-aurora/25"
          } hover:bg-mist-hover`}
        >
          <Link to={`/profile/${n.actor.username}`} onClick={(e) => e.stopPropagation()}>
            <Avatar user={n.actor} size="w-10 h-10" />
          </Link>
          <div className="min-w-0">
            <p className="text-sm">
              <span className="font-semibold">{n.actor.displayName}</span>
              {n.actor.isVerified && <IconVerified size={11} className="inline text-aurora-soft mx-0.5" />}{" "}
              <span className="text-hush">{n.label}</span>
            </p>
            {n.postPreview && <p className="text-hush text-sm mt-0.5 truncate">{n.postPreview}</p>}
            <p className="text-hush text-xs mt-1">{timeAgo(n.createdAt)}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
