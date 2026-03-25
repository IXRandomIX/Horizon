importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

// Force-activate immediately so this SW replaces any stale version
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// Paths that belong to the scramjet UI itself and must never be proxied
const NEVER_PROXY = ["/scramjet", "/scram/", "/baremux/", "/libcurl/", "/api/", "/uploads/"];

async function handleRequest(event) {
        const url = new URL(event.request.url);

        // Pass through all requests for our own scramjet assets
        if (NEVER_PROXY.some((p) => url.pathname === p || url.pathname.startsWith(p))) {
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
