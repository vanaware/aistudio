import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";
import type { Root } from "npm:@types/mdast@4.0.4";

/**
 * Parses a raw Markdown string into an mdast Root AST.
 * Fully supports CommonMark + GitHub Flavored Markdown (GFM)
 * (tables, task lists, strikethrough, autolinks).
 */
export function parseMarkdown(markdown: string): Root {
  return fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
}
