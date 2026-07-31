import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";
import { BlurLogoMark, IconSparkle, IconSearch, IconBookmark, IconUser, IconLogOut, IconSettings, IconBell } from "./Icons.jsx";
import { useNotifications } from "../context/NotificationsContext.jsx";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const linkClass = (active) =>
    `flex items-center gap-3 rounded-full px-4 py-3 transition-colors ${
      active ? "bg-mist-surface text-ghost" : "text-hush hover:bg-mist-surface hover:text-ghost"
    }`;

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 p-4">
      <Link to="/" className="flex items-center gap-2 mb-8 px-2">
        <BlurLogoMark />
        <span className="font-display italic font-semibold text-2xl text-ghost">Bluds</span>
      </Link>

      <nav className="flex flex-col gap-1 text-base flex-1">
        <Link to="/" className={linkClass(isActive("/"))}>
          <IconSparkle size={20} />
          <span className="font-medium">Aurora</span>
        </Link>
        <Link to="/search" className={linkClass(isActive("/search"))}>
          <IconSearch size={20} />
          <span className="font-medium">Buscar</span>
        </Link>
        {user && (
          <>
            <Link to="/notifications" className={linkClass(isActive("/notifications"))}>
              <span className="relative">
                <IconBell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-bloom" />
                )}
              </span>
              <span className="font-medium">Notificações</span>
            </Link>
            <Link to="/bookmarks" className={linkClass(isActive("/bookmarks"))}>
              <IconBookmark size={20} />
              <span className="font-medium">Salvos</span>
            </Link>
            <Link to={`/profile/${user.username}`} className={linkClass(location.pathname === `/profile/${user.username}`)}>
              <IconUser size={20} />
              <span className="font-medium">Perfil</span>
            </Link>
            <Link to="/settings" className={linkClass(isActive("/settings"))}>
              <IconSettings size={20} />
              <span className="font-medium">Configurações</span>
            </Link>
          </>
        )}
      </nav>

      {user ? (
        <div className="flex items-center gap-2 p-2 rounded-2xl hover:bg-mist-surface transition-colors">
          <Avatar user={user} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate text-sm">{user.displayName}</p>
            <p className="text-hush text-xs truncate">@{user.username}</p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="text-hush hover:text-bloom p-1.5 rounded-full transition-colors"
            title="Sair"
          >
            <IconLogOut size={18} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Link
            to="/login"
            className="text-center border border-mist-border rounded-full py-2.5 hover:bg-mist-surface transition-colors font-medium"
          >
            Entrar
          </Link>
          <Link
            to="/register"
            className="text-center bg-gradient-to-r from-aurora to-aurora-teal text-mist rounded-full py-2.5 transition-opacity hover:opacity-90 font-semibold"
          >
            Criar conta
          </Link>
        </div>
      )}
    </aside>
  );
}
