import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import { useAuth, getSessionToken } from "./auth";

interface NotificationsContextType {
  globalInboxUnread: number;
  chatUnread: number;
  changeLogsUnread: number;
  inboxUnread: number;
  markGlobalInboxRead: () => void;
  markChatRead: () => void;
  markChangeLogsRead: () => void;
  markInboxRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextType>({
  globalInboxUnread: 0,
  chatUnread: 0,
  changeLogsUnread: 0,
  inboxUnread: 0,
  markGlobalInboxRead: () => {},
  markChatRead: () => {},
  markChangeLogsRead: () => {},
  markInboxRead: () => {},
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
  const [changeLogsUnread, setChangeLogsUnread] = useState(0);
  const [inboxUnread, setInboxUnread] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCounts = async () => {
    if (!user) return;
    const token = getSessionToken();
    const globalSince = getLastSeen("horizon_global_inbox_seen");
    const chatSince = getLastSeen("horizon_chat_seen");
    const changeLogSince = getLastSeen("horizon_changelog_seen");

    try {
      const [gRes, cRes, clRes, nRes] = await Promise.all([
        fetch(`/api/global-inbox/after?since=${encodeURIComponent(globalSince)}`),
        fetch(`/api/messages/unread-count?since=${encodeURIComponent(chatSince)}&username=${user.username}`),
        fetch(`/api/changelog/after?since=${encodeURIComponent(changeLogSince)}`),
        token ? fetch("/api/notifications/unread-count", { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve(null),
      ]);
      if (gRes.ok) {
        const gData = await gRes.json();
        setGlobalInboxUnread(Array.isArray(gData) ? gData.length : 0);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setChatUnread(typeof cData.count === "number" ? cData.count : 0);
      }
      if (clRes.ok) {
        const clData = await clRes.json();
        setChangeLogsUnread(Array.isArray(clData) ? clData.length : 0);
      }
      if (nRes && nRes.ok) {
        const nData = await nRes.json();
        setInboxUnread(typeof nData.count === "number" ? nData.count : 0);
      }
    } catch {
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchCounts();
    timerRef.current = setInterval(fetchCounts, 8000);
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

  const markChangeLogsRead = () => {
    setLastSeen("horizon_changelog_seen", new Date().toISOString());
    setChangeLogsUnread(0);
  };

  const markInboxRead = () => {
    setInboxUnread(0);
  };

  return (
    <NotificationsContext.Provider value={{ globalInboxUnread, chatUnread, changeLogsUnread, inboxUnread, markGlobalInboxRead, markChatRead, markChangeLogsRead, markInboxRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
