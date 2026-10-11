/// <reference lib="webworker" />

import { APP_VERSION } from "./version.ts";

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = `aistudio-pwa-${APP_VERSION || "v1"}`;
const ASSETS_TO_CACHE: string[] = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg",
];

console.log(`[PWA ServiceWorker] Versão do aplicativo: ${APP_VERSION || "dev"}`);

self.addEventListener("install", (event: ExtendableEvent) => {
  console.log(`[PWA ServiceWorker] Instalando cache: ${CACHE_NAME} (v${APP_VERSION || "dev"})`);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err: unknown) => {
        console.warn("[PWA ServiceWorker] Pre-caching partial notice:", err);
      });
    }).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  console.log(`[PWA ServiceWorker] Ativando Service Worker versão: ${APP_VERSION || "dev"}`);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log(`[PWA ServiceWorker] Removendo cache antigo: ${name}`);
            return caches.delete(name);
          }
        }),
      );
    }).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event: FetchEvent) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Cache hit: return cached, update in background if online
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      // Cache miss: fetch from network
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Offline fallback for HTML navigation requests
        if (event.request.headers.get("accept")?.includes("text/html")) {
          return caches.match("/index.html") as Promise<Response>;
        }
        return new Response("Network offline", { status: 503 });
      });
    }),
  );
});
