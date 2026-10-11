import { html } from "htm/preact";
import { isOffline, isSWActive, sidebarOpen, articles, currentPath } from "../state.ts";
import { ThemeToggle } from "../render/islands/ThemeToggle.js";
import { SearchBox } from "../render/islands/SearchBox.js";
import { navigateTo } from "../router.ts";

export function Navbar() {
  const current = currentPath.value;
  const list = articles.value;

  return html`
    <nav class="top surface-container border-bottom sticky">
      <button
        class="circle transparent"
        onClick=${() => (sidebarOpen.value = !sidebarOpen.value)}
        aria-label="Abrir menu lateral"
      >
        <i>menu</i>
      </button>

      <i class="primary-text bold">menu_book</i>
      <h6 class="bold no-margin">mdBlog</h6>

      <!-- Menu Dropdown Dinâmico de Artigos do Blog (BeerCSS nativo) -->
      <button class="chip primary-container bold">
        <i>auto_stories</i>
        <span>Artigos (${list.length})</span>
        <i>arrow_drop_down</i>
        <menu class="min left scroll max-height">
          ${list.map((art) => {
            const depth = art.depth || 0;
            const indentClass = depth === 1 ? "left-margin" : depth >= 2 ? "large-margin left-margin" : "";
            const isActive = current === art.path;
            return html`
              <a
                key=${art.path}
                class=${`${isActive ? "active bold primary-text" : ""} ${indentClass}`}
                onClick=${() => navigateTo(art.path)}
              >
                <i>${art.icon || "article"}</i>
                <div class="max truncate">${art.title}</div>
                ${art.badge ? html`<span class="badge none primary">${art.badge}</span>` : null}
              </a>
            `;
          })}
        </menu>
      </button>

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
        ` : html`
          <span class="chip surface-variant small bold m l" title="Executando no cliente via pipeline direto">
            <i>memory</i> Fallback Local
          </span>
        `}

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
