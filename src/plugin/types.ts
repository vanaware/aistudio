import type { WireDoc, WireFragment } from "./wire.ts";

/**
 * Pure I/O abstraction.
 * All side effects (network, cache, file system) are injected through this interface,
 * allowing the core pipeline to be 100% deterministic and free from ambient globals.
 */
export interface IO {
  readText(url: string): Promise<string>;
  cacheGet(key: string): Promise<string | null>;
  cachePut(key: string, val: string): Promise<void>;
  cacheDelete?(key: string): Promise<void>;
}

/**
 * Documentation generation configuration.
 */
export interface DocConfig {
  basePath?: string;
  cacheTTLSeconds?: number;
  islands?: Set<string>;
  cacheName?: string;
}

export type { WireDoc, WireFragment };
