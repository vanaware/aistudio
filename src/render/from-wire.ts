import { h, Fragment, type ComponentChildren, type VNode } from "preact";
import type { Wire, WireComponent, WireElement, WireFragment, WireIsland } from "../plugin/wire.ts";
import { defaultRegistry } from "./registry.js";

export type ComponentRegistry = Record<string, any>;

export interface WireToVNodeOptions {
  registry?: ComponentRegistry;
  islands?: Record<string, any>;
}

/**
 * Transforms a Wire node tree into Preact VNodes without dangerouslySetInnerHTML.
 */
export function wireToVNode(
  wire: Wire,
  options: WireToVNodeOptions = {},
): ComponentChildren {
  const registry = { ...defaultRegistry, ...options.registry };
  const islandRegistry = options.islands ?? {};

  if (wire === null || wire === undefined) {
    return null;
  }

  // Primitive types
  if (typeof wire === "string" || typeof wire === "number" || typeof wire === "boolean") {
    return wire;
  }

  // Array of nodes
  if (Array.isArray(wire)) {
    return wire.map((item, index) =>
      h(Fragment, { key: index }, wireToVNode(item, options))
    );
  }

  // Object node
  const node = wire as WireElement | WireComponent | WireIsland | WireFragment;

  switch (node.t) {
    case "f": {
      const children = (node.c ?? []).map((child, idx) =>
        h(Fragment, { key: idx }, wireToVNode(child, options))
      );
      return h(Fragment, null, children);
    }

    case "e": {
      const children = (node.c ?? []).map((child, idx) =>
        h(Fragment, { key: idx }, wireToVNode(child, options))
      );
      return h(node.n, node.p ?? {}, children);
    }

    case "c": {
      const Comp = registry[node.n] ?? registry.Unknown;
      const children = (node.c ?? []).map((child, idx) =>
        h(Fragment, { key: idx }, wireToVNode(child, options))
      );
      const props = { ...(node.p ?? {}), nodeType: node.n };
      return h(Comp, props, children);
    }

    case "i": {
      // Island Node (Mode B)
      const Comp = islandRegistry[node.n];
      const propsJson = JSON.stringify(node.p ?? {});
      const isMissing = !Comp;

      // Children inside container for initial render / fallback
      let innerContent: ComponentChildren = null;
      if (Comp) {
        try {
          innerContent = h(Comp, node.p ?? {});
        } catch (err) {
          console.warn(`[from-wire] Initial render error for island ${node.n}:`, err);
        }
      }

      if (!innerContent && node.c && node.c.length > 0) {
        innerContent = (node.c ?? []).map((child, idx) =>
          h(Fragment, { key: idx }, wireToVNode(child, options))
        );
      }

      return h("div", {
        "data-island": node.n,
        "data-props": propsJson,
        "data-island-missing": isMissing ? "true" : undefined,
        children: innerContent,
      });
    }

    default: {
      return null;
    }
  }
}
