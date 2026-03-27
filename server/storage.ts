import { db } from "./db";
import { dummyTable, channels, messages, users, roles, proxies, pages, reactions, friendships, blockedUsers, directMessages, globalMessages, sessions, changeLogEntries, userTracks, userQuestProgress, questCycles, chatBans, chatTimeouts, notifications, type Channel, type Message, type User, type Role, type Proxy, type Page, type Reaction, type Friendship, type DirectMessage, type GlobalMessage, type Session, type ChangeLogEntry, type UserTrack, type ChatBan, type ChatTimeout, type Notification } from "@shared/schema";
import { QUESTS } from "@shared/quests";
import { eq, and, or, sql, ne, desc, inArray, gt } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getDummies(): Promise<any[]>;
  createDummy(dummy: any): Promise<any>;

  getChannels(username?: string): Promise<Channel[]>;
  createChannel(data: any): Promise<Channel>;
  updateChannel(id: number, data: any): Promise<Channel>;
  deleteChannel(id: number): Promise<void>;

  getMessages(channelId: number, limit?: number, sinceId?: number): Promise<any[]>;
  createMessage(msg: any): Promise<Message>;
  updateMessage(id: number, content: string): Promise<Message>;
  deleteMessage(id: number): Promise<void>;

  getUser(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: any): Promise<User>;
  updateUser(username: string, data: any): Promise<User>;

  getRoles(): Promise<Role[]>;
  createRole(data: any): Promise<Role>;
  updateRole(id: number, data: any): Promise<Role>;
  deleteRole(id: number): Promise<void>;

  getProxies(): Promise<Proxy[]>;
  createProxy(data: any): Promise<Proxy>;
  updateProxy(id: number, data: any): Promise<Proxy>;
  deleteProxy(id: number): Promise<void>;

  getPage(name: string): Promise<Page | undefined>;
  createPage(data: any): Promise<Page>;
  updatePage(name: string, data: any): Promise<Page>;

  assignRolesToUser(username: string, roleNames: string[]): Promise<User>;
  getUsersByRole(roleName: string): Promise<User[]>;

  getReactions(messageId: number): Promise<Reaction[]>;
  addReaction(messageId: number, username: string, emoji: string): Promise<Reaction>;
  removeReaction(messageId: number, username: string, emoji: string): Promise<void>;

  // Friends
  getFriendship(from: string, to: string): Promise<Friendship | undefined>;
  sendFriendRequest(from: string, to: string): Promise<Friendship>;
  respondFriendRequest(from: string, to: string, status: string): Promise<Friendship>;
  getFriends(username: string): Promise<string[]>;
  getInbox(username: string): Promise<Friendship[]>;
  getFriendshipStatus(user1: string, user2: string): Promise<string>;

  // Block
  blockUser(blocker: string, blocked: string): Promise<void>;
  unblockUser(blocker: string, blocked: string): Promise<void>;
  isBlocked(blocker: string, blocked: string): Promise<boolean>;
  getBlockedList(blocker: string): Promise<string[]>;

  // DMs
  getDMs(user1: string, user2: string): Promise<DirectMessage[]>;
  sendDM(from: string, to: string, content: string): Promise<DirectMessage>;
  getDMConversations(username: string): Promise<{ username: string; lastMessage: DirectMessage }[]>;
  markDMsRead(from: string, to: string): Promise<void>;
  getUnreadDMCount(username: string): Promise<number>;

  // Global Inbox
  getGlobalMessages(): Promise<GlobalMessage[]>;
  createGlobalMessage(content: string, author: string): Promise<GlobalMessage>;
  getGlobalMessagesAfter(timestamp: string): Promise<GlobalMessage[]>;
  updateGlobalMessage(id: number, content: string): Promise<GlobalMessage>;
  deleteGlobalMessage(id: number): Promise<void>;

  // Sessions
  createSession(username: string): Promise<string>;
  getSession(token: string): Promise<Session | null>;
  setWallUnlocked(token: string): Promise<void>;
  incrementWallAttempts(token: string): Promise<number>;
  setWallLockout(token: string, until: Date): Promise<void>;
  clearChannelMessages(channelId: number): Promise<void>;

  // Gatekeep OS
  setGatekeepUnlocked(token: string): Promise<void>;
  incrementGatekeepAttempts(token: string): Promise<number>;
  setGatekeepLockout(token: string, until: Date): Promise<void>;

  // XP & Quests
  getUserXP(username: string): Promise<number>;
  addUserXP(username: string, amount: number): Promise<number>;
  getCurrentCycle(): Promise<{ id: number; questIds: string[]; startedAt: Date; nextResetAt: Date }>;
  getQuestProgress(username: string, cycleId: number): Promise<any[]>;
  incrementQuestProgress(username: string, questId: string, amount: number, cycleId: number): Promise<{ progress: number; completed: boolean }>;
  markQuestCompleted(username: string, questId: string, cycleId: number): Promise<void>;

  // Notifications
  createNotification(username: string, message: string, type?: string): Promise<Notification>;
  getNotifications(username: string): Promise<Notification[]>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(username: string): Promise<void>;

  // Change Log
  getChangeLogEntries(): Promise<ChangeLogEntry[]>;
  createChangeLogEntry(content: string, imageUrl?: string): Promise<ChangeLogEntry>;
  updateChangeLogEntry(id: number, content: string, imageUrl?: string): Promise<ChangeLogEntry>;
  deleteChangeLogEntry(id: number): Promise<void>;
  getChangeLogEntriesAfter(timestamp: string): Promise<ChangeLogEntry[]>;

  // User Tracks
  getUserTracks(username?: string): Promise<UserTrack[]>;
  createUserTrack(data: { username: string; name: string; filePath: string; fileType: string; isPublic: boolean }): Promise<UserTrack>;
  deleteUserTrack(id: number): Promise<void>;
  getUserTrack(id: number): Promise<UserTrack | undefined>;

  // Chat Moderation
  banUser(username: string, bannedBy: string, reason: string, expiresAt: Date | null): Promise<void>;
  unbanUser(username: string): Promise<void>;
  getActiveBan(username: string): Promise<ChatBan | null>;
  timeoutUser(username: string, timeoutBy: string, expiresAt: Date): Promise<void>;
  untimeoutUser(username: string): Promise<void>;
  getActiveTimeout(username: string): Promise<ChatTimeout | null>;
  ensureLogsChannel(): Promise<Channel>;
  postBotMessage(channelId: number, content: string): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  async getProxies(): Promise<Proxy[]> {
    return await db.select().from(proxies);
  }
  async createProxy(data: any): Promise<Proxy> {
    const [inserted] = await db.insert(proxies).values(data).returning();
    return inserted;
  }
  async updateProxy(id: number, data: any): Promise<Proxy> {
    const [updated] = await db.update(proxies).set(data).where(eq(proxies.id, id)).returning();
    return updated;
  }
  async deleteProxy(id: number): Promise<void> {
    await db.delete(proxies).where(eq(proxies.id, id));
  }
  async getPage(name: string): Promise<Page | undefined> {
    const [page] = await db.select().from(pages).where(eq(pages.name, name));
    return page;
  }
  async createPage(data: any): Promise<Page> {
    const [inserted] = await db.insert(pages).values(data).returning();
    return inserted;
  }
  async updatePage(name: string, data: any): Promise<Page> {
    const [updated] = await db.update(pages).set(data).where(eq(pages.name, name)).returning();
    return updated;
  }
  async getDummies(): Promise<any[]> {
    return await db.select().from(dummyTable);
  }
  async createDummy(dummy: any): Promise<any> {
    const [inserted] = await db.insert(dummyTable).values(dummy).returning();
    return inserted;
  }
  async getChannels(username?: string): Promise<Channel[]> {
    if (!username) return await db.select().from(channels).where(eq(channels.isPrivate, false));
    if (username === "RandomIX") return await db.select().from(channels);
    return await db.select().from(channels).where(
      or(eq(channels.isPrivate, false), sql`${username} = ANY(${channels.allowedUsers})`)
    );
  }
  async createChannel(data: any): Promise<Channel> {
    const [inserted] = await db.insert(channels).values(data).returning();
    return inserted;
  }
  async updateChannel(id: number, data: any): Promise<Channel> {
    const [updated] = await db.update(channels).set(data).where(eq(channels.id, id)).returning();
    return updated;
  }
  async deleteChannel(id: number): Promise<void> {
    await db.delete(channels).where(eq(channels.id, id));
  }
  async getMessages(channelId: number, limit = 100, sinceId?: number): Promise<any[]> {
    const conditions = sinceId
      ? and(eq(messages.channelId, channelId), gt(messages.id, sinceId))
      : eq(messages.channelId, channelId);

    const msgs = await db
      .select()
      .from(messages)
      .where(conditions)
      .orderBy(desc(messages.id))
      .limit(limit);

    const ordered = msgs.reverse();
    if (ordered.length === 0) return [];

    const usernames = [...new Set(ordered.map(m => m.username))];
    const msgIds = ordered.map(m => m.id);

    const [allUsers, allReactions] = await Promise.all([
      db.select().from(users).where(inArray(users.username, usernames)),
      db.select().from(reactions).where(inArray(reactions.messageId, msgIds)),
    ]);

    const userMap = new Map(allUsers.map(u => [u.username, u]));
    const reactMap = new Map<number, Reaction[]>();
    for (const r of allReactions) {
      if (!reactMap.has(r.messageId)) reactMap.set(r.messageId, []);
      reactMap.get(r.messageId)!.push(r);
    }

    return ordered.map(msg => {
      const u = userMap.get(msg.username);
      return { ...msg, roles: u?.roles || [], avatar: u?.avatar || "", reactions: reactMap.get(msg.id) || [] };
    });
  }
  async createMessage(msg: any): Promise<Message> {
    const [inserted] = await db.insert(messages).values(msg).returning();
    return inserted;
  }
  async updateMessage(id: number, content: string): Promise<Message> {
    const [updated] = await db.update(messages).set({ content, isEdited: true }).where(eq(messages.id, id)).returning();
    return updated;
  }
  async deleteMessage(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
    await db.delete(reactions).where(eq(reactions.messageId, id));
  }
  async getUser(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  async createUser(user: any): Promise<User> {
    const [inserted] = await db.insert(users).values(user).returning();
    return inserted;
  }
  async updateUser(username: string, data: any): Promise<User> {
    const [updated] = await db.update(users).set(data).where(eq(users.username, username)).returning();
    return updated;
  }
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }
  async createRole(data: any): Promise<Role> {
    const [inserted] = await db.insert(roles).values(data).returning();
    return inserted;
  }
  async updateRole(id: number, data: any): Promise<Role> {
    const [updated] = await db.update(roles).set(data).where(eq(roles.id, id)).returning();
    return updated;
  }
  async deleteRole(id: number): Promise<void> {
    await db.delete(roles).where(eq(roles.id, id));
  }
  async assignRolesToUser(username: string, roleNames: string[]): Promise<User> {
    const [updated] = await db.update(users).set({ roles: roleNames }).where(eq(users.username, username)).returning();
    return updated;
  }
  async getUsersByRole(roleName: string): Promise<User[]> {
    return await db.select().from(users).where(sql`${roleName} = ANY(${users.roles})`);
  }
  async getReactions(messageId: number): Promise<Reaction[]> {
    return await db.select().from(reactions).where(eq(reactions.messageId, messageId));
  }
  async addReaction(messageId: number, username: string, emoji: string): Promise<Reaction> {
    const [existing] = await db.select().from(reactions).where(and(eq(reactions.messageId, messageId), eq(reactions.username, username), eq(reactions.emoji, emoji)));
    if (existing) return existing;
    const [inserted] = await db.insert(reactions).values({ messageId, username, emoji }).returning();
    return inserted;
  }
  async removeReaction(messageId: number, username: string, emoji: string): Promise<void> {
    await db.delete(reactions).where(and(eq(reactions.messageId, messageId), eq(reactions.username, username), eq(reactions.emoji, emoji)));
  }

  // --- Friends ---
  async getFriendship(from: string, to: string): Promise<Friendship | undefined> {
    const [f] = await db.select().from(friendships).where(
      or(
        and(eq(friendships.fromUsername, from), eq(friendships.toUsername, to)),
        and(eq(friendships.fromUsername, to), eq(friendships.toUsername, from))
      )
    );
    return f;
  }
  async sendFriendRequest(from: string, to: string): Promise<Friendship> {
    const existing = await this.getFriendship(from, to);
    if (existing) return existing;
    const [inserted] = await db.insert(friendships).values({ fromUsername: from, toUsername: to, status: "pending" }).returning();
    return inserted;
  }
  async respondFriendRequest(from: string, to: string, status: string): Promise<Friendship> {
    const [updated] = await db.update(friendships)
      .set({ status })
      .where(and(eq(friendships.fromUsername, from), eq(friendships.toUsername, to)))
      .returning();
    return updated;
  }
  async getFriends(username: string): Promise<string[]> {
    const accepted = await db.select().from(friendships).where(
      and(
        or(eq(friendships.fromUsername, username), eq(friendships.toUsername, username)),
        eq(friendships.status, "accepted")
      )
    );
    return accepted.map(f => f.fromUsername === username ? f.toUsername : f.fromUsername);
  }
  async getInbox(username: string): Promise<Friendship[]> {
    return await db.select().from(friendships).where(
      and(eq(friendships.toUsername, username), eq(friendships.status, "pending"))
    );
  }
  async getFriendshipStatus(user1: string, user2: string): Promise<string> {
    const f = await this.getFriendship(user1, user2);
    if (!f) return "none";
    return f.status === "pending" ? (f.fromUsername === user1 ? "sent" : "received") : f.status;
  }

  // --- Block ---
  async blockUser(blocker: string, blocked: string): Promise<void> {
    const [existing] = await db.select().from(blockedUsers).where(and(eq(blockedUsers.blocker, blocker), eq(blockedUsers.blocked, blocked)));
    if (!existing) {
      await db.insert(blockedUsers).values({ blocker, blocked });
    }
  }
  async unblockUser(blocker: string, blocked: string): Promise<void> {
    await db.delete(blockedUsers).where(and(eq(blockedUsers.blocker, blocker), eq(blockedUsers.blocked, blocked)));
  }
  async isBlocked(blocker: string, blocked: string): Promise<boolean> {
    const [row] = await db.select().from(blockedUsers).where(and(eq(blockedUsers.blocker, blocker), eq(blockedUsers.blocked, blocked)));
    return !!row;
  }
  async getBlockedList(blocker: string): Promise<string[]> {
    const rows = await db.select().from(blockedUsers).where(eq(blockedUsers.blocker, blocker));
    return rows.map(r => r.blocked);
  }

  // --- DMs ---
  async getDMs(user1: string, user2: string): Promise<DirectMessage[]> {
    return await db.select().from(directMessages).where(
      or(
        and(eq(directMessages.fromUsername, user1), eq(directMessages.toUsername, user2)),
        and(eq(directMessages.fromUsername, user2), eq(directMessages.toUsername, user1))
      )
    ).orderBy(directMessages.timestamp);
  }
  async sendDM(from: string, to: string, content: string): Promise<DirectMessage> {
    const [inserted] = await db.insert(directMessages).values({ fromUsername: from, toUsername: to, content }).returning();
    return inserted;
  }
  async getDMConversations(username: string): Promise<{ username: string; lastMessage: DirectMessage }[]> {
    const msgs = await db.select().from(directMessages).where(
      or(eq(directMessages.fromUsername, username), eq(directMessages.toUsername, username))
    ).orderBy(desc(directMessages.timestamp));

    const seen = new Set<string>();
    const result: { username: string; lastMessage: DirectMessage }[] = [];
    for (const msg of msgs) {
      const other = msg.fromUsername === username ? msg.toUsername : msg.fromUsername;
      if (!seen.has(other)) {
        seen.add(other);
        result.push({ username: other, lastMessage: msg });
      }
    }
    return result;
  }
  async markDMsRead(from: string, to: string): Promise<void> {
    await db.update(directMessages).set({ isRead: true }).where(
      and(eq(directMessages.fromUsername, from), eq(directMessages.toUsername, to))
    );
  }
  async getUnreadDMCount(username: string): Promise<number> {
    const rows = await db.select().from(directMessages).where(
      and(eq(directMessages.toUsername, username), eq(directMessages.isRead, false))
    );
    return rows.length;
  }

  // --- Global Inbox ---
  async getGlobalMessages(): Promise<GlobalMessage[]> {
    return await db.select().from(globalMessages).orderBy(globalMessages.createdAt);
  }
  async createGlobalMessage(content: string, author: string): Promise<GlobalMessage> {
    const [inserted] = await db.insert(globalMessages).values({ content, author }).returning();
    return inserted;
  }
  async getGlobalMessagesAfter(timestamp: string): Promise<GlobalMessage[]> {
    return await db.select().from(globalMessages).where(
      sql`${globalMessages.createdAt} > ${timestamp}::timestamptz`
    ).orderBy(globalMessages.createdAt);
  }
  async updateGlobalMessage(id: number, content: string): Promise<GlobalMessage> {
    const [updated] = await db.update(globalMessages).set({ content }).where(eq(globalMessages.id, id)).returning();
    return updated;
  }
  async deleteGlobalMessage(id: number): Promise<void> {
    await db.delete(globalMessages).where(eq(globalMessages.id, id));
  }

  // --- Sessions ---
  async createSession(username: string): Promise<string> {
    const token = randomUUID();
    await db.insert(sessions).values({ token, username });
    return token;
  }
  async getSession(token: string): Promise<Session | null> {
    if (!token) return null;
    const [row] = await db.select().from(sessions).where(eq(sessions.token, token));
    return row ?? null;
  }
  async setWallUnlocked(token: string): Promise<void> {
    await db.update(sessions).set({ wallUnlocked: true }).where(eq(sessions.token, token));
  }
  async incrementWallAttempts(token: string): Promise<number> {
    await db.update(sessions).set({ wallAttempts: sql`${sessions.wallAttempts} + 1` }).where(eq(sessions.token, token));
    const [row] = await db.select().from(sessions).where(eq(sessions.token, token));
    return row?.wallAttempts ?? 1;
  }
  async setWallLockout(token: string, until: Date): Promise<void> {
    await db.update(sessions).set({ wallLockedUntil: until }).where(eq(sessions.token, token));
  }
  async clearChannelMessages(channelId: number): Promise<void> {
    await db.delete(reactions).where(
      sql`${reactions.messageId} IN (SELECT id FROM messages WHERE channel_id = ${channelId})`
    );
    await db.delete(messages).where(eq(messages.channelId, channelId));
  }

  async setGatekeepUnlocked(token: string): Promise<void> {
    await db.update(sessions).set({ gatekeepUnlocked: true }).where(eq(sessions.token, token));
  }
  async incrementGatekeepAttempts(token: string): Promise<number> {
    await db.update(sessions).set({ gatekeepAttempts: sql`${sessions.gatekeepAttempts} + 1` }).where(eq(sessions.token, token));
    const [row] = await db.select().from(sessions).where(eq(sessions.token, token));
    return row?.gatekeepAttempts ?? 1;
  }
  async setGatekeepLockout(token: string, until: Date): Promise<void> {
    await db.update(sessions).set({ gatekeepLockedUntil: until }).where(eq(sessions.token, token));
  }

  // --- Change Log ---
  async getChangeLogEntries(): Promise<ChangeLogEntry[]> {
    return await db.select().from(changeLogEntries).orderBy(desc(changeLogEntries.createdAt));
  }
  async createChangeLogEntry(content: string, imageUrl?: string): Promise<ChangeLogEntry> {
    const [inserted] = await db.insert(changeLogEntries).values({ content, imageUrl: imageUrl || "" }).returning();
    return inserted;
  }
  async updateChangeLogEntry(id: number, content: string, imageUrl?: string): Promise<ChangeLogEntry> {
    const [updated] = await db.update(changeLogEntries).set({ content, imageUrl: imageUrl !== undefined ? imageUrl : "" }).where(eq(changeLogEntries.id, id)).returning();
    return updated;
  }
  async deleteChangeLogEntry(id: number): Promise<void> {
    await db.delete(changeLogEntries).where(eq(changeLogEntries.id, id));
  }
  async getChangeLogEntriesAfter(timestamp: string): Promise<ChangeLogEntry[]> {
    return await db.select().from(changeLogEntries).where(
      sql`${changeLogEntries.createdAt} > ${timestamp}::timestamptz`
    ).orderBy(desc(changeLogEntries.createdAt));
  }

  async getUserTracks(username?: string): Promise<UserTrack[]> {
    if (username) {
      return await db.select().from(userTracks).where(
        or(eq(userTracks.isPublic, true), eq(userTracks.username, username))
      ).orderBy(desc(userTracks.createdAt));
    }
    return await db.select().from(userTracks).where(eq(userTracks.isPublic, true)).orderBy(desc(userTracks.createdAt));
  }

  async createUserTrack(data: { username: string; name: string; filePath: string; fileType: string; isPublic: boolean }): Promise<UserTrack> {
    const [track] = await db.insert(userTracks).values(data).returning();
    return track;
  }

  async deleteUserTrack(id: number): Promise<void> {
    await db.delete(userTracks).where(eq(userTracks.id, id));
  }

  async getUserTrack(id: number): Promise<UserTrack | undefined> {
    const [track] = await db.select().from(userTracks).where(eq(userTracks.id, id));
    return track;
  }

  async getUserXP(username: string): Promise<number> {
    const user = await this.getUser(username);
    return user?.xp ?? 0;
  }

  async addUserXP(username: string, amount: number): Promise<number> {
    const current = await this.getUserXP(username);
    const newXP = Math.max(0, current + amount);
    await db.update(users).set({ xp: newXP }).where(eq(users.username, username));
    return newXP;
  }

  async getCurrentCycle(): Promise<{ id: number; questIds: string[]; startedAt: Date; nextResetAt: Date }> {
    const CYCLE_MS = 5 * 60 * 60 * 1000; // 5 hours
    const [latest] = await db.select().from(questCycles).orderBy(desc(questCycles.id)).limit(1);
    if (!latest || Date.now() - latest.startedAt.getTime() >= CYCLE_MS) {
      return this.createNewCycle();
    }
    const nextResetAt = new Date(latest.startedAt.getTime() + CYCLE_MS);
    return { id: latest.id, questIds: latest.questIds as string[], startedAt: latest.startedAt, nextResetAt };
  }

  private async createNewCycle(): Promise<{ id: number; questIds: string[]; startedAt: Date; nextResetAt: Date }> {
    const CYCLE_MS = 5 * 60 * 60 * 1000;
    const byType: Record<string, string[]> = {};
    for (const q of QUESTS) {
      if (!byType[q.type]) byType[q.type] = [];
      byType[q.type].push(q.id);
    }
    const selected: string[] = [];
    for (const ids of Object.values(byType)) {
      const shuffled = [...ids].sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, 10));
    }
    const [cycle] = await db.insert(questCycles).values({ questIds: selected, startedAt: new Date() }).returning();
    const nextResetAt = new Date(cycle.startedAt.getTime() + CYCLE_MS);
    return { id: cycle.id, questIds: cycle.questIds as string[], startedAt: cycle.startedAt, nextResetAt };
  }

  async getQuestProgress(username: string, cycleId: number): Promise<any[]> {
    return await db.select().from(userQuestProgress).where(
      and(eq(userQuestProgress.username, username), eq(userQuestProgress.cycleId, cycleId))
    );
  }

  async incrementQuestProgress(username: string, questId: string, amount: number, cycleId: number): Promise<{ progress: number; completed: boolean }> {
    const [existing] = await db.select().from(userQuestProgress).where(
      and(eq(userQuestProgress.username, username), eq(userQuestProgress.questId, questId), eq(userQuestProgress.cycleId, cycleId))
    );
    if (existing) {
      if (existing.completed) return { progress: existing.progress ?? 0, completed: true };
      const newProgress = (existing.progress ?? 0) + amount;
      const [updated] = await db.update(userQuestProgress)
        .set({ progress: newProgress })
        .where(and(eq(userQuestProgress.username, username), eq(userQuestProgress.questId, questId), eq(userQuestProgress.cycleId, cycleId)))
        .returning();
      return { progress: updated.progress ?? 0, completed: updated.completed ?? false };
    } else {
      const [created] = await db.insert(userQuestProgress)
        .values({ username, questId, progress: amount, completed: false, cycleId })
        .returning();
      return { progress: created.progress ?? 0, completed: created.completed ?? false };
    }
  }

  async markQuestCompleted(username: string, questId: string, cycleId: number): Promise<void> {
    await db.update(userQuestProgress)
      .set({ completed: true })
      .where(and(eq(userQuestProgress.username, username), eq(userQuestProgress.questId, questId), eq(userQuestProgress.cycleId, cycleId)));
  }

  async banUser(username: string, bannedBy: string, reason: string, expiresAt: Date | null): Promise<void> {
    const lower = username.toLowerCase();
    await db.update(chatBans).set({ active: false }).where(and(sql`lower(${chatBans.username}) = ${lower}`, eq(chatBans.active, true)));
    await db.insert(chatBans).values({ username: lower, bannedBy, reason, expiresAt, active: true });
  }

  async unbanUser(username: string): Promise<void> {
    const lower = username.toLowerCase();
    await db.update(chatBans).set({ active: false }).where(and(sql`lower(${chatBans.username}) = ${lower}`, eq(chatBans.active, true)));
  }

  async getActiveBan(username: string): Promise<ChatBan | null> {
    const lower = username.toLowerCase();
    const [ban] = await db.select().from(chatBans).where(and(sql`lower(${chatBans.username}) = ${lower}`, eq(chatBans.active, true)));
    if (!ban) return null;
    if (ban.expiresAt && ban.expiresAt < new Date()) {
      await this.unbanUser(username);
      return null;
    }
    return ban;
  }

  async timeoutUser(username: string, timeoutBy: string, expiresAt: Date): Promise<void> {
    const lower = username.toLowerCase();
    await db.update(chatTimeouts).set({ active: false }).where(and(sql`lower(${chatTimeouts.username}) = ${lower}`, eq(chatTimeouts.active, true)));
    await db.insert(chatTimeouts).values({ username: lower, timeoutBy, expiresAt, active: true });
  }

  async untimeoutUser(username: string): Promise<void> {
    const lower = username.toLowerCase();
    await db.update(chatTimeouts).set({ active: false }).where(and(sql`lower(${chatTimeouts.username}) = ${lower}`, eq(chatTimeouts.active, true)));
  }

  async getActiveTimeout(username: string): Promise<ChatTimeout | null> {
    const lower = username.toLowerCase();
    const [timeout] = await db.select().from(chatTimeouts).where(and(sql`lower(${chatTimeouts.username}) = ${lower}`, eq(chatTimeouts.active, true)));
    if (!timeout) return null;
    if (timeout.expiresAt < new Date()) {
      await this.untimeoutUser(username);
      return null;
    }
    return timeout;
  }

  async ensureLogsChannel(): Promise<Channel> {
    const [existing] = await db.select().from(channels).where(eq(channels.isLogs, true));
    if (existing) return existing;
    const [created] = await db.insert(channels).values({ name: "logs", isPrivate: false, readOnlyPublic: true, isLogs: true }).returning();
    return created;
  }

  async createNotification(username: string, message: string, type: string = "info"): Promise<Notification> {
    const [notif] = await db.insert(notifications).values({ username, message, type, read: false }).returning();
    return notif;
  }

  async getNotifications(username: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.username, username)).orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(id: number): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(username: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.username, username));
  }

  async postBotMessage(channelId: number, content: string): Promise<Message> {
    const [msg] = await db.insert(messages).values({
      channelId,
      username: "HorizonBot",
      content,
      role: "BOT",
      roleColor: "#3b82f6",
      font: "sans",
      animation: "none",
    }).returning();
    return msg;
  }
}

export const storage = new DatabaseStorage();
