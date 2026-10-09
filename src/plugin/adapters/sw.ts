/// <reference lib="webworker" />

import type { DocConfig, IO } from "../types.ts";
import { resolveDocPath } from "../detect.ts";
import { loadDoc } from "../core/pipeline.ts";
import { defaultShell } from "../core/shell.ts";

export interface SWPluginOptions extends DocConfig {
  bundlePath?: string;
}

/**
 * Creates a fetch event handler for the Service Worker.
 */
export function createSWFetchHandler(io: IO, options: SWPluginOptions = {}) {
  const basePath = options.basePath ?? "/docs";
  const bundlePath = options.bundlePath ?? "./mdblog.js";

  return function handleFetch(event: FetchEvent): boolean {
    const request = event.request;

    // 1. Only intercept GET requests
    if (request.method !== "GET") {
      return false;
    }

    const url = new URL(request.url);

    // 2. Anti-recursion: pass through raw markdown fetches
    if (url.searchParams.has("_md_raw")) {
      return false;
    }

    // 3. Skip range requests (media, audio, video)
    if (request.headers.has("Range")) {
      return false;
    }

    // 4. Check if request targets documentation
    const { docPath, isDoc } = resolveDocPath(url.pathname, basePath);
    if (!isDoc) {
      return false;
    }

    // 5. Intercept and handle
    event.respondWith(
      (async () => {
        try {
          const doc = await loadDoc(docPath, io, options);

          const accept = request.headers.get("Accept") ?? "";

          // Content negotiation:
          // If browser navigation (text/html): return HTML shell with embedded wire
          if (accept.includes("text/html")) {
            const html = defaultShell(doc, bundlePath);
            return new Response(html, {
              status: 200,
              headers: {
                "Content-Type": "text/html; charset=utf-8",
                "X-Rendered-By": "SW-Wire-Format",
                "X-Doc-Title": encodeURIComponent(doc.title),
              },
            });
          }

          // If SPA request (application/json): return pure WireDoc JSON
          return new Response(JSON.stringify(doc), {
            status: 200,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "X-Rendered-By": "SW-Wire-Format",
              "X-Doc-Title": encodeURIComponent(doc.title),
            },
          });
        } catch (err) {
          console.error(`[sw-adapter] Error processing ${url.pathname}:`, err);
          return new Response(
            JSON.stringify({
              error: err instanceof Error ? err.message : String(err),
              url: url.pathname,
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      })(),
    );

    return true;
  };
}
