import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api.js";
import PostCard from "../components/PostCard.jsx";

export default function Hashtag() {
  const { tag } = useParams();
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    setPosts(null);
    api.get(`/api/posts/hashtag/${tag}`).then(({ data }) => setPosts(data));
  }, [tag]);

  function handleChange(id, updated) {
    setPosts((prev) => {
      if (updated === null) return prev.filter((p) => p.id !== id);
      return prev.map((p) => (p.id === id ? updated : p));
    });
  }

  return (
    <div>
      <div className="p-4 sticky top-0 bg-mist/70 backdrop-blur-lg z-10">
        <h1 className="font-display italic font-semibold text-2xl">#{tag}</h1>
      </div>

      {posts === null && <p className="p-4 text-hush">Carregando...</p>}
      {posts?.length === 0 && (
        <div className="mx-4 p-8 text-center border border-dashed border-mist-border rounded-2xl">
          <p className="text-hush text-sm">Ninguém postou com #{tag} ainda.</p>
        </div>
      )}

      {posts?.map((post) => (
        <PostCard key={post.id} post={post} onChange={(updated) => handleChange(post.id, updated)} />
      ))}
    </div>
  );
}
