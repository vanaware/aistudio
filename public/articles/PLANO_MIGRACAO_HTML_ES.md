---
title: "⚡ Arquitetura HTML+ES (.js)"
icon: "code"
date: "2026-10-07"
badge: "Zero JSX"
author: "SyntaxMesh Team"
tags:
  - "htm/preact"
  - "zero-bundle"
  - "es-modules"
description: "Migração completa para HTML+ES no browser e biblioteca isolada de transpilação."
location: "#/articles/PLANO_MIGRACAO_HTML_ES.md"
---

# 🚀 Plano Arquitetural: Migração Completa para HTML+ES no Browser e Biblioteca Isolada de Transpilação Markdown

> **Status:** Aprovado e Executado  
> **Objetivo:** Migrar 100% dos componentes Preact do ecossistema para a solução **HTML+ES** (utilizando `htm/preact` e ES Modules padrão, sem qualquer compilação de JSX), mantendo no bundle exclusivamente uma biblioteca especializada que realiza a transpilação de Markdown para Wire Format AST, além do Service Worker.

---

## 1. Contexto e Motivação

### 1.1 O Desafio Original
Anteriormente, os componentes de interface (`App.tsx`, `Navbar.tsx`, `Sidebar.tsx`, `Content.tsx`, `Playground.tsx`, `registry.tsx`, etc.) eram escritos em sintaxe JSX (`.tsx`), exigindo que o bundler realizasse a compilação do JSX para chamadas `h()` / `_jsx()`. Isso acoplava a camada visual de apresentação ao processo de empacotamento, impedindo que os componentes fossem executados diretamente como ES Modules nativos no navegador.

### 1.2 A Solução: Componentes HTML+ES & Biblioteca Especializada
1. **Componentes 100% HTML+ES em arquivos `.js`:** Todos os componentes Preact são migrados para a solução **HTML+ES** baseada em `htm/preact` utilizando arquivos **`.js`** padrão. Utilizam *Tagged Template Literals* nativas do JavaScript (`html\`<tag>...\`\``). Não há mais nenhuma linha de JSX nem arquivos `.tsx`. Os componentes rodam nativamente no navegador do início ao fim como ES Modules padrão.
2. **Biblioteca de Transpilação Isolada no Bundle:** O processo de bundling é reservado estritamente para o que realmente necessita de empacotamento: a biblioteca de análise sintática e transformação de Markdown (`mdast-util-from-markdown`, `mdast-util-gfm`, `micromark-extension-gfm` e pipeline de Wire Format) gerada em `dist/lib/md-transpiler.js`, e o Service Worker (`dist/sw.js`).
3. **Consumo no Navegador:** O navegador importa a biblioteca de transpilação para processar Markdown bruto em Wire Format AST (`WireDoc`/`WireFragment`), e os componentes HTML+ES consomem essa árvore e renderizam a UI com zero `dangerouslySetInnerHTML`.

### 1.3 Por que a extensão correta é `.js` e NÃO `.jsx`?
- **Por que NÃO `.jsx`?** A extensão `.jsx` é uma convenção de ferramentas de build indicando sintaxe JSX não padrão (`<div>`). Navegadores não executam JSX e lançam `SyntaxError: Unexpected token '<'`. Chamar componentes HTML+ES de `.jsx` seria um erro conceitual, pois **não há JSX algum**.
- **Por que `.js` é a extensão canônica e correta?** Como `htm/preact` utiliza exclusivamente *Tagged Template Literals* nativas do JavaScript ES6 (`html\`...\``), o código é **JavaScript 100% padrão e válido**. Arquivos `.js` são reconhecidos e executados diretamente por qualquer navegador moderno via `<script type="module">` ou `import()`, sem necessidade de compilação prévia nem transpiladores em tempo de execução.

---

## 2. Comparativo Arquitetural

| Aspecto | Arquitetura Anterior | Nova Arquitetura (HTML+ES .js + Lib de Transpilação) |
|---|---|---|
| **Extensão dos Componentes** | `.tsx` (TypeScript + JSX) | **`.js`** (JavaScript ES Modules padrão) |
| **Sintaxe dos Componentes** | JSX (`<div class="row">...</div>`) | HTML+ES nativo (`html\`<div class="row">...</div>\``) |
| **Dependência de Compilador JSX** | Obrigatório (`esbuild`/`Deno.bundle`) para cada componente | **Zero compilação JSX**. Roda nativo no browser via tagged templates |
| **Isolamento do Parser Markdown** | Monolito compilado com toda a aplicação | **Biblioteca isolada** (`dist/lib/md-transpiler.js`) exportável e reutilizável |
| **Tamanho e Manutenibilidade** | Componentes acoplados ao bundle final | Componentes leves, modulares e compatíveis com ES Modules padrão |
| **Islands e Hidratação** | Híbrido com TSX | **Padrão uniforme HTML+ES (.js)** para shell, páginas e ilhas |
| **Segurança** | Zero `dangerouslySetInnerHTML` | Zero `dangerouslySetInnerHTML` (mantido integralmente) |

