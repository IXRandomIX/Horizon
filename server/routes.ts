import type { Express } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg|bmp|ico/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  },
});

const aiUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 20 },
});

let cachedGames: any[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 60;

const ADMIN_USER = "RandomIX";
const ADMIN_PASS = "AdminWorks1717!!!TotallyGatekeeped!!!@@@";
const WALL_PASS = "@@@!!!$$$TTT888BBB555ZZZ777$$$!!!@@@onAroll919876HowDidYouGetThisFar!!!%%%###GatekeepThisNow!!!---937281962";
const WALL_MAX_ATTEMPTS = 2;
const WALL_LOCKOUT_MS = 20 * 24 * 60 * 60 * 1000;

function sanitizeUser(user: any) {
  const { password, ...rest } = user;
  return rest;
}

async function getSessionUser(req: any): Promise<string | null> {
  const auth = req.headers["authorization"] as string;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const session = await storage.getSession(token);
  return session?.username ?? null;
}

async function requireAdmin(req: any, res: any): Promise<boolean> {
  const caller = await getSessionUser(req);
  if (!caller) { res.status(401).json({ message: "Unauthorized" }); return false; }
  if (caller !== ADMIN_USER) { res.status(403).json({ message: "Forbidden" }); return false; }
  return true;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  const setupChat = async () => {
    try {
      const channels = await storage.getChannels();
      if (channels.length === 0) {
        await storage.createChannel({ name: "general" });
        await storage.createChannel({ name: "announcements" });
        await storage.createChannel({ name: "lounge" });
      }
      const proxies = await storage.getProxies();
      if (proxies.length === 0) {
        await storage.createProxy({ name: "Interstellar", url: "https://ad-free-proxy--securlyeduclass.replit.app/", useWebview: true });
        await storage.createProxy({ name: "Lunaar", url: "https://vps-d38e82a1.vps.ovh.us/", useWebview: true });
        await storage.createProxy({ name: "Platinum", url: "https://the.chicanoveterans.org/@", useWebview: true });
      }
      const roles = await storage.getRoles();
      if (roles.length === 0) {
        await storage.createRole({ name: "Owner", color: "#FFD700", permissions: ["admin_panel", "manage_channels", "server_settings", "manage_roles"], displayOnBoard: true });
        await storage.createRole({ name: "Admin", color: "#A855F7", permissions: ["admin_panel", "manage_channels"], displayOnBoard: true });
      }
      const adminUser = await storage.getUser(ADMIN_USER);
      if (adminUser && !adminUser.roles.includes("Owner")) {
        await storage.assignRolesToUser(ADMIN_USER, [...adminUser.roles, "Owner"]);
      }
    } catch (err) {
      console.error("Setup failed:", err);
    }
  };
  setupChat();

  // ─── Auth: Me ─────────────────────────────────────────────────────────────
  app.get("/api/auth/me", async (req, res) => {
    const auth = req.headers["authorization"] as string;
    if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });
    const token = auth.slice(7);
    const session = await storage.getSession(token);
    if (!session) return res.status(401).json({ message: "Invalid session" });
    const user = await storage.getUser(session.username);
    if (!user) return res.status(401).json({ message: "User not found" });
    return res.json({
      username: user.username,
      role: user.role,
      isAdmin: user.username === ADMIN_USER,
      displayName: user.displayName,
      displayFont: user.displayFont,
      avatar: user.avatar,
      bio: user.bio,
      banner: user.banner,
      bannerColor: user.bannerColor,
      roles: user.roles,
      roleColor: user.roleColor,
      font: user.font,
      animation: user.animation,
    });
  });

  // ─── Site-wide Auth ───────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Username and password required." });
    if (username === ADMIN_USER) return res.status(400).json({ message: "That username is reserved." });
    const existing = await storage.getUser(username);
    if (existing) return res.status(409).json({ message: "Username already taken. Try a different one." });
    const user = await storage.createUser({ username, password, role: "User", roleColor: "#9ca3af" });
    const sessionToken = await storage.createSession(user.username);
    return res.json({ username: user.username, role: user.role, isAdmin: false, displayName: user.displayName, displayFont: user.displayFont, avatar: user.avatar, bio: user.bio, banner: user.banner, bannerColor: user.bannerColor, sessionToken });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username) return res.status(400).json({ message: "Username required." });

    if (username === ADMIN_USER) {
      if (password !== ADMIN_PASS) return res.status(401).json({ message: "Invalid credentials." });
      let user = await storage.getUser(ADMIN_USER);
      if (!user) {
        user = await storage.createUser({ username: ADMIN_USER, password: ADMIN_PASS, role: "Owner", roleColor: "#a855f7", animation: "glitch", font: "fancy" });
      }
      const sessionToken = await storage.createSession(ADMIN_USER);
      return res.json({ username: user.username, role: "Owner", isAdmin: true, displayName: user.displayName, displayFont: user.displayFont, avatar: user.avatar, bio: user.bio, banner: user.banner, bannerColor: user.bannerColor, sessionToken });
    }

    const user = await storage.getUser(username);
    if (!user) return res.status(404).json({ message: "Account not found. Please register first." });

    if (user.password && user.password !== password) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    const sessionToken = await storage.createSession(user.username);
    return res.json({ username: user.username, role: user.role, isAdmin: false, displayName: user.displayName, displayFont: user.displayFont, avatar: user.avatar, bio: user.bio, banner: user.banner, bannerColor: user.bannerColor, sessionToken });
  });

  // ─── Users Directory ──────────────────────────────────────────────────────
  app.get("/api/users", async (_req, res) => {
    const all = await storage.getAllUsers();
    res.json(all.map(sanitizeUser));
  });

  app.get("/api/users/:username", async (req, res) => {
    const user = await storage.getUser(req.params.username);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(sanitizeUser(user));
  });

  app.patch("/api/users/:username/profile", async (req, res) => {
    const caller = await getSessionUser(req);
    if (!caller) return res.status(401).json({ message: "Unauthorized" });
    if (caller !== req.params.username && caller !== ADMIN_USER) return res.status(403).json({ message: "Forbidden" });
    const allowed = ["displayName", "displayFont", "bio", "avatar", "banner", "bannerColor", "font", "animation"];
    const updates: any = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }
    const user = await storage.updateUser(req.params.username, updates);
    res.json(sanitizeUser(user));
  });

  app.post("/api/users/:username/roles", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const { roles: roleNames } = req.body;
    const user = await storage.assignRolesToUser(req.params.username, roleNames);
    res.json(sanitizeUser(user));
  });

  // ─── Friends ──────────────────────────────────────────────────────────────
  app.post("/api/friends/request", async (req, res) => {
    const { from, to } = req.body;
    if (!from || !to || from === to) return res.status(400).json({ message: "Invalid" });
    const toUser = await storage.getUser(to);
    if (!toUser) return res.status(404).json({ message: "User not found" });
    const existing = await storage.getFriendship(from, to);
    if (existing) return res.status(409).json({ message: "Friend request already exists" });
    const f = await storage.sendFriendRequest(from, to);
    res.json(f);
  });

  app.post("/api/friends/respond", async (req, res) => {
    const { from, to, status } = req.body;
    const f = await storage.respondFriendRequest(from, to, status);
    res.json(f);
  });

  app.get("/api/friends", async (req, res) => {
    const username = req.query.username as string;
    if (!username) return res.status(400).json({ message: "username required" });
    const friends = await storage.getFriends(username);
    const users = await Promise.all(friends.map(u => storage.getUser(u)));
    res.json(users.filter(Boolean).map(sanitizeUser));
  });

  app.get("/api/inbox", async (req, res) => {
    const username = req.query.username as string;
    if (!username) return res.status(400).json({ message: "username required" });
    const requests = await storage.getInbox(username);
    res.json(requests);
  });

  app.get("/api/friendship/:username", async (req, res) => {
    const me = req.query.me as string;
    if (!me) return res.status(400).json({ message: "me required" });
    const status = await storage.getFriendshipStatus(me, req.params.username);
    res.json({ status });
  });

  // ─── Block ────────────────────────────────────────────────────────────────
  app.post("/api/block", async (req, res) => {
    const { blocker, blocked } = req.body;
    await storage.blockUser(blocker, blocked);
    res.json({ ok: true });
  });

  app.post("/api/unblock", async (req, res) => {
    const { blocker, blocked } = req.body;
    await storage.unblockUser(blocker, blocked);
    res.json({ ok: true });
  });

  app.get("/api/blocked", async (req, res) => {
    const username = req.query.username as string;
    const list = await storage.getBlockedList(username);
    res.json(list);
  });

  app.get("/api/isblocked", async (req, res) => {
    const { blocker, blocked } = req.query as { blocker: string; blocked: string };
    const result = await storage.isBlocked(blocker, blocked);
    res.json({ blocked: result });
  });

  // ─── DMs ─────────────────────────────────────────────────────────────────
  app.get("/api/dm/conversations", async (req, res) => {
    const username = req.query.username as string;
    if (!username) return res.status(400).json({ message: "username required" });
    const convos = await storage.getDMConversations(username);
    res.json(convos);
  });

  app.get("/api/dm/unread", async (req, res) => {
    const username = req.query.username as string;
    const count = await storage.getUnreadDMCount(username);
    res.json({ count });
  });

  app.get("/api/dm/:username", async (req, res) => {
    const me = req.query.me as string;
    if (!me) return res.status(400).json({ message: "me required" });
    const msgs = await storage.getDMs(me, req.params.username);
    res.json(msgs);
  });

  app.post("/api/dm/:username", async (req, res) => {
    const { from, content } = req.body;
    if (!from || !content) return res.status(400).json({ message: "from and content required" });
    const isBlockedByThem = await storage.isBlocked(req.params.username, from);
    if (isBlockedByThem) return res.status(403).json({ message: "You cannot message this user." });
    const msg = await storage.sendDM(from, req.params.username, content);
    res.json(msg);
  });

  app.post("/api/dm/:username/read", async (req, res) => {
    const { me } = req.body;
    await storage.markDMsRead(req.params.username, me);
    res.json({ ok: true });
  });

  // ─── Global Inbox ─────────────────────────────────────────────────────────
  app.get("/api/global-inbox", async (_req, res) => {
    const msgs = await storage.getGlobalMessages();
    res.json(msgs);
  });

  app.get("/api/global-inbox/after", async (req, res) => {
    const { since } = req.query as { since: string };
    if (!since) return res.json([]);
    const msgs = await storage.getGlobalMessagesAfter(since);
    res.json(msgs);
  });

  app.post("/api/global-inbox", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: "Content required" });
    const msg = await storage.createGlobalMessage(content.trim(), ADMIN_USER);
    res.json(msg);
  });

  // ─── The Wall (server-side verification) ─────────────────────────────────
  app.post("/api/wall/verify", async (req, res) => {
    const auth = req.headers["authorization"] as string;
    if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });
    const token = auth.slice(7);
    const session = await storage.getSession(token);
    if (!session) return res.status(401).json({ message: "Invalid session" });

    if (session.wallUnlocked) return res.json({ success: true });

    if (session.wallLockedUntil && new Date() < session.wallLockedUntil) {
      const ms = session.wallLockedUntil.getTime() - Date.now();
      return res.status(423).json({ locked: true, lockedUntilMs: session.wallLockedUntil.getTime(), message: "Locked out" });
    }

    const { password } = req.body;
    if (password === WALL_PASS) {
      await storage.setWallUnlocked(token);
      return res.json({ success: true });
    }

    const attempts = await storage.incrementWallAttempts(token);
    if (attempts >= WALL_MAX_ATTEMPTS) {
      const until = new Date(Date.now() + WALL_LOCKOUT_MS);
      await storage.setWallLockout(token, until);
      return res.status(423).json({ locked: true, lockedUntilMs: until.getTime(), attemptsLeft: 0, message: "Locked out" });
    }
    return res.status(401).json({ success: false, attemptsLeft: WALL_MAX_ATTEMPTS - attempts, message: "Wrong password" });
  });

  app.get("/api/wall/status", async (req, res) => {
    const auth = req.headers["authorization"] as string;
    if (!auth || !auth.startsWith("Bearer ")) return res.json({ unlocked: false, attemptsLeft: WALL_MAX_ATTEMPTS });
    const token = auth.slice(7);
    const session = await storage.getSession(token);
    if (!session) return res.json({ unlocked: false, attemptsLeft: WALL_MAX_ATTEMPTS });
    if (session.wallUnlocked) return res.json({ unlocked: true });
    if (session.wallLockedUntil && new Date() < session.wallLockedUntil) {
      return res.json({ unlocked: false, locked: true, lockedUntilMs: session.wallLockedUntil.getTime(), attemptsLeft: 0 });
    }
    return res.json({ unlocked: false, attemptsLeft: Math.max(0, WALL_MAX_ATTEMPTS - (session.wallAttempts ?? 0)) });
  });

  // ─── Gatekeep OS (server-side verification) ──────────────────────────────
  const GATEKEEP_PASS = "WeAreGATEKEEPING777good7luck999";
  const GATEKEEP_MAX_ATTEMPTS = 15;
  const GATEKEEP_LOCKOUT_MS = 56 * 60 * 60 * 1000;

  app.get("/api/gatekeep/status", async (req, res) => {
    const auth = req.headers["authorization"] as string;
    if (!auth || !auth.startsWith("Bearer ")) return res.json({ unlocked: false, attemptsLeft: GATEKEEP_MAX_ATTEMPTS });
    const token = auth.slice(7);
    const session = await storage.getSession(token);
    if (!session) return res.json({ unlocked: false, attemptsLeft: GATEKEEP_MAX_ATTEMPTS });
    if (session.gatekeepUnlocked) return res.json({ unlocked: true });
    if (session.gatekeepLockedUntil && new Date() < session.gatekeepLockedUntil) {
      return res.json({ unlocked: false, locked: true, lockedUntilMs: session.gatekeepLockedUntil.getTime(), attemptsLeft: 0 });
    }
    return res.json({ unlocked: false, attemptsLeft: Math.max(0, GATEKEEP_MAX_ATTEMPTS - (session.gatekeepAttempts ?? 0)) });
  });

  app.post("/api/gatekeep/verify", async (req, res) => {
    const auth = req.headers["authorization"] as string;
    if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });
    const token = auth.slice(7);
    const session = await storage.getSession(token);
    if (!session) return res.status(401).json({ message: "Invalid session" });

    if (session.gatekeepUnlocked) return res.json({ success: true });

    if (session.gatekeepLockedUntil && new Date() < session.gatekeepLockedUntil) {
      return res.status(423).json({ locked: true, lockedUntilMs: session.gatekeepLockedUntil.getTime(), message: "Locked out" });
    }

    const { password } = req.body;
    if (password === GATEKEEP_PASS) {
      await storage.setGatekeepUnlocked(token);
      return res.json({ success: true });
    }

    const attempts = await storage.incrementGatekeepAttempts(token);
    if (attempts >= GATEKEEP_MAX_ATTEMPTS) {
      const until = new Date(Date.now() + GATEKEEP_LOCKOUT_MS);
      await storage.setGatekeepLockout(token, until);
      return res.status(423).json({ locked: true, lockedUntilMs: until.getTime(), attemptsLeft: 0, message: "Locked out" });
    }
    return res.status(401).json({ success: false, attemptsLeft: GATEKEEP_MAX_ATTEMPTS - attempts, message: "Wrong password" });
  });

  // ─── Chat unread count for notification badges ────────────────────────────
  app.get("/api/messages/unread-count", async (req, res) => {
    const { since, username } = req.query as { since: string; username: string };
    if (!since || !username) return res.json({ count: 0 });
    try {
      const allChannels = await storage.getChannels(username);
      let count = 0;
      for (const ch of allChannels) {
        const msgs = await storage.getMessages(ch.id);
        count += msgs.filter(m => m.username !== username && new Date(m.timestamp) > new Date(since)).length;
      }
      res.json({ count });
    } catch {
      res.json({ count: 0 });
    }
  });

  // ─── Legacy chat auth (kept for backward compat) ──────────────────────────
  app.post("/api/chat/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER) {
      if (password !== ADMIN_PASS) return res.status(401).json({ message: "Invalid admin credentials" });
      let user = await storage.getUser(ADMIN_USER);
      if (!user) user = await storage.createUser({ username: ADMIN_USER, password: ADMIN_PASS, role: "Owner", roleColor: "#a855f7", animation: "glitch", font: "fancy" });
      return res.json({ username: user.username, role: "Owner", isAdmin: true });
    }
    let user = await storage.getUser(username);
    if (!user) user = await storage.createUser({ username, role: "User", roleColor: "#9ca3af" });
    res.json({ username: user.username, role: user.role, isAdmin: false });
  });

  // ─── Chat Routes ──────────────────────────────────────────────────────────
  app.get("/api/chat/channels", async (req, res) => {
    const username = req.query.username as string;
    const channels = await storage.getChannels(username);
    res.json(channels);
  });

  app.post("/api/chat/channels", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const channel = await storage.createChannel(req.body);
    res.status(201).json(channel);
  });

  app.patch("/api/chat/channels/:id", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const channel = await storage.updateChannel(Number(req.params.id), req.body);
    res.json(channel);
  });

  app.delete("/api/chat/channels/:id", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    await storage.deleteChannel(Number(req.params.id));
    res.status(204).end();
  });

  app.delete("/api/chat/channels/:id/messages", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    await storage.clearChannelMessages(Number(req.params.id));
    res.status(204).end();
  });

  app.get("/api/chat/roles", async (_req, res) => {
    const roles = await storage.getRoles();
    res.json(roles);
  });

  app.post("/api/chat/roles", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const role = await storage.createRole(req.body);
    res.status(201).json(role);
  });

  app.patch("/api/chat/roles/:id", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const role = await storage.updateRole(Number(req.params.id), req.body);
    res.json(role);
  });

  app.delete("/api/chat/roles/:id", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    await storage.deleteRole(Number(req.params.id));
    res.status(204).end();
  });

  app.get("/api/chat/roles/:name/users", async (req, res) => {
    const users = await storage.getUsersByRole(req.params.name);
    res.json(users.map(sanitizeUser));
  });

  app.post("/api/chat/users/:username/fetch", async (req, res) => {
    const user = await storage.getUser(req.params.username);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(sanitizeUser(user));
  });

  app.patch("/api/chat/users/:username", async (req, res) => {
    const caller = await getSessionUser(req);
    if (!caller) return res.status(401).json({ message: "Unauthorized" });
    if (caller !== req.params.username && caller !== ADMIN_USER) return res.status(403).json({ message: "Forbidden" });
    const user = await storage.updateUser(req.params.username, req.body);
    res.json(sanitizeUser(user));
  });

  app.post("/api/chat/users/:username/roles", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const { roles: roleNames } = req.body;
    const user = await storage.assignRolesToUser(req.params.username, roleNames);
    res.json(sanitizeUser(user));
  });

  app.get("/api/chat/channels/:channelId/messages", async (req, res) => {
    const messages = await storage.getMessages(Number(req.params.channelId));
    res.json(messages);
  });

  app.post("/api/chat/channels/:channelId/messages", async (req, res) => {
    const sessionUsername = await getSessionUser(req);
    if (!sessionUsername) return res.status(401).json({ message: "Unauthorized" });
    const { content, replyToId, replyToUsername, replyToContent } = req.body;
    const username = sessionUsername;
    const user = await storage.getUser(username);
    const msg = await storage.createMessage({
      channelId: Number(req.params.channelId),
      username,
      content,
      role: user?.role || "User",
      roleColor: user?.roleColor || "#9ca3af",
      font: user?.font || "sans",
      animation: user?.animation || "none",
      replyToId,
      replyToUsername,
      replyToContent
    });
    res.status(201).json(msg);
  });

  app.patch("/api/chat/messages/:id", async (req, res) => {
    const caller = await getSessionUser(req);
    if (!caller) return res.status(401).json({ message: "Unauthorized" });
    const allMessages = await (async () => {
      const channels = await storage.getChannels();
      const all: any[] = [];
      for (const ch of channels) {
        const msgs = await storage.getMessages(ch.id);
        all.push(...msgs);
      }
      return all;
    })();
    const target = allMessages.find((m: any) => m.id === Number(req.params.id));
    if (target && target.username !== caller && caller !== ADMIN_USER) return res.status(403).json({ message: "Forbidden" });
    const { content } = req.body;
    const msg = await storage.updateMessage(Number(req.params.id), content);
    res.json(msg);
  });

  app.delete("/api/chat/messages/:id", async (req, res) => {
    const caller = await getSessionUser(req);
    if (!caller) return res.status(401).json({ message: "Unauthorized" });
    const channels = await storage.getChannels();
    let target: any = null;
    for (const ch of channels) {
      const msgs = await storage.getMessages(ch.id);
      target = msgs.find((m: any) => m.id === Number(req.params.id));
      if (target) break;
    }
    if (target && target.username !== caller && caller !== ADMIN_USER) return res.status(403).json({ message: "Forbidden" });
    await storage.deleteMessage(Number(req.params.id));
    res.status(204).end();
  });

  app.post("/api/chat/messages/:id/reactions", async (req, res) => {
    const { username, emoji } = req.body;
    const reaction = await storage.addReaction(Number(req.params.id), username, emoji);
    res.json(reaction);
  });

  app.delete("/api/chat/messages/:id/reactions", async (req, res) => {
    const { username, emoji } = req.body;
    await storage.removeReaction(Number(req.params.id), username, emoji);
    res.status(204).end();
  });

  // ─── Proxies ──────────────────────────────────────────────────────────────
  app.get("/api/proxies", async (_req, res) => {
    const proxies = await storage.getProxies();
    res.json(proxies);
  });

  app.post("/api/proxies", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const proxy = await storage.createProxy(req.body);
    res.status(201).json(proxy);
  });

  app.patch("/api/proxies/:id", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const proxy = await storage.updateProxy(Number(req.params.id), req.body);
    res.json(proxy);
  });

  app.delete("/api/proxies/:id", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    await storage.deleteProxy(Number(req.params.id));
    res.status(204).end();
  });

  // ─── Pages ────────────────────────────────────────────────────────────────
  app.get("/api/pages/:name", async (req, res) => {
    const page = await storage.getPage(req.params.name);
    if (!page) return res.status(404).json({ message: "Page not found" });
    res.json(page);
  });

  app.post("/api/pages", async (req, res) => {
    const page = await storage.createPage(req.body);
    res.status(201).json(page);
  });

  app.patch("/api/pages/:name", async (req, res) => {
    let page = await storage.getPage(req.params.name);
    if (!page) page = await storage.createPage({ ...req.body, name: req.params.name });
    else page = await storage.updatePage(req.params.name, req.body);
    res.json(page);
  });

  // ─── Upload ───────────────────────────────────────────────────────────────
  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const host = req.headers.host || "localhost:5000";
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const url = `${protocol}://${host}/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename, originalName: req.file.originalname });
  });

  // ─── Horizon AI (Gemini) ──────────────────────────────────────────────────
  app.post("/api/ai/chat", aiUpload.array("files", 20), async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ message: "Horizon AI is not configured yet. Please add your GEMINI_API_KEY in the Secrets panel." });

    const message = (req.body.message as string) || "";
    const files = (req.files as Express.Multer.File[]) || [];

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      const systemPrompt = `You are Horizon AI — an advanced AI assistant that combines the intelligence of the best AI systems. You excel at:\n- Answering complex questions with clear, detailed explanations\n- Analyzing images, photos, and documents\n- Solving math problems step-by-step (showing all work)\n- Explaining science, code, and technical topics\n- Being helpful, accurate, and friendly\n\nWhen analyzing images or files, describe what you see in detail before answering the question. Format responses clearly with markdown when appropriate.`;
      const parts: any[] = [{ text: systemPrompt + "\n\nUser: " + (message || "Please analyze the attached file(s) and describe what you see.") }];
      for (const file of files) {
        const mime = file.mimetype;
        const b64 = file.buffer.toString("base64");
        if (mime.startsWith("image/") || mime === "application/pdf") {
          parts.push({ inlineData: { mimeType: mime, data: b64 } });
        } else {
          parts.push({ text: `\n[File: ${file.originalname}]\n${file.buffer.toString("utf-8").slice(0, 8000)}` });
        }
      }
      const result = await model.generateContent(parts);
      res.json({ response: result.response.text() });
    } catch (err: any) {
      const raw = err.message || "";
      let friendly = "AI generation failed. Please try again.";
      if (raw.includes("quota") || raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED")) friendly = "Rate limit reached. Please try again later.";
      else if (raw.includes("API_KEY_INVALID") || raw.includes("API key")) friendly = "Invalid API key.";
      res.status(500).json({ message: friendly });
    }
  });


  app.get(api.games.list.path, async (_req, res) => {
    try {
      const now = Date.now();
      if (cachedGames.length > 0 && now - lastFetchTime < CACHE_DURATION) return res.json(cachedGames);
      const response = await fetch("https://cdn.jsdelivr.net/gh/gn-math/assets@main/zones.json");
      if (!response.ok) throw new Error("Failed to fetch games data");
      const data = await response.json();
      const coverUrl = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
      const htmlUrl = "https://cdn.jsdelivr.net/gh/gn-math/html@main";
      cachedGames = data.filter((game: any) => game.id >= 0 && game.url && game.name).map((game: any) => ({
        id: game.id, name: game.name,
        cover: (game.cover || "").replace("{COVER_URL}", coverUrl),
        url: (game.url || "").replace("{HTML_URL}", htmlUrl),
        author: game.author, authorLink: game.authorLink
      }));
      lastFetchTime = now;
      res.json(cachedGames);
    } catch {
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // ── Movies (TMDB proxy + bCine.app) ──────────────────────────────────────
  const TMDB_KEY = "3e20e76d6d210b6cb128d17d233b64dc";
  const TMDB_BASE = "https://api.themoviedb.org/3";

  async function tmdbFetch(path: string) {
    const res = await fetch(`${TMDB_BASE}${path}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) throw new Error(`TMDB error ${res.status}`);
    return res.json();
  }

  app.get("/api/movies/trending", async (_req, res) => {
    try {
      const [movies, tv] = await Promise.all([
        tmdbFetch(`/trending/movie/day?api_key=${TMDB_KEY}`),
        tmdbFetch(`/trending/tv/day?api_key=${TMDB_KEY}`),
      ]);
      const combined = [
        ...movies.results.map((m: any) => ({ ...m, media_type: "movie" })),
        ...tv.results.map((t: any) => ({ ...t, media_type: "tv" })),
      ].sort((a, b) => b.popularity - a.popularity);
      res.json(combined);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/movies/search/:q", async (req, res) => {
    const q = (req.params.q || "").trim();
    if (!q) return res.json([]);
    try {
      const data = await tmdbFetch(
        `/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}&include_adult=false`
      );
      const results = (data.results || []).filter(
        (r: any) => r.media_type === "movie" || r.media_type === "tv"
      );
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ─── SoundCloud Music ────────────────────────────────────────────────────────
  let _scClientId: string | null = null;
  let _scClientIdTs = 0;

  async function getScClientId(): Promise<string> {
    if (_scClientId && Date.now() - _scClientIdTs < 12 * 60 * 60 * 1000) return _scClientId;
    const pageRes = await fetch("https://soundcloud.com/", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
    });
    const html = await pageRes.text();
    const scriptUrls = [...html.matchAll(/src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+\.js)"/g)].map(m => m[1]);
    for (const url of scriptUrls.reverse().slice(0, 8)) {
      try {
        const scriptRes = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        const text = await scriptRes.text();
        const match = text.match(/client_id:"([a-zA-Z0-9]{32})"/);
        if (match) { _scClientId = match[1]; _scClientIdTs = Date.now(); return _scClientId; }
      } catch {}
    }
    throw new Error("Could not obtain SoundCloud client_id");
  }

  app.get("/api/music/search", async (req, res) => {
    const q = (req.query.q as string || "").trim();
    if (!q) return res.json([]);
    try {
      const cid = await getScClientId();
      const r = await fetch(`https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(q)}&client_id=${cid}&limit=30&offset=0`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const data = await r.json();
      res.json(data.collection || []);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/music/new", async (_req, res) => {
    try {
      const cid = await getScClientId();
      const r = await fetch(`https://api-v2.soundcloud.com/charts?kind=trending&genre=soundcloud%3Agenres%3Aall-music&client_id=${cid}&limit=30`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const data = await r.json();
      const tracks = (data.collection || []).map((item: any) => item.track).filter(Boolean);
      res.json(tracks);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/music/stream/:trackId", async (req, res) => {
    try {
      const cid = await getScClientId();
      const trackId = req.params.trackId;
      const trackRes = await fetch(`https://api-v2.soundcloud.com/tracks/${trackId}?client_id=${cid}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const track = await trackRes.json();
      const transcodings: any[] = track?.media?.transcodings || [];
      const progressive = transcodings.find((t: any) => t.format?.protocol === "progressive");
      if (!progressive) return res.status(404).json({ message: "No stream available" });
      const streamRes = await fetch(`${progressive.url}?client_id=${cid}`, { headers: { "User-Agent": "Mozilla/5.0" } });
      const streamData = await streamRes.json();
      if (!streamData.url) return res.status(404).json({ message: "No stream URL" });
      res.redirect(streamData.url);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/music/download/:trackId", async (req, res) => {
    try {
      const cid = await getScClientId();
      const trackId = req.params.trackId;
      const title = ((req.query.title as string) || "track").replace(/[^a-z0-9\s-]/gi, "_");
      const trackRes = await fetch(`https://api-v2.soundcloud.com/tracks/${trackId}?client_id=${cid}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const track = await trackRes.json();
      const transcodings: any[] = track?.media?.transcodings || [];
      const progressive = transcodings.find((t: any) => t.format?.protocol === "progressive");
      if (!progressive) return res.status(404).json({ message: "Download not available for this track" });
      const streamRes = await fetch(`${progressive.url}?client_id=${cid}`, { headers: { "User-Agent": "Mozilla/5.0" } });
      const streamData = await streamRes.json();
      if (!streamData.url) return res.status(404).json({ message: "No stream URL" });
      const audioRes = await fetch(streamData.url);
      if (!audioRes.ok || !audioRes.body) return res.status(500).json({ message: "Failed to fetch audio" });
      res.setHeader("Content-Disposition", `attachment; filename="${title}.mp3"`);
      res.setHeader("Content-Type", "audio/mpeg");
      const reader = (audioRes.body as any).getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) { res.end(); break; }
          res.write(Buffer.from(value));
        }
      };
      await pump();
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  return httpServer;
}
