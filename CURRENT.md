# 🎯 Prompt completo — Gerador de documentação estilo Docsify com Service Worker + Wire Format

> Copie e cole o bloco abaixo em outra IA. Ele é autossuficiente: descreve objetivo, decisões arquiteturais já tomadas, contratos, estrutura de arquivos, fluxos e critérios de aceitação.

---

## 🧭 Contexto e objetivo

Preciso que você gere **o código-fonte completo, em TypeScript, de um gerador de documentação estático** inspirado no Docsify, mas com arquitetura moderna. O projeto roda em **Deno**, é empacotado com `jsr:@vanaware/buildit/esbuild` para uso no browser, e usa **Preact + htm + Signals + BeerCSS** na UI.

A grande sacada arquitetural é: **um Service Worker intercepta requisições de páginas de documentação, lê o Markdown correspondente, converte para uma AST mdast, e devolve ao cliente um "wire format" — uma árvore JSON que descreve *qual componente* renderizar em cada nó, sem HTML e sem `dangerouslySetInnerHTML`.** O cliente então materializa essa árvore em VNodes Preact via um *registry* de componentes.

**Requisito crítico:** todo o pipeline (parsing Markdown → AST → wire) deve rodar **tanto no Service Worker quanto no cliente**, com o mesmo código. Se o SW não estiver registrado ou não controlar a URL, o cliente executa o mesmo pipeline localmente, de forma transparente para o chamador.

---

## 🛠 Stack obrigatória

| Item | Pacote / versão |
|---|---|
| Runtime dev | Deno 2.x |
| Bundler | `jsr:@vanaware/buildit/esbuild` |
| Import map | `deno.json` |
| UI | `preact@^10.24`, `htm@^3.1` (via `htm/preact`), `@preact/signals@^2` |
| CSS | BeerCSS via CDN (`beercss@3`) |
| Parser Markdown | `mdast-util-from-markdown@^2`, `mdast-util-gfm@^3`, `micromark-extension-gfm@^3`, `@types/mdast@^4` |
| Servidor dev | `jsr:@std/http/file-server` |

**Regras rígidas:**
- Nenhum uso de `dangerouslySetInnerHTML` em lugar algum.
- Nenhum uso de `eval`, `new Function`, ou carregamento de JS remoto dinâmico.
- O Service Worker **não pode importar Preact, htm ou qualquer coisa de UI**.
- O core do parser **não pode tocar em globais** (`fetch`, `caches`, `navigator`, `self`, `window`) — tudo isso é injetado via uma interface `IO`.

---

## 🏗 Arquitetura em 3 camadas

```
┌─────────────────────────────────────────────────────────┐
│  CORE  (puro, roda em SW + cliente + Deno + testes)     │
│  ─ parse Markdown → mdast                               │
│  ─ mdast → Wire (formato JSON serializável)             │
│  ─ pipeline(Request) → Response                         │
│  ─ IO injetado (nunca usa fetch/caches direto)          │
└─────────────────────────────────────────────────────────┘
                    ▲                    ▲
                    │                    │
      ┌─────────────┴─────────┐   ┌──────┴────────────────┐
      │  ADAPTER SW           │   │  ADAPTER CLIENT       │
      │  ─ FetchEvent         │   │  ─ window.fetch       │
      │  ─ caches.open()      │   │  ─ caches.open()      │
      │  ─ skipWaiting/claim  │   │  ─ isSWControlling()  │
      │  ─ shell HTML inline  │   │  ─ fallback local     │
      └───────────────────────┘   └───────────────────────┘
```

**Cache compartilhado:** os dois adapters usam **o mesmo `cacheName`** (ex.: `"md-wire-v1"`). O Cache Storage é compartilhado entre SW e página, então um serve o outro.

---

## 📐 Contrato do Wire Format

Serializável em JSON puro. Nunca contém funções, VNodes, ou código.

```ts
export type Wire =
  | string
  | number
  | boolean
  | null
  | Wire[]
  | WireElement
  | WireComponent
  | WireFragment;

/** Elemento intrínseco: <h1>, <p>, <em>, <a>… */
export interface WireElement {
  t: "e";
  n: string;                    // tag HTML
  p?: Record<string, unknown>;  // props
  c?: Wire[];                   // children
}

/** Componente nomeado: resolvido no cliente via registry. */
export interface WireComponent {
  t: "c";
  n: string;                    // nome do componente ("Heading", "CodeBlock", …)
  p?: Record<string, unknown>;
  c?: Wire[];
}

/** Agrupamento sem wrapper. */
export interface WireFragment {
  t: "f";
  c?: Wire[];
}

export interface WireDoc {
  wire: WireFragment;
  title: string;
  raw: string;        // markdown cru (para debug/cache key)
  url: string;        // caminho .md resolvido
  renderedAt: number; // Date.now()
}
```

**Mapeamento mdast → wire (nomes canônicos):**

