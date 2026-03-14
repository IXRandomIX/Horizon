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
  roles?: string[];
  roleColor?: string;
  font?: string;
  animation?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isVerifying: boolean;
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("horizon_session_token");
    if (!token) {
      setIsVerifying(false);
      return;
    }
    fetch("/api/auth/me", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(async res => {
        if (!res.ok) {
          localStorage.removeItem("horizon_session_token");
          localStorage.removeItem("horizon_user");
          localStorage.removeItem("horizon_chat_user");
          setUser(null);
        } else {
          const data = await res.json();
          setUser(data);
          localStorage.setItem("horizon_user", JSON.stringify(data));
          localStorage.setItem("horizon_chat_user", JSON.stringify(data));
        }
      })
      .catch(() => {
        const saved = localStorage.getItem("horizon_user");
        if (saved) {
          try { setUser(JSON.parse(saved)); } catch { setUser(null); }
        }
      })
      .finally(() => setIsVerifying(false));
  }, []);

  const login = async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    const { sessionToken, ...userData } = data;
    if (sessionToken) localStorage.setItem("horizon_session_token", sessionToken);
    const verifyRes = await fetch("/api/auth/me", {
      headers: { "Authorization": `Bearer ${sessionToken}` }
    });
    const verified = verifyRes.ok ? await verifyRes.json() : userData;
    setUser(verified);
    localStorage.setItem("horizon_user", JSON.stringify(verified));
    localStorage.setItem("horizon_chat_user", JSON.stringify(verified));
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
    if (sessionToken) localStorage.setItem("horizon_session_token", sessionToken);
    const verifyRes = await fetch("/api/auth/me", {
      headers: { "Authorization": `Bearer ${sessionToken}` }
    });
    const verified = verifyRes.ok ? await verifyRes.json() : userData;
    setUser(verified);
    localStorage.setItem("horizon_user", JSON.stringify(verified));
    localStorage.setItem("horizon_chat_user", JSON.stringify(verified));
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
    <AuthContext.Provider value={{ user, isVerifying, login, register, logout, updateUser, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
