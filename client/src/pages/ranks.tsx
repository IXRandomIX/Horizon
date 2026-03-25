import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth";
import { RANKS, QUESTS, getRankForXP, getNextRank } from "@shared/quests";
import { Trophy, Star, Zap, CheckCircle, Clock, RefreshCw, Crown, Users } from "lucide-react";

const QUEST_TYPE_COLORS: Record<string, string> = {
  games_played: "#a855f7",
  messages_sent: "#3b82f6",
  movies_visited: "#f97316",
  tube_visited: "#ef4444",
  proxies_visited: "#10b981",
};

const QUEST_TYPE_LABELS: Record<string, string> = {
  games_played: "Games",
  messages_sent: "Chat",
  movies_visited: "Movies",
  tube_visited: "HorizonTube",
  proxies_visited: "Proxies",
};

function Countdown({ nextResetAt }: { nextResetAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(nextResetAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Resetting…"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [nextResetAt]);

  return <span className="font-mono font-bold text-white">{timeLeft}</span>;
}

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
    return <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-lg object-cover" />;
  }
  return (
    <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-xs font-black text-white/50">
      {user.username[0]?.toUpperCase()}
    </div>
  );
}

export default function RanksPage() {
  const { user } = useAuth();
  const [rankData, setRankData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const token = localStorage.getItem("horizon_session_token");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [meRes, lbRes] = await Promise.all([
        fetch("/api/ranks/me", { headers }),
        fetch("/api/ranks/leaderboard", { headers }),
      ]);
      if (meRes.ok) {
        const ct = meRes.headers.get("content-type") ?? "";
        if (ct.includes("application/json")) setRankData(await meRes.json());
      }
      if (lbRes.ok) {
        const ct = lbRes.headers.get("content-type") ?? "";
        if (ct.includes("application/json")) setLeaderboard(await lbRes.json());
      }
    } catch {
      // retry silently on next interval
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Auto-refresh when cycle expires
  useEffect(() => {
    if (!rankData?.cycle?.nextResetAt) return;
    const diff = new Date(rankData.cycle.nextResetAt).getTime() - Date.now();
    if (diff <= 0) return;
    const t = setTimeout(() => fetchAll(), diff + 500);
    return () => clearTimeout(t);
  }, [rankData?.cycle?.nextResetAt, fetchAll]);

  const xp: number = rankData?.xp ?? 0;
  const isStaff: boolean = rankData?.isStaff ?? false;
  const currentRank = isStaff
    ? { rank: -1, name: "STAFF", color: "#FFD700", xpNeeded: 0 }
    : getRankForXP(xp);
  const nextRank = isStaff ? null : getNextRank(xp);
  const progressPct = !isStaff && nextRank
    ? Math.min(100, ((xp - currentRank.xpNeeded) / (nextRank.xpNeeded - currentRank.xpNeeded)) * 100)
    : 100;

  const questProgress: Record<string, { progress: number; completed: boolean }> = {};
  (rankData?.questProgress || []).forEach((qp: any) => {
    questProgress[qp.questId] = { progress: qp.progress, completed: qp.completed };
  });

  const activeQuestIds: string[] = rankData?.cycle?.questIds ?? [];
  const activeQuests = QUESTS.filter(q => activeQuestIds.includes(q.id));
  const groupedQuests = activeQuests.reduce((acc: Record<string, typeof QUESTS>, q) => {
    if (!acc[q.type]) acc[q.type] = [];
    acc[q.type].push(q);
    return acc;
  }, {});

  // Ranked tiers from highest to lowest (skip Unranked rank:0 in ladder display)
  const rankedTiers = [...RANKS].filter(r => r.rank !== 0).sort((a, b) => a.rank - b.rank);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-black">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-5xl font-display font-black text-gradient-animated tracking-widest uppercase">
              Ranks
            </h1>
            <p className="text-white/40 text-sm mt-2">Complete quests to earn XP and climb the ranks</p>
          </div>
          <button
            onClick={fetchAll}
            className="mt-1 p-2 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* My Status */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6" style={{ color: currentRank.color }} />
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Your Status</p>
              <p className="text-2xl font-black" style={{ color: currentRank.color }}>
                {isStaff ? "STAFF" : currentRank.rank === 0 ? "Unranked" : `Rank ${currentRank.rank} · ${currentRank.name}`}
              </p>
            </div>
            <div className="ml-auto text-right">
              {isStaff ? (
                <p className="text-2xl font-black text-yellow-400">∞ XP</p>
              ) : (
                <p className="text-2xl font-black text-white">{xp.toLocaleString()} <span className="text-white/40 text-sm font-normal">XP</span></p>
              )}
            </div>
          </div>
          {!isStaff && nextRank && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/40">
                <span>Next: <span className="font-bold" style={{ color: nextRank.color }}>{nextRank.name}</span></span>
                <span>{(nextRank.xpNeeded - xp).toLocaleString()} XP to go</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%`, background: `linear-gradient(to right, ${currentRank.color}, ${nextRank.color})` }}
                />
              </div>
            </div>
          )}
          {!isStaff && !nextRank && (
            <p className="text-yellow-400 text-sm font-bold">🎉 Maximum rank achieved!</p>
          )}
        </div>

        {/* Active Quests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-lg font-black uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" /> Active Quests
            </h2>
            {rankData?.cycle?.nextResetAt && (
              <div className="flex items-center gap-2 text-xs text-white/30 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Resets in</span>
                <Countdown nextResetAt={rankData.cycle.nextResetAt} />
              </div>
            )}
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/30 text-sm">Loading quests…</div>
          ) : activeQuests.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/30 text-sm">No active quests right now</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedQuests).map(([type, quests]) => (
                <div key={type} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: QUEST_TYPE_COLORS[type] }} />
                    <p className="text-xs font-bold text-white/50 uppercase tracking-widest">{QUEST_TYPE_LABELS[type]}</p>
                  </div>
                  {quests.map(quest => {
                    const qp = questProgress[quest.id];
                    const progress = qp?.progress ?? 0;
                    const completed = qp?.completed ?? false;
                    const pct = Math.min(100, (progress / quest.target) * 100);
                    return (
                      <div key={quest.id} className="rounded-xl border px-4 py-3 flex items-center gap-4 border-white/10 bg-white/[0.02]">
                        <div className="flex-shrink-0">
                          {completed
                            ? <CheckCircle className="w-5 h-5" style={{ color: QUEST_TYPE_COLORS[type] }} />
                            : <Clock className="w-5 h-5 text-white/20" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${completed ? "text-white/40 line-through" : "text-white"}`}>
                            {quest.title}
                          </p>
                          {!completed && (
                            <div className="mt-1.5 space-y-0.5">
                              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: QUEST_TYPE_COLORS[type] }} />
                              </div>
                              <p className="text-[10px] text-white/30">{progress} / {quest.target}</p>
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-black px-2 py-1 rounded-lg flex-shrink-0" style={{ background: completed ? "rgba(255,255,255,0.05)" : `${QUEST_TYPE_COLORS[type]}22`, color: completed ? "rgba(255,255,255,0.2)" : QUEST_TYPE_COLORS[type] }}>
                          +{quest.xp} XP
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="space-y-4">
          <h2 className="text-white text-lg font-black uppercase tracking-widest flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" /> Leaderboard
          </h2>

          {/* Staff Section */}
          {leaderboard && leaderboard.staff.length > 0 && (
            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-yellow-500/10">
                <Crown className="w-4 h-4 text-yellow-400" />
                <p className="text-xs font-black uppercase tracking-widest text-yellow-400">Staff</p>
              </div>
              <div className="divide-y divide-white/5">
                {leaderboard.staff.map((u) => (
                  <div key={u.username} className="flex items-center gap-3 px-4 py-3">
                    <Avatar user={u} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{u.displayName || u.username}</p>
                      <p className="text-xs text-white/30 truncate">@{u.username}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Potential rank based on XP */}
                      <div className="text-right">
                        <p className="text-[10px] text-white/30 uppercase tracking-widest">Potential</p>
                        <p className="text-xs font-bold" style={{ color: u.rank.color }}>
                          {u.rank.rank === 0 ? "Unranked" : u.rank.name}
                        </p>
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
                  {/* Tier Header */}
                  <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5" style={{ background: `${tier.color}0d` }}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: `${tier.color}22`, color: tier.color }}>
                      {tier.rank}
                    </div>
                    <p className="text-sm font-black" style={{ color: tier.color }}>{tier.name}</p>
                    <span className="text-[10px] text-white/20 ml-1">{tier.xpNeeded.toLocaleString()} XP</span>
                    <span className="ml-auto text-[10px] text-white/30 font-bold">{users.length} {users.length === 1 ? "user" : "users"}</span>
                  </div>
                  {/* Users in tier */}
                  {users.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-white/20 italic">No users at this rank yet</div>
                  ) : (
                    <div className="divide-y divide-white/[0.04] bg-white/[0.01]">
                      {users.map((u, idx) => (
                        <div key={u.username} className="flex items-center gap-3 px-4 py-2.5">
                          <span className="text-xs font-bold text-white/20 w-5 text-right flex-shrink-0">#{idx + 1}</span>
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

            {/* Unranked */}
            {leaderboard && (() => {
              const unranked = leaderboard.byRank[0] ?? [];
              if (unranked.length === 0) return null;
              return (
                <div className="rounded-2xl border border-white/10 overflow-hidden opacity-60">
                  <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black bg-white/10 text-white/30">?</div>
                    <p className="text-sm font-black text-white/30">Unranked</p>
                    <span className="ml-auto text-[10px] text-white/20 font-bold">{unranked.length} {unranked.length === 1 ? "user" : "users"}</span>
                  </div>
                  <div className="divide-y divide-white/[0.04] bg-white/[0.01]">
                    {unranked.map((u, idx) => (
                      <div key={u.username} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="text-xs font-bold text-white/20 w-5 text-right flex-shrink-0">#{idx + 1}</span>
                        <Avatar user={u} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white/50 truncate">{u.displayName || u.username}</p>
                          <p className="text-xs text-white/20">@{u.username}</p>
                        </div>
                        <span className="text-xs font-bold text-white/30 flex-shrink-0">{u.xp.toLocaleString()} XP</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Rank Ladder */}
        <div className="space-y-3">
          <h2 className="text-white text-lg font-black uppercase tracking-widest flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" /> Rank Ladder
          </h2>
          <div className="rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5">
            {rankedTiers.map((r) => {
              const isCurrentRank = !isStaff && currentRank.rank === r.rank;
              const achieved = !isStaff && xp >= r.xpNeeded;
              return (
                <div key={r.rank} className={`flex items-center gap-4 px-5 py-4 ${isCurrentRank ? "bg-white/10" : "bg-white/[0.02]"}`}>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0"
                    style={{ background: achieved || isCurrentRank ? `${r.color}22` : "rgba(255,255,255,0.05)", border: `1.5px solid ${achieved || isCurrentRank ? r.color : "rgba(255,255,255,0.08)"}` }}
                  >
                    <span style={{ color: achieved ? r.color : "rgba(255,255,255,0.2)" }}>{r.rank}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold" style={{ color: achieved ? r.color : "rgba(255,255,255,0.4)" }}>{r.name}</p>
                    <p className="text-xs text-white/30">{r.xpNeeded.toLocaleString()} XP required</p>
                  </div>
                  {isCurrentRank && (
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full" style={{ background: `${r.color}22`, color: r.color, border: `1px solid ${r.color}44` }}>Current</span>
                  )}
                  {achieved && !isCurrentRank && (
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: r.color }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
