import { useEffect, useState } from "react";
import api from "../api.js";
import PostCard from "../components/PostCard.jsx";
import { IconBookmark, IconX } from "../components/Icons.jsx";

function FolderPicker({ post, folders, onMoved }) {
  const [open, setOpen] = useState(false);
  const [newFolder, setNewFolder] = useState("");

  async function moveTo(folder) {
    await api.patch(`/api/posts/${post.id}/bookmark/folder`, { folder });
    onMoved(post.id, folder);
    setOpen(false);
    setNewFolder("");
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="text-xs text-hush hover:text-aurora-soft border border-mist-border rounded-full px-2.5 py-1 transition-colors"
      >
        {post.bookmarkFolder || "Geral"}
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-30 top-full mt-1 right-0 bg-mist-surface backdrop-blur-lg border border-mist-border rounded-2xl shadow-card py-1 w-48 overflow-hidden"
        >
          {folders.map((f) => (
            <button
              key={f}
              onClick={() => moveTo(f)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-mist-hover"
            >
              {f}
            </button>
          ))}
          <div className="flex items-center gap-1 p-2 border-t border-mist-border">
            <input
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              placeholder="Nova pasta"
              className="flex-1 bg-mist border border-mist-border rounded-lg px-2 py-1 text-sm outline-none focus:border-aurora/50"
            />
            <button
              onClick={() => newFolder.trim() && moveTo(newFolder.trim())}
              className="text-aurora-soft text-sm px-2"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Bookmarks() {
  const [posts, setPosts] = useState([]);
  const [folders, setFolders] = useState(["Geral"]);
  const [activeFolder, setActiveFolder] = useState(null); // null = todas
  const [loading, setLoading] = useState(true);

  async function loadFolders() {
    const { data } = await api.get("/api/posts/bookmarks/folders");
    setFolders(data.length > 0 ? data : ["Geral"]);
  }

  async function loadPosts(folder) {
    setLoading(true);
    const qs = folder ? `?folder=${encodeURIComponent(folder)}` : "";
    const { data } = await api.get(`/api/posts/bookmarks/me${qs}`);
    setPosts(data);
    setLoading(false);
  }

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    loadPosts(activeFolder);
  }, [activeFolder]);

  function handleChange(id, updated) {
    if (updated === null || updated.bookmarkedByMe === false) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      return;
    }
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...updated, bookmarkFolder: p.bookmarkFolder } : p)));
  }

  function handleMoved(id, folder) {
    setPosts((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, bookmarkFolder: folder } : p));
      // Se tô filtrando por pasta e o post saiu dela, some da lista
      return activeFolder ? next.filter((p) => p.bookmarkFolder === activeFolder) : next;
    });
    if (!folders.includes(folder)) setFolders((prev) => [...prev, folder]);
  }

  return (
    <div>
      <div className="p-4 sticky top-0 bg-mist/80 backdrop-blur-sm z-10">
        <h1 className="font-display italic font-semibold text-2xl flex items-center gap-2 mb-3">
          <IconBookmark size={19} className="text-aurora-soft" /> Salvos
        </h1>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveFolder(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              activeFolder === null ? "bg-gradient-to-r from-aurora to-aurora-teal text-mist" : "border border-mist-border text-hush hover:text-ghost"
            }`}
          >
            Todas
          </button>
          {folders.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFolder(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                activeFolder === f ? "bg-gradient-to-r from-aurora to-aurora-teal text-mist" : "border border-mist-border text-hush hover:text-ghost"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="p-4 text-hush">Carregando...</p>}
      {!loading && posts.length === 0 && (
        <div className="mx-4 p-8 text-center border border-dashed border-mist-border rounded-2xl">
          <p className="text-hush text-sm">Nada salvo aqui ainda. Toque no marcador em um post pra guardar.</p>
        </div>
      )}

      {posts.map((post) => (
        <div key={post.id} className="relative">
          <PostCard post={post} onChange={(updated) => handleChange(post.id, updated)} />
          <div className="absolute top-4 right-16 z-10" onClick={(e) => e.stopPropagation()}>
            <FolderPicker post={post} folders={folders} onMoved={handleMoved} />
          </div>
        </div>
      ))}
    </div>
  );
}