| mdast | wire |
|---|---|
| `heading` (depth n) | `{ t:"c", n:"Heading", p:{depth:n}, c:[…] }` |
| `paragraph` | `{ t:"c", n:"Paragraph", c:[…] }` |
| `blockquote` | `{ t:"c", n:"Blockquote", c:[…] }` |
| `list` | `{ t:"c", n:"List", p:{ordered,start}, c:[…] }` |
| `listItem` | `{ t:"c", n:"ListItem", p:{checked}, c:[…] }` |
| `code` (bloco) | `{ t:"c", n:"CodeBlock", p:{lang,value} }` |
| `inlineCode` | `{ t:"c", n:"InlineCode", p:{value} }` |
| `link` | `{ t:"c", n:"Link", p:{href,title}, c:[…] }` |
| `image` | `{ t:"c", n:"Image", p:{src,alt,title} }` |
| `strong` | `{ t:"e", n:"strong", c:[…] }` |
| `emphasis` | `{ t:"e", n:"em", c:[…] }` |
| `delete` | `{ t:"e", n:"del", c:[…] }` |
| `break` | `{ t:"e", n:"br" }` |
| `thematicBreak` | `{ t:"e", n:"hr" }` |
| `table` | `{ t:"c", n:"Table", p:{align}, c:[TableHead, TableBody] }` |
| `tableRow` | `{ t:"c", n:"TableRow" }` |
| `tableCell` | `{ t:"c", n:"TableCell", p:{align} }` |
| `text` | string crua |
| `html` | **descartado** (retorna `null`) |
| desconhecido | `{ t:"c", n:"Unknown", p:{nodeType} }` |

---

## 📁 Estrutura de arquivos

```
.
├── deno.json
├── build.ts
├── index.html
├── src/
│   ├── docs.ts                    ← instancia mdFetch com config
│   ├── main.ts                    ← entrypoint SPA
│   ├── register-sw.ts
│   ├── sw.ts                      ← entrypoint do Service Worker
│   ├── state.ts                   ← signals globais
│   ├── router.ts
│   ├── styles.css
│   │
│   ├── plugin/                    ← PACOTE PUBLICÁVEL (JSR-ready)
│   │   ├── mod.ts                 ← barrel público
│   │   ├── types.ts               ← contratos (IO, config, WireDoc)
│   │   ├── wire.ts                ← tipo Wire
│   │   ├── detect.ts              ← isSWControlling, hasSW, matchesUrl, defaultResolve
│   │   ├── core/
│   │   │   ├── parse.ts           ← md → mdast + extractTitle
│   │   │   ├── to-wire.ts         ← mdast → wire
│   │   │   ├── respond.ts         ← WireDoc → Response (content-negotiation)
│   │   │   ├── pipeline.ts        ← createPipeline(cfg, io, opts)
│   │   │   ├── shell.ts           ← HTML shell com wire inline
│   │   │   └── io.ts              ← createCacheIO(cacheName)
│   │   └── adapters/
│   │       ├── sw.ts              ← createMarkdownPlugin(cfg)
│   │       └── client.ts          ← createMdFetcher(cfg)
│   │
│   ├── render/                    ← lado cliente (Preact)
│   │   ├── from-wire.ts           ← wireToVNode(wire, registry)
│   │   └── registry.tsx           ← componentes padrão
│   │
│   └── components/
│       ├── App.ts
│       ├── Navbar.ts
│       ├── Sidebar.ts
│       └── Content.ts
│
└── docs/
    ├── README.md
    ├── _sidebar.md
    ├── _navbar.md
    └── guia.md
```

---

## 📜 Especificação de cada módulo

### `src/plugin/types.ts`

```ts
export type Matcher =
  | RegExp
  | string
  | ((url: URL, request: Request) => boolean);

export type Resolver = (url: URL) => string | null;

export interface IO {
  readText(path: string): Promise<string | null>;   // null = 404
  cacheGet(key: string): Promise<WireDoc | null>;
  cachePut(key: string, doc: WireDoc): Promise<void>;
}

export interface MarkdownPluginConfig {
  match: Matcher;
  resolve?: Resolver;                    // default: defaultResolve
  parse?: (md: string) => Root;          // default: parseMarkdown
  titleFrom?: (ast: Root) => string;     // default: extractTitle
  cacheTTL?: number;                     // segundos; 0 desliga. default 3600
  cacheName?: string;                    // default "md-wire-v1"
  preferSW?: boolean;                    // só no client. default true
}
```

### `src/plugin/core/io.ts`

```ts
export function createCacheIO(cacheName: string): IO;
```
- `readText`: `fetch(path, {cache:"no-cache"})` → `.text()` ou `null` em !ok.
- `cacheGet`: `caches.open(cacheName).match(key)` → `.json()` ou `null`.
- `cachePut`: `cache.put(key, new Response(JSON.stringify(doc), {headers:{"content-type":"application/json"}}))`.
- **Guardar contra ausência de `caches`** (fallback no-op).

### `src/plugin/core/parse.ts`

```ts
export function parseMarkdown(md: string): Root;   // usa fromMarkdown + GFM
export function extractTitle(ast: Root): string;   // primeiro heading depth=1, senão "Documento"
```

### `src/plugin/core/to-wire.ts`

```ts
export function renderToWire(ast: Root): WireFragment;
```
- Aplica a tabela de mapeamento acima.
- `html` retorna `null` (descartado por segurança).
- Desconhecido → `Unknown`.

### `src/plugin/core/respond.ts`

```ts
export interface RespondOptions { shell?: (doc: WireDoc) => string; }

export function respond(doc: WireDoc, accept: string, opts: RespondOptions): Response;
export function notFound(msg: string): Response;
```

- Se `accept` inclui `application/json`:
  - `content-type: application/json; charset=utf-8`
  - `cache-control: no-store`
  - Headers `x-rendered-at`, `x-title`, `x-source`.
- Senão, se `opts.shell` existe:
  - `content-type: text/html; charset=utf-8`
  - `cache-control: public, max-age=…` (usar `cacheTTL`)
  - Mesmos headers `x-*`.
- Senão (client puro): retorna `406` com JSON do `WireDoc`.

### `src/plugin/core/shell.ts`

