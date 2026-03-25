"use strict";
const stockSW = "./sw.js";

const swAllowedHostnames = ["localhost", "127.0.0.1"];

async function registerSW() {
        if (!navigator.serviceWorker) {
                if (
                        location.protocol !== "https:" &&
                        !swAllowedHostnames.includes(location.hostname)
                )
                        throw new Error("Service workers cannot be registered without https.");

                throw new Error("Your browser doesn't support service workers.");
        }

        // Unregister any old service workers that have the broad /scramjet/ scope
        // (from a previous session before the scope was narrowed to ./service/)
        const existing = await navigator.serviceWorker.getRegistrations();
        for (const reg of existing) {
                if (reg.scope.endsWith("/scramjet/") && !reg.scope.endsWith("/scramjet/service/")) {
                        await reg.unregister();
                }
        }

        // Register only for the /scramjet/service/ prefix so the SW never
        // intercepts page assets (index.html, index.js, /scram/, etc.)
        await navigator.serviceWorker.register(stockSW, { scope: "./service/" });
}
