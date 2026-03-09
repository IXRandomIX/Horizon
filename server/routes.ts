import type { Express } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";
import { storage } from "./storage";

// Define a basic caching mechanism to avoid excessive fetching
let cachedGames: any[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Create default channel if none exists
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
        await storage.createRole({ 
          name: "Owner", 
          color: "#FFD700", 
          permissions: ["admin_panel", "manage_channels", "server_settings", "manage_roles"],
          displayOnBoard: true 
        });
        await storage.createRole({ 
          name: "Admin", 
          color: "#A855F7", 
          permissions: ["admin_panel", "manage_channels"],
          displayOnBoard: true 
        });
      }

      // Ensure RandomIX has Owner role
      const adminUser = await storage.getUser("RandomIX");
      if (adminUser && !adminUser.roles.includes("Owner")) {
        const newRoles = [...adminUser.roles, "Owner"];
        await storage.assignRolesToUser("RandomIX", newRoles);
      }
    } catch (err) {
      console.error("Setup failed:", err);
    }
  };
  setupChat();

  app.get(api.games.list.path, async (req, res) => {
    try {
      const now = Date.now();
      if (cachedGames.length > 0 && now - lastFetchTime < CACHE_DURATION) {
        return res.json(cachedGames);
      }
      const response = await fetch("https://cdn.jsdelivr.net/gh/gn-math/assets@main/zones.json");
      if (!response.ok) throw new Error("Failed to fetch games data");
      const data = await response.json();
      const coverUrl = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
      const htmlUrl = "https://cdn.jsdelivr.net/gh/gn-math/html@main";
      const formattedGames = data.filter((game: any) => game.id >= 0 && game.url && game.name).map((game: any) => {
        let url = game.url || "";
        let cover = game.cover || "";
        url = url.replace("{HTML_URL}", htmlUrl);
        cover = cover.replace("{COVER_URL}", coverUrl);
        return { id: game.id, name: game.name, cover: cover, url: url, author: game.author, authorLink: game.authorLink };
      });
      cachedGames = formattedGames;
      lastFetchTime = now;
      res.json(cachedGames);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // Chat Routes
  app.get("/api/chat/channels", async (req, res) => {
    const username = req.query.username as string;
    const channels = await storage.getChannels(username);
    res.json(channels);
  });

  app.post("/api/chat/channels", async (req, res) => {
    const channel = await storage.createChannel(req.body);
    res.status(201).json(channel);
  });

  app.patch("/api/chat/channels/:id", async (req, res) => {
    const channel = await storage.updateChannel(Number(req.params.id), req.body);
    res.json(channel);
  });

  app.delete("/api/chat/channels/:id", async (req, res) => {
    await storage.deleteChannel(Number(req.params.id));
    res.status(204).end();
  });

  app.get("/api/chat/roles", async (req, res) => {
    const roles = await storage.getRoles();
    res.json(roles);
  });

  app.post("/api/chat/roles", async (req, res) => {
    const role = await storage.createRole(req.body);
    res.status(201).json(role);
  });

  app.patch("/api/chat/roles/:id", async (req, res) => {
    const role = await storage.updateRole(Number(req.params.id), req.body);
    res.json(role);
  });

  app.post("/api/chat/users/:username/fetch", async (req, res) => {
    const user = await storage.getUser(req.params.username);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  app.delete("/api/chat/roles/:id", async (req, res) => {
    await storage.deleteRole(Number(req.params.id));
    res.status(204).end();
  });

  app.patch("/api/chat/users/:username", async (req, res) => {
    const user = await storage.updateUser(req.params.username, req.body);
    res.json(user);
  });

  app.post("/api/chat/users/:username/roles", async (req, res) => {
    const { roles: roleNames } = req.body;
    const user = await storage.assignRolesToUser(req.params.username, roleNames);
    res.json(user);
  });

  app.get("/api/chat/channels/:channelId/messages", async (req, res) => {
    const messages = await storage.getMessages(Number(req.params.channelId));
    res.json(messages);
  });

  app.post("/api/chat/channels/:channelId/messages", async (req, res) => {
    const { content, username } = req.body;
    const user = await storage.getUser(username);
    const msg = await storage.createMessage({
      channelId: Number(req.params.channelId),
      username,
      content,
      role: user?.role || "User",
      roleColor: user?.roleColor || "#9ca3af",
      font: user?.font || "sans",
      animation: user?.animation || "none"
    });
    res.status(201).json(msg);
  });

  app.get("/api/proxies", async (req, res) => {
    const proxies = await storage.getProxies();
    res.json(proxies);
  });

  app.post("/api/proxies", async (req, res) => {
    const proxy = await storage.createProxy(req.body);
    res.status(201).json(proxy);
  });

  app.patch("/api/proxies/:id", async (req, res) => {
    const proxy = await storage.updateProxy(Number(req.params.id), req.body);
    res.json(proxy);
  });

  app.delete("/api/proxies/:id", async (req, res) => {
    await storage.deleteProxy(Number(req.params.id));
    res.status(204).end();
  });

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
    const page = await storage.updatePage(req.params.name, req.body);
    res.json(page);
  });

  app.get("/api/chat/roles/:name/users", async (req, res) => {
    const users = await storage.getUsersByRole(req.params.name);
    res.json(users);
  });

  app.post("/api/chat/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const ADMIN_USER = "RandomIX";
    const ADMIN_PASS = "AdminWorks1717!!!TotallyGatekeeped!!!@@@";

    if (username === ADMIN_USER) {
      if (password === ADMIN_PASS) {
        let user = await storage.getUser(username);
        if (!user) {
          user = await storage.createUser({
            username,
            password: ADMIN_PASS,
            role: "Owner",
            roleColor: "#a855f7",
            animation: "glitch",
            font: "fancy"
          });
        }
        return res.json({ username: user.username, role: "Owner", isAdmin: true });
      } else {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }
    }

    let user = await storage.getUser(username);
    if (!user) {
      user = await storage.createUser({ username, role: "User", roleColor: "#9ca3af" });
    }
    res.json({ username: user.username, role: user.role, isAdmin: false });
  });

  return httpServer;
}
