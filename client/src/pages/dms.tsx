import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, ArrowLeft, User } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { ProfileModal } from "@/components/profile-modal";
import { motion } from "framer-motion";

export default function DMsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams<{ username?: string }>();
  const [, navigate] = useLocation();

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeUser, setActiveUser] = useState<string | null>(params.username || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [viewProfile, setViewProfile] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedMe, setBlockedMe] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (params.username) setActiveUser(params.username);
  }, [params.username]);

  const loadConversations = () => {
    if (!user) return;
    fetch(`/api/dm/conversations?username=${user.username}`).then(r => r.json()).then(setConversations);
  };

  const loadMessages = async () => {
    if (!user || !activeUser) return;
    const res = await fetch(`/api/dm/${activeUser}?me=${user.username}`);
    const data = await res.json();
    setMessages(data);
    fetch(`/api/dm/${activeUser}/read`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ me: user.username }) });
    setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 50);
  };

  const loadActiveProfile = () => {
    if (!activeUser) return;
    fetch(`/api/users/${activeUser}`).then(r => r.json()).then(setActiveProfile);
    if (user && activeUser !== user.username) {
      fetch(`/api/isblocked?blocker=${user.username}&blocked=${activeUser}`).then(r => r.json()).then(d => setIsBlocked(d.blocked));
      fetch(`/api/isblocked?blocker=${activeUser}&blocked=${user.username}`).then(r => r.json()).then(d => setBlockedMe(d.blocked));
    }
  };

  useEffect(() => { loadConversations(); }, [user?.username]);

  useEffect(() => {
    if (activeUser) {
      loadMessages();
      loadActiveProfile();
    }
  }, [activeUser]);

  useEffect(() => {
    if (!activeUser) return;
    const interval = setInterval(loadMessages, 6000);
    return () => clearInterval(interval);
  }, [activeUser, user?.username]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !user || !activeUser || sending) return;
    setSending(true);
    const res = await fetch(`/api/dm/${activeUser}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: user.username, content: newMsg.trim() }),
    });
    if (res.ok) {
      setNewMsg("");
      loadMessages();
      loadConversations();
    } else {
      const data = await res.json();
      toast({ title: data.message || "Failed to send", variant: "destructive" });
    }
    setSending(false);
  };

  if (!user) return null;

  return (
    <div className="h-full flex bg-black text-white overflow-hidden">
      <ProfileModal username={viewProfile} onClose={() => setViewProfile(null)} />

      {/* Conversations List */}
      <div className={`flex-shrink-0 w-64 border-r border-white/5 flex flex-col ${activeUser ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h2 className="font-display font-bold text-sm tracking-widest uppercase text-gradient-animated">DMs</h2>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.length === 0 && (
              <p className="text-white/20 text-xs text-center py-8">No conversations yet</p>
            )}
            {conversations.map((conv) => (
              <button
                key={conv.username}
                onClick={() => { setActiveUser(conv.username); navigate(`/dms/${conv.username}`); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${activeUser === conv.username ? "bg-primary/10 border border-primary/20" : "hover:bg-white/5 border border-transparent"}`}
                data-testid={`dm-conv-${conv.username}`}
              >
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-sm font-black text-white/40 flex-shrink-0 overflow-hidden">
                  {conv.avatar ? <img src={conv.avatar} alt={conv.username} className="w-full h-full object-cover" /> : conv.username[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold truncate ${activeUser === conv.username ? "text-primary" : "text-white"}`}>{conv.username}</p>
                  <p className="text-xs text-white/30 truncate">{conv.lastMessage?.content?.slice(0, 30)}{(conv.lastMessage?.content?.length || 0) > 30 ? "..." : ""}</p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Conversation */}
      {activeUser ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="border-b border-white/5 px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 text-white/50" onClick={() => { setActiveUser(null); navigate("/dms"); }}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <button
              onClick={() => setViewProfile(activeUser)}
              className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-sm font-black text-white/40 flex-shrink-0 overflow-hidden hover:opacity-80 transition-opacity"
            >
              {activeProfile?.avatar ? <img src={activeProfile.avatar} alt={activeUser} className="w-full h-full object-cover" /> : activeUser[0]?.toUpperCase()}
            </button>
            <button onClick={() => setViewProfile(activeUser)} className="text-white font-bold hover:text-primary transition-colors">
              @{activeUser}
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {isBlocked || blockedMe ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-white/20 text-sm">{isBlocked ? "You have blocked this user." : "You have been blocked by this user."}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <MessageSquare className="w-12 h-12 text-white/10" />
                <p className="text-white/20 text-sm">Start a conversation with @{activeUser}</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.fromUsername === user.username;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {!isMe && (
                      <button onClick={() => setViewProfile(msg.fromUsername)} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-black text-white/40 flex-shrink-0 hover:opacity-80 transition-opacity">
                        {msg.fromUsername[0]?.toUpperCase()}
                      </button>
                    )}
                    <div className={`max-w-xs lg:max-w-md ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-primary text-white rounded-br-sm" : "bg-white/[0.06] text-white border border-white/10 rounded-bl-sm"}`}>
                        {msg.content}
                      </div>
                      <p className="text-white/20 text-xs px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Input */}
          {!isBlocked && !blockedMe && (
            <div className="border-t border-white/5 p-4">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  placeholder={`Message @${activeUser}...`}
                  className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/20"
                  data-testid="input-dm-message"
                />
                <Button type="submit" disabled={!newMsg.trim() || sending} size="icon" className="bg-primary hover:bg-primary/90 h-10 w-10">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <p className="text-white/20">Select a conversation or start a new one</p>
          </div>
        </div>
      )}
    </div>
  );
}
