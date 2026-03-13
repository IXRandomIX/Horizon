# Horizon — Platform Overview

## Tech Stack
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui + Wouter + TanStack Query + Framer Motion
- **Backend**: Express.js + Drizzle ORM + PostgreSQL
- **Auth**: Custom session via localStorage (`horizon_user`)

## Key Architecture Notes

### Authentication
- Global auth gate: if not logged in, only `LoginPage` is rendered.
- `AuthProvider` in `client/src/context/auth.tsx` stores user in localStorage.
- Admin: username `RandomIX`, password hardcoded in `server/routes.ts` (`ADMIN_USER`/`ADMIN_PASS`). **Never change these.**

### Notifications
- `NotificationsProvider` in `client/src/context/notifications.tsx` polls every 6 seconds.
- Tracks `lastSeen` timestamps in localStorage for Global Inbox and Chat.
- Badge counts shown in sidebar for unread items.

### Pages
- `/announcements` — Announcements
- `/chat` — Horizon Chat (multi-channel with real-time polling)
- `/ai` — Horizon AI (Gemini-powered chat with image/file support)
- `/global-inbox` — Global Inbox (only RandomIX can post; all users see)
- `/partners` — Partners (only RandomIX can edit)
- `/games` — Games portal
- `/browser` — Proxy browser
- `/proxies` — Proxy list
- `/tools` — Media & tools
- `/gatekeep-os` — GatekeepOS
- `/the-wall` — The Wall
- `/profile` — Profile editor (display name, font, bio, avatar, banner)
- `/friends` — Friends list
- `/inbox` — Friend request inbox
- `/dms/:username` — Direct messages
- `/users` — User directory with search

### Social Features
- Friends, DMs, blocking all stored in PostgreSQL
- Profile modal accessible from clicking usernames in chat

### DB Tables
- `users`, `channels`, `messages`, `roles`, `reactions`
- `friendships`, `blocked_users`, `direct_messages`
- `global_messages` — Global Inbox posts
- `proxies`, `pages`

## Running
```
npm run dev       # Start dev server (port 5000)
npm run db:push   # Push schema changes to DB
```
