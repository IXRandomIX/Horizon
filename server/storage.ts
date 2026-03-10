import { db } from "./db";
import { dummyTable, channels, messages, users, roles, proxies, pages, reactions, type Channel, type Message, type User, type Role, type Proxy, type Page, type Reaction } from "@shared/schema";
import { eq, and, or, sql } from "drizzle-orm";

export interface IStorage {
  getDummies(): Promise<any[]>;
  createDummy(dummy: any): Promise<any>;
  
  getChannels(username?: string): Promise<Channel[]>;
  createChannel(data: any): Promise<Channel>;
  updateChannel(id: number, data: any): Promise<Channel>;
  deleteChannel(id: number): Promise<void>;
  
  getMessages(channelId: number): Promise<any[]>;
  createMessage(msg: any): Promise<Message>;
  updateMessage(id: number, content: string): Promise<Message>;
  deleteMessage(id: number): Promise<void>;
  
  getUser(username: string): Promise<User | undefined>;
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
      or(
        eq(channels.isPrivate, false),
        sql`${username} = ANY(${channels.allowedUsers})`
      )
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

  async getMessages(channelId: number): Promise<any[]> {
    const msgs = await db.select().from(messages).where(eq(messages.channelId, channelId));
    const enriched = await Promise.all(msgs.map(async (msg) => {
      const user = await this.getUser(msg.username);
      const reactList = await this.getReactions(msg.id);
      return { ...msg, roles: user?.roles || [], reactions: reactList };
    }));
    return enriched;
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
}

export const storage = new DatabaseStorage();
