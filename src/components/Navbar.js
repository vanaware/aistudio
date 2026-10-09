import { html } from "htm/preact";
import { isOffline, isSWActive, sidebarOpen, articles, currentPath } from "../state.ts";
import { ThemeToggle } from "../render/islands/ThemeToggle.js";
import { SearchBox } from "../render/islands/SearchBox.js";
import { navigateTo } from "../router.ts";

export function Navbar() {
  const current = currentPath.value;
  const list = articles.value;
  const topSections = list.filter((art) => art.depth <= 1);

  return html`
    <nav class="top surface-container border-bottom sticky">
      <button
        class="circle transparent"
        onClick=${() => (sidebarOpen.value = !sidebarOpen.value)}
        aria-label="Abrir menu lateral"
      >
        <i>menu</i>
      </button>

      <a
        class="row items-center gap-small wave transparent surface-text no-margin"
        onClick=${() => navigateTo(articles.value[0]?.path || "/articles/index.md")}
        title="Página Inicial"
      >
        <i class="primary-text bold">menu_book</i>
        <h6 class="bold no-margin">mdBlog</h6>
      </a>

      <!-- Links diretos de navegação na barra (sem select box ou menu dropdown) -->
      <div class="row items-center gap-small m l margin-left">
        ${topSections.map((art) => {
          const isActive = current === art.path;
          return html`
            <a
              key=${art.path}
              class=${`row items-center gap-tiny wave round small-padding small-text ${
                isActive ? "bold primary-text primary-container" : "surface-text"
              }`}
              onClick=${() => navigateTo(art.path)}
              title=${art.title}
            >
              <i class="tiny">${art.icon || "article"}</i>
              <span>${art.title.replace(/^[^\w\s]*\s*/, "")}</span>
            </a>
          `;
        })}
      </div>

      <div class="max"></div>

      <div class="row items-center gap">
        <!-- Status badges - versão detalhada em telas médias/grandes -->
        ${isOffline.value ? html`
          <span class="chip error small bold m l" title="Aplicação operando offline">
            <i>cloud_off</i> Offline
          </span>
        ` : html`
          <span class="chip success small bold m l" title="Conectado à internet">
            <i>cloud_done</i> Online
          </span>
        `}

        ${isSWActive.value ? html`
          <span class="chip primary-container small bold m l" title="Service Worker ativo">
            <i>bolt</i> SW Ativo
          </span>
        ` : null}

        <!-- Indicador compacto exclusivo para mobile (telas pequenas .s) -->
        <span
          class="circle small transparent s"
          title=${isOffline.value ? "Offline" : isSWActive.value ? "Online (SW Ativo)" : "Online (Local)"}
        >
          <i class=${isOffline.value ? "error-text" : "success-text"}>
            ${isOffline.value ? "cloud_off" : "cloud_done"}
          </i>
        </span>

        <!-- Busca com suporte responsivo nativo BeerCSS (visível em telas m e l) -->
        <div class="m l">
          <${SearchBox} placeholder="Buscar artigos..." />
        </div>

        <${ThemeToggle} />
      </div>
    </nav>
  `;
}
