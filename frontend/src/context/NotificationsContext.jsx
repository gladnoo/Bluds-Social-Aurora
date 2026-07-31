import { createContext, useContext, useEffect, useRef, useState } from "react";
import api from "../api.js";
import { useAuth } from "./AuthContext.jsx";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  async function refreshUnread() {
    if (!user) return;
    try {
      const { data } = await api.get("/api/notifications/unread-count");
      setUnreadCount(data.count);
    } catch {
      // silencioso — não é crítico se essa checagem falhar ocasionalmente
    }
  }

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    refreshUnread();
    intervalRef.current = setInterval(refreshUnread, 30000);
    return () => clearInterval(intervalRef.current);
  }, [user?.id]);

  function clearUnread() {
    setUnreadCount(0);
  }

  return (
    <NotificationsContext.Provider value={{ unreadCount, refreshUnread, clearUnread }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
