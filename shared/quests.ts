export const RANKS = [
  { rank: 9, name: "Unranked", xpNeeded: 0, color: "#6b7280" },
  { rank: 8, name: "Rank Climber", xpNeeded: 300, color: "#a3a3a3" },
  { rank: 7, name: "Normal", xpNeeded: 1000, color: "#60a5fa" },
  { rank: 6, name: "Beginner", xpNeeded: 5000, color: "#34d399" },
  { rank: 5, name: "Small Fry", xpNeeded: 20000, color: "#fbbf24" },
  { rank: 4, name: "Vet", xpNeeded: 100000, color: "#f97316" },
  { rank: 3, name: "Corporal", xpNeeded: 500000, color: "#f43f5e" },
  { rank: 2, name: "Sergeant", xpNeeded: 750000, color: "#a855f7" },
  { rank: 1, name: "Chief", xpNeeded: 1500000, color: "#FFD700" },
];

export function getRankForXP(xp: number) {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.xpNeeded) current = r;
  }
  return current;
}

export function getNextRank(xp: number) {
  for (const r of RANKS) {
    if (r.xpNeeded > xp) return r;
  }
  return null;
}

export const QUESTS = [
  // First game
  { id: "games_1", type: "games_played", title: "Play your first game", description: "Launch any game from our Games Portal", target: 1, xp: 50 },
  // Games quests
  { id: "games_5", type: "games_played", title: "Play 5 games from our website", description: "Launch and play 5 games from the Games Portal", target: 5, xp: 200 },
  { id: "games_10", type: "games_played", title: "Play 10 games from our website", description: "Launch 10 games total from the Games Portal", target: 10, xp: 650 },
  { id: "games_25", type: "games_played", title: "Play 25 games from our website", description: "A true gamer — 25 games played", target: 25, xp: 2000 },
  { id: "games_50", type: "games_played", title: "Play 50 games from our website", description: "Dedicated gamer — 50 games played", target: 50, xp: 5000 },
  { id: "games_100", type: "games_played", title: "Play 100 games from our website", description: "Gaming legend — 100 games played", target: 100, xp: 15000 },
  // Chat quests
  { id: "messages_10", type: "messages_sent", title: "Get 10 messages in Chat", description: "Send 10 messages in any chat channel", target: 10, xp: 90 },
  { id: "messages_50", type: "messages_sent", title: "Get 50 messages in Chat", description: "Send 50 messages in any chat channel", target: 50, xp: 500 },
  { id: "messages_100", type: "messages_sent", title: "Get 100 messages in Chat", description: "Send 100 messages in any chat channel", target: 100, xp: 1200 },
  { id: "messages_500", type: "messages_sent", title: "Get 500 messages in Chat", description: "Send 500 messages in any channel", target: 500, xp: 7000 },
  { id: "messages_1000", type: "messages_sent", title: "Get 1000 messages in Chat", description: "Chat master — 1000 messages sent", target: 1000, xp: 20000 },
  // Movies visits
  { id: "movies_1", type: "movies_visited", title: "Visit the Movies page", description: "Check out our Movies & Shows section", target: 1, xp: 50 },
  { id: "movies_5", type: "movies_visited", title: "Visit the Movies page 5 times", description: "Return to Movies 5 separate times", target: 5, xp: 150 },
  { id: "movies_10", type: "movies_visited", title: "Visit Movies 10 times", description: "A movie buff — visit Movies 10 times", target: 10, xp: 400 },
  // HorizonTube visits
  { id: "tube_1", type: "tube_visited", title: "Watch on HorizonTube", description: "Open the HorizonTube video player", target: 1, xp: 100 },
  { id: "tube_5", type: "tube_visited", title: "Use HorizonTube 5 times", description: "Come back to HorizonTube 5 times", target: 5, xp: 350 },
  { id: "tube_10", type: "tube_visited", title: "Use HorizonTube 10 times", description: "Regular viewer — 10 HorizonTube visits", target: 10, xp: 800 },
  // Proxy visits
  { id: "proxies_1", type: "proxies_visited", title: "Use a Proxy", description: "Visit the Proxies page", target: 1, xp: 75 },
  { id: "proxies_5", type: "proxies_visited", title: "Use a Proxy 5 times", description: "Visit Proxies 5 times", target: 5, xp: 250 },
  { id: "proxies_10", type: "proxies_visited", title: "Use a Proxy 10 times", description: "Proxy regular — visit Proxies 10 times", target: 10, xp: 600 },
];

export type QuestType = (typeof QUESTS)[0]["type"];
