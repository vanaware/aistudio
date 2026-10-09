// Ilha interativa pura HTML+ES (executada diretamente no navegador sem compilação nem bundle)
import { html } from "htm/preact";
import { signal } from "@preact/signals";

export function DemoWidget({ title = "Ilha Dinâmica HTML+ES", step = 1 }) {
  const count = signal(0);
  const visible = signal(true);

  return html`
    <article class="border round medium-padding surface-container margin-bottom">
      <div class="row wrap items-center justify-between gap">
        <div>
          <h6 class="no-margin bold">${title}</h6>
          <p class="small-text surface-variant-text no-margin">
            Módulo ES nativo carregado sob demanda via import() do browser
          </p>
        </div>
        <div class="row items-center gap">
          <button
            class="circle small surface-variant"
            onClick=${() => (count.value -= Number(step))}
            aria-label="Diminuir"
          >
            <i>remove</i>
          </button>
          <span class="chip primary bold center-align">${count.value}</span>
          <button
            class="circle small primary"
            onClick=${() => (count.value += Number(step))}
            aria-label="Aumentar"
          >
            <i>add</i>
          </button>
        </div>
      </div>
    </article>
  `;
}

export default DemoWidget;
