export function PwaStatusCard() {
  return (
    <article class="border">
      <h5>Arquitetura PWA & Deno</h5>
      <div>Construído com Deno, Preact, Signals e BeerCSS puro</div>

      <div class="space"></div>

      <div class="grid">
        <div class="s12 m6">
          <article class="surface-container">
            <div class="row">
              <i>cloud_done</i>
              <div class="max">
                <h6>Service Worker</h6>
                <div>Cache offline e rotas</div>
              </div>
              <span class="chip success">Ativo</span>
            </div>
          </article>
        </div>

        <div class="s12 m6">
          <article class="surface-container">
            <div class="row">
              <i>devices</i>
              <div class="max">
                <h6>Web Manifest</h6>
                <div>Instalável como PWA</div>
              </div>
              <span class="chip primary">PWA</span>
            </div>
          </article>
        </div>

        <div class="s12 m6">
          <article class="surface-container">
            <div class="row">
              <i>palette</i>
              <div class="max">
                <h6>BeerCSS 5</h6>
                <div>Material Design 3 puro</div>
              </div>
              <span class="chip">Puro</span>
            </div>
          </article>
        </div>

        <div class="s12 m6">
          <article class="surface-container">
            <div class="row">
              <i>electric_bolt</i>
              <div class="max">
                <h6>Preact Signals</h6>
                <div>Reatividade de alta performance</div>
              </div>
              <span class="chip secondary">Signals</span>
            </div>
          </article>
        </div>
      </div>
    </article>
  );
}
