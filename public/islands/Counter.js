// Ilha Counter em formato puro HTML+ES (execução direta no navegador)
import { html } from "htm/preact";
import { signal } from "@preact/signals";

export function Counter({ start = 0, step = 1, label = "Contador Interativo" }) {
  const count = signal(Number(start));

  return html`
    <article class="border round medium-padding surface-container-low margin">
      <div class="row wrap items-center justify-between gap">
        <div class="max wrap">
          <h6 class="no-margin bold wrap">${label}</h6>
          <p class="small-text surface-variant-text no-margin wrap">
            Ilha HTML+ES (execução nativa sem compilação de bundle)
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
          <span class="chip primary bold center-align">
            ${count.value}
          </span>
          <button
            class="circle small primary"
            onClick=${() => (count.value += Number(step))}
            aria-label="Aumentar"
          >
            <i>add</i>
          </button>
          <button
            class="circle small transparent"
            onClick=${() => (count.value = Number(start))}
            title="Resetar"
            aria-label="Resetar"
          >
            <i>refresh</i>
          </button>
        </div>
      </div>
    </article>
  `;
}

export default Counter;