```ts
export function defaultShell(doc: WireDoc): string;
```
- HTML completo, `<html lang="pt-BR">`.
- BeerCSS via CDN.
- `<div id="app"></div>`.
- **Wire embutido:** `<script id="__md_wire" type="application/json">${safeJson}</script>` onde `safeJson = JSON.stringify(doc).replace(/</g, "\\u003c")`.
- `<script type="module" src="/dist/bundle.js">`.
- Título escapado (`&<>"'`).

### `src/plugin/core/pipeline.ts`

```ts
export function createPipeline(
  cfg: MarkdownPluginConfig,
  io: IO,
  respondOpts?: RespondOptions,
): {
  handle(request: Request): Promise<Response>;
  load(url: URL): Promise<WireDoc | Response>;   // para pré-render/testes
};
```

**Lógica de `loadDoc`:**
1. `resolve(url)` → path. `null` → `notFound`.
2. Se `cacheTTL > 0`: `io.cacheGet(path)`; se `now - doc.renderedAt < cacheTTL*1000`, retorna cacheado.
3. `io.readText(path)` → raw. `null` → `notFound`.
4. `parse(raw)` → AST. `titleFrom(ast)`. `renderToWire(ast)` → `WireDoc`.
5. Se `cacheTTL > 0`: `io.cachePut(path, doc)`.
6. Retorna `doc`.

**Lógica de `handle`:** `respond(doc, accept, respondOpts)`.

### `src/plugin/detect.ts`

```ts
export function isSWControlling(url: URL | string): boolean;
export function hasSW(): boolean;
export function matchesUrl(url: URL, req: Request, m: Matcher): boolean;
export function defaultResolve(url: URL): string | null;
```
- `isSWControlling`: verifica se `navigator.serviceWorker.controller` existe e se a URL está dentro do scope.
- `defaultResolve`: `.md` → mantém; `/foo/` → `/foo/README.md`; `/foo` → `/foo.md`.

### `src/plugin/adapters/sw.ts`

```ts
export function createMarkdownPlugin(cfg: MarkdownPluginConfig): {
  fetchHandler: (e: FetchEvent) => void;
  installHandler: () => void;
  activateHandler: (e: ExtendableEvent) => void;
};
```

- Cria `IO` interno que:
  - `readText` adiciona query param `_md_raw=1` para evitar recursão.
  - `cacheGet`/`cachePut` usam `cacheName`.
- Cria `pipeline = createPipeline(cfg, io, { shell: defaultShell })`.
- `fetchHandler`: filtra método `GET`, ignora requests com header `range`, ignora URLs com `_md_raw`, ignora o que não casa com `match`, e chama `event.respondWith(pipeline.handle(event.request))`.
- `installHandler`: `self.skipWaiting()`.
- `activateHandler`: apaga caches que começam com `md-wire-` mas ≠ `cacheName`; `self.clients.claim()` em `event.waitUntil`.

### `src/plugin/adapters/client.ts`

```ts
export function createMdFetcher(cfg: MarkdownPluginConfig):
  (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export function createLocalFetcher(cfg: MarkdownPluginConfig):
  (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
```

- Cria `IO` via `createCacheIO(cacheName)` — **sem `_md_raw`** (não há recursão).
- `createMdFetcher`: normaliza `Request`; se `match` falha ou método ≠ GET → `fetch(req)`; se `preferSW !== false && isSWControlling(url)` → `fetch(req)` (SW responde); senão → `pipeline.handle(req)`.
- `createLocalFetcher`: sempre pipeline local.

### `src/plugin/mod.ts` — barrel

Reexporta: `createMarkdownPlugin`, `createMdFetcher`, `createLocalFetcher`, `createPipeline`, `createCacheIO`, `isSWControlling`, `hasSW`, e os tipos `MarkdownPluginConfig`, `WireDoc`, `IO`, `Matcher`, `Resolver`, `Wire`, `WireElement`, `WireComponent`, `WireFragment`.

### `src/render/from-wire.ts`

```ts
export type Registry = Record<string, ComponentType<any>>;
export function wireToVNode(w: Wire, registry: Registry): ComponentChildren;
```
- `string|number|boolean` → direto/string.
- Array → `.map()`.
- `t:"e"` → `h(w.n, w.p, ...children)`.
- `t:"c"` → se `registry[w.n]` existe, `h(Comp, w.p, ...children)`; senão, fallback visual `h("span", {class:"md-unknown"}, "[Nome]")`.
- `t:"f"` → `h(Fragment, null, ...children)`.

### `src/render/registry.tsx`

Implementar componentes Preact (via `htm`) para **todos** os nomes canônicos:

- `Heading` → tag dinâmica `h1..h6` + slug de id + âncora `#`.
- `Paragraph`, `Blockquote`, `List`, `ListItem` (com checkbox GFM se `checked != null`).
- `InlineCode`, `CodeBlock` (com botão "copiar" usando `navigator.clipboard`).
- `Link` — links `.md` viram `#/rota` (hash routing); links `http(s)://` abrem em nova aba com `rel="noopener noreferrer"`.
- `Image` — `loading="lazy"`.
- `Table`, `TableHead`, `TableBody`, `TableRow`, `TableHeaderCell`, `TableCell` — respeitar `align`.
- `Unknown` — aviso visual com o `nodeType`.

### `src/docs.ts`

```ts
import { createMdFetcher } from "./plugin/mod.ts";

export const mdFetch = createMdFetcher({
  match: (url) => url.pathname === "/" || url.pathname.startsWith("/docs/"),
  resolve: (url) => {
    let p = url.pathname.replace(/^\/docs\//, "");
    if (url.pathname === "/") p = "";
    if (p === "" || p.endsWith("/")) return `/docs/${p}README.md`;
    return `/docs/${p}.md`;
  },
  cacheTTL: 60,
  cacheName: "md-wire-v1",
});
```

