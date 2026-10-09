import type { WireDoc } from "../wire.ts";

/**
 * Escapes characters that could terminate or corrupt a script tag.
 */
function safeJsonSerialize(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Generates the full HTML shell for first-paint navigation.
 * Emits BeerCSS, manifest, and an inline <script id="__md_wire"> payload for zero-latency initial rendering.
 */
export function defaultShell(doc: WireDoc, bundlePath = "./mdblog.js"): string {
  const serializedWire = safeJsonSerialize(doc);

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(doc.title)} - AiStudio Docs</title>
    <meta name="description" content="Documentation powered by Service Worker, Wire Format and Preact Islands" />
    <meta name="theme-color" content="#6750a4" />

    <!-- Web App Manifest -->
    <link rel="manifest" href="./manifest.json" />

    <!-- Favicon SVG Inline -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📑</text></svg>" />

    <!-- BeerCSS Framework v5.0.3 -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/beercss@5.0.3/dist/cdn/beer.min.css" />
    <script type="module" src="https://cdn.jsdelivr.net/npm/beercss@5.0.3/dist/cdn/beer.min.js"></script>

    <!-- Material Dynamic Colors & Fonts -->
    <script type="module" src="https://cdn.jsdelivr.net/npm/material-dynamic-colors@1.1.4/dist/cdn/material-dynamic-colors.min.js"></script>
    <script type="module" src="https://cdn.jsdelivr.net/npm/material-dynamic-fonts@0.0.3/dist/cdn/material-dynamic-fonts.min.js?font=Material Symbols Outlined&selector=i"></script>

    <!-- Pre-rendered Wire Format JSON -->
    <script id="__md_wire" type="application/json">${serializedWire}</script>
  </head>
  <body class="auto">
    <div id="app"></div>
    <script type="module" src="${bundlePath}"></script>
  </body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
