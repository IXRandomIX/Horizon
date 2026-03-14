import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const dummyTable = pgTable("dummy", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  isPrivate: boolean("is_private").default(false),
  allowedUsers: text("allowed_users").array().default(sql`'{}'::text[]`),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").default("#9ca3af"),
  permissions: text("permissions").array().default(sql`'{}'::text[]`),
  displayOnBoard: boolean("display_on_board").default(true),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").notNull(),
  username: text("username").notNull(),
  content: text("content").notNull(),
  role: text("role").default("User"),
  roleColor: text("role_color").default("#9ca3af"),
  font: text("font").default("sans"),
  animation: text("animation").default("none"),
  timestamp: timestamp("timestamp").defaultNow(),
  isEdited: boolean("is_edited").default(false),
  replyToId: integer("reply_to_id"),
  replyToUsername: text("reply_to_username"),
  replyToContent: text("reply_to_content"),
});

export const reactions = pgTable("reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull(),
  username: text("username").notNull(),
  emoji: text("emoji").notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
  role: text("role").default("User"),
  roleColor: text("role_color").default("#9ca3af"),
  roles: text("roles").array().default(sql`'{}'::text[]`),
  animation: text("animation").default("none"),
  font: text("font").default("sans"),
  displayName: text("display_name"),
  displayFont: text("display_font").default("sans"),
  bio: text("bio").default(""),
  avatar: text("avatar").default(""),
  banner: text("banner").default(""),
  bannerColor: text("banner_color").default("#1a1a2e"),
});

export const proxies = pgTable("proxies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  useWebview: boolean("use_webview").default(true),
});

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  content: text("content").default(""),
  fontSize: integer("font_size").default(16),
  animation: text("animation").default("none"),
  fontFamily: text("font_family").default("Playfair Display"),
});

export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  fromUsername: text("from_username").notNull(),
  toUsername: text("to_username").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const blockedUsers = pgTable("blocked_users", {
  id: serial("id").primaryKey(),
  blocker: text("blocker").notNull(),
  blocked: text("blocked").notNull(),
});

export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  fromUsername: text("from_username").notNull(),
  toUsername: text("to_username").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  isRead: boolean("is_read").default(false),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  username: text("username").notNull(),
  wallUnlocked: boolean("wall_unlocked").default(false),
  wallAttempts: integer("wall_attempts").default(0),
  wallLockedUntil: timestamp("wall_locked_until"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Session = typeof sessions.$inferSelect;

export const globalMessages = pgTable("global_messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  author: text("author").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type GlobalMessage = typeof globalMessages.$inferSelect;

export const insertProxySchema = createInsertSchema(proxies).omit({ id: true });
export const insertPageSchema = createInsertSchema(pages).omit({ id: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, timestamp: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true });
export const insertReactionSchema = createInsertSchema(reactions).omit({ id: true });

export type Proxy = typeof proxies.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type Channel = typeof channels.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Reaction = typeof reactions.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
export type BlockedUser = typeof blockedUsers.$inferSelect;
export type DirectMessage = typeof directMessages.$inferSelect;
