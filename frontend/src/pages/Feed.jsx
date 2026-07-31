import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import api from "../api.js";
import ComposeBox from "../components/ComposeBox.jsx";
import PostCard from "../components/PostCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { IconSparkle } from "../components/Icons.jsx";

export default function Feed() {
  const { user } = useAuth();
  const [tab, setTab] = useState("for-you"); // "for-you" | "following"
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  async function loadFirstPage(currentTab) {
    setLoading(true);
    const qs = currentTab === "following" ? "&feed=following" : "";
    const { data } = await api.get(`/api/posts?page=0${qs}`);
    setItems(data.items);
    setHasMore(data.hasMore);
    setPage(0);
    setLoading(false);
  }

  async function loadNextPage() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const qs = tab === "following" ? "&feed=following" : "";
    const { data } = await api.get(`/api/posts?page=${nextPage}${qs}`);
    setItems((prev) => [...prev, ...data.items]);
    setHasMore(data.hasMore);
    setPage(nextPage);
    setLoadingMore(false);
  }

  useEffect(() => {
    loadFirstPage(tab);
  }, [tab]);

  // Observa o "sentinela" no fim da lista: quando ele aparece na tela, busca a próxima página
  const observerCallback = useCallback(
    (entries) => {
      if (entries[0].isIntersecting) loadNextPage();
    },
    [page, hasMore, loadingMore, tab]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(observerCallback, { rootMargin: "400px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [observerCallback]);

  function handlePosted(newPost) {
    setItems((prev) => [{ repostedBy: null, post: newPost }, ...prev]);
  }

  function handlePostChange(postId, updated) {
    setItems((prev) => {
      if (updated === null) return prev.filter((item) => item.post.id !== postId);
      return prev.map((item) => (item.post.id === postId ? { ...item, post: updated } : item));
    });
  }

  return (
    <div>
      <div className="p-4 pb-0 sticky top-0 bg-mist/70 backdrop-blur-lg z-10">
        <h1 className="font-display italic font-semibold text-2xl flex items-center gap-2 mb-3">
          <IconSparkle size={19} className="text-aurora-soft" /> Aurora
        </h1>

        {user && (
          <div className="flex gap-1 border-b border-mist-border">
            {[
              { key: "for-you", label: "Para você" },
              { key: "following", label: "Seguindo" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-3 text-sm font-semibold relative transition-colors ${
                  tab === t.key ? "text-ghost" : "text-hush hover:text-ghost"
                }`}
              >
                {t.label}
                {tab === t.key && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-gradient-to-r from-aurora to-aurora-teal" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <ComposeBox onPosted={handlePosted} />

      {loading && <p className="p-4 text-hush">Carregando...</p>}
      {!loading && items.length === 0 && (
        <div className="mx-4 p-8 text-center border border-dashed border-mist-border rounded-2xl">
          <p className="text-ghost font-medium mb-1">
            {tab === "following" ? "Quem você segue ainda não postou nada." : "Ainda tá quieto por aqui."}
          </p>
          <p className="text-hush text-sm">
            {tab === "following" ? "Que tal seguir mais gente na aba Buscar?" : "Poste algo e chama a galera pro papo."}
          </p>
        </div>
      )}

      <AnimatePresence initial={false}>
        {items.map((item) => (
          <PostCard
            key={`${item.post.id}-${item.repostedBy?.username || "orig"}`}
            post={item.post}
            repostedBy={item.repostedBy}
            onChange={(updated) => handlePostChange(item.post.id, updated)}
          />
        ))}
      </AnimatePresence>

      {/* Sentinela invisível: quando entra na tela, carrega a próxima página */}
      <div ref={sentinelRef} className="h-1" />
      {loadingMore && <p className="p-4 text-center text-hush text-sm">Carregando mais...</p>}
      {!loading && !hasMore && items.length > 0 && (
        <p className="p-6 text-center text-hush text-sm">Você chegou ao fim.</p>
      )}
    </div>
  );
}