---

## 3. Estrutura de Diretórios e Módulos

```
.
├── src/
│   ├── index.html                 # Shell HTML com scripts em módulos ES nativos
│   ├── main.js                    # Entrypoint da SPA (HTML+ES nativo .js)
│   ├── state.ts                   # Gerenciamento de estado global reativo (Signals)
│   ├── router.ts                  # Roteador SPA baseado em hash
│   ├── register-sw.ts             # Registro do Service Worker
│   ├── sw.ts                      # Service Worker para cache e interceptação de Wire
│   │
│   ├── lib/
│   │   └── md-transpiler.ts       # 📦 Ponto de entrada da biblioteca de transpilação Markdown -> Wire
│   │
│   ├── plugin/                    # Núcleo de parsing e pipeline agnóstico
│   │   ├── core/                  # parse.ts, to-wire.ts, pipeline.ts, io.ts
│   │   ├── wire.ts                # Definição dos tipos Wire Format
│   │   └── detect.ts              # Utilitários de rota e detecção
│   │
│   ├── components/                # 🎨 Componentes 100% HTML+ES (.js puro sem JSX)
│   │   ├── App.js                 # Shell de layout (Navbar + Sidebar + Content)
│   │   ├── Navbar.js              # Barra superior reativa com BeerCSS
│   │   ├── Sidebar.js             # Drawer lateral compacto com scroll independente
│   │   ├── Content.js             # Visualizador do artigo renderizado via Wire
│   │   ├── Playground.js          # Editor e compilador interativo de Markdown
│   │   ├── CounterCard.js         # Demonstração reativa de Signals
│   │   ├── TaskMeshCard.js        # Gerenciador de tarefas integrado com store
│   │   ├── PwaStatusCard.js       # Status e diagnósticos da PWA
│   │   └── Header.js              # Top bar alternativo
│   │
│   └── render/                    # 🏗️ Materialização da árvore Wire em VNodes
│       ├── from-wire.ts           # wireToVNode() recursivo
│       ├── registry.js            # Componentes padrão HTML+ES (Heading, CodeBlock, etc.)
│       ├── hydrate-islands.ts     # Hidratação seletiva no DOM
│       └── islands/               # Ilhas interativas HTML+ES (.js)
│           ├── manifest.ts        # Lista de nomes de ilhas autorizadas
│           ├── index.js           # Mapeamento de componentes
│           ├── Counter.js         # Ilha interativa: Contador (.js)
│           ├── SearchBox.js       # Ilha interativa: Busca rápida (.js)
│           └── ThemeToggle.js     # Ilha interativa: Alternador de tema claro/escuro (.js)
│
├── dist/                          # 📁 Saída gerada pelo build
│   ├── lib/
│   │   └── md-transpiler.js       # 📦 Biblioteca isolada empacotada de transpilação Markdown
│   ├── sw.js                      # Service Worker isolado
│   ├── index.html                 # Shell da aplicação
│   └── ...                        # Assets estáticos (BeerCSS, ícones, manifest)
```
│   ├── lib/
│   │   └── md-transpiler.js       # 📦 Biblioteca isolada empacotada de transpilação Markdown
│   ├── sw.js                      # Service Worker isolado
│   ├── index.html                 # Shell da aplicação
│   └── ...                        # Assets estáticos (BeerCSS, ícones, manifest)
```

---

## 4. Detalhamento da Biblioteca de Transpilação (`md-transpiler`)

A biblioteca isolada empacotada em `dist/lib/md-transpiler.js` encapsula:
1. `mdast-util-from-markdown` + `micromark-extension-gfm` + `mdast-util-gfm`: Análise léxica e sintática de Markdown padrão CommonMark + extensões GitHub Flavored Markdown (tabelas, task lists, strikethrough, autolinks).
2. `mdastToWire`: Conversão de nós AST `mdast` para a árvore leve serializável JSON `WireDoc` / `WireFragment`.
3. Sanitização contra XSS: Descarte de nós HTML crus e sanitização estrita de propriedades JSON.
4. Identificação de Ilhas Reativas: Detecção sintática de blocos ````island:Nome```` e diretivas `::Nome{...}`.

### 4.1 Interface Pública Exportada
```ts
export {
  parseMarkdown,      // (md: string) => Root mdast
  mdastToWire,        // (root: Root, islandNames?: Set<string>) => { wire, title }
  processMarkdown,    // (md: string, url: string, islands?: Set<string>) => WireDoc
  loadDoc,            // (url: string, io: IO, options?: LoadDocOptions) => Promise<WireDoc>
  createMemoryIO,     // (files?: Record<string, string>) => IO
  countWireNodes,     // (wire: WireNode) => number
  countWireIslands,   // (wire: WireNode) => number
  sanitizeProps,      // (props: any) => Record<string, any>
};
```

---

## 5. Padrão de Codificação dos Componentes HTML+ES

Todos os componentes seguem a convenção oficial do Preact com `htm/preact`:

```ts
import { html } from "htm/preact";
import { count, step } from "../store.ts";

