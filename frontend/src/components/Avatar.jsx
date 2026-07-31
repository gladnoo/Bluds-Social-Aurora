import { IconUser } from "./Icons.jsx";
import { resolveImageUrl } from "../lib/media.js";

const SIZE_RING = {
  "w-5 h-5": "p-[1px]",
  "w-9 h-9": "p-[1.5px]",
  "w-10 h-10": "p-[2px]",
  "w-11 h-11": "p-[2px]",
  "w-20 h-20": "p-[3px]",
};

// Assinatura visual: todo avatar carrega um anel em degradê aurora (violeta -> verde-água).
export default function Avatar({ user, size = "w-10 h-10", ring = true }) {
  const src = resolveImageUrl(user?.avatarUrl);

  const inner = src ? (
    <img src={src} alt={user.displayName} className={`${size} rounded-full object-cover block`} />
  ) : (
    <div className={`${size} rounded-full bg-mist-surface flex items-center justify-center text-hush flex-shrink-0`}>
      <IconUser size={16} />
    </div>
  );

  if (!ring) return inner;

  const ringPad = SIZE_RING[size] || "p-[2px]";

  return (
    <div className={`${ringPad} rounded-full bg-gradient-to-br from-aurora to-aurora-teal flex-shrink-0`}>
      <div className="bg-mist rounded-full">{inner}</div>
    </div>
  );
}
