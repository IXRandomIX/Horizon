import { Globe, Shield, Plus, Trash2, X, Maximize2 } from "lucide-react";
import { WebviewFrame } from "@/components/webview-frame";
import { usePageXP } from "@/hooks/use-xp-track";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Proxy = {
  id: number;
  name: string;
  url: string;
  useWebview?: boolean;
};

export default function Proxies() {
  usePageXP("proxies_visited");
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [user, setUser] = useState<{ username: string; isAdmin: boolean } | null>(null);
  const [newProxyName, setNewProxyName] = useState("");
  const [newProxyUrl, setNewProxyUrl] = useState("");
  const [newProxyWebview, setNewProxyWebview] = useState(true);
  const [activeProxyUrl, setActiveProxyUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("horizon_chat_user");
    if (saved) setUser(JSON.parse(saved));
    fetchProxies();
  }, []);

  const fetchProxies = async () => {
    try {
      const res = await fetch("/api/proxies");
      const data = await res.json();
      setProxies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch proxies");
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("horizon_session_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const handleAddProxy = async () => {
    if (!newProxyName || !newProxyUrl) return;
    const res = await fetch("/api/proxies", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name: newProxyName, url: newProxyUrl, useWebview: newProxyWebview }),
    });
    if (res.ok) {
      toast({ title: "Proxy added" });
      setNewProxyName("");
      setNewProxyUrl("");
      setNewProxyWebview(true);
      fetchProxies();
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: data.message || "Failed to add proxy", variant: "destructive" });
    }
  };

  const handleDeleteProxy = async (id: number) => {
    const res = await fetch(`/api/proxies/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    if (res.ok) {
      toast({ title: "Proxy removed" });
      fetchProxies();
    }
  };

  const handleUpdateProxyWebview = async (id: number, useWebview: boolean) => {
    const res = await fetch(`/api/proxies/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ useWebview }),
    });
    if (res.ok) {
      toast({ title: useWebview ? "Using webview" : "Opening in new tab" });
      fetchProxies();
    }
  };

  const isAdmin = user?.username === "RandomIX";

  const openProxy = (proxy: Proxy) => {
    if (proxy.useWebview) {
      setActiveProxyUrl(proxy.url);
    } else {
      window.open(proxy.url, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden relative">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex items-center justify-between mb-12">
            <h1 className="text-4xl md:text-6xl font-display font-black text-white text-gradient-animated tracking-widest uppercase">
              Proxies
            </h1>
            {isAdmin && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 gap-2">
                    <Plus className="w-4 h-4" /> Add Proxy
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-black border-white/10">
                  <DialogHeader><DialogTitle className="text-white">Add New Proxy</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input placeholder="Name (e.g. Lunaar)" value={newProxyName} onChange={(e) => setNewProxyName(e.target.value)} className="bg-white/5 border-white/10" />
                    <Input placeholder="URL (https://...)" value={newProxyUrl} onChange={(e) => setNewProxyUrl(e.target.value)} className="bg-white/5 border-white/10" />
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="webview-toggle" checked={newProxyWebview} onChange={(e) => setNewProxyWebview(e.target.checked)} className="w-4 h-4" />
                      <label htmlFor="webview-toggle" className="text-white/70 text-sm cursor-pointer">Use Webview (checked = webview, unchecked = new tab)</label>
                    </div>
                    <Button onClick={handleAddProxy} className="w-full">Save Proxy</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {proxies.map((proxy, i) => (
              <motion.div
                key={proxy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-white/[0.03] border-white/10 hover:border-primary/50 transition-all group h-full flex flex-col relative">
                  {isAdmin && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white/50 hover:text-white h-8 w-8"
                        onClick={() => handleUpdateProxyWebview(proxy.id, !proxy.useWebview)}
                        title={proxy.useWebview ? "Click to open in new tab" : "Click to use webview"}
                      >
                        {proxy.useWebview ? "📱" : "🔗"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-400 h-8 w-8"
                        onClick={() => handleDeleteProxy(proxy.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20 group-hover:scale-110 transition-transform">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-white font-display tracking-wide">{proxy.name}</CardTitle>
                    <CardDescription className="text-muted-foreground truncate">{proxy.url}</CardDescription>
                    <div className="text-xs text-muted-foreground/60 mt-2">
                      {proxy.useWebview ? "📱 Opens in webview" : "🔗 Opens in new tab"}
                    </div>
                  </CardHeader>
                  <CardContent className="mt-auto pt-6">
                    <Button 
                      className="w-full bg-white/5 hover:bg-primary hover:text-white border-white/10 transition-all rounded-xl h-12"
                      onClick={() => openProxy(proxy)}
                    >
                      Establish Connection
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Webview Overlay */}
      <AnimatePresence>
        {activeProxyUrl && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 bg-black flex flex-col"
          >
            <div className="h-14 border-b border-white/10 bg-black/90 backdrop-blur-xl flex items-center px-4 justify-between">
              <div className="flex items-center gap-4 flex-1">
                <Shield className="w-5 h-5 text-primary" />
                <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-mono text-muted-foreground truncate max-w-md">
                  {activeProxyUrl}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-white"
                  onClick={() => window.open(activeProxyUrl, '_blank')}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-red-500"
                  onClick={() => setActiveProxyUrl(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 bg-black">
              <WebviewFrame
                src={activeProxyUrl}
                allow="fullscreen"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