export function CounterCard() {
  return html`
    <article class="border round medium-elevate">
      <div class="row items-center justify-between">
        <h5 class="bold">Estado Reativo (Signals)</h5>
        <span class="chip primary">Passo: ${step.value}</span>
      </div>
      <div class="row center-align">
        <button
          class="circle large secondary"
          onClick=${() => (count.value -= step.value)}
        >
          <i>remove</i>
        </button>
        <h1 class="bold large primary-text">${count.value}</h1>
        <button
          class="circle large primary"
          onClick=${() => (count.value += step.value)}
        >
          <i>add</i>
        </button>
      </div>
    </article>
  `;
}
```

### 5.1 Regras de Sintaxe HTML+ES
- **Tags de Fechamento Automático:** Podem ser fechadas como `<input />` ou `<input>`.
- **Interpolação de Componentes:** Componentes Preact filhos são interpolados com `${Component}`: `<${Navbar} />`.
- **Manipuladores de Eventos:** Passados como funções via `${(e) => ...}`: `onClick=${handleClick}`.
- **Valores Booleanos:** `checked=${isActive}`.
- **Classes Dinâmicas:** `class="row ${isActive ? 'active' : ''}"`.

---

## 6. Fases de Execução da Migração

### Fase 1: Criação da Biblioteca Isolada de Transpilação
- Implementar `src/lib/md-transpiler.ts` reunindo todas as funções do pipeline de markdown para wire.
- Atualizar `build.ts` para empacotar `src/lib/md-transpiler.ts` como `dist/lib/md-transpiler.js`.

### Fase 2: Migração do Registry de Renderização para HTML+ES
- Converter `src/render/registry.tsx` em `src/render/registry.ts`.
- Substituir todas as tags JSX (`<h4 ...>`, `<pre ...>`, etc.) por `html\`...\`` com `htm/preact`.
- Garantir que a renderização de cabeçalhos, blocos de código com botão de cópia, listas com checkboxes e tabelas funcione perfeitamente.

### Fase 3: Migração das Islands para HTML+ES
- Converter `src/render/islands/SearchBox.tsx` em `src/render/islands/SearchBox.ts`.
- Converter `src/render/islands/ThemeToggle.tsx` em `src/render/islands/ThemeToggle.ts`.
- Validar `src/render/islands/Counter.ts` que já utilizava `htm/preact`.
- Atualizar `src/render/islands/index.ts` com as novas importações `.ts`.

### Fase 4: Migração dos Componentes de UI da Aplicação
- Converter `src/components/App.tsx` -> `src/components/App.ts`.
- Converter `src/components/Navbar.tsx` -> `src/components/Navbar.ts`.
- Converter `src/components/Sidebar.tsx` -> `src/components/Sidebar.ts`.
- Converter `src/components/Content.tsx` -> `src/components/Content.ts`.
- Converter `src/components/Playground.tsx` -> `src/components/Playground.ts`.
- Converter `src/components/CounterCard.tsx` -> `src/components/CounterCard.ts`.
- Converter `src/components/TaskMeshCard.tsx` -> `src/components/TaskMeshCard.ts`.
- Converter `src/components/PwaStatusCard.tsx` -> `src/components/PwaStatusCard.ts`.
- Converter `src/components/Header.tsx` -> `src/components/Header.ts`.

### Fase 5: Atualização do Entrypoint e Build Pipeline
- Converter `src/main.tsx` -> `src/main.ts`.
- Atualizar `src/index.html` para apontar para `./main.ts`.
- Atualizar `build.ts` para compilar o app e a biblioteca de transpilação.
- Atualizar tarefas em `deno.json`.

### Fase 6: Validação de Testes BDD
- Atualizar e executar `tests/app_test.ts`, `tests/registry_test.ts`, `tests/islands_test.ts`, `tests/pipeline_test.ts`.
- Adicionar novos testes confirmando que nenhum arquivo `.tsx` resta no codebase e que a biblioteca `dist/lib/md-transpiler.js` é gerada com sucesso.
- Executar `deno check` e `deno test`.
