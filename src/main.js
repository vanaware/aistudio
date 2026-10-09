import { render } from "preact";
import { html } from "htm/preact";
import { App } from "./components/App.js";
import { Navbar } from "./components/Navbar.js";
import { Sidebar } from "./components/Sidebar.js";
import { Content } from "./components/Content.js";
import { ThemeToggle } from "./render/islands/ThemeToggle.js";
import { SearchBox } from "./render/islands/SearchBox.js";
import { Counter } from "./render/islands/Counter.js";
import { initRouter, navigateTo } from "./router.ts";
import { registerServiceWorker } from "./register-sw.ts";
import * as state from "./state.ts";

// Exporta todos os componentes e ferramentas da biblioteca
export {
  App,
  Navbar,
  Sidebar,
  Content,
  ThemeToggle,
  SearchBox,
  Counter,
  initRouter,
  navigateTo,
  registerServiceWorker,
  state,
};

// Disponibiliza a biblioteca no escopo global para consumo direto via browser
if (typeof window !== "undefined") {
  window.mdBlog = {
    App,
    Navbar,
    Sidebar,
    Content,
    ThemeToggle,
    SearchBox,
    Counter,
    initRouter,
    navigateTo,
    registerServiceWorker,
    state,
  };
}

/**
 * Inicialização automática no browser:
 * 1. Procura o container #app (ou cria um se ausente).
 * 2. Tenta carregar um app.js customizado do usuário caso exista.
 * 3. Caso NÃO exista app.js, utiliza automaticamente o App padrão com todos os componentes da biblioteca embutidos.
 * 4. Inicializa o router reativo e registra o Service Worker.
 */
async function bootstrap() {
  let root = document.getElementById("app");
  if (!root && document.body) {
    root = document.createElement("div");
    root.id = "app";
    document.body.appendChild(root);
  }

  // 1. Verifica se há um componente customizado provido via window ou arquivo app.js
  let ComponentToMount = App;

  if (typeof window !== "undefined" && window.mdBlogApp) {
    ComponentToMount = window.mdBlogApp;
  } else {
    try {
      // Tenta importar dinamicamente app.js em tempo de execução no browser se existir
      const dynamicImport = new Function("path", "return import(path)");
      const userModule = await dynamicImport("./app.js").catch(() => null);
      if (userModule) {
        if (typeof userModule.App === "function") {
          ComponentToMount = userModule.App;
        } else if (typeof userModule.default === "function") {
          ComponentToMount = userModule.default;
        }
      }
    } catch {
      // Nenhum app.js encontrado: usa a biblioteca e componentes embutidos por padrão
    }
  }

  if (root) {
    render(html`<${ComponentToMount} />`, root);
  }

  // Inicializa o roteador para leitura reativa dos artigos
  initRouter();

  // Registra o Service Worker padrão com escopo relativo
  registerServiceWorker();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      bootstrap().catch((err) => console.error("[mdBlog] Bootstrap error:", err));
    });
  } else {
    bootstrap().catch((err) => console.error("[mdBlog] Bootstrap error:", err));
  }
}
