import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users } from "lucide-react";
import { useLocation } from "wouter";
import { ProfileModal } from "@/components/profile-modal";

export default function FriendsPage() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [viewProfile, setViewProfile] = useState<string | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!user) return;
    fetch(`/api/friends?username=${user.username}`).then(r => r.json()).then(setFriends);
  }, [user?.username]);

  if (!user) return null;

  return (
    <div className="h-full flex flex-col bg-black text-white">
      <ProfileModal username={viewProfile} onClose={() => setViewProfile(null)} />

      <div className="border-b border-white/5 px-6 py-5">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-display font-black text-white tracking-widest uppercase">Friends</h1>
        </div>
        <p className="text-white/30 text-sm mt-1">{friends.length} friend{friends.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Users className="w-12 h-12 text-white/10" />
            <p className="text-white/20 text-sm">No friends yet. Add some from Horizon Chat!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
            {friends.map((friend, i) => {
              const displayName = friend.displayName || friend.username;
              const bannerStyle = friend.banner
                ? { backgroundImage: `url(${friend.banner})`, backgroundSize: "cover", backgroundPosition: "center" }
                : { backgroundColor: friend.bannerColor || "#1a1a2e" };

              return (
                <motion.div
                  key={friend.username}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden"
                >
                  <div className="h-16" style={bannerStyle} />
                  <div className="px-4 pb-4 -mt-6 relative">
                    <button
                      onClick={() => setViewProfile(friend.username)}
                      className="w-12 h-12 rounded-xl border-2 border-[#0e0e14] bg-white/10 flex items-center justify-center text-xl font-black text-white/40 hover:opacity-80 transition-opacity overflow-hidden"
                    >
                      {friend.avatar
                        ? <img src={friend.avatar} alt={friend.username} className="w-full h-full object-cover" />
                        : friend.username[0]?.toUpperCase()
                      }
                    </button>
                    <div className="mt-2">
                      <p className="text-white font-bold text-sm">{displayName}</p>
                      <p className="text-white/40 text-xs">@{friend.username}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/dms/${friend.username}`)}
                      className="w-full mt-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs"
                      data-testid={`button-dm-${friend.username}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Chat
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
