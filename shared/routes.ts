import { z } from 'zod';
import { GameSchema, errorSchemas } from './schema'; // Assuming we move them or keep them

export const MessageSchema = z.object({
  id: z.number(),
  channelId: z.number(),
  username: z.string(),
  content: z.string(),
  role: z.string(),
  roleColor: z.string(),
  timestamp: z.string(),
});

export const ChannelSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const api = {
  games: {
    list: {
      method: 'GET' as const,
      path: '/api/games' as const,
      responses: {
        200: z.array(z.any()), // Simplified for now
        500: z.any(),
      },
    },
  },
  chat: {
    channels: {
      list: {
        method: 'GET' as const,
        path: '/api/chat/channels' as const,
        responses: {
          200: z.array(ChannelSchema),
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/chat/channels' as const,
        input: z.object({ name: z.string() }),
        responses: {
          201: ChannelSchema,
        },
      },
    },
    messages: {
      list: {
        method: 'GET' as const,
        path: '/api/chat/channels/:channelId/messages' as const,
        responses: {
          200: z.array(MessageSchema),
        },
      },
      send: {
        method: 'POST' as const,
        path: '/api/chat/channels/:channelId/messages' as const,
        input: z.object({ content: z.string(), username: z.string() }),
        responses: {
          201: MessageSchema,
        },
      },
    },
    auth: {
      login: {
        method: 'POST' as const,
        path: '/api/chat/auth/login' as const,
        input: z.object({ username: z.string(), password: z.string().optional() }),
        responses: {
          200: z.object({ username: z.string(), role: z.string(), isAdmin: z.boolean() }),
          401: z.object({ message: z.string() }),
        },
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
