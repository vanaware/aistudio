import { html } from "htm/preact";
import { currentPath, sidebarOpen } from "../state.ts";

const SECTIONS = [
  {
    group: "Publicações & Artigos",
    items: [
      { path: "/docs/README.md", title: "Visão Geral do mdBlog", icon: "article" },
      { path: "/docs/guia.md", title: "Post: Guia & Ilhas Reativas", icon: "science", badge: "Ilhas" },
      { path: "/docs/PLANO_MIGRACAO_HTML_ES.md", title: "Post: Arquitetura HTML+ES (.js)", icon: "code", badge: "Novo" },
    ],
  },
  {
    group: "Documentação & Especificação",
    items: [
      { path: "/docs/ARQUITETURA_WIRE_FORMAT.md", title: "Especificação Wire Format (AST)", icon: "schema" },
      { path: "/docs/FLUXOS_E_CICLO_DE_VIDA.md", title: "Fluxos de Navegação e Cache", icon: "sync" },
      { path: "/docs/GUIA_DE_ISLANDS.md", title: "Manual de Islands HTML+ES", icon: "widgets" },
      { path: "/docs/PLANO_DESENVOLVIMENTO.md", title: "Plano de Desenvolvimento", icon: "checklist" },
    ],
  },
];

export function Sidebar() {
  const current = currentPath.value;

  return html`
    <!-- Overlay escurecedor nativo do BeerCSS para fechar gaveta no mobile -->
    ${sidebarOpen.value ? html`
      <div
        class="overlay active s m"
        onClick=${() => (sidebarOpen.value = false)}
        onTouchMove=${(e) => e.preventDefault()}
      ></div>
    ` : null}

    <nav
      class=${`left drawer scroll surface-container-low border-right ${
        sidebarOpen.value ? "active" : "l"
      }`}
    >
      <!-- Topo compacto com título e botão de fechar -->
      <div class="row items-center justify-between small-padding border-bottom">
        <div class="row items-center gap">
          <i class="primary-text">menu_book</i>
          <span class="bold medium-text truncate">Artigos do Blog</span>
        </div>
        <button
          class="circle transparent s m"
          onClick=${() => (sidebarOpen.value = false)}
          aria-label="Fechar navegação lateral"
        >
          <i>close</i>
        </button>
      </div>

      <!-- Lista de seções e artigos -->
      <div class="small-padding">
        ${SECTIONS.map((sec) => html`
          <div key=${sec.group} class="small-margin bottom-margin">
            <div class="small-text surface-variant-text bold uppercase tiny-margin bottom-margin left-padding truncate">
              ${sec.group}
            </div>
            <div class="column">
              ${sec.items.map((item) => {
                const isActive = current === item.path;
                return html`
                  <a
                    key=${item.path}
                    href="#${item.path}"
                    class=${`row items-center wave round small-padding tiny-margin bottom-margin ${
                      isActive
                        ? "primary-container bold"
                        : "transparent surface-text"
                    }`}
                    onClick=${() => {
                      if (typeof window !== "undefined" && window.innerWidth < 992) {
                        sidebarOpen.value = false;
                      }
                    }}
                  >
                    <i
                      class=${`small ${
                        isActive ? "primary-text" : "surface-variant-text"
                      }`}
                    >
                      ${item.icon}
                    </i>
                    <span class="max truncate small-text">${item.title}</span>
                    ${item.badge ? html`
                      <span class="badge none primary">${item.badge}</span>
                    ` : null}
                  </a>
                `;
              })}
            </div>
          </div>
        `)}
      </div>
    </nav>
  `;
}
