import { html } from "htm/preact";
import {
  currentDoc,
  currentPath,
  isLoading,
  errorMessage,
  articles,
} from "../state.ts";
import { wireToVNode } from "../render/from-wire.ts";
import { islands } from "../render/islands/index.js";
import { navigateTo } from "../router.ts";

export function Content() {
  const doc = currentDoc.value;
  const path = currentPath.value;
  const loading = isLoading.value;
  const error = errorMessage.value;

  if (loading && !doc) {
    return html`
      <main class="responsive max padding center-align margin-top">
        <progress class="circle large"></progress>
        <p class="margin-top surface-variant-text">
          Carregando...
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
            </div>
          </div>
          <div class="margin-top">
            <button
              class="button primary"
              onClick=${() => navigateTo(articles.value[0]?.path || "/articles/index.md")}
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

  const currentArticle = articles.value.find((a) => a.path === path);

  // Monta o breadcrumb discreto a partir da hierarquia do artigo
  const breadcrumbs = [];
  let curr = currentArticle;
  while (curr) {
    breadcrumbs.unshift(curr);
    if (!curr.parentPath || curr.parentPath === curr.path) break;
    curr = articles.value.find((a) => a.path === curr.parentPath);
  }

  const rootArticle = articles.value.find(
    (a) => a.depth === 0 || a.name === "index.md" || a.path.endsWith("/index.md"),
  );
  if (rootArticle && breadcrumbs.length > 0 && breadcrumbs[0].path !== rootArticle.path) {
    breadcrumbs.unshift(rootArticle);
  }

  // Título, autor e data extraídos do frontmatter ou metadados
  const title = doc.frontmatter?.title || currentArticle?.title || doc.title || "Artigo";
  const author = doc.frontmatter?.author || currentArticle?.author;
  const date = doc.frontmatter?.date || currentArticle?.date;

  // Evita duplicar o título h1 do topo do markdown se já estiver no cabeçalho
  let renderWire = doc.wire;
  if (
    renderWire &&
    renderWire.t === "f" &&
    Array.isArray(renderWire.c) &&
    renderWire.c.length > 0
  ) {
    const firstNode = renderWire.c[0];
    if (
      firstNode &&
      firstNode.t === "c" &&
      firstNode.n === "Heading" &&
      (firstNode.p?.depth === 1 || firstNode.p?.depth === "1")
    ) {
      renderWire = {
        ...renderWire,
        c: renderWire.c.slice(1),
      };
    }
  }

  return html`
    <main class="responsive max padding">
      <!-- 1. Breadcrumb discreto -->
      ${breadcrumbs.length > 1 ? html`
        <nav class="row items-center gap-small small-text surface-variant-text margin-bottom">
          ${breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return html`
              ${idx > 0 ? html`<i class="tiny">chevron_right</i>` : null}
              <a
                class=${isLast ? "bold primary-text" : "surface-variant-text wave"}
                onClick=${() => navigateTo(crumb.path)}
              >
                ${crumb.title}
              </a>
            `;
          })}
        </nav>
      ` : null}

      <!-- 2. Cabeçalho limpo: Título, autor e data -->
      <header class="margin-bottom-large padding-bottom border-bottom">
        <h3 class="bold no-margin-bottom">${title}</h3>
        ${(author || date) ? html`
          <div class="row wrap items-center gap-medium small-text surface-variant-text margin-top-small">
            ${author ? html`
              <span class="row items-center gap-tiny">
                <i class="tiny">person</i>
                <span>${author}</span>
              </span>
            ` : null}
            ${date ? html`
              <span class="row items-center gap-tiny">
                <i class="tiny">calendar_today</i>
                <span>${date}</span>
              </span>
            ` : null}
          </div>
        ` : null}
      </header>

      <!-- 3. Conteúdo do artigo -->
      <article class="no-border no-padding wrap">
        ${wireToVNode(renderWire, { islands })}
      </article>

      <!-- 4. Lista de Sub-páginas (exibida após o conteúdo do artigo) -->
      ${currentArticle && currentArticle.children && currentArticle.children.length > 0 ? html`
        <section class="margin-top-large padding-top border-top">
          <div class="row items-center gap-small margin-bottom">
            <i class="primary-text">subdirectory_arrow_right</i>
            <h6 class="no-margin bold">Sub-páginas desta seção (${currentArticle.children.length})</h6>
          </div>
          <div class="column gap-small">
            ${currentArticle.children.map((sub) => html`
              <a
                key=${sub.path}
                class="row items-center justify-between border round padding surface-container wave"
                onClick=${() => navigateTo(sub.path)}
              >
                <div class="row items-center gap-small">
                  <i class="primary-text">${sub.icon || "article"}</i>
                  <div>
                    <div class="bold">${sub.title}</div>
                    ${sub.description ? html`<div class="small-text surface-variant-text">${sub.description}</div>` : null}
                  </div>
                </div>
                <div class="row items-center gap-small">
                  ${sub.badge ? html`<span class="badge none primary">${sub.badge}</span>` : null}
                  <i class="surface-variant-text">chevron_right</i>
                </div>
              </a>
            `)}
          </div>
        </section>
      ` : null}

      <!-- 5. Rodapé simplificado -->
      <footer class="margin-top-large padding-top padding-bottom border-top center-align surface-variant-text small-text">
        <span>Made with mdBlog</span>
      </footer>
    </main>
  `;
}
