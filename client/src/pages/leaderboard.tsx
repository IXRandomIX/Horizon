import { useEffect, useState, useCallback } from "react";
import { RANKS, getRankForXP } from "@shared/quests";
import { Crown, Users, RefreshCw } from "lucide-react";

interface LeaderboardUser {
  username: string;
  displayName: string | null;
  avatar: string | null;
  xp: number;
  rank: { rank: number; name: string; xpNeeded: number; color: string };
}

interface LeaderboardData {
  staff: LeaderboardUser[];
  byRank: Record<number, LeaderboardUser[]>;
}

function Avatar({ user }: { user: LeaderboardUser }) {
  if (user.avatar) {
    return <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />;
  }
  return (
    <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-xs font-black text-white/50 flex-shrink-0">
      {user.username[0]?.toUpperCase()}
    </div>
  );
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    const token = localStorage.getItem("horizon_session_token");
    if (!token) return;
    try {
      const res = await fetch("/api/ranks/leaderboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const ct = res.headers.get("content-type") ?? "";
        if (ct.includes("application/json")) setLeaderboard(await res.json());
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const rankedTiers = [...RANKS].sort((a, b) => a.rank - b.rank);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-black">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-5xl font-display font-black text-gradient-animated tracking-widest uppercase">
              Leaderboard
            </h1>
            <p className="text-white/40 text-sm mt-2">See where every user ranks across the platform</p>
          </div>
          <button
            onClick={fetchLeaderboard}
            className="mt-1 p-2 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-white/30 text-sm">
            Loading leaderboard…
          </div>
        ) : (
          <>
            {/* Staff Section */}
            {leaderboard && leaderboard.staff.length > 0 && (
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-yellow-500/10">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <p className="text-xs font-black uppercase tracking-widest text-yellow-400">Staff</p>
                  <span className="ml-auto text-[10px] text-yellow-500/50 font-bold">{leaderboard.staff.length} {leaderboard.staff.length === 1 ? "member" : "members"}</span>
                </div>
                <div className="divide-y divide-white/5">
                  {leaderboard.staff.map((u) => (
                    <div key={u.username} className="flex items-center gap-3 px-4 py-3">
                      <Avatar user={u} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{u.displayName || u.username}</p>
                        <p className="text-xs text-white/30 truncate">@{u.username}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] text-white/30 uppercase tracking-widest">XP</p>
                          <p className="text-[10px] font-black text-white/50 tracking-widest">0</p>
                        </div>
                        <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
                          STAFF
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rank Tiers */}
            <div className="space-y-3">
              {rankedTiers.map((tier) => {
                const users = leaderboard?.byRank[tier.rank] ?? [];
                return (
                  <div key={tier.rank} className="rounded-2xl border border-white/10 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5" style={{ background: `${tier.color}0d` }}>
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                        style={{ background: `${tier.color}22`, color: tier.color }}
                      >
                        {tier.rank}
                      </div>
                      <p className="text-sm font-black" style={{ color: tier.color }}>{tier.name}</p>
                      <span className="text-[10px] text-white/20 ml-1">{tier.xpNeeded.toLocaleString()} XP</span>
                      <span className="ml-auto text-[10px] text-white/30 font-bold">
                        {users.length} {users.length === 1 ? "user" : "users"}
                      </span>
                    </div>
                    {users.length === 0 ? (
                      <div className="px-4 py-4 text-xs text-white/20 italic">No users at this rank yet</div>
                    ) : (
                      <div className="divide-y divide-white/[0.04] bg-white/[0.01]">
                        {users.map((u, idx) => (
                          <div key={u.username} className="flex items-center gap-3 px-4 py-3">
                            <span className="text-xs font-bold text-white/20 w-6 text-right flex-shrink-0">#{idx + 1}</span>
                            <Avatar user={u} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">{u.displayName || u.username}</p>
                              <p className="text-xs text-white/30">@{u.username}</p>
                            </div>
                            <span className="text-xs font-bold text-white/50 flex-shrink-0">{u.xp.toLocaleString()} XP</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

            </div>
          </>
        )}
      </div>
    </div>
  );
}
