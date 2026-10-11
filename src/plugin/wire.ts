/**
 * Wire Format types and serialization utilities.
 * Pure TypeScript definitions, 100% JSON-serializable.
 */

export type Wire =
  | string
  | number
  | boolean
  | null
  | Wire[]
  | WireElement
  | WireComponent
  | WireIsland
  | WireFragment;

/**
 * Intrinsic HTML element representation (e.g. strong, em, del, br, hr).
 */
export interface WireElement {
  t: "e";
  n: string;
  p?: Record<string, unknown>;
  c?: Wire[];
}

/**
 * Named static component resolved by client component registry (e.g. Heading, Paragraph, CodeBlock).
 */
export interface WireComponent {
  t: "c";
  n: string;
  p?: Record<string, unknown>;
  c?: Wire[];
}

/**
 * Interactive Island (Mode B) hydrated on demand on the client.
 */
export interface WireIsland {
  t: "i";
  n: string;
  p?: Record<string, unknown>;
  c?: Wire[];
}

/**
 * Fragment grouping children without creating a DOM container.
 */
export interface WireFragment {
  t: "f";
  c?: Wire[];
}

/**
 * Complete document returned by the wire pipeline.
 */
export interface WireDoc {
  wire: WireFragment;
  title: string;
  raw: string;
  url: string;
  renderedAt: number;
}

/**
 * Sanitizes props to ensure they are 100% JSON serializable.
 * Strips functions, symbols, and circular references.
 */
export function sanitizeProps(p?: Record<string, unknown>): Record<string, unknown> {
  if (!p || typeof p !== "object") return {};
  try {
    return JSON.parse(JSON.stringify(p));
  } catch {
    return {};
  }
}

/**
 * Counts total nodes in a Wire tree for telemetry.
 */
export function countWireNodes(wire: Wire): number {
  if (!wire || typeof wire !== "object") return 1;
  if (Array.isArray(wire)) {
    let sum = 1;
    for (const item of wire) {
      sum += countWireNodes(item);
    }
    return sum;
  }
  let count = 1;
  if ("c" in wire && Array.isArray(wire.c)) {
    for (const child of wire.c) {
      count += countWireNodes(child);
    }
  }
  return count;
}

/**
 * Counts interactive islands in a Wire tree.
 */
export function countWireIslands(wire: Wire): number {
  if (!wire || typeof wire !== "object") return 0;
  if (Array.isArray(wire)) {
    let sum = 0;
    for (const item of wire) {
      sum += countWireIslands(item);
    }
    return sum;
  }
  let count = wire.t === "i" ? 1 : 0;
  if ("c" in wire && Array.isArray(wire.c)) {
    for (const child of wire.c) {
      count += countWireIslands(child);
    }
  }
  return count;
}

