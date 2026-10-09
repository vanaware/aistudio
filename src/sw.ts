/// <reference lib="webworker" />

import { createBrowserIO } from "./plugin/core/io.ts";
import { createSWFetchHandler } from "./plugin/adapters/sw.ts";
import { islandNamesSet } from "./render/islands/manifest.ts";

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = "mdblog-pwa-v1";
const STATIC_ASSETS: string[] = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg",
  "./beer.min.css",
  "./beer.min.js",
];

const io = createBrowserIO({
  cacheName: "md-wire-v1",
  useIndexedDB: false, // IndexedDB in SW might be limited across origins, CacheStorage is standard in SW
});

const handleDocFetch = createSWFetchHandler(io, {
  basePath: "/docs",
  cacheTTLSeconds: 60,
  islands: islandNamesSet,
  bundlePath: "./main.js",
});

self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS).catch((err: unknown) => {
          console.info("[SW] Static pre-caching notice:", err);
        });
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME && !key.startsWith("md-wire-")) {
              console.info("[SW] Removing outdated cache:", key);
              return caches.delete(key);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event: FetchEvent) => {
  if (event.request.method !== "GET") return;

  // 1. Try documentation interception first (Wire Format)
  const handled = handleDocFetch(event);
  if (handled) {
    return;
  }

  // 2. Network-First strategy with Cache Fallback for navigation and assets.
  // Guarantees zero stale hashed bundles in development and previews.
  event.respondWith(
    (async () => {
      const isNavigate =
        event.request.mode === "navigate" ||
        event.request.headers.get("accept")?.includes("text/html");

      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone()).catch(() => {});
        }
        return networkResponse;
      } catch (_err) {
        // Offline / network failure -> Fallback to Cache
        const cached = await caches.match(event.request);
        if (cached) {
          return cached;
        }

        // For navigation requests when offline, fallback to cached index.html
        if (isNavigate) {
          const fallback =
            (await caches.match("./index.html")) ||
            (await caches.match("./")) ||
            (await caches.match("index.html"));
          if (fallback) {
            return fallback;
          }
        }

        return new Response("Offline", {
          status: 503,
          statusText: "Offline",
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
    })(),
  );
});
