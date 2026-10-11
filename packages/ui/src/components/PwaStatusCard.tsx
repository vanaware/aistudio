import { APP_VERSION } from "../version.ts";

export function PwaStatusCard() {
  const displayVersion = APP_VERSION
    ? (APP_VERSION.startsWith("v") ? APP_VERSION : `v${APP_VERSION}`)
    : "v1.0";

  return (
    <article class="border round medium-elevate">
      <div class="row">
        <div class="max">
          <h5 class="bold">Arquitetura PWA & Deno</h5>
          <p class="secondary-text">Versão {displayVersion} • Empacotado com Deno & esbuild</p>
        </div>
        <span class="chip tertiary">
          <i>verified</i>
          <span>{displayVersion}</span>
        </span>
      </div>

      <div class="grid">
        <div class="s12 m6">
          <article class="fill surface-container round">
            <div class="row">
              <i>cloud_done</i>
              <div class="max">
                <h6 class="bold">Service Worker</h6>
                <p class="secondary-text">Cache offline e interceptação de rotas</p>
              </div>
              <span class="chip success">Ativo</span>
            </div>
          </article>
        </div>

        <div class="s12 m6">
          <article class="fill surface-container round">
            <div class="row">
              <i>devices</i>
              <div class="max">
                <h6 class="bold">Web Manifest</h6>
                <p class="secondary-text">Instalável em desktop e mobile</p>
              </div>
              <span class="chip primary">PWA Ready</span>
            </div>
          </article>
        </div>

        <div class="s12 m6">
          <article class="fill surface-container round">
            <div class="row">
              <i>palette</i>
              <div class="max">
                <h6 class="bold">BeerCSS 5.0.3</h6>
                <p class="secondary-text">Material Design 3 puro sem CSS customizado</p>
              </div>
              <span class="chip">Puro</span>
            </div>
          </article>
        </div>

        <div class="s12 m6">
          <article class="fill surface-container round">
            <div class="row">
              <i>electric_bolt</i>
              <div class="max">
                <h6 class="bold">Preact Signals</h6>
                <p class="secondary-text">Reatividade de alta performance</p>
              </div>
              <span class="chip secondary">Signals</span>
            </div>
          </article>
        </div>
      </div>
    </article>
  );
}
