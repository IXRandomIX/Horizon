import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import { useAuth } from "./auth";

interface NotificationsContextType {
  globalInboxUnread: number;
  chatUnread: number;
  markGlobalInboxRead: () => void;
  markChatRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextType>({
  globalInboxUnread: 0,
  chatUnread: 0,
  markGlobalInboxRead: () => {},
  markChatRead: () => {},
});

function getLastSeen(key: string): string {
  return localStorage.getItem(key) || new Date(0).toISOString();
}

function setLastSeen(key: string, ts: string) {
  localStorage.setItem(key, ts);
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [globalInboxUnread, setGlobalInboxUnread] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCounts = async () => {
    if (!user) return;
    const globalSince = getLastSeen("horizon_global_inbox_seen");
    const chatSince = getLastSeen("horizon_chat_seen");

    try {
      const [gRes, cRes] = await Promise.all([
        fetch(`/api/global-inbox/after?since=${encodeURIComponent(globalSince)}`),
        fetch(`/api/messages/unread-count?since=${encodeURIComponent(chatSince)}&username=${user.username}`),
      ]);
      if (gRes.ok) {
        const gData = await gRes.json();
        setGlobalInboxUnread(Array.isArray(gData) ? gData.length : 0);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setChatUnread(typeof cData.count === "number" ? cData.count : 0);
      }
    } catch {
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchCounts();
    timerRef.current = setInterval(fetchCounts, 6000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user?.username]);

  const markGlobalInboxRead = () => {
    setLastSeen("horizon_global_inbox_seen", new Date().toISOString());
    setGlobalInboxUnread(0);
  };

  const markChatRead = () => {
    setLastSeen("horizon_chat_seen", new Date().toISOString());
    setChatUnread(0);
  };

  return (
    <NotificationsContext.Provider value={{ globalInboxUnread, chatUnread, markGlobalInboxRead, markChatRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
