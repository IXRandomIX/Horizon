import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/auth";
import { useNotifications } from "@/context/notifications";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Inbox, PenLine, X, Send, Loader2, Crown, Edit2, Trash2, Save } from "lucide-react";

const ADMIN = "RandomIX";

export default function GlobalInboxPage() {
  const { user } = useAuth();
  const { markGlobalInboxRead } = useNotifications();
  const { toast } = useToast();
  const isOwner = user?.username === ADMIN;

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("horizon_session_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const load = async () => {
    const res = await fetch("/api/global-inbox");
    if (res.ok) {
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    markGlobalInboxRead();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!draft.trim() || !user) return;
    setSending(true);
    const res = await fetch("/api/global-inbox", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ content: draft.trim() }),
    });
    if (res.ok) {
      setDraft("");
      setComposing(false);
      toast({ title: "Global message sent!" });
      await load();
    } else {
      const data = await res.json();
      toast({ title: data.message || "Failed to send", variant: "destructive" });
    }
    setSending(false);
  };

  const handleEdit = async (id: number) => {
    if (!editDraft.trim()) return;
    setSavingEdit(true);
    const res = await fetch(`/api/global-inbox/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ content: editDraft.trim() }),
    });
    if (res.ok) {
      toast({ title: "Message updated!" });
      setEditingId(null);
      setEditDraft("");
      await load();
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: data.message || "Failed to update", variant: "destructive" });
    }
    setSavingEdit(false);
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/global-inbox/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      toast({ title: "Message deleted" });
      await load();
    }
  };

  const startEdit = (msg: any) => {
    setEditingId(msg.id);
    setEditDraft(msg.content);
    setComposing(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend();
    if (e.key === "Escape") setComposing(false);
  };

  const fmt = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) + " at " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!user) return null;

  return (
    <div className="h-full flex flex-col bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-5 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <Inbox className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-display font-black text-white tracking-widest uppercase">Global Inbox</h1>
          </div>
          <p className="text-white/30 text-sm mt-1">
            {isOwner ? "Only you can post here — everyone sees these messages." : "Official messages from Horizon's owner."}
          </p>
        </div>
        {isOwner && (
          <Button
            onClick={() => { setComposing(!composing); cancelEdit(); }}
            data-testid="button-write-global"
            className={`gap-2 ${composing ? "bg-white/10 text-white border border-white/10" : "bg-primary hover:bg-primary/90 text-white"}`}
          >
            {composing ? <><X className="w-4 h-4" /> Cancel</> : <><PenLine className="w-4 h-4" /> Write Global Message</>}
          </Button>
        )}
      </div>

      {/* Compose box (owner only) */}
      {isOwner && composing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-white/5 px-6 py-4 bg-white/[0.02] shrink-0"
        >
          <div className="max-w-3xl">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Crown className="w-3 h-3 text-primary" /> Write a global message — all users will see this
            </p>
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write your message to everyone... (Ctrl+Enter to send)"
              className="w-full h-32 bg-black/60 border border-white/10 rounded-xl p-4 text-white text-sm resize-none focus:outline-none focus:border-primary/50 placeholder:text-white/20"
              data-testid="input-global-message"
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-white/20 text-xs">{draft.length} characters</p>
              <Button
                onClick={handleSend}
                disabled={sending || !draft.trim()}
                className="bg-primary hover:bg-primary/90 text-white gap-2"
                data-testid="button-send-global"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? "Sending..." : "Send to Everyone"}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-3xl">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Inbox className="w-14 h-14 text-white/10" />
              <p className="text-white/20 text-sm">No messages yet.</p>
              {isOwner && (
                <p className="text-white/10 text-xs">Click "Write Global Message" to send the first one.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  className="group bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:border-white/15 transition-colors relative"
                >
                  {/* Author bar */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <Crown className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-bold text-primary">@{msg.author}</span>
                    <span className="text-white/20 text-xs ml-auto">{fmt(msg.createdAt)}</span>

                    {/* Admin action buttons */}
                    {isOwner && editingId !== msg.id && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-white/40 hover:text-white"
                          onClick={() => startEdit(msg)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500/50 hover:text-red-400"
                          onClick={() => handleDelete(msg.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Content or Edit form */}
                  <AnimatePresence mode="wait">
                    {editingId === msg.id ? (
                      <motion.div
                        key="edit"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <textarea
                          autoFocus
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          className="w-full h-24 bg-black/60 border border-primary/30 rounded-xl p-3 text-white text-sm resize-none focus:outline-none focus:border-primary/60 placeholder:text-white/20"
                        />
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() => handleEdit(msg.id)}
                            disabled={savingEdit || !editDraft.trim()}
                            className="bg-primary hover:bg-primary/90 text-white gap-1.5"
                          >
                            {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEdit}
                            className="text-white/50 hover:text-white gap-1.5"
                          >
                            <X className="w-3.5 h-3.5" /> Cancel
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.p
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-white/85 leading-relaxed whitespace-pre-wrap text-sm"
                      >
                        {msg.content}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
