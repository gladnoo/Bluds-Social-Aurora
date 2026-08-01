const BADGE_ICONS = {
  "primeiro-post": "✎",
  "cem-posts": "◆",
  popular: "◎",
  influente: "✦",
  querido: "♥",
  veterano: "⟡",
};

const BADGE_LABELS = {
  "primeiro-post": "Primeira postagem",
  "cem-posts": "Voz ativa (100 posts)",
  popular: "Popular (50+ seguidores)",
  influente: "Influente (200+ seguidores)",
  querido: "Querido (100+ curtidas)",
  veterano: "Veterano (6+ meses)",
};

export default function BadgeRow({ badges }) {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="flex gap-1.5 flex-wrap mt-2">
      {badges.map((b) => (
        <span
          key={b}
          title={BADGE_LABELS[b] || b}
          className="w-7 h-7 rounded-full bg-gradient-to-br from-aurora/25 to-aurora-teal/20 border border-aurora/30 flex items-center justify-center text-sm text-aurora-soft"
        >
          {BADGE_ICONS[b] || "★"}
        </span>
      ))}
    </div>
  );
}
