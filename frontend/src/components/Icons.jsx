// Conjunto de ícones vetoriais (SVG, stroke-based) usados no lugar de emojis.
// Todos aceitam className e size; herdam a cor do texto via currentColor.

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconSparkle({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5l2 2M15.5 15.5l2 2M6.5 17.5l2-2M15.5 8.5l2-2" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

export function IconUser({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c1.4-3.6 4.4-5.4 7.5-5.4s6.1 1.8 7.5 5.4" />
    </svg>
  );
}

export function IconSearch({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.6-4.6" />
    </svg>
  );
}

export function IconBookmark({ size = 20, className = "", filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} fill={filled ? "currentColor" : "none"}>
      <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.6L6 21V4.5Z" />
    </svg>
  );
}

export function IconHeart({ size = 20, className = "", filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} fill={filled ? "currentColor" : "none"}>
      <path d="M12 20.2s-7.6-4.6-9.9-9.2C.6 7.6 2.3 4.4 5.6 4c2-.3 3.7.6 4.9 2.2l.5.7.5-.7C12.7 4.6 14.4 3.7 16.4 4c3.3.4 5 3.6 3.5 7-2.3 4.6-9.9 9.2-9.9 9.2Z" />
    </svg>
  );
}

export function IconMessageCircle({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M21 11.5a8.4 8.4 0 0 1-8.7 8.4 8.7 8.7 0 0 1-3.4-.7L3 21l1.9-5a8.2 8.2 0 0 1-.9-3.7A8.4 8.4 0 0 1 12.7 3.5 8.4 8.4 0 0 1 21 11.5Z" />
    </svg>
  );
}

export function IconRepeat({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 7.5h11.5a3 3 0 0 1 3 3v2" />
      <path d="M7 4.5 4 7.5l3 3" />
      <path d="M20 16.5H8.5a3 3 0 0 1-3-3v-2" />
      <path d="M17 19.5l3-3-3-3" />
    </svg>
  );
}

export function IconQuote({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M8.5 8.5h-3a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1.8c-.1 2-1 3-2.6 3.6" />
      <path d="M18.5 8.5h-3a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1.8c-.1 2-1 3-2.6 3.6" />
    </svg>
  );
}

export function IconImage({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M20 15.5 15.8 12a1.6 1.6 0 0 0-2.1.1L6 19" />
    </svg>
  );
}

export function IconX({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconTrash({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4.5 6.5h15M9 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1.5M18 6.5 17.3 19a2 2 0 0 1-2 1.9H8.7a2 2 0 0 1-2-1.9L6 6.5" />
    </svg>
  );
}

export function IconArrowLeft({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function IconLogOut({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M9 4.5H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 19.5h3" />
      <path d="M15.5 16l4-4-4-4M19 12H9" />
    </svg>
  );
}

export function IconCamera({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1-2h6l1 2h2.5A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z" />
      <circle cx="12" cy="13" r="3.3" />
    </svg>
  );
}

export function IconPlus({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconUserPlus({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="10" cy="8" r="3.4" />
      <path d="M3.5 20c1.3-3.4 4.1-5.1 6.5-5.1s5.2 1.7 6.5 5.1" />
      <path d="M18.5 8v4.5M20.7 10.2h-4.4" />
    </svg>
  );
}

export function IconUserCheck({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="10" cy="8" r="3.4" />
      <path d="M3.5 20c1.3-3.4 4.1-5.1 6.5-5.1s5.2 1.7 6.5 5.1" />
      <path d="M16.3 10.3l1.7 1.7 3-3.3" />
    </svg>
  );
}

export function IconEdit({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M15.5 4.5 19.5 8.5 8 20H4v-4L15.5 4.5Z" />
    </svg>
  );
}

export function IconPin({ size = 20, className = "", filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} fill={filled ? "currentColor" : "none"}>
      <path d="M9 4.5h6l-.7 5.5L18 13v1.5H6V13l3.7-3Z" />
      <path d="M12 14.5V20" />
    </svg>
  );
}

export function IconShare({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="18" cy="5.5" r="2.3" />
      <circle cx="6" cy="12" r="2.3" />
      <circle cx="18" cy="18.5" r="2.3" />
      <path d="M8 10.8l8-4.3M8 13.2l8 4.3" />
    </svg>
  );
}

export function IconChart({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4.5 19.5v-6M10 19.5V8M15.5 19.5v-3M21 19.5V4.5" />
    </svg>
  );
}

export function IconCheck({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

export function IconTrendingUp({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 15.5l6-6 4 4 6-7" />
      <path d="M15.5 6h4.5v4.5" />
    </svg>
  );
}
export function IconSettings({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.5 7.5 0 0 0 0-2l2-1.5-2-3.5-2.4 1a7.6 7.6 0 0 0-1.7-1L15 3h-6l-.3 2.9a7.6 7.6 0 0 0-1.7 1l-2.4-1-2 3.5L4.6 11a7.5 7.5 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7.6 7.6 0 0 0 1.7 1L9 21h6l.3-2.9a7.6 7.6 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5Z" />
    </svg>
  );
}

export function IconLock({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function IconGlobe({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.2 2.4 3.3 5.3 3.3 8.5s-1.1 6.1-3.3 8.5c-2.2-2.4-3.3-5.3-3.3-8.5S9.8 5.9 12 3.5Z" />
    </svg>
  );
}

export function IconFlag({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6 20.5V4.5" />
      <path d="M6 5.5c1.8-1.3 3.6-1.3 5.4 0s3.6 1.3 5.4 0v8c-1.8 1.3-3.6 1.3-5.4 0s-3.6-1.3-5.4 0Z" />
    </svg>
  );
}

export function IconSmile({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 14c1 1.3 2.2 2 3.5 2s2.5-.7 3.5-2" />
      <path d="M8.7 9.8h.01M15.3 9.8h.01" />
    </svg>
  );
}

export function IconBell({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6 10.5a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14.5 6 10.5Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconVerified({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path
        d="M12 2.5l2.4 1.4 2.7-.4 1.2 2.4 2.4 1.2-.4 2.7 1.4 2.4-1.4 2.4.4 2.7-2.4 1.2-1.2 2.4-2.7-.4L12 21.5l-2.4-1.4-2.7.4-1.2-2.4-2.4-1.2.4-2.7L2.3 12l1.4-2.4-.4-2.7 2.4-1.2 1.2-2.4 2.7.4L12 2.5Z"
        fill="currentColor"
      />
      <path d="M8.5 12.2l2.2 2.2 4.3-4.7" stroke="#2b2740" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BlurLogoMark({ size = 22, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <defs>
        <linearGradient id="bluds-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#5eead4" />
        </linearGradient>
      </defs>
      <circle cx="9" cy="9" r="7.2" fill="url(#bluds-mark)" opacity="0.9" />
      <circle cx="15.5" cy="15.5" r="5" fill="url(#bluds-mark)" opacity="0.55" />
    </svg>
  );
}