### `src/sw.ts`

```ts
/// <reference lib="webworker" />
import { createMarkdownPlugin } from "./plugin/adapters/sw.ts";
const plugin = createMarkdownPlugin({
  match: (url) => url.pathname === "/" || url.pathname.startsWith("/docs/"),
  resolve: /* mesma função do docs.ts */,
  cacheTTL: 60,
  cacheName: "md-wire-v1",
});
self.addEventListener("install", () => plugin.installHandler());
self.addEventListener("activate", (e) => plugin.activateHandler(e));
self.addEventListener("fetch", plugin.fetchHandler);
```

### `src/components/Content.ts`

- Signals `content`, `loading`, `error`, `currentPath`.
- Ao montar: consome wire inline (`#__md_wire`), remove do DOM, e se `doc.url` bate com a rota atual, usa direto. Senão, faz `mdFetch(path, {headers:{Accept:"application/json"}})`.
- `content.value = wireToVNode(doc.wire, registry)`.
- Renderiza `<article class="markdown-body">{content.value}</article>` — **sem `dangerouslySetInnerHTML`**.

### `src/main.ts`

- Registra SW via `registerMarkdownSW()`, com `catch` que loga e segue — o fallback client-side já cuida do resto.
- Chama `initRouter()`, `render(<App/>, document.getElementById("app"))`.
- Log de diagnóstico: `[md] rodando em modo ${hasSW() ? "SW" : "cliente"}`.

### `src/register-sw.ts`

```ts
export async function registerMarkdownSW(url = "./sw.js"): Promise<ServiceWorkerRegistration>;
```
- `navigator.serviceWorker.register(url, { type: "module", scope: "./" })`.
- Aguarda `navigator.serviceWorker.ready`.

### `build.ts`

```ts
import { build } from "jsr:@vanaware/buildit/esbuild";
```
- Dois `build()` em paralelo:
  - `src/main.ts` → `dist/bundle.js`
  - `src/sw.ts` → `dist/sw.js`
- Comum: `bundle:true`, `minify:true`, `format:"esm"`, `target:["es2022"]`, `platform:"browser"`, `sourcemap:true`, `absWorkingDir: Deno.cwd()`.
- Suporte a `--watch` via `Deno.args`.

### `deno.json`

- `imports` com todos os pacotes npm/jsr listados acima.
- `tasks`: `build`, `dev` (watch), `serve` (`jsr:@std/http/file-server . --port 8000`).
- `compilerOptions.lib`: `["dom","dom.iterable","webworker","deno.ns","esnext"]`.

### `index.html`

- `<div id="app"></div>`
- BeerCSS via CDN (CSS + JS).
- `<link rel="stylesheet" href="./src/styles.css">`.
- `<script type="module" src="./dist/bundle.js"></script>`.

### `src/styles.css`

- Layout `.app-shell` com grid: sidebar (280px) + conteúdo.
- Estilos para `.markdown-body`, `.md-code`, `.md-copy`, `.md-quote`, `.md-unknown-node`.
- Media query mobile: sidebar acima, conteúdo abaixo.
- Usar variáveis CSS do BeerCSS quando possível (`--surface`, `--outline`, `--primary`).

### `docs/`

- `README.md`, `guia.md`, `_sidebar.md`, `_navbar.md` com conteúdo mínimo de exemplo.

---

## 🔄 Fluxos que o código deve suportar

### 1. Navegação direta (digitar URL, F5)

```
Browser → GET /docs/guia   (Accept: text/html)
   ↓
SW intercepta → pipeline → parse mdast → wire
   ↓
SW devolve shell HTML com wire inline em #__md_wire
   ↓
bundle.js roda → Content consome #__md_wire → wireToVNode → render
```

### 2. Navegação SPA (clique)

```
Clique → hash muda → currentPath signal
   ↓
Content reage → mdFetch("/docs/outra", {Accept:"application/json"})
   ↓
SW intercepta → pipeline → cache hit ou parse → JSON
   ↓
wireToVNode → render (sem reload)
```

### 3. Fallback sem SW

```
Browser → mdFetch("/docs/guia", {Accept:"application/json"})
   ↓
isSWControlling() → false
   ↓
pipeline local roda com createCacheIO → mesma saída JSON
   ↓
wireToVNode → render
```

### 4. Cache compartilhado

- SW popula cache `md-wire-v1` na chave do path `.md`.
- Cliente (fallback) lê o mesmo cache.
- `cacheTTL` controla expiração via `x-rendered-at`.
- `activateHandler` limpa versões antigas.

---

## ⚠️ Casos de erro a tratar

