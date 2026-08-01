import { useEffect, useRef, useState } from "react";
import api from "../api.js";

// Detecta quando o usuário está digitando "@algo" na posição do cursor
// e busca sugestões de usuário pra autocompletar.
export function useMentionAutocomplete(content, setContent, textareaRef) {
  const [query, setQuery] = useState(null); // null = não tá mencionando ninguém agora
  const [suggestions, setSuggestions] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    const cursor = el?.selectionStart ?? content.length;
    const textBeforeCursor = content.slice(0, cursor);
    const match = textBeforeCursor.match(/(^|\s)@(\w*)$/);
    setQuery(match ? match[2] : null);
  }, [content]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query === null || query.length === 0) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const { data } = await api.get(`/api/users/search?q=${encodeURIComponent(query)}`);
      setSuggestions(data.slice(0, 5));
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function selectMention(username) {
    const el = textareaRef.current;
    const cursor = el?.selectionStart ?? content.length;
    const textBeforeCursor = content.slice(0, cursor);
    const match = textBeforeCursor.match(/(^|\s)@(\w*)$/);
    if (!match) return;

    const atStart = match.index + match[1].length;
    const before = content.slice(0, atStart);
    const after = content.slice(cursor);
    const inserted = `@${username} `;
    const next = before + inserted + after;

    setContent(next);
    setQuery(null);
    setSuggestions([]);

    requestAnimationFrame(() => {
      el?.focus();
      const pos = before.length + inserted.length;
      if (el) el.selectionStart = el.selectionEnd = pos;
    });
  }

  return { suggestions, showDropdown: query !== null && suggestions.length > 0, selectMention };
}
