import { html } from "htm/preact";
import { useSignal } from "@preact/signals";

const DOCS_INDEX = [
  { path: "/docs/README.md", title: "Visão Geral e Introdução", desc: "Apresentação da arquitetura Docsify com Wire Format" },
  { path: "/docs/PLANO_MIGRACAO_HTML_ES.md", title: "Migração HTML+ES (.js) & Lib Transpiler", desc: "Arquitetura 100% HTML+ES em JS puro e lib de transpilação" },
  { path: "/docs/PLANO_DESENVOLVIMENTO.md", title: "Plano de Desenvolvimento", desc: "Plano técnico detalhado e etapas" },
  { path: "/docs/ARQUITETURA_WIRE_FORMAT.md", title: "Arquitetura do Wire Format", desc: "Contrato JSON e mapeamento mdast" },
  { path: "/docs/FLUXOS_E_CICLO_DE_VIDA.md", title: "Fluxos e Ciclo de Vida", desc: "First-paint, SPA, Offline e Cache" },
  { path: "/docs/GUIA_DE_ISLANDS.md", title: "Guia de Islands (Modo B)", desc: "Hidratação seletiva no estilo Fresh" },
  { path: "/docs/guia.md", title: "Guia Prático de Exemplo", desc: "Exemplo prático de documentação interativa" },
];

export function SearchBox({ placeholder = "Pesquisar documentação..." } = {}) {
  const query = useSignal("");
  const isOpen = useSignal(false);

  const results = query.value.trim() === ""
    ? []
    : DOCS_INDEX.filter((doc) =>
        doc.title.toLowerCase().includes(query.value.toLowerCase()) ||
        doc.desc.toLowerCase().includes(query.value.toLowerCase()),
      );

  return html`
    <div class="margin">
      <div class="field prefix round fill small surface-container-highest no-margin">
        <i class="front">search</i>
        <input
          type="search"
          placeholder=${placeholder}
          value=${query.value}
          onInput=${(e) => {
            query.value = e.target.value;
            isOpen.value = true;
          }}
          onFocus=${() => (isOpen.value = true)}
        />
        ${query.value ? html`
          <i
            class="back link"
            onClick=${() => {
              query.value = "";
              isOpen.value = false;
            }}
          >
            close
          </i>
        ` : null}
      </div>

      ${isOpen.value && results.length > 0 ? html`
        <menu class="surface-container-high border round shadow medium-padding active">
          <p class="small-text surface-variant-text no-margin margin-bottom">
            ${results.length} resultado(s) encontrado(s):
          </p>
          <div class="column gap">
            ${results.map((doc) => html`
              <a
                key=${doc.path}
                href="#${doc.path}"
                class="row items-center wave padding round surface-container-low"
                onClick=${() => {
                  isOpen.value = false;
                  query.value = "";
                }}
              >
                <i class="primary-text">description</i>
                <div class="max truncate">
                  <div class="bold truncate">${doc.title}</div>
                  <div class="small-text surface-variant-text truncate">${doc.desc}</div>
                </div>
              </a>
            `)}
          </div>
        </menu>
      ` : null}
    </div>
  `;
}