| Caso | Comportamento |
|---|---|
| Markdown 404 | `notFound()` com status 404, texto claro |
| SW não suportado | `register-sw` loga, `mdFetch` cai no fallback |
| `navigator.serviceWorker.controller === null` | `isSWControlling` retorna `false` |
| `caches` indisponível (file://) | IO degrada para no-op, pipeline segue |
| Bloco `html` no markdown | `to-wire` retorna `null` (descartado) |
| Componente não registrado | Fallback visual `[Nome]` em span |
| Nó mdast desconhecido | Componente `Unknown` com `nodeType` |
| Recursão no fetch interno do SW | Query param `_md_raw=1` + early-return |
| `Response` clonada após consumo | `cache.put(key, doc)` serializa antes; nunca consumir 2× |
| `Accept` variando no mesmo cache key | JSON responde `no-store`, HTML responde cacheável |

---

## 🚫 O que NÃO fazer

- ❌ `dangerouslySetInnerHTML` em qualquer componente.
- ❌ `eval`, `new Function`, `Blob` + `URL.createObjectURL` para código.
- ❌ Importar `preact`, `htm` ou `@preact/signals` no SW.
- ❌ Usar `fetch`/`caches`/`navigator`/`self` dentro de `src/plugin/core/`.
- ❌ Renderizar Markdown para string HTML no SW.
- ❌ Duplicar lógica de parse entre SW e cliente.
- ❌ Guardar VNodes ou funções no cache — só JSON puro.
- ❌ Esquecer de filtrar `range` requests (vídeo/streaming) no `fetchHandler`.

---

## ✅ Critérios de aceitação

1. `deno task build` gera `dist/bundle.js` e `dist/sw.js` sem erros.
2. `deno task serve` sobe em `:8000`; navegar para `/docs/guia` renderiza o conteúdo **vindo do SW**.
3. DevTools → Application → Service Workers mostra `sw.js` ativo.
4. Network tab: requisições ao SPA têm `Accept: application/json` e resposta com header `x-source: /docs/guia.md`.
5. **Desligar o SW** (Application → Unregister) e recarregar → app continua funcionando (fallback client-side).
6. `curl http://localhost:8000/docs/guia` devolve HTML com `<script id="__md_wire">` embutido.
7. `curl -H "Accept: application/json" http://localhost:8000/docs/guia` devolve JSON com `{wire, title, raw, url, renderedAt}`.
8. Nenhum componente usa `dangerouslySetInnerHTML` (grep deve retornar vazio em `src/`).
9. O `src/plugin/core/` compila sem precisar de `dom`, `webworker` ou `deno.ns` — só ESNext puro.
10. Trocar o conteúdo de `registry.tsx` (ex.: novo visual para `CodeBlock`) reflete na UI **sem invalidar o cache do wire** — o `wire` cacheado continua válido.

---

## 📝 Observações finais para a IA geradora

- Prefira **funções puras** e **factories** (`createX`) a classes.
- Use **`htm` template literals** para JSX no cliente (não `.tsx` — exceto se você decidir por `.tsx`, mas então ajuste os imports).
- Todo o código em **TypeScript estrito**.
- Nomes de arquivos com **`.ts`** no core e no SW, **`.tsx`** ou `.ts` (com htm) nos componentes.
- Comentários em **português**.
- Sem dependências além das listadas.
- O pacote `src/plugin/` deve ser **publicável isoladamente** como `@seu-escopo/md-wire` (SW+core) e o registry como `@seu-escopo/preact-md-wire` (cliente). Estrutura e exports devem refletir isso.

Gere o código completo, arquivo por arquivo, respeitando todos os contratos acima. Se algo estiver ambíguo, escolha a opção **mais simples que preserve o contrato**, e mencione a decisão em um comentário `// DECISÃO:` no arquivo afetado.



# 🎯 Prompt completo — Islands estilo Fresh na arquitetura Docsify+Wire+SW

> Copie e cole o bloco abaixo em outra IA. Ele assume que o projeto base (wire format, Service Worker, fallback client-side, registry de componentes) **já foi gerado** por um prompt anterior. Esta segunda etapa adiciona Islands no **Modo B** (hidratação seletiva, fiel ao Fresh).

---

## 🧭 Contexto

Você vai evoluir um projeto Deno + TypeScript de documentação estática que já possui:

- Um **Service Worker** que intercepta requisições, lê Markdown, converte para **mdast** e serializa em um **wire format** (árvore JSON com nós `{t:"e"|"c"|"f", ...}`).
- Um **cliente** que materializa o wire em VNodes Preact via `wireToVNode(wire, registry)`.
- Um **fallback client-side** que roda o mesmo pipeline quando o SW não controla a URL.
- **Nenhum uso de `dangerouslySetInnerHTML`**.

Agora você vai adicionar **Islands** — pontos de interatividade isolados, hidratados sob demanda, sem afetar o resto da página. O objetivo é replicar o modelo do **Fresh** (Deno): *"zero JavaScript enviado ao cliente quando nenhuma interatividade é necessária"*.

**Regra de ouro:** o wire format **não pode conter funções, handlers, closures ou referências a componentes**. Só JSON puro. Toda interatividade nasce no cliente, em ilhas registradas explicitamente.

---

## 🏝 Modelo de Islands a implementar (Modo B)

1. **Declaração estática:** o desenvolvedor declara quais nomes são ilhas via `islands: ["Counter", "SearchBox", …]` no config do plugin.
2. **Marcação no wire:** durante `mdast → wire`, qualquer componente cujo nome esteja em `islands[]` vira um nó **`WireIsland`** (`t:"i"`) em vez de `WireComponent` (`t:"c"`).
3. **Marcação no HTML:** na renderização client-side, cada ilha é emitida como um elemento HTML com atributos `data-island` e `data-props` — **sempre com children estáticos já renderizados**, nunca vazios.
4. **Hidratação seletiva:** um módulo `hydrateIslands()` varre o DOM, encontra `[data-island]`, e chama `preact.hydrate()` **apenas nesses pontos**.
5. **Ilhas não registradas:** se o cliente não tem a ilha no registry, os children estáticos permanecem visíveis e inertes — nunca erro, nunca tela branca.

---

## 📐 Contrato do WireIsland

Adicione ao arquivo de tipos do wire:

```ts
export interface WireIsland {
  t: "i";                         // "i" de island
  n: string;                      // nome da ilha ("Counter", "SearchBox", …)
  p?: Record<string, unknown>;    // props SERIALIZÁVEIS (JSON puro, sem funções)
  c?: Wire[];                     // children pré-renderizados (fallback estático)
}

export type Wire =
  | string
  | number
  | boolean
  | null
  | Wire[]
  | WireElement      // t:"e"
  | WireComponent    // t:"c"
  | WireIsland       // t:"i"  ← NOVO
  | WireFragment;    // t:"f"
```

**Invariante crítico:** `p` deve poder passar por `JSON.parse(JSON.stringify(p))` sem perda. Se um sanitizador encontrar `function`, `symbol`, `undefined` ou referência circular, deve removê-la silenciosamente (ou lançar em modo dev).

---

## 📁 Arquivos a criar ou modificar

```
src/
├── plugin/
│   ├── wire.ts                    ← MODIFICAR: adicionar WireIsland
│   ├── types.ts                   ← MODIFICAR: adicionar islands?: string[]
│   └── core/
│       └── to-wire.ts             ← MODIFICAR: bifurcar comp() em island()
│
├── render/
│   ├── from-wire.ts               ← MODIFICAR: tratar t:"i"
│   ├── hydrate-islands.ts         ← CRIAR: hidratação seletiva
│   ├── islands/
│   │   ├── Counter.tsx            ← CRIAR (exemplo)
│   │   ├── SearchBox.tsx          ← CRIAR (exemplo)
│   │   └── index.ts               ← CRIAR: manifest de islands
│   └── registry.tsx               ← MODIFICAR: compor estáticos + islands
│
└── components/
    └── Content.ts                 ← MODIFICAR: chamar hydrateIslands após render
```

---

## 📜 Especificação detalhada de cada módulo

### 1. `src/plugin/wire.ts`

Adicione a interface `WireIsland` conforme o contrato acima. Atualize a união `Wire`.

### 2. `src/plugin/types.ts`

Adicione ao `MarkdownPluginConfig`:

```ts
/** Nomes que devem virar WireIsland em vez de WireComponent. */
islands?: string[];
```

### 3. `src/plugin/core/to-wire.ts`

Transforme `comp()` em uma factory que recebe o `Set` de ilhas:

```ts
export interface ToWireOptions {
  islands?: Set<string>;
}

export function renderToWire(ast: Root, opts: ToWireOptions = {}): WireFragment {
  const islands = opts.islands ?? new Set();
  // …toda a lógica de mapeamento passa a usar islands.has(n)…
}
```

Regra de decisão dentro da factory:

```ts
function node(n: string, p: Record<string, unknown> = {}, c?: Wire[]): Wire {
  const isIsland = islands.has(n);
  const props = sanitizeProps(p); // JSON-safe

  if (isIsland) {
    return c === undefined
      ? { t: "i", n, p: props }
      : { t: "i", n, p: props, c };
  }
  return c === undefined
    ? { t: "c", n, p: props }
    : { t: "c", n, p: props, c };
}

function sanitizeProps(p: Record<string, unknown>): Record<string, unknown> {
  try {
    return JSON.parse(JSON.stringify(p));
  } catch {
    return {};
  }
}
```

**Importante:** todos os componentes do wire passam por `sanitizeProps`. Isso garante que o wire inteiro seja serializável, ilha ou não.

### 4. `src/render/from-wire.ts`

Adicione o case `t:"i"`:

```ts
if (w.t === "i") {
  const Comp = registry[w.n];
  const children = (w.c ?? []).map((x) => wireToVNode(x, registry));

  if (!Comp) {
    // Ilha não registrada → emite marcador HTML com children estáticos.
    // O DOM fica navegável (âncoras, texto) mas sem interatividade.
    return h("div", {
      "data-island": w.n,
      "data-props": JSON.stringify(w.p ?? {}),
      "data-island-missing": "true",
    }, ...children);
  }

  // Ilha registrada → emite marcador + componente ainda NÃO hidratado.
  // A hidratação real ocorre depois, em hydrateIslands().
  return h("div", {
    "data-island": w.n,
    "data-props": JSON.stringify(w.p ?? {}),
  }, ...children);
}
```

**Nota de design:** na primeira renderização (após consumir `#__md_wire`), emitimos **HTML estático com marcadores**. Não chamamos `h(Comp, …)` ainda — a ilha só vira interativa depois que `hydrateIslands()` roda. Isso replica exatamente o comportamento SSR + hidratação seletiva do Fresh.

### 5. `src/render/hydrate-islands.ts` — o coração

```ts
import { h, hydrate } from "preact";
import type { ComponentType } from "preact";
import type { Registry } from "./from-wire.ts";

export interface HydrateOptions {
  /** Root a varrer. Default: document.body. */
  root?: ParentNode;
  /** Se true, loga ilhas hidratadas (útil em dev). */
  verbose?: boolean;
}

/**
 * Percorre o DOM e hidrata apenas os nós marcados com [data-island].
 * Não hidrata o resto da página — esse é o ponto do modelo Islands.
 */
export function hydrateIslands(
  registry: Registry,
  opts: HydrateOptions = {},
): number {
  const root = opts.root ?? document.body;
  const nodes = root.querySelectorAll<HTMLElement>("[data-island]");
  let hydrated = 0;

  for (const el of nodes) {
    if (el.dataset.islandHydrated === "true") continue;

    const name = el.dataset.island;
    if (!name) continue;

    const Comp = registry[name] as ComponentType<any> | undefined;
    if (!Comp) {
      if (opts.verbose) console.warn(`[islands] não registrada: ${name}`);
      continue;
    }

    let props: Record<string, unknown> = {};
    try {
      props = JSON.parse(el.dataset.props || "{}");
    } catch {
      if (opts.verbose) console.warn(`[islands] props inválidas em ${name}`);
      continue;
    }

    // Marca antes de hidratar — evita double hydration se rodar 2x
    el.dataset.islandHydrated = "true";

    try {
      hydrate(h(Comp, props), el);
      hydrated++;
      if (opts.verbose) console.info(`[islands] hidratada: ${name}`);
    } catch (e) {
      console.error(`[islands] falha ao hidratar ${name}`, e);
    }
  }

  return hydrated;
}
```

**Atenção ao `hydrate` do Preact:** ele espera que o DOM interno do `el` seja estruturalmente compatível com o que `Comp` renderiza. Como emitimos os children estáticos e a ilha **deve renderizar os mesmos children** (via `props.children` ou similar), a hidratação casa. Se o componente gerar DOM diferente, o Preact reconcilia (com perda de foco/estado em inputs controlados — comportamento esperado).

### 6. `src/render/islands/index.ts`

```ts
import { Counter } from "./Counter.tsx";
import { SearchBox } from "./SearchBox.tsx";

/** Manifest de ilhas: nome → componente. */
export const islands = {
  Counter,
  SearchBox,
} as const;

export type IslandName = keyof typeof islands;
```

### 7. `src/render/islands/Counter.tsx` — exemplo mínimo

```tsx
import { useSignal } from "@preact/signals";

export interface CounterProps {
  start?: number;
  label?: string;
}

export function Counter({ start = 0, label = "Contador" }: CounterProps) {
  const count = useSignal(start);
  return (
    <div class="md-island md-counter">
      <span>{label}: {count.value}</span>
      <button onClick={() => count.value++}>+</button>
      <button onClick={() => count.value--}>−</button>
    </div>
  );
}
```

### 8. `src/render/islands/SearchBox.tsx` — exemplo com API

```tsx
import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

export interface SearchBoxProps {
  placeholder?: string;
}

export function SearchBox({ placeholder = "Buscar…" }: SearchBoxProps) {
  const query = useSignal("");
  const results = useSignal<{ title: string; url: string }[]>([]);

  useEffect(() => {
    if (!query.value) { results.value = []; return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.value)}`);
      if (res.ok) results.value = await res.json();
    }, 150);
    return () => clearTimeout(t);
  }, [query.value]);

  return (
    <div class="md-island md-search">
      <input
        type="search"
        placeholder={placeholder}
        value={query.value}
        onInput={(e) => query.value = (e.target as HTMLInputElement).value}
      />
      <ul>
        {results.value.map((r) => (
          <li key={r.url}><a href={r.url}>{r.title}</a></li>
        ))}
      </ul>
    </div>
  );
}
```

### 9. `src/render/registry.tsx`

Componha estáticos + islands em um único registry:

```ts
import { islands } from "./islands/index.ts";

