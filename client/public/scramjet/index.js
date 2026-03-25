"use strict";

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");

const navbar = document.getElementById("sj-navbar");
const navBack = document.getElementById("nav-back");
const navForward = document.getElementById("nav-forward");
const navReload = document.getElementById("nav-reload");
const navHome = document.getElementById("nav-home");
const navUrl = document.getElementById("nav-url");

const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
        files: {
                wasm: "/scram/scramjet.wasm.wasm",
                all: "/scram/scramjet.all.js",
                sync: "/scram/scramjet.sync.js",
        },
});

// IMPORTANT: init() is async — store the promise so we can await it before
// the first navigation. Without this, the IndexedDB config write races with
// the service worker's loadConfig() read, causing route() to return false on
// the very first proxy request (consistently broken on fresh production visits).
const scramjetInitPromise = scramjet.init();

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

let activeFrame = null;

function showNavbar() {
        navbar.style.display = "flex";
}

function hideNavbar() {
        navbar.style.display = "none";
}

function goHome() {
        if (activeFrame) {
                activeFrame.frame.remove();
                activeFrame = null;
        }
        hideNavbar();
        document.getElementById("main-content").style.opacity = "1";
        document.getElementById("main-content").style.pointerEvents = "auto";
}

navBack.addEventListener("click", () => {
        if (activeFrame) activeFrame.back();
});

navForward.addEventListener("click", () => {
        if (activeFrame) activeFrame.forward();
});

navReload.addEventListener("click", () => {
        if (activeFrame) activeFrame.reload();
});

navHome.addEventListener("click", goHome);

form.addEventListener("submit", async (event) => {
        event.preventDefault();

        try {
                await registerSW();
        } catch (err) {
                error.textContent = "Failed to register service worker.";
                errorCode.textContent = err.toString();
                throw err;
        }

        // Ensure scramjet.init() has fully completed (IDB config written + config
        // message sent to SW) before we navigate. This is the production fix:
        // without this await the SW's loadConfig() reads an empty IDB on first visit.
        try {
                await scramjetInitPromise;
        } catch (err) {
                console.warn("scramjet.init() failed, proceeding anyway:", err);
        }

        // Re-send the config to the SW controller directly, in case it started
        // before init() completed and therefore missed the postMessage.
        if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                        scramjet$type: "loadConfig",
                        config: scramjet.config,
                });
        }

        const url = search(address.value, searchEngine.value);

        // Inline the transport directly so no external import() is needed in the SharedWorker.
        // Using import() inside new AsyncFunction() fails silently in production Chrome.
        const TRANSPORT_NAME = "server-fetch-transport-v1";
        if ((await connection.getTransport()) !== TRANSPORT_NAME) {
                await connection.setManualTransport(`
                        class ServerFetchTransport {
                                ready = true;
                                async request(remote, method, body, headers, signal) {
                                        let headersObj = {};
                                        if (headers) {
                                                if (typeof headers[Symbol.iterator] === "function") {
                                                        for (const [k, v] of headers) headersObj[k] = v;
                                                } else {
                                                        Object.assign(headersObj, headers);
                                                }
                                        }
                                        let bodyData;
                                        const m = (method || "GET").toUpperCase();
                                        if (body && !["GET", "HEAD"].includes(m)) {
                                                if (body instanceof ReadableStream) {
                                                        const chunks = [];
                                                        const reader = body.getReader();
                                                        for (;;) {
                                                                const { done, value } = await reader.read();
                                                                if (done) break;
                                                                chunks.push(value);
                                                        }
                                                        const total = chunks.reduce((n, c) => n + c.length, 0);
                                                        bodyData = new Uint8Array(total);
                                                        let off = 0;
                                                        for (const c of chunks) { bodyData.set(c, off); off += c.length; }
                                                } else if (body instanceof ArrayBuffer) {
                                                        bodyData = new Uint8Array(body);
                                                } else {
                                                        bodyData = body;
                                                }
                                        }
                                        const resp = await fetch("/api/proxy-fetch", {
                                                method: "POST",
                                                headers: {
                                                        "X-Proxy-URL": remote.toString(),
                                                        "X-Proxy-Method": m,
                                                        "X-Proxy-Headers": JSON.stringify(headersObj),
                                                },
                                                body: bodyData,
                                                signal,
                                        });
                                        const status = parseInt(resp.headers.get("X-Proxy-Status") || "200");
                                        const statusText = resp.headers.get("X-Proxy-StatusText") || "";
                                        let proxyHeaders = {};
                                        try { proxyHeaders = JSON.parse(resp.headers.get("X-Proxy-Headers") || "{}"); } catch (e) {}
                                        return { status, statusText, headers: proxyHeaders, body: resp.body };
                                }
                                connect(url, protocols, requestHeaders, onopen, onmessage, onclose, onerror) {
                                        onerror("WebSocket tunneling not supported in server-fetch mode");
                                        return [() => {}, () => {}];
                                }
                        }
                        return [ServerFetchTransport, "${TRANSPORT_NAME}"];
                `, []);
        }

        // Remove any existing frame
        if (activeFrame) {
                activeFrame.frame.remove();
        }

        const frame = scramjet.createFrame();
        frame.frame.id = "sj-frame";
        document.body.appendChild(frame.frame);
        frame.go(url);

        activeFrame = frame;
        showNavbar();

        // Update URL display and address bar on navigation
        frame.addEventListener("urlchange", (e) => {
                const realUrl = e.url ? e.url.toString() : "";
                navUrl.textContent = realUrl;
                address.value = realUrl;
        });
});
