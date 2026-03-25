importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

// Listen for config messages from the controller page.
// scramjet.init() sends {scramjet$type:"loadConfig", config:{...}} to the SW.
// The library's built-in message handler sets scramjet.config, but only if the
// SW was already listening. This explicit handler ensures we never miss it.
self.addEventListener("message", (event) => {
        if (event.data && event.data.scramjet$type === "loadConfig" && event.data.config) {
                // Set the config directly — same property the library's route() reads.
                scramjet.config = event.data.config;
        }
});

// Force-activate immediately so this SW replaces any stale version
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// The scramjet page and its own static assets must never be intercepted.
// scramjet.route() returns true for ANY URL starting with the prefix (/scramjet/)
// which includes the page itself — so we need to explicitly bypass these.
const SCRAMJET_STATICS = new Set([
        "/scramjet/",
        "/scramjet/index.html",
        "/scramjet/sw.js",
        "/scramjet/index.js",
        "/scramjet/loading.js",
        "/scramjet/search.js",
        "/scramjet/config.js",
        "/scramjet/register-sw.js",
        "/scramjet/index.css",
        "/scramjet/fonts.css",
        "/scramjet/favicon.ico",
        "/scramjet/sj.png",
        "/scramjet/credits.html",
        "/scramjet/404.html",
        "/scramjet/fetch-transport.js",
]);

// Paths that should always pass through regardless of scramjet config
const PASS_THROUGH_PREFIXES = ["/scram/", "/baremux/", "/libcurl/", "/api/", "/uploads/", "/scramjet/fonts/"];

async function handleRequest(event) {
        const path = new URL(event.request.url).pathname;

        if (SCRAMJET_STATICS.has(path)) return fetch(event.request);
        if (PASS_THROUGH_PREFIXES.some((p) => path.startsWith(p))) return fetch(event.request);

        await scramjet.loadConfig();

        // Guard: if config is still null (e.g. fresh install before init() wrote to IDB),
        // skip routing to avoid a TypeError in route(). The config message handler above
        // and the await in the submit handler prevent this in normal use.
        if (!scramjet.config) {
                return fetch(event.request);
        }

        if (scramjet.route(event)) {
                return scramjet.fetch(event);
        }
        return fetch(event.request);
}

self.addEventListener("fetch", (event) => {
        event.respondWith(handleRequest(event));
});
