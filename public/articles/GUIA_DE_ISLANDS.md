---
title: "🏝️ Islands HTML+ES"
icon: "widgets"
date: "2026-10-05"
badge: "Islands"
author: "SyntaxMesh Team"
tags:
  - "islands"
  - "fresh"
  - "hidratação"
description: "Manual de arquitetura de ilhas interativas no modelo Fresh com Preact."
location: "#/articles/GUIA_DE_ISLANDS.md"
---

# 🏝 Guia de Arquitetura de Islands (Solução HTML+ES)

Inspirado no modelo arquitetural do **Fresh** (Deno) e com a adoção exclusiva da solução **HTML+ES (Hyperscript Tagged Markup via `htm/preact` + ES Modules padrão)**, o sistema de Islands permite inserir componentes interativos e reativos dentro da documentação estática mantendo o princípio de **zero compilação prévia pelo bundle**, **zero JavaScript desnecessário** e **execução 100% nativa no navegador do início ao fim**.

---

## 1. Por que HTML+ES e não TSX ou MDX?

Durante a evolução do projeto, três abordagens foram rigorosamente avaliadas:

| Abordagem | Veredito | Justificativa Técnica |
|---|---|---|
| **TSX (Compilado)** | Substituído | Exige empacotamento prévio (`Deno.bundle`/esbuild) para cada nova ilha. Impede que o usuário crie ou adicione ilhas a quente diretamente no browser. |
| **MDX no Browser** | Descartado | Exige carregar o compilador `@mdx-js` completo (~3MB a 5MB) em tempo de execução no cliente e usar `new Function` / `eval` inseguro, ferindo CSP e penalizando o mobile. |
| **JSX sem Build** | Descartado | Navegadores lançam `SyntaxError: Unexpected token '<'`. Exigiria carregar transpilador pesado (Babel/Sucrase de ~800KB) no cliente. |
| **HTML+ES (`htm/preact`)** | **ADOTADO EXCLUSIVAMENTE** | Padrão oficial do Preact. Utiliza *Tagged Template Literals* nativas do JavaScript ES6 (`html\`...\``). Pesa apenas **~600 bytes**, roda nativamente em qualquer navegador sem build, permite `import()` dinâmico assíncrono sob demanda e respeita CSP. |

---

## 2. Princípios Fundamentais

1. **Apenas Ilhas são Hidratadas:** O resto da documentação (cabeçalhos, parágrafos, tabelas, citações) é materializado como nós HTML puramente estáticos. O Preact não gasta ciclos tentando reconciliar o que não muda.
2. **Zero Bundle para Novas Ilhas:** Ilhas podem ser escritas como arquivos `.js` comuns em `public/islands/` e carregadas assincronamente pelo navegador via `import("./islands/Nome.js")`.
3. **Sem closures no Wire:** O Wire Format é JSON puro. Uma ilha é apenas um nó `{ t: "i", n: "Nome", p: { props }, c: [ filhosEstáticos ] }`.
4. **Isolamento do Service Worker:** O Service Worker **nunca** importa Preact ou componentes de UI. Ele manipula apenas os nomes literais das ilhas (`manifest.ts`).
5. **Resiliência a Falhas:** Se uma ilha não puder ser resolvida nem baixada, o conteúdo de fallback estático pré-renderizado permanece visível e funcional, sem causar tela branca ou exceções.

---

## 3. Separação de Responsabilidades: Manifesto vs Registry

Para evitar que o Service Worker fique inflado com dependências de UI e DOM:

```
                  ┌──────────────────────────────────────────────┐
                  │    src/render/islands/manifest.ts            │
                  │    export const islandNames = [...] as const;│
                  └──────────────────────┬───────────────────────┘
                                         │
                  ┌──────────────────────┴───────────────────────┐
                  ▼                                              ▼
   [ Service Worker / Core ]                         [ Client Browser (HTML+ES) ]
   - Lê apenas nomes (strings)                      - Carrega ilhas pré-registradas
   - Marca nós com t: "i"                           - Ou faz import() dinâmico (.js)
   - ZERO dependências Preact                       - Hidrata seletivamente via DOM
```

---

## 4. Como Funciona a Hidratação Seletiva (`hydrateIslands`)

### 4.1 Emissão dos Marcadores HTML
Durante a execução de `wireToVNode()`, nós com `t: "i"` geram elementos contenedores com atributos de dados:

```html
<!-- Se a ilha estiver registrada ou com fallback: -->
<div data-island="Counter" data-props='{"start": 10}'>
  <!-- Filhos estáticos renderizados inicialmente -->
</div>
```

### 4.2 O Algoritmo de Hidratação com Suporte Dinâmico
A função `hydrateIslands(registry, opts)` varre o DOM procurando por elementos `[data-island]`. Se a ilha não estiver presente no registro pré-carregado, tenta importá-la como módulo ES sob demanda (`./islands/${name}.js`):

```ts
export function hydrateIslands(registry: Record<string, ComponentType<any>>, opts: HydrateOptions = {}): number {
  const root = opts.root ?? document.body;
  const nodes = root.querySelectorAll<HTMLElement>("[data-island]");
  let hydrated = 0;

  for (const el of nodes) {
    if (el.dataset.islandHydrated === "true") continue;
    const name = el.dataset.island;
    if (!name) continue;

    const Comp = registry[name];
    if (!Comp) {
      // Import dinâmico nativo do navegador para ilha HTML+ES autônoma:
      import(`./islands/${name}.js`)
        .then((mod) => {
          const dynamicComp = mod[name] || mod.default;
          if (dynamicComp) {
            registry[name] = dynamicComp;
            const props = JSON.parse(el.dataset.props || "{}");
            el.dataset.islandHydrated = "true";
            hydrate(h(dynamicComp, props), el);
          }
        })
        .catch(() => {
          el.dataset.islandMissing = "true";
        });
      continue;
    }

    let props = {};
    try {
      props = JSON.parse(el.dataset.props || "{}");
    } catch {}

    el.dataset.islandHydrated = "true";
    try {
      hydrate(h(Comp, props), el);
      hydrated++;
    } catch (e) {
      console.error(`[islands] Falha ao hidratar ${name}:`, e);
    }
  }

  return hydrated;
}
```

---

## 5. Como Criar uma Nova Island em Formato HTML+ES

Com a solução HTML+ES, você pode criar uma nova ilha sem precisar rebuildar o projeto!

### Exemplo: `public/islands/MeuWidget.js`

```javascript
import { html } from "htm/preact";
import { signal } from "@preact/signals";

export function MeuWidget({ titulo = "Meu Widget Dinâmico" }) {
  const ativo = signal(false);

  return html`
    <article class="border round padding surface-container margin-bottom">
      <div class="row items-center justify-between">
        <h6 class="no-margin bold">${titulo}</h6>
        <button
          class="chip ${ativo.value ? 'primary' : 'surface-variant'}"
          onClick=${() => (ativo.value = !ativo.value)}
        >
          ${ativo.value ? "Ativado" : "Desativado"}
        </button>
      </div>
    </article>
  `;
}

export default MeuWidget;
```

### Usando no Markdown
Basta referenciar a ilha em qualquer arquivo `.md`:

```markdown
::MeuWidget{titulo: "Demonstração sem Rebuild"}
```

Ou em bloco de código:

````markdown
```island:MeuWidget
{
  "titulo": "Demonstração em Bloco"
}
```
````

Ao abrir o documento no navegador, o cliente detecta a ilha, importa `public/islands/MeuWidget.js` nativamente via rede/cache e ativa a reatividade instantaneamente!
