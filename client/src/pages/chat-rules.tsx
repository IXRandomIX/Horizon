import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Save, X, Plus, Trash2, BookOpen } from "lucide-react";
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

type Section = {
  id: string;
  title: string;
  content: string;
};

const ADMIN = "RandomIX";

export default function ChatRulesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isOwner = user?.username === ADMIN;

  const [sections, setSections] = useState<Section[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    localStorage.setItem("horizon_visited_rules", "true");
    fetchPage();
  }, []);

  const fetchPage = async () => {
    try {
      const res = await fetch("/api/pages/chat-rules");
      if (res.ok) {
        const data = await res.json();
        try {
          setSections(JSON.parse(data.content || "[]"));
        } catch {
          setSections([]);
        }
      }
    } catch {}
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("horizon_session_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let res = await fetch("/api/pages/chat-rules", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ name: "chat-rules", content: JSON.stringify(sections) }),
      });
      if (res.status === 404) {
        res = await fetch("/api/pages", {
          method: "POST",
          headers,
          body: JSON.stringify({ name: "chat-rules", content: JSON.stringify(sections) }),
        });
      }
      if (res.ok) {
        toast({ title: "Chat rules saved" });
        setIsEditing(false);
        fetchPage();
      }
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  const addSection = () => {
    setSections([...sections, { id: Date.now().toString(), title: "", content: "" }]);
  };

  const updateSection = (id: string, field: "title" | "content", value: string) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const deleteSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden relative">
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
              <Button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-primary hover:bg-primary/90 gap-2 shrink-0"
              >
                {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 md:p-8 mb-8"
          >
            <ol className="space-y-3">
              {PERMANENT_RULES.map((rule, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-black text-primary">
                    {i + 1}
                  </span>
                  <p className="text-white/80 text-sm md:text-base leading-relaxed pt-0.5">{rule}</p>
                </li>
              ))}
            </ol>
          </motion.div>

          {isEditing && isOwner ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 bg-white/[0.03] border border-white/10 rounded-2xl p-6 md:p-8"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-white/70 text-sm font-bold">Additional Sections</label>
                  <Button onClick={addSection} variant="outline" size="sm" className="gap-2 border-white/10 hover:bg-white/10">
                    <Plus className="w-4 h-4" /> Add Section
                  </Button>
                </div>
                {sections.map((section) => (
                  <div key={section.id} className="space-y-2 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Section title"
                        value={section.title}
                        onChange={(e) => updateSection(section.id, "title", e.target.value)}
                        className="bg-white/5 border-white/10 flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSection(section.id)}
                        className="text-red-500 hover:text-red-400 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <textarea
                      placeholder="Section content"
                      value={section.content}
                      onChange={(e) => updateSection(section.id, "content", e.target.value)}
                      className="w-full h-28 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 text-sm resize-none"
                    />
                  </div>
                ))}
                {sections.length === 0 && (
                  <p className="text-center py-6 text-white/40 text-sm">No additional sections. Click "Add Section" to add more content.</p>
                )}
              </div>
              <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90 gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </Button>
            </motion.div>
          ) : (
            sections.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                {sections.map((section) => (
                  <div key={section.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                    {section.title && (
                      <h2 className="text-white font-bold text-lg mb-3 text-gradient-animated">{section.title}</h2>
                    )}
                    <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{section.content}</p>
                  </div>
                ))}
              </motion.div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
