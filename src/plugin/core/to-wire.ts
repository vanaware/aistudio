import type { Root, RootContent } from "npm:@types/mdast@4.0.4";
import type { Wire, WireComponent, WireElement, WireFragment, WireIsland } from "../wire.ts";
import { sanitizeProps } from "../wire.ts";
import { slugify } from "../detect.ts";

/**
 * Extracts plain text from mdast nodes recursively.
 */
function extractText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as Record<string, unknown>;
  if (typeof n.value === "string") return n.value;
  if (Array.isArray(n.children)) {
    return n.children.map(extractText).join("");
  }
  return "";
}

/**
 * Transforms an mdast Root into a WireFragment tree.
 */
export function mdastToWire(
  root: Root,
  islands: Set<string> = new Set(),
): { wire: WireFragment; title: string } {
  let extractedTitle = "";

  function transform(node: RootContent | Root): Wire | null {
    if (!node || typeof node !== "object") return null;

    switch (node.type) {
      case "root": {
        const children: Wire[] = [];
        for (const child of node.children) {
          const w = transform(child);
          if (w !== null) children.push(w);
        }
        return { t: "f", c: children } as WireFragment;
      }

      case "heading": {
        const text = extractText(node);
        if (node.depth === 1 && !extractedTitle) {
          extractedTitle = text.trim();
        }
        const id = slugify(text);
        const children = transformChildren(node.children);
        return {
          t: "c",
          n: "Heading",
          p: sanitizeProps({ depth: node.depth, id }),
          c: children,
        } as WireComponent;
      }

      case "paragraph": {
        // Suporte a ilhas dinâmicas por arquivo no markdown: ::NomeDoArquivo.js{start: 5} ou ::NomeDoArquivo.js
        const text = extractText(node).trim();
        const islandDirectiveMatch = text.match(/^::([A-Za-z0-9_.-]+)(?:\{([\s\S]*)\})?$/);
        if (islandDirectiveMatch) {
          const rawTarget = islandDirectiveMatch[1];
          const islandFileName = rawTarget.endsWith(".js") ? rawTarget : `${rawTarget}.js`;
          let props: Record<string, unknown> = {};
          if (islandDirectiveMatch[2]) {
            const raw = islandDirectiveMatch[2].trim();
            const wrapped = raw.startsWith("{") ? raw : `{${raw}}`;
            try {
              props = JSON.parse(wrapped);
            } catch {
              try {
                // Quote unquoted object keys (e.g. start: 20 -> "start": 20)
                const quoted = wrapped.replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');
                props = JSON.parse(quoted);
              } catch {
                // Ignore parse error, use empty props
              }
            }
          }
          return {
            t: "i",
            n: islandFileName,
            p: sanitizeProps(props),
            c: [],
          } as WireIsland;
        }

        const children = transformChildren(node.children);
        return {
          t: "c",
          n: "Paragraph",
          p: {},
          c: children,
        } as WireComponent;
      }

      case "blockquote": {
        return {
          t: "c",
          n: "Blockquote",
          p: {},
          c: transformChildren(node.children),
        } as WireComponent;
      }

      case "list": {
        return {
          t: "c",
          n: "List",
          p: sanitizeProps({
            ordered: Boolean(node.ordered),
            start: node.start ?? 1,
          }),
          c: transformChildren(node.children),
        } as WireComponent;
      }

      case "listItem": {
        return {
          t: "c",
          n: "ListItem",
          p: sanitizeProps({
            checked: typeof node.checked === "boolean" ? node.checked : undefined,
          }),
          c: transformChildren(node.children),
        } as WireComponent;
      }

      case "code": {
        // Support code blocks as Islands:
        // ```island:Counter
        // {"start": 10}
        // ```
        const lang = node.lang?.trim() ?? "";
        if (lang.startsWith("island:")) {
          const rawIsland = lang.slice(7).trim();
          const islandFileName = rawIsland.endsWith(".js") ? rawIsland : `${rawIsland}.js`;
          let props: Record<string, unknown> = {};
          if (node.value.trim()) {
            try {
              props = JSON.parse(node.value.trim());
            } catch {
              props = { raw: node.value };
            }
          }
          return {
            t: "i",
            n: islandFileName,
            p: sanitizeProps(props),
            c: [],
          } as WireIsland;
        }

        return {
          t: "c",
          n: "CodeBlock",
          p: sanitizeProps({
            lang: node.lang ?? "",
            meta: node.meta ?? "",
            value: node.value ?? "",
          }),
        } as WireComponent;
      }

      case "inlineCode": {
        return {
          t: "c",
          n: "InlineCode",
          p: sanitizeProps({ value: node.value ?? "" }),
        } as WireComponent;
      }

      case "link": {
        return {
          t: "c",
          n: "Link",
          p: sanitizeProps({
            href: node.url,
            title: node.title ?? undefined,
          }),
          c: transformChildren(node.children),
        } as WireComponent;
      }

      case "image": {
        return {
          t: "c",
          n: "Image",
          p: sanitizeProps({
            src: node.url,
            alt: node.alt ?? "",
            title: node.title ?? undefined,
          }),
        } as WireComponent;
      }

      case "strong": {
        return {
          t: "e",
          n: "strong",
          c: transformChildren(node.children),
        } as WireElement;
      }

      case "emphasis": {
        return {
          t: "e",
          n: "em",
          c: transformChildren(node.children),
        } as WireElement;
      }

      case "delete": {
        return {
          t: "e",
          n: "del",
          c: transformChildren(node.children),
        } as WireElement;
      }

      case "break": {
        return {
          t: "e",
          n: "br",
        } as WireElement;
      }

      case "thematicBreak": {
        return {
          t: "e",
          n: "hr",
        } as WireElement;
      }

      case "table": {
        return {
          t: "c",
          n: "Table",
          p: sanitizeProps({ align: node.align ?? [] }),
          c: transformChildren(node.children),
        } as WireComponent;
      }

      case "tableRow": {
        return {
          t: "c",
          n: "TableRow",
          c: transformChildren(node.children),
        } as WireComponent;
      }

      case "tableCell": {
        return {
          t: "c",
          n: "TableCell",
          c: transformChildren(node.children),
        } as WireComponent;
      }

      case "text": {
        return node.value;
      }

      case "html": {
        // STRICT SAFETY: Raw HTML is discarded immediately
        return null;
      }

      default: {
        return null;
      }
    }
  }

  function transformChildren(children?: unknown[]): Wire[] {
    if (!Array.isArray(children)) return [];
    const result: Wire[] = [];
    for (const child of children) {
      const w = transform(child as RootContent);
      if (w !== null) {
        result.push(w);
      }
    }
    return result;
  }

  const wire = (transform(root) as WireFragment) ?? { t: "f", c: [] };
  return { wire, title: extractedTitle || "Documentation" };
}
