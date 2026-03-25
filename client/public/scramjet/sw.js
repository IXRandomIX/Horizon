importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

// Force-activate immediately so this SW replaces any stale version
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// The proxy URL prefix — MUST match what index.js passes to scramjet.init()
const PROXY_PREFIX = "/scramjet/service/";

// Paths that belong to the scramjet UI itself and must never be proxied
const NEVER_PROXY = ["/scramjet/sw", "/scram/", "/baremux/", "/libcurl/", "/api/", "/uploads/"];

async function handleRequest(event) {
        const url = new URL(event.request.url);
        const path = url.pathname;

        // Always bypass our own static assets
        if (NEVER_PROXY.some((p) => path === p || path.startsWith(p))) {
                return fetch(event.request);
        }

        // Only run scramjet logic for proxy URLs (those under the proxy prefix)
        // Everything else — including the /scramjet/ page itself — passes straight through
        if (!path.startsWith(PROXY_PREFIX)) {
                return fetch(event.request);
        }

        await scramjet.loadConfig();
        if (scramjet.route(event)) {
                return scramjet.fetch(event);
        }
        return fetch(event.request);
}

self.addEventListener("fetch", (event) => {
        event.respondWith(handleRequest(event));
});
