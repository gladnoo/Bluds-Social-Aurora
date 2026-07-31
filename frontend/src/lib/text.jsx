// Detecta #hashtags e @menções num texto e devolve nós React com links clicáveis.
import { Link } from "react-router-dom";

export function renderContentWithHashtags(content) {
  if (!content) return null;
  const parts = content.split(/(#\w+|@\w+)/g);
  return parts.map((part, i) => {
    if (/^#\w+$/.test(part)) {
      const tag = part.slice(1);
      return (
        <Link key={i} to={`/hashtag/${tag}`} onClick={(e) => e.stopPropagation()} className="text-aurora-soft hover:underline">
          {part}
        </Link>
      );
    }
    if (/^@\w+$/.test(part)) {
      const username = part.slice(1);
      return (
        <Link key={i} to={`/profile/${username}`} onClick={(e) => e.stopPropagation()} className="text-aurora-teal hover:underline">
          {part}
        </Link>
      );
    }
    return part;
  });
}
