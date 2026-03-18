import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Save, X, Plus, Trash2, Lock, BookOpen } from "lucide-react";
import { useAuth } from "@/context/auth";

const PERMANENT_RULES = [
  "No NSFW",
  "No harassment",
  "No homophobia",
  "No discrimination",
  "No saying the N-Word unless I let you or something",
  "No toxicity",
  "No hate speech",
  "No racism but you can make some jokes of it if you want only if it doesn't offend them",
  "No being mr. timmy tuff knuckles",
  "Be cool because yes",
  "No spamming",
  "This isn't a rule but if you want you can ask me what I could add to this website in the future or any game ideas",
];

const ADMIN = "RandomIX";

export default function ChatRulesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isOwner = user?.username === ADMIN;

  const [customRules, setCustomRules] = useState<string[]>([]);
  const [editingRules, setEditingRules] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    localStorage.setItem("horizon_visited_rules", "true");
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch("/api/pages/chat-rules");
      if (res.ok) {
        const data = await res.json();
        try {
          const parsed = JSON.parse(data.content || "[]");
          setCustomRules(Array.isArray(parsed) ? parsed : []);
        } catch {
          setCustomRules([]);
        }
      }
    } catch {}
  };

  const startEditing = () => {
    setEditingRules([...customRules]);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditingRules([]);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("horizon_session_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const body = JSON.stringify({ name: "chat-rules", content: JSON.stringify(editingRules) });

      let res = await fetch("/api/pages/chat-rules", {
        method: "PATCH",
        headers,
        body,
      });
      if (res.status === 404) {
        res = await fetch("/api/pages", {
          method: "POST",
          headers,
          body,
        });
      }
      if (res.ok) {
        toast({ title: "Rules saved" });
        setCustomRules([...editingRules]);
        setIsEditing(false);
      }
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  const addRule = () => setEditingRules([...editingRules, ""]);

  const updateRule = (index: number, value: string) => {
    const updated = [...editingRules];
    updated[index] = value;
    setEditingRules(updated);
  };

  const deleteRule = (index: number) => {
    setEditingRules(editingRules.filter((_, i) => i !== index));
  };

  const allRules = isEditing
    ? [...PERMANENT_RULES, ...editingRules]
    : [...PERMANENT_RULES, ...customRules];

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex items-start justify-between mb-10 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl md:text-5xl font-black text-gradient-animated tracking-widest uppercase">
                  WELCOME TO CHAT RULES
                </h1>
                <p className="text-white/30 text-xs tracking-widest uppercase mt-1">Read before chatting</p>
              </div>
            </div>
            {isOwner && (
              <div className="flex gap-2 shrink-0">
                {isEditing ? (
                  <>
                    <Button onClick={cancelEditing} variant="outline" className="border-white/10 hover:bg-white/10 gap-2">
                      <X className="w-4 h-4" /> Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 gap-2">
                      <Save className="w-4 h-4" /> Save
                    </Button>
                  </>
                ) : (
                  <Button onClick={startEditing} className="bg-primary hover:bg-primary/90 gap-2">
                    <Edit2 className="w-4 h-4" /> Edit Rules
                  </Button>
                )}
              </div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 md:p-8"
          >
            <ol className="space-y-3">
              {PERMANENT_RULES.map((rule, i) => (
                <li key={`perm-${i}`} className="flex gap-4 items-start">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-black text-primary">
                    {i + 1}
                  </span>
                  <div className="flex-1 flex items-start justify-between gap-2 pt-0.5">
                    <p className="text-white/80 text-sm md:text-base leading-relaxed">{rule}</p>
                    {isEditing && (
                      <Lock className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" />
                    )}
                  </div>
                </li>
              ))}

              {isEditing
                ? editingRules.map((rule, i) => (
                    <li key={`edit-${i}`} className="flex gap-4 items-start">
                      <span className="shrink-0 w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-black text-white/60">
                        {PERMANENT_RULES.length + i + 1}
                      </span>
                      <div className="flex-1 flex items-center gap-2">
                        <textarea
                          value={rule}
                          onChange={(e) => updateRule(i, e.target.value)}
                          placeholder="Enter rule text..."
                          rows={2}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 text-sm resize-none"
                        />
                        <button
                          onClick={() => deleteRule(i)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))
                : customRules.map((rule, i) => (
                    <li key={`custom-${i}`} className="flex gap-4 items-start">
                      <span className="shrink-0 w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-black text-primary">
                        {PERMANENT_RULES.length + i + 1}
                      </span>
                      <p className="text-white/80 text-sm md:text-base leading-relaxed pt-0.5">{rule}</p>
                    </li>
                  ))}
            </ol>

            {isEditing && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <Button
                  onClick={addRule}
                  variant="outline"
                  className="w-full border-dashed border-white/10 hover:bg-white/5 hover:border-primary/30 text-white/50 hover:text-white gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Rule
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
