import { isSWActive } from "./state.ts";

export async function registerServiceWorker(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    console.info("[SW] Service Worker is not supported in this browser.");
    isSWActive.value = false;
    return;
  }

  try {
    // Relative path for GitHub Pages and subfolder support
    const registration = await navigator.serviceWorker.register("./sw.js", {
      scope: "./",
    });

    // Check for updates immediately so stale workers are replaced
    registration.update().catch(() => {});

    if (navigator.serviceWorker.controller) {
      isSWActive.value = true;
    }

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      isSWActive.value = true;
    });

    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    if (registration.installing) {
      registration.installing.addEventListener("statechange", (e) => {
        const sw = e.target as ServiceWorker;
        if (sw.state === "activated") {
          isSWActive.value = true;
        }
      });
    }
  } catch (err) {
    console.warn("[SW] Registration error (normal in some sandboxed environments):", err);
    isSWActive.value = false;
  }
}
