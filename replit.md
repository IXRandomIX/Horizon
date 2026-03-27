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

### HorizonTube Video Streaming
- **Architecture**: yt-dlp (server-side) → extract signed YouTube CDN URL → proxy all bytes through `/api/yt-stream/:videoId` → HTML5 `<video>` tag
- **Content-blocker bypass**: Browser only contacts the app's own domain. YouTube/googlevideo.com URLs are never exposed to the browser.
- **yt-dlp** is installed as a system dependency. It handles all YouTube auth/signing.
- Format selector: `best[height<=720][ext=mp4]/best[ext=mp4]/...` — always picks a single combined (progressive) URL, never DASH (which would require two URLs).
- Stream URLs cached 3 hours; on 403/410 the cache is cleared and the browser auto-retries.
- Frontend retries up to 2 times automatically on video error before showing error UI.
- **Do NOT revert to Invidious `/latest_version` or youtubei.js** — both have proven unreliable.

### Performance (Code Splitting)
- All page components in `App.tsx` use `React.lazy()` + `Suspense` for code splitting.
- Only the Login page, AppSidebar, and MusicPlayer are in the initial bundle.
- Each page loads its JS chunk only when the user navigates to it — prevents "Page Unresponsive" on first load.

### Music Player localStorage
- Tracks saved to localStorage via `slimTrack()` — only 7 essential fields kept (id, title, artwork_url, duration, permalink_url, sourceUrl, user). Drops ~45 unused SoundCloud fields.
- History limited to 100 tracks. Total localStorage footprint: ~20KB max (vs ~1.5MB before).
- On mount, existing bloated localStorage data is sanitized and re-saved automatically.
- Null-user guard in `artistStats` IIFE prevents crashes from corrupted history.

## Running
```
npm run dev       # Start dev server (port 5000)
npm run db:push   # Push schema changes to DB
```
