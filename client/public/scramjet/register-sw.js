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

        // If a service worker is already controlling this page, we're good
        if (navigator.serviceWorker.controller) return;

        // Unregister any stale service workers before registering fresh
        const existing = await navigator.serviceWorker.getRegistrations();
        for (const reg of existing) {
                await reg.unregister();
        }

        // Register the fresh SW and wait until it's installed + activated
        const registration = await navigator.serviceWorker.register(stockSW);

        // The sw.js calls skipWaiting()+clients.claim(), so it activates immediately.
        // Wait for it to become active so it controls this page before we navigate.
        await new Promise((resolve) => {
                const sw = registration.installing || registration.waiting || registration.active;
                if (!sw || sw.state === "activated") {
                        resolve();
                        return;
                }
                sw.addEventListener("statechange", function onStateChange() {
                        if (sw.state === "activated") {
                                sw.removeEventListener("statechange", onStateChange);
                                resolve();
                        }
                });
        });

        // Wait for this page to be claimed by the new SW
        if (!navigator.serviceWorker.controller) {
                await new Promise((resolve) => {
                        navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
                });
        }
}
