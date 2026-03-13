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
}

const AuthContext = createContext<AuthContextType | null>(null);

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
    setUser(data);
    localStorage.setItem("horizon_user", JSON.stringify(data));
    localStorage.setItem("horizon_chat_user", JSON.stringify(data));
  };

  const register = async (username: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");
    setUser(data);
    localStorage.setItem("horizon_user", JSON.stringify(data));
    localStorage.setItem("horizon_chat_user", JSON.stringify(data));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("horizon_user");
    localStorage.removeItem("horizon_chat_user");
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

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
