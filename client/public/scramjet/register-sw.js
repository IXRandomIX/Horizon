"use strict";

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
        // SW is already installed & activated by the inline head script.
        // Just confirm we have a controller; if not, wait for it.
        if (!navigator.serviceWorker.controller) {
                await new Promise((r) =>
                        navigator.serviceWorker.addEventListener("controllerchange", r, { once: true })
                );
        }
}
