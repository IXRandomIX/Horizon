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
  // Games (10 quests) — 10 to 1000 XP
  { id: "games_1",    type: "games_played", title: "Play your first game",        description: "Launch any game from the Games Portal",               target: 1,    xp: 10 },
  { id: "games_5",    type: "games_played", title: "Play 5 games",                description: "Launch 5 games from the Games Portal",                target: 5,    xp: 30 },
  { id: "games_10",   type: "games_played", title: "Play 10 games",               description: "Launch 10 games from the Games Portal",               target: 10,   xp: 60 },
  { id: "games_25",   type: "games_played", title: "Play 25 games",               description: "A true gamer — 25 games played",                      target: 25,   xp: 120 },
  { id: "games_50",   type: "games_played", title: "Play 50 games",               description: "Dedicated gamer — 50 games played",                   target: 50,   xp: 220 },
  { id: "games_100",  type: "games_played", title: "Play 100 games",              description: "Gaming legend — 100 games played",                    target: 100,  xp: 380 },
  { id: "games_200",  type: "games_played", title: "Play 200 games",              description: "Unstoppable — 200 games played",                      target: 200,  xp: 520 },
  { id: "games_350",  type: "games_played", title: "Play 350 games",              description: "Elite gamer — 350 games played",                      target: 350,  xp: 680 },
  { id: "games_500",  type: "games_played", title: "Play 500 games",              description: "Half-thousand milestone — 500 games played",          target: 500,  xp: 830 },
  { id: "games_750",  type: "games_played", title: "Play 750 games",              description: "Gaming god — 750 games played",                       target: 750,  xp: 1000 },
  // Chat (10 quests) — 10 to 1000 XP
  { id: "messages_10",    type: "messages_sent", title: "Send 10 messages",       description: "Send 10 messages in any chat channel",                target: 10,    xp: 10 },
  { id: "messages_50",    type: "messages_sent", title: "Send 50 messages",       description: "Send 50 messages in any chat channel",                target: 50,    xp: 30 },
  { id: "messages_100",   type: "messages_sent", title: "Send 100 messages",      description: "Send 100 messages in any chat channel",               target: 100,   xp: 60 },
  { id: "messages_500",   type: "messages_sent", title: "Send 500 messages",      description: "Send 500 messages in any channel",                    target: 500,   xp: 120 },
  { id: "messages_1000",  type: "messages_sent", title: "Send 1,000 messages",    description: "Chat master — 1,000 messages sent",                   target: 1000,  xp: 220 },
  { id: "messages_2500",  type: "messages_sent", title: "Send 2,500 messages",    description: "Seriously chatty — 2,500 messages sent",              target: 2500,  xp: 380 },
  { id: "messages_5000",  type: "messages_sent", title: "Send 5,000 messages",    description: "You never stop talking — 5,000 messages",             target: 5000,  xp: 520 },
  { id: "messages_10000", type: "messages_sent", title: "Send 10,000 messages",   description: "Chat legend — 10,000 messages sent",                  target: 10000, xp: 680 },
  { id: "messages_25000", type: "messages_sent", title: "Send 25,000 messages",   description: "Living in the chat — 25,000 messages",                target: 25000, xp: 830 },
  { id: "messages_50000", type: "messages_sent", title: "Send 50,000 messages",   description: "Undeniable chat god — 50,000 messages",               target: 50000, xp: 1000 },
  // Movies (10 quests) — 10 to 1000 XP
  { id: "movies_1",    type: "movies_visited", title: "Visit the Movies page",    description: "Check out the Movies & Shows section",                target: 1,    xp: 10 },
  { id: "movies_5",    type: "movies_visited", title: "Visit Movies 5 times",     description: "Return to Movies 5 separate times",                   target: 5,    xp: 30 },
  { id: "movies_10",   type: "movies_visited", title: "Visit Movies 10 times",    description: "A movie buff — 10 visits",                            target: 10,   xp: 60 },
  { id: "movies_25",   type: "movies_visited", title: "Visit Movies 25 times",    description: "Always watching — 25 visits to Movies",               target: 25,   xp: 120 },
  { id: "movies_50",   type: "movies_visited", title: "Visit Movies 50 times",    description: "Dedicated viewer — 50 visits",                        target: 50,   xp: 220 },
  { id: "movies_100",  type: "movies_visited", title: "Visit Movies 100 times",   description: "Cinephile — 100 visits to Movies",                    target: 100,  xp: 380 },
  { id: "movies_200",  type: "movies_visited", title: "Visit Movies 200 times",   description: "Film fanatic — 200 visits",                           target: 200,  xp: 520 },
  { id: "movies_350",  type: "movies_visited", title: "Visit Movies 350 times",   description: "Never leaves the movies — 350 visits",                target: 350,  xp: 680 },
  { id: "movies_500",  type: "movies_visited", title: "Visit Movies 500 times",   description: "Movie marathon — 500 visits",                         target: 500,  xp: 830 },
  { id: "movies_1000", type: "movies_visited", title: "Visit Movies 1,000 times", description: "Legendary cinephile — 1,000 visits",                  target: 1000, xp: 1000 },
  // Proxies (10 quests) — 10 to 1000 XP
  { id: "proxies_1",    type: "proxies_visited", title: "Use a Proxy",            description: "Visit the Proxies page",                              target: 1,    xp: 10 },
  { id: "proxies_5",    type: "proxies_visited", title: "Use Proxies 5 times",    description: "Visit Proxies 5 times",                               target: 5,    xp: 30 },
  { id: "proxies_10",   type: "proxies_visited", title: "Use Proxies 10 times",   description: "Proxy regular — 10 visits",                           target: 10,   xp: 60 },
  { id: "proxies_25",   type: "proxies_visited", title: "Use Proxies 25 times",   description: "Sneaky browser — 25 proxy visits",                    target: 25,   xp: 120 },
  { id: "proxies_50",   type: "proxies_visited", title: "Use Proxies 50 times",   description: "Always behind a proxy — 50 visits",                   target: 50,   xp: 220 },
  { id: "proxies_100",  type: "proxies_visited", title: "Use Proxies 100 times",  description: "Ghost mode — 100 proxy visits",                       target: 100,  xp: 380 },
  { id: "proxies_200",  type: "proxies_visited", title: "Use Proxies 200 times",  description: "Invisible — 200 proxy visits",                        target: 200,  xp: 520 },
  { id: "proxies_350",  type: "proxies_visited", title: "Use Proxies 350 times",  description: "Untraceable — 350 proxy visits",                      target: 350,  xp: 680 },
  { id: "proxies_500",  type: "proxies_visited", title: "Use Proxies 500 times",  description: "Master of proxies — 500 visits",                      target: 500,  xp: 830 },
  { id: "proxies_1000", type: "proxies_visited", title: "Use Proxies 1,000 times",description: "Proxy legend — 1,000 visits",                         target: 1000, xp: 1000 },
];

export type QuestType = (typeof QUESTS)[0]["type"];
