import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";
import FollowButton from "./FollowButton.jsx";
import { IconTrendingUp, IconVerified } from "./Icons.jsx";

function TrendingWidget() {
  const [trending, setTrending] = useState(null);

  useEffect(() => {
    api.get("/api/posts/trending/tags").then(({ data }) => setTrending(data));
  }, []);

  if (trending && trending.length === 0) return null;

  return (
    <div className="p-4 rounded-3xl bg-mist-surface border border-mist-border mb-4">
      <h2 className="font-display italic font-semibold text-lg mb-3 flex items-center gap-2">
        <IconTrendingUp size={16} className="text-aurora-soft" /> Em alta
      </h2>
      {trending === null && <p className="text-hush text-sm">Carregando...</p>}
      <div className="flex flex-col gap-2.5">
        {trending?.map((t) => (
          <Link
            key={t.tag}
            to={`/hashtag/${t.tag}`}
            className="flex items-center justify-between hover:bg-mist-hover -mx-2 px-2 py-1 rounded-lg transition-colors"
          >
            <span className="font-semibold text-sm">#{t.tag}</span>
            <span className="text-hush text-xs">
              {t.count} {t.count === 1 ? "post" : "posts"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function RightRail() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState(null);

  useEffect(() => {
    if (!user) return;
    api.get("/api/users/suggestions").then(({ data }) => setSuggestions(data));
  }, [user]);

  return (
    <aside className="hidden lg:block w-80 p-4">
      <div className="sticky top-4">
        <TrendingWidget />

        {user && (
          <div className="p-4 rounded-3xl bg-mist-surface border border-mist-border">
            <h2 className="font-display italic font-semibold text-lg mb-3">Quem seguir</h2>

            {suggestions === null && <p className="text-hush text-sm">Carregando...</p>}
            {suggestions?.length === 0 && (
              <p className="text-hush text-sm">Você já segue todo mundo por aqui.</p>
            )}

            <div className="flex flex-col gap-3">
              {suggestions?.map((s) => (
                <div key={s.id} className="flex items-center gap-2.5">
                  <Link to={`/profile/${s.username}`}>
                    <Avatar user={s} size="w-9 h-9" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/profile/${s.username}`} className="font-semibold text-sm truncate flex items-center gap-1 hover:underline">
                      {s.displayName}
                      {s.isVerified && <IconVerified size={12} className="text-aurora-soft flex-shrink-0" />}
                    </Link>
                    <p className="text-hush text-xs truncate">@{s.username}</p>
                  </div>
                  <FollowButton
                    username={s.username}
                    followedByMe={false}
                    compact
                    onChange={() => setSuggestions((prev) => prev.filter((p) => p.id !== s.id))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
