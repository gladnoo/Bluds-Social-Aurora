import { useEffect, useState } from "react";
import api from "../api.js";
import PostCard from "../components/PostCard.jsx";
import { IconBookmark } from "../components/Icons.jsx";

export default function Bookmarks() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await api.get("/api/posts/bookmarks/me");
    setPosts(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function handleChange(id, updated) {
    setPosts((prev) => {
      // Se removeu o post ou tirou dos salvos, some da lista
      if (updated === null || updated.bookmarkedByMe === false) return prev.filter((p) => p.id !== id);
      return prev.map((p) => (p.id === id ? updated : p));
    });
  }

  return (
    <div>
      <div className="p-4 sticky top-0 bg-mist/70 backdrop-blur-lg z-10">
        <h1 className="font-display italic font-semibold text-2xl flex items-center gap-2">
          <IconBookmark size={19} className="text-aurora-soft" /> Salvos
        </h1>
      </div>

      {loading && <p className="p-4 text-hush">Carregando...</p>}
      {!loading && posts.length === 0 && (
        <div className="mx-4 p-8 text-center border border-dashed border-mist-border rounded-2xl">
          <p className="text-hush text-sm">Nada salvo ainda. Toque no marcador em um post pra guardar aqui.</p>
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} onChange={(updated) => handleChange(post.id, updated)} />
      ))}
    </div>
  );
}
