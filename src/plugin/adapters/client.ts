import type { DocConfig, IO } from "../types.ts";
import type { WireDoc } from "../wire.ts";
import { isSWControlling, resolveDocPath } from "../detect.ts";
import { loadDoc } from "../core/pipeline.ts";

/**
 * Creates a local client-side fetcher that executes the pipeline in-browser
 * when the Service Worker is not active or when offline.
 */
export function createLocalFetcher(io: IO, options: DocConfig = {}) {
  const basePath = options.basePath ?? "/docs";

  return async function localFetch(urlOrPath: string): Promise<WireDoc> {
    const { docPath } = resolveDocPath(urlOrPath, basePath);
    return await loadDoc(docPath, io, options);
  };
}

/**
 * Unified client fetcher with transparent Service Worker & fallback support.
 */
export async function mdFetch(
  urlOrPath: string,
  io: IO,
  options: DocConfig = {},
): Promise<WireDoc> {
  const { docPath } = resolveDocPath(urlOrPath, options.basePath ?? "/docs");

  // 1. If SW is controlling the page, try fetching with Accept: application/json
  if (isSWControlling()) {
    try {
      const response = await fetch(docPath, {
        headers: { Accept: "application/json" },
      });
      if (response.ok) {
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const doc: WireDoc = await response.json();
          return doc;
        }
      }
    } catch (err) {
      console.warn(`[client-adapter] SW fetch failed, falling back to local:`, err);
    }
  }

  // 2. Fallback: process directly via local client pipeline
  const localFetcher = createLocalFetcher(io, options);
  return await localFetcher(docPath);
}
