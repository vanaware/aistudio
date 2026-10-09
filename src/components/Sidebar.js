import { html } from "htm/preact";
import { currentPath, sidebarOpen, articles } from "../state.ts";

export function Sidebar() {
  const current = currentPath.value;
  const list = articles.value;

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

      <!-- Lista dinâmica de artigos do blog -->
      <div class="small-padding">
        <div class="small-margin bottom-margin">
          <div class="row items-center justify-between tiny-margin bottom-margin left-padding right-padding">
            <span class="small-text surface-variant-text bold uppercase truncate">
              Publicações (${list.length})
            </span>
            <span class="chip tiny surface-variant">Dinâmico</span>
          </div>

          <div class="column">
            ${list.map((item) => {
              const isActive = current === item.path;
              const depth = item.depth || 0;
              const indentClass = depth === 1 ? "left-margin" : depth >= 2 ? "large-margin left-margin" : "";
              return html`
                <a
                  key=${item.path}
                  href="#${item.path}"
                  class=${`row items-center wave round small-padding tiny-margin bottom-margin ${
                    isActive
                      ? "primary-container bold"
                      : "transparent surface-text"
                  } ${indentClass}`}
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
                    ${item.icon || "article"}
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
      </div>
    </nav>
  `;
}
