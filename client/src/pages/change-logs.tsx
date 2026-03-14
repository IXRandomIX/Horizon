import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/auth";
import { useNotifications } from "@/context/notifications";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScrollText, Plus, Trash2, Edit2, Save, X, Loader2, ImageIcon } from "lucide-react";

const ADMIN = "RandomIX";

type Entry = {
  id: number;
  content: string;
  imageUrl: string;
  createdAt: string;
};

export default function ChangeLogsPage() {
  const { user } = useAuth();
  const { markChangeLogsRead } = useNotifications();
  const { toast } = useToast();
  const isOwner = user?.username === ADMIN;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [draftImage, setDraftImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const res = await fetch("/api/changelog");
    if (res.ok) {
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    markChangeLogsRead();
    const interval = setInterval(load, 6000);
    return () => clearInterval(interval);
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("horizon_session_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const handleUploadImage = async (file: File) => {
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("horizon_session_token");
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: token ? { "Authorization": `Bearer ${token}` } : {},
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      setDraftImage(data.url);
    } else {
      toast({ title: "Failed to upload image", variant: "destructive" });
    }
    setUploadingImage(false);
  };

  const handleAdd = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    const res = await fetch("/api/changelog", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ content: draft.trim(), imageUrl: draftImage }),
    });
    if (res.ok) {
      toast({ title: "Change log entry added!" });
      setDraft("");
      setDraftImage("");
      setAdding(false);
      await load();
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: data.message || "Failed to add entry", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleEdit = async (id: number) => {
    if (!draft.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/changelog/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ content: draft.trim(), imageUrl: draftImage }),
    });
    if (res.ok) {
      toast({ title: "Entry updated!" });
      setEditingId(null);
      setDraft("");
      setDraftImage("");
      await load();
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: data.message || "Failed to update", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/changelog/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      toast({ title: "Entry deleted" });
      await load();
    }
  };

  const startEdit = (entry: Entry) => {
    setEditingId(entry.id);
    setDraft(entry.content);
    setDraftImage(entry.imageUrl || "");
    setAdding(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft("");
    setDraftImage("");
  };

  const startAdd = () => {
    setAdding(true);
    setEditingId(null);
    setDraft("");
    setDraftImage("");
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
            <ScrollText className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-display font-black text-white tracking-widest uppercase">Change Logs</h1>
          </div>
          <p className="text-white/30 text-sm mt-1">
            {isOwner ? "Only you can post here — everyone sees these updates." : "Latest updates and changes from Horizon's owner."}
          </p>
        </div>
        {isOwner && !adding && editingId === null && (
          <Button
            onClick={startAdd}
            className="bg-primary hover:bg-primary/90 text-white gap-2"
          >
            <Plus className="w-4 h-4" /> Add Entry
          </Button>
        )}
      </div>

      {/* Add / Edit Form (owner only) */}
      <AnimatePresence>
        {isOwner && (adding || editingId !== null) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-b border-white/5 px-6 py-4 bg-white/[0.02] shrink-0"
          >
            <div className="max-w-3xl mx-auto">
              <p className="text-xs text-white/30 uppercase tracking-widest mb-3">
                {editingId !== null ? "Edit Entry" : "New Change Log Entry"}
              </p>
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write your change log entry... (centered for all users)"
                className="w-full h-32 bg-black/60 border border-white/10 rounded-xl p-4 text-white text-sm resize-none focus:outline-none focus:border-primary/50 placeholder:text-white/20"
              />

              {/* Image URL or upload */}
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={draftImage}
                    onChange={(e) => setDraftImage(e.target.value)}
                    placeholder="Image / GIF URL (optional)..."
                    className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50 placeholder:text-white/20"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-white/10 text-white/60 hover:text-white shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    Upload
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadImage(file);
                    }}
                  />
                </div>
                {draftImage && (
                  <div className="relative inline-block">
                    <img src={draftImage} alt="Preview" className="max-h-32 rounded-lg border border-white/10 object-contain" />
                    <button
                      onClick={() => setDraftImage("")}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mt-3">
                <Button
                  onClick={editingId !== null ? () => handleEdit(editingId) : handleAdd}
                  disabled={saving || !draft.trim()}
                  className="bg-primary hover:bg-primary/90 text-white gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving..." : "Save Entry"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={editingId !== null ? cancelEdit : () => setAdding(false)}
                  className="text-white/50 hover:text-white gap-2"
                >
                  <X className="w-4 h-4" /> Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entries */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-3xl mx-auto w-full">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <ScrollText className="w-14 h-14 text-white/10" />
              <p className="text-white/20 text-sm">No change logs yet.</p>
              {isOwner && (
                <p className="text-white/10 text-xs">Click "Add Entry" to post the first one.</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {entries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  className="group bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-white/15 transition-colors text-center relative"
                >
                  {isOwner && (
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/40 hover:text-white"
                        onClick={() => startEdit(entry)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500/50 hover:text-red-400"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}

                  <p className="text-white/30 text-xs mb-4 tracking-wide">{fmt(entry.createdAt)}</p>

                  {entry.imageUrl && (
                    <div className="flex justify-center mb-4">
                      <img
                        src={entry.imageUrl}
                        alt=""
                        className="max-w-full max-h-64 rounded-xl border border-white/10 object-contain"
                      />
                    </div>
                  )}

                  <p className="text-white/85 leading-relaxed whitespace-pre-wrap text-sm text-center mx-auto max-w-2xl">
                    {entry.content}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
