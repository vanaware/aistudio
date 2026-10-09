import { render } from "preact";
import { html } from "htm/preact";
import { App } from "./components/App.js";
import { initRouter } from "./router.ts";
import { registerServiceWorker } from "./register-sw.ts";

function bootstrap() {
  const root = document.getElementById("app");
  if (root) {
    render(html`<${App} />`, root);
  }

  // Initialize router and pre-rendered wire consumption
  initRouter();

  // Register offline Service Worker with relative scope
  registerServiceWorker();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
