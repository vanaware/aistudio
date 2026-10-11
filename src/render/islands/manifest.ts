/**
 * Pure island names manifest.
 * CRITICAL: This file MUST NOT import Preact, DOM, or UI libraries.
 * It is safe for consumption in Service Worker, Core, and Headless tests.
 */
export const islandNames = ["Counter", "SearchBox", "ThemeToggle"] as const;

export type IslandName = (typeof islandNames)[number];

export const islandNamesSet: Set<string> = new Set(islandNames);
