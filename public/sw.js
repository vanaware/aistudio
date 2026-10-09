/// <reference lib="webworker" />

/**
 * =========================================================================
 * sw.js - Service Worker Padrão do mdBlog
 * =========================================================================
 *
 * Este arquivo demonstra como o Service Worker utiliza a biblioteca
 * empacotada (./lib/md-transpiler.js) para fornecer:
 *
 * 1. 📦 Cache de Assets Estáticos (PWA Offline):
 *    Armazena index.html, folhas de estilo do BeerCSS e o bundle da biblioteca.
 *
 * 2. ⚡ Interceptação Inteligente de Documentação:
 *    Intercepta requisições de artigos (/articles/*.md) e transforma o
 *    Markdown bruto em Wire Format AST diretamente em background.
 *
 * 3. 🛡️ Resiliência Network-First:
 *    Busca atualizações em rede e recorre ao cache local se desconectado.
 */

import {
  createBrowserIO,
  createSWFetchHandler,
} from "./lib/md-transpiler.js";

const CACHE_NAME = "mdblog-pwa-v1";

// Lista de assets fundamentais para operação offline
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg",
  "./beer.min.css",
  "./beer.min.js",
  "./mdblog.js",
  "./main.js",
  "./lib/md-transpiler.js",
];

// Camada de I/O em memória e cache do Service Worker
const io = createBrowserIO({
  cacheName: "md-wire-v1",
  useIndexedDB: false,
});

// Inicializa o interceptador de requisições de artigos usando a biblioteca empacotada
const handleDocFetch = createSWFetchHandler(io, {
  basePath: "/articles",
  cacheTTLSeconds: 60,
  bundlePath: "./mdblog.js",
});

// Instalação: pré-carrega os assets no cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

// Ativação: limpa versões obsoletas do cache
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME && !key.startsWith("md-wire-")) {
              return caches.delete(key);
            }
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Interceptação de requisições
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // 1. Tenta interceptar rota de artigo usando a biblioteca mdBlog
  if (handleDocFetch(event)) {
    return;
  }

  // 2. Estratégia Network-First com Fallback no Cache para assets estáticos e navegação
  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone()).catch(() => {});
        }
        return networkResponse;
      } catch (_err) {
        // Fallback offline a partir do cache local
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // Se for navegação no browser, entrega index.html armazenado no cache
        if (event.request.mode === "navigate") {
          const fallback =
            (await caches.match("./index.html")) ||
            (await caches.match("./"));
          if (fallback) return fallback;
        }

        return new Response("Offline", { status: 503 });
      }
    })(),
  );
});
