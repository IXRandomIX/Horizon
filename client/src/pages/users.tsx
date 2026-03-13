import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { ProfileModal } from "@/components/profile-modal";

export default function UsersPage() {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [viewProfile, setViewProfile] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users").then(r => r.json()).then(setAllUsers);
  }, []);

  const filtered = allUsers.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.displayName || "").toLowerCase().includes(search.toLowerCase())
  );

  const FONT_CLASSES: Record<string, string> = {
    "Playfair Display": "font-playfair",
    "EB Garamond": "font-garamond",
    "Bodoni Moda": "font-bodoni",
    "Cormorant": "font-cormorant",
    "Instrument Serif": "font-instrument",
    "Parisienne": "font-adios",
  };

  return (
    <div className="h-full flex flex-col bg-black text-white">
      <ProfileModal username={viewProfile} onClose={() => setViewProfile(null)} />

      <div className="border-b border-white/5 px-6 py-5">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-display font-black text-white tracking-widest uppercase">Users</h1>
          <span className="ml-auto text-xs text-white/20">{allUsers.length} registered</span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="bg-white/5 border-white/10 h-10 pl-9 text-white placeholder:text-white/20"
            data-testid="input-search-users"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Users className="w-12 h-12 text-white/10" />
            <p className="text-white/20 text-sm">No users found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((u, i) => {
              const displayName = u.displayName || u.username;
              const fontClass = FONT_CLASSES[u.displayFont] || "font-sans";
              const isMe = user?.username === u.username;
              const bannerStyle = u.banner
                ? { backgroundImage: `url(${u.banner})`, backgroundSize: "cover", backgroundPosition: "center" }
                : { backgroundColor: u.bannerColor || "#1a1a2e" };

              return (
                <motion.div
                  key={u.username}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  data-testid={`user-card-${u.username}`}
                >
                  <button
                    onClick={() => setViewProfile(u.username)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 hover:bg-white/[0.05] transition-all text-left group"
                  >
                    <div className="h-14" style={bannerStyle} />
                    <div className="px-4 pb-4 -mt-5 relative">
                      <div className="w-11 h-11 rounded-xl border-2 border-[#0e0e14] bg-white/10 flex items-center justify-center text-base font-black text-white/40 overflow-hidden">
                        {u.avatar
                          ? <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
                          : u.username[0]?.toUpperCase()
                        }
                      </div>
                      <div className="mt-2">
                        <p className={`text-sm font-bold text-white group-hover:text-primary transition-colors ${fontClass}`}>{displayName}</p>
                        <p className="text-white/30 text-xs">@{u.username} {isMe && <span className="text-primary">(you)</span>}</p>
                        {u.bio && <p className="text-white/30 text-xs mt-1 line-clamp-1">{u.bio}</p>}
                      </div>
                      {u.roles?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(u.roles as string[]).slice(0, 2).map((r: string) => (
                            <span key={r} className="text-[10px] px-1.5 py-0.5 rounded-full text-white/50 bg-white/5 border border-white/10">{r}</span>
                          ))}
                          {u.roles.length > 2 && <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white/30 bg-white/5">+{u.roles.length - 2}</span>}
                        </div>
                      )}
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
