import { html } from "htm/preact";
import { useSignal } from "@preact/signals";
import {
  currentDoc,
  currentPath,
  isLoading,
  errorMessage,
  viewMode,
  parseTimeMs,
} from "../state.ts";
import { wireToVNode } from "../render/from-wire.ts";
import { islands } from "../render/islands/index.js";
import { countWireNodes, countWireIslands } from "../plugin/wire.ts";
import { navigateTo } from "../router.ts";

const QUICK_ARTICLES = [
  { path: "/docs/README.md", label: "🏠 Início", desc: "Visão Geral" },
  { path: "/docs/guia.md", label: "🧪 Post: Guia & Ilhas", desc: "Demonstração prática" },
  { path: "/docs/PLANO_MIGRACAO_HTML_ES.md", label: "⚡ Post: HTML+ES (.js)", desc: "Arquitetura limpa" },
  { path: "/docs/ARQUITETURA_WIRE_FORMAT.md", label: "⚙️ Wire AST Spec", desc: "Contrato JSON" },
  { path: "/docs/GUIA_DE_ISLANDS.md", label: "🏝️ Islands HTML+ES", desc: "Manual técnico" },
];

export function Content() {
  const doc = currentDoc.value;
  const path = currentPath.value;
  const loading = isLoading.value;
  const error = errorMessage.value;
  const mode = viewMode.value;
  const copied = useSignal(false);

  function copyText(text) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 2000);
    }
  }

  if (loading && !doc) {
    return html`
      <main class="responsive max padding center-align margin-top">
        <progress class="circle large"></progress>
        <p class="margin-top surface-variant-text">
          Carregando artigo e renderizando via Wire Format AST...
        </p>
      </main>
    `;
  }

  if (error && !doc) {
    return html`
      <main class="responsive max padding">
        <article class="border error-container round medium-padding margin">
          <div class="row items-center gap">
            <i class="error-text large">error</i>
            <div>
              <h5 class="no-margin bold">Falha ao carregar o artigo</h5>
              <p class="margin-top">${error}</p>
              <p class="small-text surface-variant-text">Caminho: ${path}</p>
            </div>
          </div>
          <div class="margin-top">
            <button
              class="button primary"
              onClick=${() => navigateTo("/docs/README.md")}
            >
              <i>home</i> Ir para Início
            </button>
          </div>
        </article>
      </main>
    `;
  }

  if (!doc) {
    return html`
      <main class="responsive max padding center-align">
        <p class="surface-variant-text">Nenhum artigo selecionado.</p>
      </main>
    `;
  }

  const nodeCount = countWireNodes(doc.wire);
  const islandCount = countWireIslands(doc.wire);

  return html`
    <main class="responsive max padding">
      <!-- Quick Article Switcher Bar -->
      <div class="margin-bottom padding-bottom border-bottom">
        <div class="row wrap items-center justify-between gap margin-bottom">
          <span class="bold small-text surface-variant-text uppercase row wrap items-center gap-small">
            <i>auto_stories</i>
            <span class="m l">Artigos em Destaque:</span>
            <span class="s">Destaques:</span>
          </span>
          <span class="chip small success bold">
            <i>verified</i> 100% HTML+ES (.js)
          </span>
        </div>

        <div class="row wrap gap-small">
          ${QUICK_ARTICLES.map((art) => {
            const isCurrent = path === art.path;
            return html`
              <button
                key=${art.path}
                class=${`chip small ${isCurrent ? "primary-container bold" : "surface-variant"}`}
                onClick=${() => navigateTo(art.path)}
              >
                <span>${art.label}</span>
              </button>
            `;
          })}
        </div>
      </div>

      <!-- Article Navigation Tabs -->
      <nav class="tabs scroll border-bottom margin-bottom">
        <a
          class=${`row items-center gap-small ${mode === "preview" ? "active bold primary-text" : ""}`}
          onClick=${() => (viewMode.value = "preview")}
        >
          <i>visibility</i>
          <span>
            <span class="s">Artigo</span>
            <span class="m l">Artigo Renderizado (Preact + Islands)</span>
          </span>
        </a>
        <a
          class=${`row items-center gap-small ${mode === "ast" ? "active bold primary-text" : ""}`}
          onClick=${() => (viewMode.value = "ast")}
        >
          <i>schema</i>
          <span>
            <span class="s">Wire AST</span>
            <span class="m l">Wire Format AST (JSON)</span>
          </span>
        </a>
        <a
          class=${`row items-center gap-small ${mode === "raw" ? "active bold primary-text" : ""}`}
          onClick=${() => (viewMode.value = "raw")}
        >
          <i>description</i>
          <span>
            <span class="s">Markdown</span>
            <span class="m l">Markdown Original (.md)</span>
          </span>
        </a>
      </nav>

      <!-- Metrics and Info Banner -->
      <div class="row wrap items-center justify-between gap margin-bottom surface-container-low round padding-small border">
        <div class="row wrap items-center gap-small">
          <span class="chip small surface-container-high truncate" title=${doc.url}>
            <i>description</i> <strong>${doc.url}</strong>
          </span>
          <span class="chip small primary-container">
            <i>account_tree</i> <strong>${nodeCount}</strong> nós
          </span>
          <span class="chip small secondary-container">
            <i>widgets</i> <strong>${islandCount}</strong> Ilhas Reativas
          </span>
          <span class="chip small surface-variant">
            <i>speed</i> <strong>${parseTimeMs.value} ms</strong>
          </span>
        </div>

        <div class="row wrap items-center gap-small">
          <span class="small-text surface-variant-text">
            Cache: <strong>IndexedDB (idb-keyval)</strong>
          </span>
        </div>
      </div>

      <!-- Article Content View -->
      ${mode === "preview" ? html`
        <article class="no-border no-padding wrap">
          ${wireToVNode(doc.wire, { islands })}

          <footer class="margin-top padding-top border-top row wrap items-center justify-between surface-variant-text small-text gap">
            <div class="row wrap items-center gap-small">
              <i>security</i>
              <span>Zero <code>dangerouslySetInnerHTML</code> • 100% Preact VNodes</span>
            </div>
            <div class="wrap">
              Processado em: ${new Date(doc.renderedAt).toLocaleTimeString()}
            </div>
          </footer>
        </article>
      ` : null}

      ${mode === "ast" ? html`
        <article class="border round medium-padding surface-container">
          <div class="row wrap items-center justify-between gap margin-bottom border-bottom padding-bottom">
            <div class="max wrap">
              <h6 class="no-margin bold row items-center gap-small">
                <i>schema</i> Árvore JSON do Wire Format
              </h6>
              <p class="small-text surface-variant-text margin-top wrap">
                Nós serializáveis gerados pelo pipeline (elementos, componentes e ilhas).
              </p>
            </div>
            <button
              class="chip primary small"
              onClick=${() => copyText(JSON.stringify(doc.wire, null, 2))}
            >
              <i>${copied.value ? "check" : "content_copy"}</i>
              <span>${copied.value ? "Copiado!" : "Copiar JSON"}</span>
            </button>
          </div>

          <pre class="border round padding surface-container-lowest scroll wrap">
            <code>${JSON.stringify(doc.wire, null, 2)}</code>
          </pre>
        </article>
      ` : null}

      ${mode === "raw" ? html`
        <article class="border round medium-padding surface-container">
          <div class="row wrap items-center justify-between gap margin-bottom border-bottom padding-bottom">
            <div class="max wrap">
              <h6 class="no-margin bold row items-center gap-small">
                <i>description</i> Arquivo Markdown Original
              </h6>
              <p class="small-text surface-variant-text margin-top wrap">
                Conteúdo bruto obtido diretamente do arquivo .md.
              </p>
            </div>
            <button
              class="chip primary small"
              onClick=${() => copyText(doc.raw)}
            >
              <i>${copied.value ? "check" : "content_copy"}</i>
              <span>${copied.value ? "Copiado!" : "Copiar Markdown"}</span>
            </button>
          </div>

          <pre class="border round padding surface-container-lowest scroll wrap">
            <code>${doc.raw}</code>
          </pre>
        </article>
      ` : null}
    </main>
  `;
}
