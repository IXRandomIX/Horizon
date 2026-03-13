import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Check, X, Inbox } from "lucide-react";
import { ProfileModal } from "@/components/profile-modal";

export default function InboxPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [viewProfile, setViewProfile] = useState<string | null>(null);

  const load = () => {
    if (!user) return;
    fetch(`/api/inbox?username=${user.username}`).then(r => r.json()).then(setRequests);
  };

  useEffect(() => { load(); }, [user?.username]);

  const respond = async (from: string, status: "accepted" | "declined") => {
    if (!user) return;
    await fetch("/api/friends/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: user.username, status }),
    });
    toast({ title: status === "accepted" ? `You are now friends with @${from}!` : `Declined @${from}'s request.` });
    load();
  };

  if (!user) return null;

  return (
    <div className="h-full flex flex-col bg-black text-white">
      <ProfileModal username={viewProfile} onClose={() => setViewProfile(null)} />

      <div className="border-b border-white/5 px-6 py-5">
        <div className="flex items-center gap-3">
          <Inbox className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-display font-black text-white tracking-widest uppercase">Inbox</h1>
        </div>
        <p className="text-white/30 text-sm mt-1">Friend requests sent to you</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Inbox className="w-12 h-12 text-white/10" />
            <p className="text-white/20 text-sm">No pending friend requests</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-xl">
            {requests.map((req, i) => (
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
