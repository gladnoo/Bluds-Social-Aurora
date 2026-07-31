import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import { IconSparkle, IconSearch, IconBookmark, IconUser, IconPlus, IconBell } from "./Icons.jsx";
import { useNotifications } from "../context/NotificationsContext.jsx";

export default function BottomNav() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const item = (path, Icon, badge = false) => (
    <Link
      to={path}
      className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
        isActive(path) ? "bg-gradient-to-br from-aurora/25 to-aurora-teal/25 text-aurora-soft" : "text-hush"
      }`}
    >
      <Icon size={18} />
      {badge && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-bloom" />}
    </Link>
  );

  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-20 flex items-center justify-center gap-3">
      <div className="flex items-center gap-0.5 bg-mist-surface backdrop-blur-lg border border-mist-border rounded-full px-1.5 py-2 shadow-card">
        {item("/", IconSparkle)}
        {item("/search", IconSearch)}
        {user && item("/notifications", IconBell, unreadCount > 0)}
        {user && item("/bookmarks", IconBookmark)}
        {item(user ? `/profile/${user.username}` : "/login", IconUser)}
      </div>

      {user && (
        <motion.div whileTap={{ scale: 0.88 }}>
          <Link
            to="/"
            className="w-14 h-14 rounded-full bg-gradient-to-br from-aurora to-aurora-teal flex items-center justify-center shadow-aurora text-mist flex-shrink-0"
            title="Postar"
          >
            <IconPlus size={24} />
          </Link>
        </motion.div>
      )}
    </nav>
  );
}
