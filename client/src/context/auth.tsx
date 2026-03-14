import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface AuthUser {
  username: string;
  role: string;
  isAdmin: boolean;
  displayName?: string;
  displayFont?: string;
  avatar?: string;
  bio?: string;
  banner?: string;
  bannerColor?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function getSessionToken(): string | null {
  return localStorage.getItem("horizon_session_token");
}

export function authFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  const token = getSessionToken();
  const existingHeaders = (opts.headers || {}) as Record<string, string>;
  const headers: Record<string, string> = { ...existingHeaders };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(url, { ...opts, headers });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem("horizon_user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const login = async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    const { sessionToken, ...userData } = data;
    setUser(userData);
    localStorage.setItem("horizon_user", JSON.stringify(userData));
    localStorage.setItem("horizon_chat_user", JSON.stringify(userData));
    if (sessionToken) localStorage.setItem("horizon_session_token", sessionToken);
  };

  const register = async (username: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");
    const { sessionToken, ...userData } = data;
    setUser(userData);
    localStorage.setItem("horizon_user", JSON.stringify(userData));
    localStorage.setItem("horizon_chat_user", JSON.stringify(userData));
    if (sessionToken) localStorage.setItem("horizon_session_token", sessionToken);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("horizon_user");
    localStorage.removeItem("horizon_chat_user");
    localStorage.removeItem("horizon_session_token");
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem("horizon_user", JSON.stringify(updated));
      localStorage.setItem("horizon_chat_user", JSON.stringify(updated));
      return updated;
    });
  };

  const getToken = () => getSessionToken();

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
