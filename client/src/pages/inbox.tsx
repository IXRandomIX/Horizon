import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth";
import { authFetch } from "@/context/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Check, X, Inbox, Zap, MinusCircle, Bell, CheckCheck } from "lucide-react";
import { ProfileModal } from "@/components/profile-modal";

export default function InboxPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [viewProfile, setViewProfile] = useState<string | null>(null);
  const [tab, setTab] = useState<"notifications" | "friend-requests">("notifications");

  const loadRequests = () => {
    if (!user) return;
    fetch(`/api/inbox?username=${user.username}`).then(r => r.json()).then(setRequests);
  };

  const loadNotifications = () => {
    if (!user) return;
    authFetch("/api/notifications").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setNotifications(data);
    });
  };

  useEffect(() => {
    loadRequests();
    loadNotifications();
  }, [user?.username]);

  const respond = async (from: string, status: "accepted" | "declined") => {
    if (!user) return;
    await fetch("/api/friends/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: user.username, status }),
    });
    toast({ title: status === "accepted" ? `You are now friends with @${from}!` : `Declined @${from}'s request.` });
    loadRequests();
  };

  const markRead = async (id: number) => {
    await authFetch(`/api/notifications/${id}/read`, { method: "POST" });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await authFetch("/api/notifications/read-all", { method: "POST" });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) return null;

  return (
    <div className="h-full flex flex-col bg-black text-white">
      <ProfileModal username={viewProfile} onClose={() => setViewProfile(null)} />

      <div className="border-b border-white/5 px-6 py-5">
        <div className="flex items-center gap-3">
          <Inbox className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-display font-black text-white tracking-widest uppercase">Inbox</h1>
          {unreadCount > 0 && (
            <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        <div className="flex gap-1 mt-4 p-1 bg-white/5 rounded-lg w-fit">
          <button
            onClick={() => setTab("notifications")}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${tab === "notifications" ? "bg-primary/20 text-primary border border-primary/30" : "text-white/40 hover:text-white/70"}`}
            data-testid="tab-notifications"
          >
            <Bell className="w-3.5 h-3.5" /> Notifications {unreadCount > 0 && <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{unreadCount}</span>}
          </button>
          <button
            onClick={() => setTab("friend-requests")}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${tab === "friend-requests" ? "bg-primary/20 text-primary border border-primary/30" : "text-white/40 hover:text-white/70"}`}
            data-testid="tab-friend-requests"
          >
            Friend Requests {requests.length > 0 && <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{requests.length}</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === "notifications" && (
          <div className="space-y-3 max-w-xl">
            {notifications.length > 0 && unreadCount > 0 && (
              <div className="flex justify-end mb-2">
                <Button size="sm" variant="ghost" onClick={markAllRead} className="text-white/40 hover:text-white gap-1.5 text-xs" data-testid="button-mark-all-read">
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </Button>
              </div>
            )}
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Bell className="w-12 h-12 text-white/10" />
                <p className="text-white/20 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif, i) => {
                const isXPAdd = notif.type === "xp_add";
                const isXPRemove = notif.type === "xp_remove";
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`border rounded-2xl p-4 flex items-start gap-4 transition-colors cursor-pointer ${notif.read ? "bg-white/[0.02] border-white/5" : "bg-white/[0.05] border-white/10"}`}
                    onClick={() => !notif.read && markRead(notif.id)}
                    data-testid={`notification-${notif.id}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isXPAdd ? "bg-green-500/15 border border-green-500/20" : isXPRemove ? "bg-red-500/15 border border-red-500/20" : "bg-primary/15 border border-primary/20"}`}>
                      {isXPAdd ? <Zap className="w-5 h-5 text-green-400" /> : isXPRemove ? <MinusCircle className="w-5 h-5 text-red-400" /> : <Bell className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-relaxed ${notif.read ? "text-white/50" : "text-white"}`}>{notif.message}</p>
                      <p className="text-white/25 text-xs mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {tab === "friend-requests" && (
          <div className="space-y-3 max-w-xl">
            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Inbox className="w-12 h-12 text-white/10" />
                <p className="text-white/20 text-sm">No pending friend requests</p>
              </div>
            ) : (
              requests.map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex items-center gap-4"
                >
                  <button
                    onClick={() => setViewProfile(req.fromUsername)}
                    className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl font-black text-white/40 hover:bg-white/15 transition-colors flex-shrink-0"
                  >
                    {req.fromUsername[0]?.toUpperCase()}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold">
                      <button onClick={() => setViewProfile(req.fromUsername)} className="hover:text-primary transition-colors">
                        @{req.fromUsername}
                      </button>
                    </p>
                    <p className="text-white/40 text-sm">sent you a friend request</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => respond(req.fromUsername, "accepted")}
                      className="bg-green-900/20 hover:bg-green-900/30 text-green-400 border border-green-800/30"
                      data-testid={`button-accept-${req.fromUsername}`}
                    >
                      <Check className="w-4 h-4 mr-1" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => respond(req.fromUsername, "declined")}
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/10 border border-red-900/20"
                      data-testid={`button-decline-${req.fromUsername}`}
                    >
                      <X className="w-4 h-4 mr-1" /> Decline
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
