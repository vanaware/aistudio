import { html } from "htm/preact";
import { isOffline, isSWActive, sidebarOpen } from "../state.ts";
import { ThemeToggle } from "../render/islands/ThemeToggle.js";
import { SearchBox } from "../render/islands/SearchBox.js";

export function Navbar() {
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
      <h6 class="max bold no-margin truncate">mdBlog</h6>

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
          <${SearchBox} placeholder="Buscar docs..." />
        </div>

        <${ThemeToggle} />
      </div>
    </nav>
  `;
}
