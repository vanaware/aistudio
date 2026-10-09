/**
 * md-transpiler.ts
 *
 * Biblioteca isolada de transpilação de Markdown para Wire Format AST.
 * Agrupa o parser CommonMark + extensões GFM (micromark / mdast) e o pipeline
 * de transformação para nós leves JSON Wire (WireDoc, WireFragment, WireIsland).
 *
 * Pode ser consumida tanto no navegador quanto em workers sem dependência de UI.
 */

export { parseMarkdown } from "../plugin/core/parse.ts";
export { mdastToWire } from "../plugin/core/to-wire.ts";
export {
  processMarkdown,
  loadDoc,
} from "../plugin/core/pipeline.ts";
export {
  createBrowserIO,
  createMemoryIO,
} from "../plugin/core/io.ts";
export {
  createSWFetchHandler,
} from "../plugin/adapters/sw.ts";
export {
  defaultShell,
} from "../plugin/core/shell.ts";
export type {
  IO,
  DocConfig,
} from "../plugin/types.ts";
export {
  slugify,
  isSWControlling,
  resolveDocPath,
} from "../plugin/detect.ts";
export {
  countWireNodes,
  countWireIslands,
  sanitizeProps,
  type WireDoc,
  type Wire,
  type WireElement,
  type WireComponent,
  type WireIsland,
  type WireFragment,
} from "../plugin/wire.ts";
