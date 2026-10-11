import type { DocConfig, IO } from "../types.ts";
import type { WireDoc } from "../wire.ts";
import { parseMarkdown } from "./parse.ts";
import { mdastToWire } from "./to-wire.ts";

/**
 * Pure transformation pipeline: takes raw markdown and returns a complete WireDoc.
 */
export function processMarkdown(
  markdown: string,
  url: string,
  islands: Set<string> = new Set(),
): WireDoc {
  const root = parseMarkdown(markdown);
  const { wire, title } = mdastToWire(root, islands);

  return {
    wire,
    title,
    raw: markdown,
    url,
    renderedAt: Date.now(),
  };
}

/**
 * Orchestrates document loading with TTL caching and IO abstraction.
 */
export async function loadDoc(
  url: string,
  io: IO,
  config: DocConfig = {},
): Promise<WireDoc> {
  const ttlMs = (config.cacheTTLSeconds ?? 60) * 1000;
  const cacheKey = `wire:${url}`;

  // 1. Try cache
  try {
    const cachedJson = await io.cacheGet(cacheKey);
    if (cachedJson) {
      const cachedDoc: WireDoc = JSON.parse(cachedJson);
      const isFresh = Date.now() - cachedDoc.renderedAt < ttlMs;
      if (isFresh) {
        return cachedDoc;
      }
    }
  } catch (err) {
    console.warn(`[pipeline] Cache lookup warning for ${url}:`, err);
  }

  // 2. Fetch raw markdown
  const markdown = await io.readText(url);

  // 3. Process into WireDoc
  const islands = config.islands ?? new Set<string>();
  const doc = processMarkdown(markdown, url, islands);

  // 4. Update cache
  try {
    await io.cachePut(cacheKey, JSON.stringify(doc));
  } catch (err) {
    console.warn(`[pipeline] Cache write warning for ${url}:`, err);
  }

  return doc;
}
