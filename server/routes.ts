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
    const { content, username, replyToId, replyToUsername, replyToContent } = req.body;
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
    const { content } = req.body;
    const msg = await storage.updateMessage(Number(req.params.id), content);
    res.json(msg);
  });

  app.delete("/api/chat/messages/:id", async (req, res) => {
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
    let page = await storage.getPage(req.params.name);
    if (!page) {
      page = await storage.createPage({ ...req.body, name: req.params.name });
    } else {
      page = await storage.updatePage(req.params.name, req.body);
    }
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

  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const host = req.headers.host || "localhost:5000";
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const url = `${protocol}://${host}/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename, originalName: req.file.originalname });
  });

  app.post("/api/ai/chat", aiUpload.array("files", 20), async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ message: "Horizon AI is not configured yet. Please add your GEMINI_API_KEY in the Secrets panel." });
    }

    const message = (req.body.message as string) || "";
    const files = (req.files as Express.Multer.File[]) || [];

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

      const systemPrompt = `You are Horizon AI — an advanced AI assistant that combines the intelligence of the best AI systems. You excel at:
- Answering complex questions with clear, detailed explanations
- Analyzing images, photos, and documents
- Solving math problems step-by-step (showing all work)
- Explaining science, code, and technical topics
- Being helpful, accurate, and friendly

When analyzing images or files, describe what you see in detail before answering the question. Format responses clearly with markdown when appropriate.`;

      const parts: any[] = [{ text: systemPrompt + "\n\nUser: " + (message || "Please analyze the attached file(s) and describe what you see.") }];

      for (const file of files) {
        const mime = file.mimetype;
        const b64 = file.buffer.toString("base64");
        if (mime.startsWith("image/") || mime === "application/pdf") {
          parts.push({ inlineData: { mimeType: mime, data: b64 } });
        } else {
          const text = file.buffer.toString("utf-8");
          parts.push({ text: `\n[File: ${file.originalname}]\n${text.slice(0, 8000)}` });
        }
      }

      const result = await model.generateContent(parts);
      const response = result.response.text();
      res.json({ response });
    } catch (err: any) {
      console.error("Gemini error:", err);
      const raw = err.message || "";
      let friendly = "AI generation failed. Please try again.";
      if (raw.includes("quota") || raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED") || raw.includes("Too Many Requests")) {
        friendly = "Rate limit reached. You've exceeded your API quota for today — please try again later or check your Google AI plan.";
      } else if (raw.includes("API_KEY_INVALID") || raw.includes("API key")) {
        friendly = "Invalid API key. Please check your Gemini API key in the secrets panel.";
      } else if (raw.includes("404") || raw.includes("not found")) {
        friendly = "AI model not found. Please contact the administrator.";
      }
      res.status(500).json({ message: friendly });
    }
  });

  // HAIC - Kimi 2.5 Instant code assistant
  app.post("/api/haic/chat", async (req, res) => {
    const apiKey = process.env.KIMI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ message: "HAIC is not configured yet. Please add your KIMI_API_KEY in the Secrets panel." });
    }

    const { messages } = req.body as { messages: { role: string; content: string }[] };
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "Invalid request body." });
    }

    try {
      const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "moonshot-v1-8k",
          messages: [
            {
              role: "system",
              content: "You are HAIC — Horizon AI Code, an elite coding assistant powered by Kimi. You specialize in writing, reviewing, debugging, and explaining code across all languages. You are precise, fast, and give clean, production-quality code with clear explanations. Format all code with proper markdown code blocks including the language identifier."
            },
            ...messages
          ],
          temperature: 0.3,
          max_tokens: 4096,
        }),
      });

      const data = await response.json() as any;
      if (!response.ok) {
        const errMsg = data?.error?.message || "HAIC request failed.";
        return res.status(500).json({ message: errMsg });
      }

      const reply = data?.choices?.[0]?.message?.content || "";
      res.json({ response: reply });
    } catch (err: any) {
      console.error("HAIC error:", err);
      res.status(500).json({ message: err.message || "HAIC generation failed." });
    }
  });

  return httpServer;
}
