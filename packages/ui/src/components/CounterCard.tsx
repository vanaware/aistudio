import { count, step, square, cube, isEven } from "../store.ts";

export function CounterCard() {
  return (
    <article class="border round medium-elevate">
      <div class="row">
        <div class="max">
          <h5 class="bold">Estado Reativo (Signals)</h5>
          <p class="secondary-text">Atualizações instantâneas sem re-renderização desnecessária</p>
        </div>
        <span class="chip primary">
          <i>bolt</i>
          <span>Passo: {step.value}</span>
        </span>
      </div>

      <div class="row center-align">
        <button
          class="circle large secondary"
          onClick={() => (count.value -= step.value)}
          title="Diminuir"
        >
          <i>remove</i>
        </button>

        <div class="center-align padding">
          <h1 class="bold large primary-text">{count.value}</h1>
          <span class="chip">{isEven.value ? "Número Par" : "Número Ímpar"}</span>
        </div>

        <button
          class="circle large primary"
          onClick={() => (count.value += step.value)}
          title="Aumentar"
        >
          <i>add</i>
        </button>
      </div>

      <nav class="row center-align">
        <button
          class={step.value === 1 ? "chip fill primary" : "chip border"}
          onClick={() => (step.value = 1)}
        >
          Passo 1
        </button>
        <button
          class={step.value === 5 ? "chip fill primary" : "chip border"}
          onClick={() => (step.value = 5)}
        >
          Passo 5
        </button>
        <button
          class={step.value === 10 ? "chip fill primary" : "chip border"}
          onClick={() => (step.value = 10)}
        >
          Passo 10
        </button>
        <button
          class="chip transparent"
          onClick={() => (count.value = 0)}
        >
          <i>refresh</i>
          <span>Zerar</span>
        </button>
      </nav>

      <div class="grid">
        <div class="s6">
          <article class="fill surface-container round center-align">
            <h6 class="secondary-text">Quadrado (computed)</h6>
            <h4 class="bold">{square.value}</h4>
          </article>
        </div>
        <div class="s6">
          <article class="fill surface-container round center-align">
            <h6 class="secondary-text">Cubo (computed)</h6>
            <h4 class="bold">{cube.value}</h4>
          </article>
        </div>
      </div>
    </article>
  );
}
