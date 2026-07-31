import { createContext, useContext, useEffect, useState } from "react";
import api from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("bluds_user");
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  function persist(token, user) {
    localStorage.setItem("bluds_token", token);
    localStorage.setItem("bluds_user", JSON.stringify(user));
    setUser(user);
  }

  async function register(payload) {
    const { data } = await api.post("/api/auth/register", payload);
    persist(data.token, data.user);
    return data.user;
  }

  async function login(payload) {
    const { data } = await api.post("/api/auth/login", payload);
    persist(data.token, data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("bluds_token");
    localStorage.removeItem("bluds_user");
    setUser(null);
  }

  function updateUser(newUserData) {
    setUser(newUserData);
    localStorage.setItem("bluds_user", JSON.stringify(newUserData));
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
