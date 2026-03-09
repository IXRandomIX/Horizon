import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Save, X, Plus, Trash2 } from "lucide-react";

type Section = {
  id: string;
  title: string;
  content: string;
};

export default function Partners() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("Playfair Display");
  const [animation, setAnimation] = useState("Electric Magenta to Deep Blue");
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("horizon_chat_user");
    if (saved) setUser(JSON.parse(saved));
    fetchPage();
  }, []);

  const fetchPage = async () => {
    try {
      const res = await fetch("/api/pages/partners");
      if (res.ok) {
        const data = await res.json();
        try {
          setSections(JSON.parse(data.content || '[]'));
        } catch {
          setSections([]);
        }
        setFontSize(data.fontSize);
        setFontFamily(data.fontFamily);
        setAnimation(data.animation);
      }
    } catch (err) {
      console.error("Failed to fetch page");
    }
  };

  const handleSave = async () => {
    try {
      let res = await fetch("/api/pages/partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "partners", content: JSON.stringify(sections), fontSize, fontFamily, animation }),
      });
      if (res.status === 404) {
        res = await fetch("/api/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "partners", content: JSON.stringify(sections), fontSize, fontFamily, animation }),
        });
      }
      if (res.ok) {
        toast({ title: "Partners page saved" });
        setIsEditing(false);
        fetchPage();
      }
    } catch (err) {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  const addSection = () => {
    setSections([...sections, { id: Date.now().toString(), title: "", content: "" }]);
  };

  const updateSection = (id: string, field: 'title' | 'content', value: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const deleteSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const isOwner = user?.username === "RandomIX";
  const gradientClass = animation === "Electric Magenta to Deep Blue" ? "text-gradient-animated" : "text-white";

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden relative">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between mb-12">
            <h1 className="text-4xl md:text-6xl font-display font-black text-white text-gradient-animated tracking-widest uppercase">
              Partners
            </h1>
            {isOwner && (
              <Button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-primary hover:bg-primary/90 gap-2"
              >
                {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            )}
          </div>

          {isEditing && isOwner ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 bg-white/[0.03] border border-white/10 rounded-lg p-8"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-white/70 text-sm font-bold">Sections</label>
                  <Button onClick={addSection} variant="outline" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" /> Add Section
                  </Button>
                </div>
                {sections.map((section) => (
                  <div key={section.id} className="space-y-2 p-4 bg-white/5 rounded border border-white/10">
                    <div className="flex items-center justify-between">
                      <Input
                        placeholder="Section title"
                        value={section.title}
                        onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                        className="bg-white/5 border-white/10 flex-1 mr-2"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteSection(section.id)}
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <textarea
                      placeholder="Section content (press Enter for line breaks)"
                      value={section.content}
                      onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                      className="w-full h-32 bg-white/5 border border-white/10 rounded px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-primary/50"
                    />
                  </div>
                ))}
                {sections.length === 0 && (
                  <div className="text-center py-8 text-white/50">
                    <p>No sections yet. Click "Add Section" to get started.</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-white/70 text-sm">Font Size</label>
                  <Input
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    min="12"
                    max="72"
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-white/70 text-sm">Font Family</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white"
                  >
                    <option>Playfair Display</option>
                    <option>Bodoni Moda</option>
                    <option>Cormorant</option>
                    <option>EB Garamond</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-white/70 text-sm">Gradient Animation</label>
                <select
                  value={animation}
                  onChange={(e) => setAnimation(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white"
                >
                  <option>Electric Magenta to Deep Blue</option>
                  <option>Neon Cyan to Deep Purple</option>
                  <option>Pearlescent Purple to Soft Teal</option>
                  <option>None</option>
                </select>
              </div>

              <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90 gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="min-h-[400px]"
            >
              {sections.length > 0 ? (
                <div className="space-y-12">
                  {sections.map((section) => (
                    <div key={section.id} className="space-y-4">
                      {section.title && (
                        <h2
                          style={{
                            fontSize: `${Math.max(fontSize * 1.2, 28)}px`,
                            fontFamily,
                          }}
                          className={`${gradientClass} font-bold`}
                        >
                          {section.title}
                        </h2>
                      )}
                      <p
                        style={{
                          fontSize: `${fontSize}px`,
                          fontFamily,
                        }}
                        className={`${gradientClass} max-w-2xl leading-relaxed whitespace-pre-wrap`}
                      >
                        {section.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <p className="text-white/50 text-lg">No partners content yet</p>
                    {isOwner && (
                      <Button
                        onClick={() => setIsEditing(true)}
                        variant="outline"
                        className="mt-4"
                      >
                        Add Content
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
