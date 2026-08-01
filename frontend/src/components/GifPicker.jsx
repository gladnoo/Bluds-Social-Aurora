import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { IconSearch, IconX } from "./Icons.jsx";

const TENOR_KEY = import.meta.env.VITE_TENOR_API_KEY;

export default function GifPicker({ onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    loadGifs(query || "trending");
    return () => clearTimeout(debounceRef.current);
  }, []);

  async function loadGifs(q) {
    if (!TENOR_KEY) {
      setResults([]);
      return;
    }
    const endpoint = q === "trending" ? "featured" : "search";
    const url = `https://tenor.googleapis.com/v2/${endpoint}?key=${TENOR_KEY}&client_key=bluds_social&limit=15${
      endpoint === "search" ? `&q=${encodeURIComponent(q)}` : ""
    }`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    }
  }

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadGifs(value.trim() || "trending"), 350);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="absolute z-30 bottom-full mb-2 left-0 w-80 max-w-[90vw] bg-mist-surface backdrop-blur-lg border border-mist-border rounded-2xl shadow-card overflow-hidden"
    >
      <div className="flex items-center justify-between p-2 border-b border-mist-border">
        <div className="flex items-center gap-2 flex-1 bg-mist border border-mist-border rounded-full px-3 py-1.5">
          <IconSearch size={14} className="text-hush" />
          <input
            autoFocus
            value={query}
            onChange={handleChange}
            placeholder="Buscar GIF"
            className="flex-1 bg-transparent outline-none text-sm placeholder-hush"
          />
        </div>
        <button onClick={onClose} className="text-hush hover:text-ghost p-1.5">
          <IconX size={16} />
        </button>
      </div>

      <div className="h-64 overflow-y-auto p-2">
        {!TENOR_KEY && (
          <p className="text-hush text-xs p-3 text-center">
            GIFs desativados — falta configurar VITE_TENOR_API_KEY.
          </p>
        )}
        {TENOR_KEY && results === null && <p className="text-hush text-xs p-3 text-center">Carregando...</p>}
        {TENOR_KEY && results?.length === 0 && (
          <p className="text-hush text-xs p-3 text-center">Nenhum GIF encontrado.</p>
        )}
        <div className="grid grid-cols-2 gap-1.5">
          {results?.map((gif) => {
            const preview = gif.media_formats?.tinygif?.url;
            const full = gif.media_formats?.gif?.url;
            if (!preview || !full) return null;
            return (
              <button
                key={gif.id}
                type="button"
                onClick={() => onSelect(full)}
                className="rounded-lg overflow-hidden border border-mist-border hover:border-aurora/50 transition-colors"
              >
                <img src={preview} alt="" loading="lazy" className="w-full h-24 object-cover" />
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
