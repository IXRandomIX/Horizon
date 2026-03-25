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
        prefix: "/scramjet/service/",
        files: {
                wasm: "/scram/scramjet.wasm.wasm",
                all: "/scram/scramjet.all.js",
                sync: "/scram/scramjet.sync.js",
        },
});

scramjet.init();

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

        const url = search(address.value, searchEngine.value);

        let wispUrl =
                (location.protocol === "https:" ? "wss" : "ws") +
                "://" +
                location.host +
                "/wisp/";
        if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
                await connection.setTransport("/libcurl/index.mjs", [
                        { websocket: wispUrl },
                ]);
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
