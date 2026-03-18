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

const audioUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(mp3|mp4|wav|ogg|flac|aac|m4a|webm|opus)$/i;
    const ok = allowed.test(path.extname(file.originalname)) || file.mimetype.startsWith("audio/") || file.mimetype.startsWith("video/");
    cb(null, ok);
  },
});

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

  app.patch("/api/global-inbox/:id", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: "Content required" });
    const msg = await storage.updateGlobalMessage(Number(req.params.id), content.trim());
    res.json(msg);
  });

  app.delete("/api/global-inbox/:id", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    await storage.deleteGlobalMessage(Number(req.params.id));
    res.status(204).end();
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


  const FROGIEE1_GAMES = [
    { name: "Geometry Dash", url: "https://play.frogiee1.org/stuff/selfhosted/gdlite/", cover: "" },
    { name: "Getaway Shootout", url: "https://play.frogiee1.org/stuff/selfhosted/rayvon-shootout/", cover: "" },
    { name: "Rooftop Snipers", url: "https://play.frogiee1.org/stuff/selfhosted/rooftop-snipers/", cover: "" },
    { name: "Rooftop Snipers 2", url: "https://play.frogiee1.org/stuff/selfhosted/rooftop-snipers-2/", cover: "" },
    { name: "Tube Jumpers", url: "https://play.frogiee1.org/stuff/selfhosted/tube-jumpers/", cover: "" },
    { name: "Five Nights at Freddy's", url: "https://play.frogiee1.org/stuff/selfhosted/fnaf1/", cover: "" },
    { name: "Five Nights at Freddy's 2", url: "https://play.frogiee1.org/stuff/selfhosted/fnaf2/", cover: "" },
    { name: "Five Nights at Freddy's 3", url: "https://play.frogiee1.org/stuff/selfhosted/fnaf3/", cover: "" },
    { name: "Five Nights at Freddy's 4", url: "https://play.frogiee1.org/stuff/selfhosted/fnaf4/", cover: "" },
    { name: "Five Nights at Freddy's Sister Location", url: "https://play.frogiee1.org/stuff/selfhosted/sisterlocation/", cover: "" },
    { name: "Pizzeria Simulator", url: "https://play.frogiee1.org/stuff/selfhosted/pizzeriasimulator/", cover: "" },
    { name: "FNaF World", url: "https://play.frogiee1.org/stuff/selfhosted/fnafworld/", cover: "" },
    { name: "Ultimate Custom Night", url: "https://play.frogiee1.org/stuff/selfhosted/ucn/", cover: "" },
    { name: "Minecraft Classic", url: "https://play.frogiee1.org/stuff/selfhosted/minecraft/", cover: "" },
    { name: "Subway Surfers", url: "https://play.frogiee1.org/cdn/projects/subway-surfers/", cover: "" },
    { name: "Bloodmoney", url: "https://play.frogiee1.org/stuff/selfhosted/bloodmoney/", cover: "" },
    { name: "Crossy Road", url: "https://play.frogiee1.org/stuff/selfhosted/crossyroad/", cover: "" },
    { name: "Slow Roads", url: "https://play.frogiee1.org/stuff/selfhosted/slowroads/", cover: "" },
    { name: "Happy Wheels", url: "https://play.frogiee1.org/stuff/selfhosted/happywheels/", cover: "" },
    { name: "PolyTrack", url: "https://play.frogiee1.org/stuff/selfhosted/polytrack/", cover: "" },
    { name: "Slope", url: "https://play.frogiee1.org/stuff/selfhosted/slope/", cover: "" },
    { name: "A Small World Cup", url: "https://play.frogiee1.org/stuff/selfhosted/asmallworldcup/", cover: "" },
    { name: "BitLife", url: "https://play.frogiee1.org/stuff/selfhosted/bitlife/", cover: "" },
    { name: "Monkey Mart", url: "https://play.frogiee1.org/stuff/selfhosted/monkey-mart/", cover: "" },
    { name: "Drive Mad", url: "https://play.frogiee1.org/cdn/projects/drive-mad/", cover: "" },
    { name: "Monster Tracks", url: "https://play.frogiee1.org/stuff/selfhosted/monster-tracks/", cover: "" },
    { name: "A Dance of Fire and Ice", url: "https://play.frogiee1.org/stuff/selfhosted/a-dance-of-fire-and-ice/", cover: "" },
    { name: "Cannon Basketball 4", url: "https://play.frogiee1.org/stuff/selfhosted/cannon-basketball-4/", cover: "" },
    { name: "Dragon vs Icy Bricks", url: "https://play.frogiee1.org/stuff/selfhosted/dragon-vs-bricks/", cover: "" },
    { name: "Dodge", url: "https://play.frogiee1.org/stuff/selfhosted/dodge/", cover: "" },
    { name: "Baldi's Basics", url: "https://play.frogiee1.org/stuff/selfhosted/baldis-basics/", cover: "" },
    { name: "100 Player Pong", url: "https://play.frogiee1.org/stuff/selfhosted/100ng/", cover: "" },
    { name: "Burrito Bison", url: "https://play.frogiee1.org/stuff/selfhosted/burrito-bison/", cover: "" },
    { name: "Rhythm Hell", url: "https://play.frogiee1.org/stuff/selfhosted/rhythm-hell/", cover: "" },
    { name: "Bacon May Die", url: "https://play.frogiee1.org/stuff/selfhosted/bacon-may-die/", cover: "" },
    { name: "Soccer Random", url: "https://play.frogiee1.org/stuff/selfhosted/soccer-random/", cover: "" },
    { name: "Basket Random", url: "https://play.frogiee1.org/stuff/selfhosted/basket-random/", cover: "" },
    { name: "Boxing Random", url: "https://play.frogiee1.org/stuff/selfhosted/boxing-random/", cover: "" },
    { name: "Volley Random", url: "https://play.frogiee1.org/stuff/selfhosted/volley-random/", cover: "" },
    { name: "Bouncy Basketball", url: "https://play.frogiee1.org/stuff/selfhosted/bouncy-basketball/", cover: "" },
    { name: "Adventure Drivers", url: "https://play.frogiee1.org/stuff/selfhosted/adventure-drivers/", cover: "" },
    { name: "Cookie Clicker", url: "https://play.frogiee1.org/cdn/projects/cookie-clicker/index.html", cover: "" },
    { name: "Stickman Hook", url: "https://play.frogiee1.org/cdn/projects/stickman-hook/", cover: "" },
    { name: "OvO", url: "https://play.frogiee1.org/cdn/projects/ovo/", cover: "" },
    { name: "DOOM (Classic)", url: "https://play.frogiee1.org/stuff/selfhosted/doom/", cover: "" },
    { name: "Tomb of the Mask", url: "https://play.frogiee1.org/stuff/selfhosted/tomb-of-the-mask/", cover: "" },
    { name: "Big Tower Tiny Square", url: "https://play.frogiee1.org/cdn/projects/btts/", cover: "" },
    { name: "Half-Life", url: "https://play.frogiee1.org/stuff/selfhosted/half-life/", cover: "" },
    { name: "Superhot", url: "https://play.frogiee1.org/stuff/selfhosted/super-hot/", cover: "" },
    { name: "HexGL", url: "https://play.frogiee1.org/stuff/selfhosted/hexgl/", cover: "" },
    { name: "Buckshot Roulette", url: "https://play.frogiee1.org/stuff/selfhosted/buckshot-roulette/", cover: "" },
    { name: "Nazi Zombies Portable", url: "https://play.frogiee1.org/stuff/selfhosted/nzp/", cover: "" },
    { name: "Super Fowlst", url: "https://play.frogiee1.org/stuff/selfhosted/super-foulist/", cover: "" },
    { name: "Basket Bros", url: "https://play.frogiee1.org/cdn/projects/basketbros-io/", cover: "" },
    { name: "Quake", url: "https://play.frogiee1.org/stuff/selfhosted/quake/", cover: "" },
    { name: "Run 3", url: "https://play.frogiee1.org/stuff/selfhosted/run3/", cover: "" },
    { name: "Bob the Robber 2", url: "https://play.frogiee1.org/cdn/projects/bobtherobber2/index.html", cover: "" },
    { name: "Moto X3M", url: "https://play.frogiee1.org/cdn/projects/motox3m/index.html", cover: "" },
    { name: "Flappy Bird", url: "https://play.frogiee1.org/stuff/selfhosted/flappybird/", cover: "" },
    { name: "Tanuki Sunset", url: "https://play.frogiee1.org/stuff/selfhosted/tanuki-sunset/", cover: "" },
    { name: "Basketball Stars", url: "https://play.frogiee1.org/stuff/selfhosted/basketball-stars/", cover: "" },
    { name: "10 Minutes Till Dawn", url: "https://play.frogiee1.org/stuff/selfhosted/10minutestilldawn/", cover: "" },
    { name: "Angry Birds (Frogiee)", url: "https://play.frogiee1.org/stuff/selfhosted/angrybirds/", cover: "" },
    { name: "Balatro", url: "https://play.frogiee1.org/stuff/selfhosted/balatro/", cover: "" },
    { name: "Bad Game", url: "https://play.frogiee1.org/stuff/selfhosted/bad-game/", cover: "" },
    { name: "Block Blast", url: "https://play.frogiee1.org/stuff/selfhosted/block-blast/", cover: "" },
    { name: "Doki Doki Literature Club Plus", url: "https://play.frogiee1.org/stuff/selfhosted/ddlcplus/", cover: "" },
    { name: "Danganronpa", url: "https://play.frogiee1.org/stuff/selfhosted/danganronpa/", cover: "" },
    { name: "Escape Road", url: "https://play.frogiee1.org/stuff/selfhosted/escape-road/", cover: "" },
    { name: "Delta Traveler", url: "https://play.frogiee1.org/stuff/selfhosted/delta-traveler/", cover: "" },
    { name: "Drift Boss", url: "https://play.frogiee1.org/stuff/selfhosted/drift-boss/", cover: "" },
    { name: "Endless Truck", url: "https://play.frogiee1.org/stuff/selfhosted/endless-truck/", cover: "" },
    { name: "Do Not Take This Cat Home", url: "https://play.frogiee1.org/stuff/selfhosted/donotcathome/", cover: "" },
    { name: "Diggy", url: "https://play.frogiee1.org/stuff/selfhosted/diggy/", cover: "" },
    { name: "Avalanche", url: "https://play.frogiee1.org/stuff/selfhosted/avalanche/", cover: "" },
    { name: "Bloons Tower Defense", url: "https://play.frogiee1.org/stuff/selfhosted/btd1/", cover: "" },
    { name: "Bloons Tower Defense 2", url: "https://play.frogiee1.org/stuff/selfhosted/btd2/", cover: "" },
    { name: "Advance Wars", url: "https://play.frogiee1.org/stuff/selfhosted/advance-wars/", cover: "" },
    { name: "Animal Crossing Wild World", url: "https://play.frogiee1.org/stuff/selfhosted/animalcrossing/", cover: "" },
    { name: "Alien Hominid", url: "https://play.frogiee1.org/stuff/selfhosted/alien-hominid/", cover: "" },
    { name: "Burger and Frights", url: "https://play.frogiee1.org/stuff/selfhosted/burger-and-frights/", cover: "" },
    { name: "Bendy and the Ink Machine", url: "https://play.frogiee1.org/stuff/selfhosted/batim/", cover: "" },
    { name: "Crash Bandicoot", url: "https://play.frogiee1.org/stuff/selfhosted/crash-bandicoot/", cover: "" },
    { name: "Cuphead", url: "https://play.frogiee1.org/stuff/selfhosted/cuphead/", cover: "" },
  ];

  app.get(api.games.list.path, async (_req, res) => {
    try {
      const now = Date.now();
      if (cachedGames.length > 0 && now - lastFetchTime < CACHE_DURATION) return res.json(cachedGames);

      const coverUrl = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
      const htmlUrl = "https://cdn.jsdelivr.net/gh/gn-math/html@main";
      const hydraUrl = "https://cdn.jsdelivr.net/gh/Hydra-Network/hydra-assets@main";
      const ckvUrl = "https://cdn.jsdelivr.net/gh/WanoCapy/ChickenKingsVault@main";

      const [gnMathRes, hydraRes, ckvRes, srRes] = await Promise.allSettled([
        fetch("https://cdn.jsdelivr.net/gh/gn-math/assets@main/zones.json"),
        fetch(`${hydraUrl}/gmes.json`),
        fetch("https://raw.githubusercontent.com/carbonicality/ChickenKingsVault/main/games.json"),
        fetch("https://sciencerules.xyz/scripts/games.json"),
      ]);

      const allGames: any[] = [];
      const seenNames = new Set<string>();

      const addGame = (game: any) => {
        const key = game.name.toLowerCase().trim();
        if (!seenNames.has(key)) {
          seenNames.add(key);
          allGames.push(game);
        }
      };


      if (gnMathRes.status === "fulfilled" && gnMathRes.value.ok) {
        const data = await gnMathRes.value.json();
        data.filter((g: any) => g.id >= 0 && g.url && g.name).forEach((g: any) => {
          addGame({
            id: g.id, name: g.name,
            cover: (g.cover || "").replace("{COVER_URL}", coverUrl),
            url: (g.url || "").replace("{HTML_URL}", htmlUrl),
            author: g.author, authorLink: g.authorLink,
            source: "gn-math"
          });
        });
      }

      if (hydraRes.status === "fulfilled" && hydraRes.value.ok) {
        const data = await hydraRes.value.json();
        data.forEach((g: any) => {
          if (g.title && g.file_name) {
            addGame({
              id: null, name: g.title,
              cover: `${hydraUrl}/${g.thumb}`,
              url: `${hydraUrl}/gmes/${g.file_name}`,
              author: "Hydra Network", authorLink: "https://scienceissuperfun-2.blackbearshow.com",
              source: "hydra"
            });
          }
        });
      }

      if (ckvRes.status === "fulfilled" && ckvRes.value.ok) {
        const data = await ckvRes.value.json();
        data.forEach((g: any) => {
          if (g.name && g.html) {
            addGame({
              id: null, name: g.name,
              cover: g.img ? `https://raw.githubusercontent.com/carbonicality/ChickenKingsVault/main/${g.img}` : "",
              url: `${ckvUrl}/${g.html}`,
              author: "ChickenKingsVault", authorLink: "https://scienceissuperfun-2.blackbearshow.com",
              source: "ckv"
            });
          }
        });
      }

      if (srRes.status === "fulfilled" && srRes.value.ok) {
        const data = await srRes.value.json();
        const srBase = "https://sciencerules.xyz";
        const resolveSrUrl = (url: string) => {
          if (!url) return "";
          if (url.startsWith("http")) return url;
          if (url.startsWith("/")) return `${srBase}${url}`;
          if (url.startsWith("../")) return `${srBase}/${url.replace(/^(\.\.\/)+/, "")}`;
          return `${srBase}/${url}`;
        };
        data.forEach((g: any, i: number) => {
          if (g.title && g.url) {
            addGame({
              id: 80000 + i,
              name: g.title,
              cover: resolveSrUrl(g.image || ""),
              url: resolveSrUrl(g.url),
              author: "sciencerules.xyz",
              authorLink: "https://sciencerules.xyz",
              source: "sciencerules",
              directIframe: true,
            });
          }
        });
      }

      const CLOUDMOON_GAMES = [
        { name: "Brawl Stars", pkg: "com.supercell.brawlstars" },
        { name: "Roblox", pkg: "com.roblox.client" },
        { name: "Clash Royale", pkg: "com.supercell.clashroyale" },
        { name: "Genshin Impact", pkg: "com.miHoYo.GenshinImpact" },
        { name: "Honkai: Star Rail", pkg: "com.HoYoverse.hkrpgoversea" },
        { name: "Zenless Zone Zero", pkg: "com.HoYoverse.Nap" },
        { name: "Dungeon Fighter Mobile", pkg: "com.proxima.dfm" },
        { name: "Clash of Clans", pkg: "com.supercell.clashofclans" },
        { name: "Wuthering Waves", pkg: "com.kurogame.wutheringwaves.global" },
        { name: "EA FC Mobile", pkg: "com.ea.gp.fifamobile" },
        { name: "Pokémon TCG Pocket", pkg: "jp.pokemon.pokemontcgp" },
        { name: "Geometry Dash Lite", pkg: "com.robtopx.geometryjumplite" },
        { name: "Block Juggle", pkg: "com.block.juggle" },
        { name: "Identity V", pkg: "com.netease.idv.googleplay" },
        { name: "PUBG Mobile", pkg: "com.levelinfinite.sgameGlobal" },
        { name: "Mobile Legends: Bang Bang", pkg: "com.mobile.legends" },
        { name: "Squad Busters", pkg: "com.supercell.squad" },
        { name: "eFootball", pkg: "jp.konami.pesam" },
        { name: "The Battle Cats", pkg: "jp.co.ponos.battlecatsen" },
        { name: "The Battle Cats (JP)", pkg: "jp.co.ponos.battlecats" },
        { name: "Free Fire", pkg: "com.dts.freefireth" },
        { name: "Pokémon UNITE", pkg: "jp.pokemon.pokemonunite" },
        { name: "Subway Surfers", pkg: "com.kiloo.subwaysurf" },
        { name: "Onmyoji", pkg: "com.netease.yysls" },
        { name: "Cookie Run: Kingdom", pkg: "com.devsisters.ck" },
        { name: "Among Us", pkg: "com.innersloth.spacemafia" },
        { name: "Love and Deep Space", pkg: "com.papegames.lysk.en" },
        { name: "Fall Buds", pkg: "com.kitkagames.fallbuddies" },
        { name: "Candy Crush Saga", pkg: "com.king.candycrushsaga" },
        { name: "Arena of Valor (VN)", pkg: "com.garena.game.kgvn" },
        { name: "Limbus Company", pkg: "com.ProjectMoon.LimbusCompany" },
        { name: "Granny", pkg: "com.dvloper.granny" },
        { name: "Dungeon Shooter: The Forgotten Temple", pkg: "com.ChillyRoom.DungeonShooter" },
        { name: "Friday Night Funkin'", pkg: "me.funkin.fnf" },
        { name: "Garena RoV: Realm of Valor", pkg: "com.garena.game.kgth" },
        { name: "Asphalt 9: Legends", pkg: "com.gameloft.android.ANMP.GloftA9HM" },
        { name: "Call of Duty: Mobile", pkg: "com.activision.callofduty.shooter" },
        { name: "Free Fire MAX", pkg: "com.dts.freefiremax" },
        { name: "Sky: Children of the Light", pkg: "com.tgc.sky.android" },
        { name: "Blue Archive", pkg: "com.nexon.bluearchive" },
        { name: "Melon Playground", pkg: "com.studio27.MelonPlayground" },
        { name: "Yo-kai Watch Puni Puni", pkg: "com.Level5.YWP" },
        { name: "Torchlight: Infinite", pkg: "com.xd.xdtglobal.gp" },
        { name: "Monster Strike", pkg: "jp.co.mixi.monsterstrike" },
        { name: "Fortnite", pkg: "com.epicgames.fortnite" },
        { name: "War Thunder Mobile", pkg: "com.gaijingames.wtm" },
        { name: "Plants vs. Zombies FREE", pkg: "com.ea.game.pvzfree_row" },
        { name: "Baseball 9", pkg: "us.kr.baseballnine" },
        { name: "Car Parking Multiplayer", pkg: "com.olzhas.carparking.multyplayer" },
        { name: "Honkai Impact 3rd", pkg: "com.miHoYo.bh3oversea" },
        { name: "Plants vs. Zombies 2", pkg: "com.ea.game.pvz2_row" },
        { name: "Solo Leveling: ARISE", pkg: "com.netmarble.sololv" },
        { name: "Racing Master", pkg: "com.netease.dfjssea" },
        { name: "Infinity Nikki", pkg: "com.infoldgames.infinitynikkien" },
        { name: "NIKKE: Goddess of Victory", pkg: "com.proximabeta.nikke" },
        { name: "Rocket League Sideswipe", pkg: "com.Psyonix.RL2D" },
        { name: "Teamfight Tactics", pkg: "com.riotgames.league.teamfighttactics" },
        { name: "Teamfight Tactics (VN)", pkg: "com.riotgames.league.teamfighttacticsvn" },
        { name: "Punishing: Gray Raven", pkg: "com.kurogame.gplay.punishing.grayraven.en" },
        { name: "Chaos Zero Nightmare", pkg: "com.smilegate.chaoszero.stove.google" },
        { name: "Life Makeover", pkg: "com.archosaur.sea.yslzm.gp" },
        { name: "Life Makeover HD", pkg: "com.archosaur.seareal.yslzm.gp" },
        { name: "Uma Musume Pretty Derby", pkg: "com.cygames.umamusume" },
        { name: "CookieRun: Tower of Adventures", pkg: "com.devsisters.cba" },
        { name: "Royal Match", pkg: "com.dreamgames.royalmatch" },
        { name: "Farlight 84", pkg: "com.farlightgames.igame.gp" },
        { name: "Fishing Planet", pkg: "com.FishingPlanetLLC.FishingPlanet" },
        { name: "Haikyu!! Fly High", pkg: "com.garena.game.haikyu" },
        { name: "Garena Delta Force", pkg: "com.garena.game.df" },
        { name: "Harry Potter: Magic Awakened", pkg: "com.netease.harrypotter.na" },
        { name: "Madden NFL Mobile", pkg: "com.ea.gp.maddennfl21mobile" },
        { name: "The Sims Mobile", pkg: "com.ea.gp.simsmobile" },
        { name: "Tears of Themis", pkg: "com.miHoYo.tot.glb" },
        { name: "Chess", pkg: "com.mobilechess.gp" },
        { name: "Retro Bowl", pkg: "com.newstargames.retrobowl" },
        { name: "Shining Nikki", pkg: "com.papegames.nn4.en" },
        { name: "Reverse: 1999", pkg: "com.bluepoch.m.en.reverse1999" },
        { name: "Trickcal: Chibi Go", pkg: "com.bilibili.trickcal" },
        { name: "Rememento", pkg: "com.blackstorm.rememento.android.google" },
        { name: "Dragon Ball Legends", pkg: "com.bandainamcoent.dblegends_ww" },
        { name: "Dragon Ball Legends (JP)", pkg: "com.bandainamcoent.dblegends_jp" },
        { name: "One Piece Bounty Rush", pkg: "com.bandainamcoent.opbrww" },
        { name: "ZEPETO", pkg: "me.zepeto.main" },
        { name: "Yu-Gi-Oh! Master Duel", pkg: "jp.konami.masterduel" },
        { name: "Gacha Life", pkg: "air.com.lunime.gachalife" },
        { name: "Fate/Grand Order", pkg: "com.aniplex.fategrandorder.en" },
        { name: "Disney Twisted-Wonderland", pkg: "com.aniplex.twst.en" },
        { name: "Azur Lane", pkg: "com.YoStarEN.AzurLane" },
        { name: "Arknights", pkg: "com.YoStarEN.Arknights" },
        { name: "Blue Archive (JP)", pkg: "com.YostarJP.BlueArchive" },
        { name: "Etheria: Restart", pkg: "com.xd.etheria.gp.glb" },
        { name: "Snowbreak: Containment Zone", pkg: "com.Sunborn.SnqxExilium.Glo" },
        { name: "Watcher of Realms", pkg: "com.td.watcherofrealms" },
        { name: "Toca Life World", pkg: "com.tocaboca.tocalifeworld" },
        { name: "Resonance Solstice", pkg: "com.ujoy.reso" },
        { name: "Lost Sword", pkg: "com.wemadeconnect.aos.lostdgl" },
        { name: "Mecharashi", pkg: "com.tentree.gp.un.mecharashi" },
        { name: "Persona 5: The Phantom X", pkg: "sea.com.iwplay.p5x" },
        { name: "Seven Knights Idle Adventure", pkg: "com.netmarble.skiagb" },
        { name: "The Legend of Neverland", pkg: "com.gameark.ggplay.lonsea" },
        { name: "Once Human", pkg: "com.h73.jhqyna" },
        { name: "Roblox (VNG)", pkg: "com.roblox.client.vnggames" },
      ];
      CLOUDMOON_GAMES.forEach((g, i) => addGame({
        id: 70000 + i,
        name: g.name,
        url: `/api/cloudmoon-game/${g.pkg}`,
        cover: "",
        author: "CloudMoon",
        authorLink: "https://web.cloudmoonapp.com",
        source: "cloudmoon",
        directIframe: true,
      }));

      FROGIEE1_GAMES.forEach((g, i) => addGame({ id: 90000 + i, ...g, author: "Frogiee1", authorLink: "https://play.frogiee1.org", source: "frogiee1" }));

      cachedGames = allGames;
      lastFetchTime = now;
      res.json(cachedGames);
    } catch {
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // ── now.gg Roblox V3 Reverse Proxy ───────────────────────────────────────
  // All nowgg traffic is routed through our domain so content blockers see nothing.
  const NOWGG_ORIGIN = "https://68.ip.nowgg.fun";
  const PROXY_BASE   = "/nowgg-proxy";

  const NOWGG_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

  // Map each nowgg origin to a short proxy prefix
  const NOWGG_ORIGIN_MAP: Record<string, string> = {
    "https://68.ip.nowgg.fun": `${PROXY_BASE}/__o__`,
    "https://cdn.nowgg.fun":   `${PROXY_BASE}/__cdn1__`,
    "https://cdn.now.gg":      `${PROXY_BASE}/__cdn2__`,
    "https://now.gg":          `${PROXY_BASE}/__ngg__`,
  };

  // Script injected into the proxied page to kill ads, popups, and boost performance
  const NOWGG_INJECT = `<script>
(function(){
  /* ── 1. Block window.open / window.alert popups ── */
  window.open = function(){ return null; };
  window.alert = function(){};
  window.confirm = function(){ return false; };

  /* ── 2. Neutralize ad network globals before their scripts can run ── */
  window.googletag   = { cmd:{ push:function(){} }, pubads:function(){ return { setTargeting:function(){return this},enableSingleRequest:function(){return this},disableInitialLoad:function(){return this},addEventListener:function(){return this},refresh:function(){},setPrivacySettings:function(){return this} }; }, enableServices:function(){} };
  window.tude        = { cmd:{ push:function(){} } };
  window.adsbygoogle = { push:function(){} };
  window.__tcfapi    = function(c,v,cb){ cb && cb({cmpStatus:'loaded',eventStatus:'tcloaded',gdprApplies:false},true); };
  window.__uspapi    = function(c,v,cb){ cb && cb('1YNN',true); };
  window._taboola    = { push:function(){} };
  window._mgq        = { push:function(){} };
  window.dataLayer   = { push:function(){} };
  window.gtag        = function(){};
  window._qevents    = [];
  window.clicky      = { log:function(){}, goal:function(){} };

  /* ── 3. Block ad/analytics fetch ── */
  var _oFetch = window.fetch;
  window.fetch = function(url, opts){
    if(/googletagmanager|googlesyndication|doubleclick|adservice|tude\.tv|pubmatic|rubiconproject|openx|amazon-adsystem|moatads|pagead|securepubads|taboola|outbrain|mgid|sharethrough|quantcast|criteo|adsrvr|adnxs|bidswitch/i.test(String(url||''))){
      return Promise.resolve(new Response('{}', {status:200,headers:{'Content-Type':'application/json'}}));
    }
    return _oFetch.apply(this, arguments);
  };

  /* ── 4. Block ad XHR ── */
  var _oXHR = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(m, url){
    if(/googletagmanager|googlesyndication|doubleclick|adservice|tude|pubmatic|taboola|outbrain|criteo|quantcast/i.test(String(url||''))){
      url = 'about:blank';
    }
    return _oXHR.apply(this, arguments);
  };

  /* ── 5. Inject CSS nukes for common ad overlay patterns ── */
  var _style = document.createElement('style');
  _style.textContent = [
    /* Performance */
    'html,body,canvas,video,iframe{transform:translateZ(0);will-change:transform;image-rendering:auto;}',
    /* Kill fixed-position ad cards in corners (z-index > 999) */
    'body>div[style*="position: fixed"],body>div[style*="position:fixed"]{display:none!important;}',
    /* Kill common ad wrapper class patterns */
    '[class*="AdCard"],[class*="ad-card"],[class*="AdWidget"],[class*="sticky-ad"],[class*="floatAd"],[class*="float-ad"],[class*="corner-ad"],[class*="popup-ad"],[class*="pop-ad"],[id*="sticky-ad"],[id*="float-ad"]{display:none!important;}',
    /* Kill any element with very high z-index that is fixed/absolute and NOT the game */
    '*[style*="z-index: 9"]:not(#game-player):not(canvas):not(video){pointer-events:none;}',
  ].join('');
  document.documentElement.appendChild(_style);

  /* ── 6. Aggressive DOM sweeper ── */
  var AD_SELECTORS = [
    '[class*="modal"],[class*="Modal"],[class*="popup"],[class*="Popup"]',
    '[class*="overlay"],[class*="Overlay"],[class*="ad-"],[class*="-ad-"]',
    '[class*="AdSlot"],[class*="adSlot"],[class*="AdBanner"],[class*="adBanner"]',
    '[class*="AdCard"],[class*="adCard"],[class*="FloatAd"],[class*="StickyAd"]',
    '[id*="modal"],[id*="popup"],[id*="overlay"],[id*="google_ads"],[id*="ad-unit"]',
    'iframe[src*="googlesyndication"],iframe[src*="doubleclick"],iframe[src*="adservice"]',
    '[role="dialog"],[role="alertdialog"]',
    'ins.adsbygoogle',
  ].join(',');

  /* Text fragments that only appear in ads */
  var AD_TEXT = ['learn more','click here','sponsored','advertisement','public wi-fi','your whatsapp'];

  function isGameEl(el){
    try {
      if(!el) return false;
      var id = (el.id||'').toLowerCase();
      if(id === 'game-iframe' || id === 'game-player' || id === '__next') return true;
      if(el.tagName === 'HTML' || el.tagName === 'BODY') return true;
      if(el.closest && (el.closest('#game-player') || el.closest('#__next'))) return true;
    } catch(e){}
    return false;
  }

  function killEl(el){
    try {
      if(isGameEl(el)) return;
      el.style.cssText += ';display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;';
      el.remove();
    } catch(e){}
  }

  function sweepFixedEls(){
    try {
      /* Kill anything fixed/absolute with a high z-index that isn't the game */
      var all = document.querySelectorAll('body > div, body > section, body > aside');
      all.forEach(function(el){
        if(isGameEl(el)) return;
        var st = window.getComputedStyle(el);
        var pos = st.position;
        var zi  = parseInt(st.zIndex,10)||0;
        if((pos==='fixed'||pos==='absolute') && zi > 100){
          /* Check it's not the game stream */
          if(!el.querySelector('canvas') && !el.querySelector('video[autoplay]')){
            killEl(el);
          }
        }
      });
    } catch(e){}
  }

  function sweepByText(){
    try {
      /* Kill any small fixed-ish card that contains known ad text */
      var divs = document.querySelectorAll('body div');
      divs.forEach(function(el){
        if(isGameEl(el)) return;
        var txt = (el.innerText||'').toLowerCase();
        var st  = window.getComputedStyle(el);
        var isFixed = st.position === 'fixed' || st.position === 'absolute';
        if(isFixed && el.offsetWidth < 500 && el.offsetHeight < 400){
          for(var i=0;i<AD_TEXT.length;i++){
            if(txt.indexOf(AD_TEXT[i]) !== -1){ killEl(el); break; }
          }
        }
      });
    } catch(e){}
  }

  function killAds(root){
    try {
      var scope = (root && root.querySelectorAll) ? root : document;
      scope.querySelectorAll(AD_SELECTORS).forEach(function(el){
        killEl(el);
      });
    } catch(e) {}
  }

  /* MutationObserver — starts immediately before any other script ── */
  var _obs = new MutationObserver(function(muts){
    for(var i=0;i<muts.length;i++){
      muts[i].addedNodes.forEach(function(n){
        if(n.nodeType===1){
          killAds(n);
          /* If the added node itself is a fixed ad card, kill it */
          try {
            var st = window.getComputedStyle(n);
            if((st.position==='fixed'||st.position==='absolute') && parseInt(st.zIndex||'0',10)>50 && !n.querySelector('canvas') && !n.querySelector('video')){
              killEl(n);
            }
          } catch(e){}
        }
      });
    }
  });
  _obs.observe(document.documentElement, {childList:true, subtree:true});

  /* Interval sweep — catches anything the observer misses ── */
  var _sweepCount = 0;
  var _sweepTimer = setInterval(function(){
    killAds(document);
    sweepFixedEls();
    sweepByText();
    _sweepCount++;
    /* After 60s (300 × 200ms) slow down; after 5min stop ── */
    if(_sweepCount > 1500){ clearInterval(_sweepTimer); }
    else if(_sweepCount > 300){ clearInterval(_sweepTimer); _sweepTimer = setInterval(function(){ killAds(document); sweepFixedEls(); sweepByText(); }, 2000); }
  }, 200);

  document.addEventListener('DOMContentLoaded', function(){
    killAds(document);
    sweepFixedEls();
    sweepByText();
  });
})();
</script>`;

  // Ad/analytics script patterns to strip entirely from HTML
  const AD_SCRIPT_PATTERNS = [
    /googletagmanager\.com[^"']*/g,
    /googlesyndication\.com[^"']*/g,
    /doubleclick\.net[^"']*/g,
    /pagead2\.googlesyndication[^"']*/g,
  ];

  function stripAdScripts(html: string): string {
    // Remove <script> tags loading ad networks
    html = html.replace(/<script[^>]*src=["'][^"']*(?:googletagmanager|googlesyndication|doubleclick|adsbygoogle|tude\.tv|pubmatic|pagead)[^"']*["'][^>]*><\/script>/gi, '');
    html = html.replace(/<script[^>]*src=["'][^"']*(?:googletagmanager|googlesyndication|doubleclick|adsbygoogle|tude\.tv|pubmatic|pagead)[^"']*["'][^>]*\/>/gi, '');
    // Remove GTM noscript iframe
    html = html.replace(/<noscript[^>]*>[\s\S]*?googletagmanager[\s\S]*?<\/noscript>/gi, '');
    return html;
  }

  function rewriteNowGG(text: string): string {
    for (const [origin, prefix] of Object.entries(NOWGG_ORIGIN_MAP)) {
      // Plain string replacement
      text = text.split(origin).join(prefix);
      // JSON-escaped variant (backslash before each slash)
      text = text.split(origin.replace(/\//g, "\\/")).join(prefix.replace(/\//g, "\\/"));
    }
    // Rewrite root-relative paths like /2/_next/... or /cdn/... to our proxy.
    // Only match paths starting with /[a-zA-Z0-9_] to avoid matching "/>" etc.
    text = text.replace(/(["'`])(\/[a-zA-Z0-9_][^"'`\s)>]*)/g, (_, q, p) => {
      if (p.startsWith(PROXY_BASE)) return `${q}${p}`;
      return `${q}${PROXY_BASE}/__rel__${p}`;
    });
    return text;
  }

  // Injected as the VERY FIRST thing in <head> so it runs before Next.js router reads window.location
  const NOWGG_URL_SPOOF = `<script>
(function(){
  /* Make Next.js router think we are at the Roblox game path */
  try{ history.replaceState({}, '', '/apps/a/19900/b.html'); }catch(e){}
})();
</script>`;

  function injectAndClean(html: string): string {
    html = stripAdScripts(html);
    html = rewriteNowGG(html);
    // URL spoof runs FIRST, then the ad-blocker — single replacement so order is guaranteed
    html = html.replace(/<head[^>]*>/, (m) => m + NOWGG_URL_SPOOF + NOWGG_INJECT);
    return html;
  }

  async function proxyNowGGUpstream(targetUrl: string, res: any, reqBody?: Buffer, method = "GET") {
    const upstream = await fetch(targetUrl, {
      method,
      headers: {
        "User-Agent": NOWGG_UA,
        "Referer": NOWGG_ORIGIN,
        "Origin": NOWGG_ORIGIN,
        ...(reqBody ? { "Content-Type": "application/json" } : {}),
      },
      ...(reqBody ? { body: reqBody } : {}),
    });
    const ct = upstream.headers.get("content-type") || "application/octet-stream";
    res.setHeader("Content-Type", ct);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
    if (ct.includes("text") || ct.includes("javascript")) {
      let body = await upstream.text();
      if (ct.includes("text/html")) {
        body = injectAndClean(body);
      } else {
        body = rewriteNowGG(body);
      }
      res.send(body);
    } else {
      const buf = await upstream.arrayBuffer();
      res.send(Buffer.from(buf));
    }
  }

  // Serve the proxied Roblox V3 entry page
  app.get(`${PROXY_BASE}/`, async (_req, res) => {
    try {
      await proxyNowGGUpstream(`${NOWGG_ORIGIN}/apps/a/19900/b.html`, res);
    } catch (e: any) {
      res.status(502).send("Proxy error: " + e.message);
    }
  });

  function nowggRoute(prefix: string, origin: string) {
    const re = new RegExp(`^${PROXY_BASE.replace(/\//g, "\\/")}\\/${prefix}\\/?(.*)`);
    const handler = async (req: any, res: any) => {
      const tail = req.params[0] || "";
      const qs = req.url.includes("?") ? "?" + req.url.split("?")[1] : "";
      try {
        const body = req.method === "POST" || req.method === "PUT"
          ? Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}))
          : undefined;
        await proxyNowGGUpstream(`${origin}/${tail}${qs}`, res, body, req.method);
      } catch {
        res.status(502).send("Proxy error");
      }
    };
    app.get(re, handler);
    app.post(re, handler);
    app.options(re, (_req: any, res: any) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      res.sendStatus(204);
    });
  }

  nowggRoute("__rel__",  NOWGG_ORIGIN);
  nowggRoute("__o__",    "https://68.ip.nowgg.fun");
  nowggRoute("__cdn1__", "https://cdn.nowgg.fun");
  nowggRoute("__cdn2__", "https://cdn.now.gg");
  nowggRoute("__ngg__",  "https://now.gg");

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

  app.get("/api/music/new", async (req, res) => {
    try {
      const cid = await getScClientId();
      const genre = (req.query.genre as string) || "all-music";
      const kind = (req.query.kind as string) || "trending";
      const encoded = `soundcloud%3Agenres%3A${encodeURIComponent(genre)}`;
      const r = await fetch(`https://api-v2.soundcloud.com/charts?kind=${kind}&genre=${encoded}&client_id=${cid}&limit=50`, {
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

  // ─── Change Log ───────────────────────────────────────────────────────────
  app.get("/api/changelog", async (_req, res) => {
    const entries = await storage.getChangeLogEntries();
    res.json(entries);
  });

  app.get("/api/changelog/after", async (req, res) => {
    const { since } = req.query as { since: string };
    if (!since) return res.json([]);
    const entries = await storage.getChangeLogEntriesAfter(since);
    res.json(entries);
  });

  app.post("/api/changelog", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const { content, imageUrl } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: "Content required" });
    const entry = await storage.createChangeLogEntry(content.trim(), imageUrl || "");
    res.json(entry);
  });

  app.patch("/api/changelog/:id", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const { content, imageUrl } = req.body;
    const entry = await storage.updateChangeLogEntry(Number(req.params.id), content, imageUrl);
    res.json(entry);
  });

  app.delete("/api/changelog/:id", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    await storage.deleteChangeLogEntry(Number(req.params.id));
    res.status(204).end();
  });

  // Helper: fetch a cloudmoonapp.com URL, strip framing-hostile headers, and return HTML
  async function proxyCloudMoonHtml(targetUrl: string, baseHref: string, res: any) {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://web.cloudmoonapp.com/",
      },
      redirect: "follow",
    });
    if (!response.ok) return res.status(response.status).send("Failed to load from CloudMoon");
    let html = await response.text();
    const inject = `<base href="${baseHref}"><script>
(function(){
  function routeUrl(url) {
    if (!url || typeof url !== 'string' || !url.trim()) return;
    if (url.includes('cloudmoonapp.com')) {
      window.location.href = '/api/cloudmoon-proxy?url=' + encodeURIComponent(url);
    } else {
      window.location.href = url;
    }
  }
  var origOpen = window.open;
  window.open = function(url, target, features) {
    routeUrl(url);
    return { closed: false, focus: function(){}, close: function(){} };
  };
  document.addEventListener('click', function(e) {
    var el = e.target;
    while (el && el.tagName !== 'A') el = el.parentElement;
    if (el && el.target === '_blank' && el.href) {
      e.preventDefault();
      routeUrl(el.href);
    }
  }, true);
  // Override location.assign and location.replace to stay in iframe
  var _assign = window.location.assign.bind(window.location);
  var _replace = window.location.replace.bind(window.location);
  try {
    Object.defineProperty(window, 'location', {
      get: function() { return window.location; },
      configurable: true
    });
  } catch(e) {}
})();
</script>`;
    // Inject before </head> or <head> or at start
    if (html.match(/<head[^>]*>/i)) {
      html = html.replace(/(<head[^>]*>)/i, `$1${inject}`);
    } else {
      html = inject + html;
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.removeHeader?.("X-Frame-Options");
    res.send(html);
  }

  // CloudMoon game proxy — loads the game info page through our domain and intercepts window.open
  app.get("/api/cloudmoon-game/:pkg", async (req: any, res: any) => {
    try {
      const pkg = req.params.pkg;
      await proxyCloudMoonHtml(
        `https://web.cloudmoonapp.com/game/${pkg}`,
        "https://web.cloudmoonapp.com/",
        res
      );
    } catch (err: any) {
      res.status(502).send("Proxy error");
    }
  });

  // CloudMoon arbitrary URL proxy — used by the injected script to proxy run-site URLs
  // so they load inside the iframe instead of being blocked by X-Frame-Options
  app.get("/api/cloudmoon-proxy", async (req: any, res: any) => {
    try {
      const rawUrl = req.query.url as string;
      if (!rawUrl) return res.status(400).send("Missing url");
      let targetUrl: URL;
      try { targetUrl = new URL(rawUrl); } catch { return res.status(400).send("Invalid url"); }
      // Only allow cloudmoonapp.com
      if (!targetUrl.hostname.endsWith("cloudmoonapp.com")) {
        return res.status(403).send("Not allowed");
      }
      const baseHref = `${targetUrl.protocol}//${targetUrl.hostname}/`;
      const contentTypeHint = targetUrl.pathname.match(/\.(js|css|json|png|jpg|gif|svg|woff|woff2|ttf|ico)$/i);
      if (contentTypeHint) {
        // For non-HTML assets, pass them through directly
        const r = await fetch(rawUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://web.cloudmoonapp.com/",
          },
          redirect: "follow",
        });
        const ct = r.headers.get("content-type") || "application/octet-stream";
        res.setHeader("Content-Type", ct);
        const buf = await r.arrayBuffer();
        return res.send(Buffer.from(buf));
      }
      await proxyCloudMoonHtml(rawUrl, baseHref, res);
    } catch (err: any) {
      res.status(502).send("Proxy error");
    }
  });

  // User Tracks — upload, list, serve, delete
  app.get("/api/user-tracks", async (req: any, res: any) => {
    const session = await storage.getSession(req.cookies?.token || "");
    const tracks = await storage.getUserTracks(session?.username);
    res.json(tracks);
  });

  app.post("/api/user-tracks", audioUpload.single("file"), async (req: any, res: any) => {
    const session = await storage.getSession(req.cookies?.token || "");
    if (!session) return res.status(401).json({ error: "Not logged in" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const { name, isPublic } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });
    const track = await storage.createUserTrack({
      username: session.username,
      name: name.trim(),
      filePath: req.file.filename,
      fileType: req.file.mimetype || "audio/mpeg",
      isPublic: isPublic === "true" || isPublic === true,
    });
    res.json(track);
  });

  app.get("/api/user-tracks/file/:id", async (req: any, res: any) => {
    const track = await storage.getUserTrack(Number(req.params.id));
    if (!track) return res.status(404).json({ error: "Not found" });
    const filePath = path.join(uploadsDir, track.filePath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
    res.setHeader("Content-Type", track.fileType || "audio/mpeg");
    res.setHeader("Accept-Ranges", "bytes");
    fs.createReadStream(filePath).pipe(res);
  });

  app.delete("/api/user-tracks/:id", async (req: any, res: any) => {
    const session = await storage.getSession(req.cookies?.token || "");
    if (!session) return res.status(401).json({ error: "Not logged in" });
    const track = await storage.getUserTrack(Number(req.params.id));
    if (!track) return res.status(404).json({ error: "Not found" });
    if (track.username !== session.username) return res.status(403).json({ error: "Not yours" });
    const filePath = path.join(uploadsDir, track.filePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await storage.deleteUserTrack(track.id);
    res.status(204).end();
  });

  // ─── Eaglercraft Proxy (bypasses content blockers) ───────────────────────
  const EAGLER_ORIGIN = "https://d3rsc7j663z58n.cloudfront.net";

  app.use("/api/eaglercraft-proxy", async (req: any, res: any) => {
    const subPath = req.path === "/" ? "/" : req.path;
    const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    const targetUrl = `${EAGLER_ORIGIN}${subPath}${query}`;

    try {
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": req.headers["accept"] as string || "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": EAGLER_ORIGIN + "/",
        "Origin": EAGLER_ORIGIN,
      };
      if (req.headers["accept-encoding"]) {
        headers["Accept-Encoding"] = "identity";
      }

      const upstreamRes = await fetch(targetUrl, {
        method: req.method,
        headers,
        body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
        redirect: "follow",
      });

      const contentType = upstreamRes.headers.get("content-type") || "";

      res.status(upstreamRes.status);
      upstreamRes.headers.forEach((value: string, key: string) => {
        const skip = ["content-encoding", "content-length", "transfer-encoding",
          "connection", "x-frame-options", "content-security-policy",
          "x-content-type-options", "strict-transport-security"];
        if (!skip.includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      res.setHeader("Access-Control-Allow-Origin", "*");

      if (contentType.includes("text/html")) {
        let html = await upstreamRes.text();
        html = html.replace(new RegExp(EAGLER_ORIGIN.replace(/\./g, "\\."), "g"), "/api/eaglercraft-proxy");
        html = html.replace(/(src|href|action)="\//g, `$1="/api/eaglercraft-proxy/`);
        html = html.replace(/(src|href|action)='\//g, `$1='/api/eaglercraft-proxy/`);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.send(html);
      } else if (contentType.includes("javascript") || contentType.includes("text/css")) {
        let text = await upstreamRes.text();
        text = text.replace(new RegExp(EAGLER_ORIGIN.replace(/\./g, "\\."), "g"), "/api/eaglercraft-proxy");
        res.setHeader("Content-Type", contentType);
        res.send(text);
      } else {
        const buf = Buffer.from(await upstreamRes.arrayBuffer());
        res.send(buf);
      }
    } catch (err: any) {
      console.error("[eaglercraft-proxy] error:", err.message);
      res.status(502).json({ message: "Proxy error", detail: err.message });
    }
  });

  return httpServer;
}
