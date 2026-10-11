import { count, step, square, cube, isEven } from "../store.ts";

export function CounterCard() {
  return (
    <article class="border">
      <div class="row">
        <div class="max">
          <h5>Estado Reativo</h5>
          <div>Preact Signals e computação reativa</div>
        </div>
        <span class="chip primary">
          <i>bolt</i>
          <span>Passo {step.value}</span>
        </span>
      </div>

      <div class="space"></div>

      <div class="center-align">
        <h1 class="primary-text">{count.value}</h1>
        <span class="chip">{isEven.value ? "Número Par" : "Número Ímpar"}</span>
      </div>

      <div class="space"></div>

      <div class="row center-align">
        <button
          class="circle secondary"
          onClick={() => (count.value -= step.value)}
          title="Diminuir"
        >
          <i>remove</i>
        </button>

        <button
          class={step.value === 1 ? "chip fill primary" : "chip border"}
          onClick={() => (step.value = 1)}
        >
          1
        </button>
        <button
          class={step.value === 5 ? "chip fill primary" : "chip border"}
          onClick={() => (step.value = 5)}
        >
          5
        </button>
        <button
          class={step.value === 10 ? "chip fill primary" : "chip border"}
          onClick={() => (step.value = 10)}
        >
          10
        </button>

        <button
          class="chip"
          onClick={() => (count.value = 0)}
          title="Zerar"
        >
          <i>refresh</i>
        </button>

        <button
          class="circle primary"
          onClick={() => (count.value += step.value)}
          title="Aumentar"
        >
          <i>add</i>
        </button>
      </div>

      <div class="space"></div>

      <div class="grid">
        <div class="s6">
          <article class="surface-container center-align">
            <div>Quadrado</div>
            <h4>{square.value}</h4>
          </article>
        </div>
        <div class="s6">
          <article class="surface-container center-align">
            <div>Cubo</div>
            <h4>{cube.value}</h4>
          </article>
        </div>
      </div>
    </article>
  );
}