export const registry: Registry = {
  // componentes estáticos existentes (Heading, Paragraph, CodeBlock, Link, …)
  ...staticComponents,
  // ilhas
  ...islands,
};
```

### 10. `src/components/Content.ts`

Após renderizar o conteúdo vindo do wire, **chame `hydrateIslands()`** para animar as ilhas:

```ts
import { hydrateIslands } from "../render/hydrate-islands.ts";

// …

async function load(route: string): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    const doc = await fetchDoc(route);
    content.value = wireToVNode(doc.wire, registry);
    // Após o Preact aplicar no DOM (microtask), hidrata as ilhas marcadas.
    queueMicrotask(() => hydrateIslands(registry, { verbose: import.meta.env?.DEV }));
    document.title = doc.title;
  } catch (e) { /* … */ }
  finally { loading.value = false; }
}
```

**Alternativa mais limpa:** use `useEffect` no componente raiz para rodar `hydrateIslands()` depois que `content.value` muda:

```ts
import { useEffect } from "preact/hooks";

useEffect(() => {
  if (content.value) hydrateIslands(registry, { verbose: false });
}, [content.value]);
```

---

## 🔧 Ajustes no config do plugin

### `src/docs.ts`

```ts
import { createMdFetcher } from "./plugin/mod.ts";
import { islands as islandMap } from "./render/islands/index.ts";

