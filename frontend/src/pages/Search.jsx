import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";
import Avatar from "../components/Avatar.jsx";
import { IconSearch, IconVerified } from "../components/Icons.jsx";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const debounceRef = useRef(null);

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setBusy(true);
      const { data } = await api.get(`/api/users/search?q=${encodeURIComponent(value)}`);
      setResults(data);
      setBusy(false);
    }, 350);
  }

  return (
    <div>
      <div className="p-4 sticky top-0 bg-mist/70 backdrop-blur-lg z-10">
        <h1 className="font-display italic font-semibold text-2xl mb-3">Buscar</h1>
        <div className="flex items-center gap-2 bg-mist-surface border border-mist-border rounded-full px-4 py-2.5">
          <IconSearch size={18} className="text-hush" />
          <input
            value={query}
            onChange={handleChange}
            placeholder="Buscar por nome ou @usuário"
            className="flex-1 bg-transparent outline-none placeholder-hush"
          />
        </div>
      </div>

      {busy && <p className="p-4 text-hush text-sm">Buscando...</p>}

      {results?.length === 0 && (
        <div className="mx-4 p-8 text-center border border-dashed border-mist-border rounded-2xl">
          <p className="text-hush text-sm">Ninguém encontrado com esse nome.</p>
        </div>
      )}

      <div className="px-2">
        {results?.map((u) => (
          <Link
            key={u.id}
            to={`/profile/${u.username}`}
            className="flex items-center gap-3 p-3 mx-2 rounded-2xl hover:bg-mist-surface transition-colors"
          >
            <Avatar user={u} />
            <div className="min-w-0">
              <p className="font-semibold truncate flex items-center gap-1">
                {u.displayName}
                {u.isVerified && <IconVerified size={13} className="text-aurora-soft flex-shrink-0" />}
              </p>
              <p className="text-hush text-sm truncate">@{u.username}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
