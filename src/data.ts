import { ConversionRule, CompatibilityCheck, MigrationSummary } from './types.ts';

export const migrationSummary: MigrationSummary = {
  repoName: 'vanaware/aistudio',
  repoUrl: 'https://github.com/vanaware/aistudio',
  description: 'Forcing AI Studio to use Deno',
  license: 'MIT License (Copyright (c) 2026 Vanaware)',
  runtimeSource: 'Pure Deno 2 (Native Runtime)',
  runtimeTarget: 'Deno serveDir + Preact JSX + BeerCSS PWA',
  port: 3000,
  host: '0.0.0.0',
};

export const compatibilityChecks: CompatibilityCheck[] = [
  {
    id: 'runtime',
    target: 'Deno Runtime Environment',
    status: 'ready',
    detail: 'Deno 2.9 (V8 15.0, TypeScript 6.0) executing natively inside the container without Node.js or Vite.',
  },
  {
    id: 'bundler',
    target: 'Deno Bundle API',
    status: 'ready',
    detail: 'Using Deno bundle CLI to compile and transpile TypeScript and Preact JSX directly into dist/app.js.',
  },
  {
    id: 'server',
    target: 'Static File Server (serveDir)',
    status: 'ready',
    detail: 'Using jsr:@std/http/file-server serveDir on port 3000 (0.0.0.0) with SPA/PWA fallback.',
  },
  {
    id: 'styling',
    target: 'BeerCSS Material You',
    status: 'ready',
    detail: 'Styling provided exclusively by BeerCSS with no Tailwind or external CSS frameworks.',
  },
  {
    id: 'pwa',
    target: 'Progressive Web App (PWA)',
    status: 'ready',
    detail: 'Service Worker (sw.js) active with cache-first static strategy, offline support, and web manifest.',
  },
];

export const conversionRules: ConversionRule[] = [
  {
    id: 'deno-serve',
    category: 'server',
    denoApi: 'Deno.serve({ port: 3000 }, handler)',
    nodeReplacement: 'jsr:@std/http/file-server serveDir',
    description: 'Serves static files directly from dist/ on port 3000 with zero external dependencies.',
    exampleDeno: `import { serveDir } from "jsr:@std/http/file-server";\nDeno.serve({ port: 3000, hostname: "0.0.0.0" }, (req) => serveDir(req, { fsRoot: "dist" }));`,
    exampleNode: `deno run -A server.ts // Running on http://0.0.0.0:3000`,
  },
  {
    id: 'deno-bundle',
    category: 'fs',
    denoApi: 'deno bundle src/main.tsx -o dist/app.js',
    nodeReplacement: 'Deno Bundle API',
    description: 'Compiles TypeScript and Preact JSX directly into a minified browser bundle.',
    exampleDeno: `deno bundle --platform browser --minify src/main.tsx -o dist/app.js`,
    exampleNode: `dist/app.js generated in ~15ms`,
  },
  {
    id: 'preact-jsx',
    category: 'env',
    denoApi: 'deno.json jsxImportSource',
    nodeReplacement: 'Preact JSX runtime',
    description: 'Deno compiles JSX directly with jsxImportSource: https://esm.sh/preact@10.25.4.',
    exampleDeno: `{\n  "compilerOptions": {\n    "jsx": "react-jsx",\n    "jsxImportSource": "https://esm.sh/preact@10.25.4"\n  }\n}`,
    exampleNode: `Native JSX transpilation with no Babel or Vite!`,
  },
  {
    id: 'pwa-sw',
    category: 'storage',
    denoApi: 'navigator.serviceWorker.register("/sw.js")',
    nodeReplacement: 'Cache API (PWA)',
    description: 'Caches dist/ assets for instantaneous loads and offline capability.',
    exampleDeno: `const cache = await caches.open("deno-pwa-v1");\nawait cache.addAll(["/", "/index.html", "/app.js", "/beer.min.css"]);`,
    exampleNode: `Offline PWA enabled`,
  },
];