const islandNames = Object.keys(islandMap);

export const mdFetch = createMdFetcher({
  match: (url) => url.pathname === "/" || url.pathname.startsWith("/docs/"),
  resolve: /* …igual ao projeto base… */,
  cacheTTL: 60,
  cacheName: "md-wire-v1",
  islands: islandNames,   // ← NOVO: o SW passa isso para o pipeline
});
```

### `src/sw.ts`

```ts
import { createMarkdownPlugin } from "./plugin/adapters/sw.ts";
import { islands as islandMap } from "./render/islands/index.ts";

// CUIDADO: importar islands no SW puxa Preact para o bundle do SW.
// Isso é aceitável SE o bundle do SW incluir Preact para as ilhas.
// Alternativa: duplicar apenas os nomes como constante estática.
const islandNames = Object.keys(islandMap);

const plugin = createMarkdownPlugin({
  match: (url) => url.pathname === "/" || url.pathname.startsWith("/docs/"),
  resolve: /* …igual ao projeto base… */,
  cacheTTL: 60,
  cacheName: "md-wire-v1",
  islands: islandNames,
});
```

**Decisão recomendada:** importar `islands/index.ts` no SW puxa todo Preact e os componentes de ilha para dentro do bundle do SW. Isso é **aceitável** (o SW é grande, mas as ilhas ficam disponíveis) **desde que as ilhas não dependam de `window`**. Se dependerem, o SW vai quebrar no `import`. **Solução limpa:** crie um arquivo `src/render/islands/manifest.ts` que exporta só os **nomes** (array de strings), sem imports:

```ts
// src/render/islands/manifest.ts
export const islandNames = ["Counter", "SearchBox"] as const;
```

E o `index.ts` (com imports reais) só roda no cliente. O SW importa só o manifest.

---

## 🔄 Fluxos obrigatórios a suportar

### Fluxo 1 — Navegação direta com islands

```
GET /docs/guia  (Accept: text/html)
  ↓ SW intercepta
  ↓ parse mdast → to-wire com islands:Set
  ↓ shell HTML com <script id="__md_wire">…</script>
  ↓ Browser carrega bundle.js
  ↓ Content consome __md_wire → wireToVNode → VNodes com <div data-island>
  ↓ render(<App/>, #app)
  ↓ useEffect dispara hydrateIslands() → preact.hydrate() nos [data-island]
  ↓ Ilhas ficam interativas; resto continua estático
```

### Fluxo 2 — Navegação SPA

```
Clique → hash muda → Content refetcha (Accept: application/json)
  ↓ SW devolve JSON { wire }
  ↓ wireToVNode emite <div data-island> novos
  ↓ useEffect dispara hydrateIslands() → apenas as ilhas novas
```

### Fluxo 3 — Ilha não registrada

```
SW emite t:"i" n:"FutureWidget"
Cliente: registry["FutureWidget"] === undefined
  ↓
from-wire emite <div data-island="FutureWidget" data-island-missing="true">
  com os children estáticos dentro
  ↓
hydrateIslands() ignora (não há Comp)
  ↓
Usuário vê o conteúdo pré-renderizado, sem interatividade, sem erro
```

### Fluxo 4 — Sem SW (fallback)

```
mdFetch local roda o pipeline com islands:Set igual
  ↓ mesmo wire format
  ↓ mesmo fluxo de hidratação
```

---

## 🚫 O que NÃO fazer

- ❌ Colocar funções, closures, signals ou Promises no `p` do wire (deve ser JSON puro).
- ❌ Chamar `preact.render()` em cima de nós `[data-island]` — use **`hydrate()`**.
- ❌ Hidratar duas vezes o mesmo nó (use `data-island-hydrated` como flag).
- ❌ Deixar children de ilha vazios no wire — sempre pré-renderize o fallback estático.
- ❌ Importar o bundle completo de islands no SW se elas dependem de `window`.
- ❌ Hidratar todas as ilhas no primeiro paint — hidrate **só** o que o usuário vê (para grandes docs, considere `IntersectionObserver`).
- ❌ Quebrar o contrato anterior: nem `dangerouslySetInnerHTML` nem `eval`.

---

## ✅ Critérios de aceitação

1. Um markdown contendo um bloco que mapeia para `Counter` faz o SW emitir `{t:"i", n:"Counter", p:{…}}` no wire.
2. Na primeira carga, o HTML tem `<div data-island="Counter" data-props='{"start":5}'>…estático…</div>` e o contador **não** responde a cliques antes da hidratação.
3. Após `hydrateIslands()`, clicar em `+` incrementa o contador sem re-renderizar o resto da página.
4. Removendo `Counter` do registry, a página continua renderizando (com `data-island-missing="true"`) e **não lança erro**.
5. `hydrateIslands()` rodando 2× no mesmo root hidrata apenas 1× (flag `data-island-hydrated`).
6. `grep -r "dangerouslySetInnerHTML" src/` retorna vazio.
7. O bundle do SW **não contém** os componentes Preact de ilha (verificar com `deno task build` e inspeção de `dist/sw.js`).
8. Trocar props de uma ilha no markdown invalida o cache do wire só para aquela página (via `cacheName` + `renderedAt`).
9. Adicionar uma nova ilha exige apenas: (a) criar o arquivo em `src/render/islands/`, (b) adicionar ao `index.ts`, (c) adicionar o nome no `manifest.ts`. Nenhum outro arquivo muda.
10. Ilha com children interativos (ex.: link dentro de ilha) mantém os links navegáveis antes mesmo da hidratação — porque os children são HTML real.

---

## 🎁 Bônus opcional (se sobrar escopo)

- **`IntersectionObserver`**: hidratar ilhas apenas quando entram no viewport (modelo "islands lazy").
- **`data-island-priority="eager|lazy|idle"`**: controla quando hidratar (`requestIdleCallback` para `idle`).
- **Ilhas aninhadas**: uma ilha pode renderizar outra, e `hydrateIslands` deve cuidar da recursão naturalmente pelo Preact.
- **Devtools em dev**: `console.table` de quantas ilhas foram hidratadas por rota.

---

## 📝 Instruções de execução para a IA

- Gere **todos os arquivos modificados e novos** por completo (não apenas diffs), pois outra IA vai aplicar em um projeto existente.
- Comentários em **português**.
- Prefira `htm` template literals a `.tsx` no lado do cliente, **exceto** em `src/render/islands/*.tsx` — ali use JSX puro porque é onde a clareza da árvore de componentes mais importa. Se preferir consistência total, use `htm` em tudo.
- Se surgir ambiguidade, escolha a opção **mais próxima do modelo Fresh** e sinalize com `// DECISÃO:` no arquivo.
- **Não quebre** nenhum contrato do projeto base: wire format continua JSON puro, `dangerouslySetInnerHTML` continua banido, fallback client-side continua funcionando, pipeline core continua puro.

Ao final, produza também um **`README-ISLANDS.md`** curto explicando:
- Como criar uma nova ilha (3 passos).
- Como o SW e o cliente cooperam para marcar e hidratar.
- O que acontece quando uma ilha não está registrada.
- Como debugar hidratação (DevTools → Elements → buscar `[data-island]`).
