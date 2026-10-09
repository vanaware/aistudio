---
title: "📋 Plano de Desenvolvimento"
icon: "checklist"
date: "2026-10-03"
badge: "Roadmap"
author: "SyntaxMesh Team"
tags:
  - "roadmap"
  - "planejamento"
  - "fases"
description: "Plano detalhado de desenvolvimento do gerador de documentação."
location: "#/articles/PLANO_DESENVOLVIMENTO.md"
pages:
  - "PLANO_MIGRACAO_HTML_ES.md"
---

# 🚀 Plano Detalhado de Desenvolvimento

Este documento descreve o plano cronológico, arquitetural e técnico para o desenvolvimento do **Gerador de Documentação Estático com Service Worker, Wire Format e Preact Islands (Modo B)**, conforme as especificações de `CURRENT.md`.

---

## 1. Visão Geral e Princípios Fundamentais

### 1.1 Objetivo
Construir uma solução de documentação com a fluidez do Docsify, mas que:
1. Elimine completamente o uso de `dangerouslySetInnerHTML`.
2. Intercepte requisições via **Service Worker**, convertendo Markdown diretamente em uma árvore serializável JSON (**Wire Format**).
3. Entregue um HTML inicial com o Wire embutido em `<script id="__md_wire">` para first-paint instantâneo e SEO/acessibilidade estruturada.
4. Execute o **mesmo pipeline** no cliente de maneira transparente caso o Service Worker não esteja ativo ou seja desabilitado.
5. **100% dos Componentes Preact em HTML+ES no Navegador:** Migração integral de todos os componentes de interface (`App`, `Navbar`, `Sidebar`, `Content`, `Playground`, `registry`, ilhas) para **HTML+ES** (`htm/preact` e ES Modules padrão), executando 100% no navegador do início ao fim sem necessidade de compilação JSX nem transpiladores pesados em runtime.
6. **Biblioteca Isolada de Transpilação Markdown no Bundle:** O processo de bundling é reservado exclusivamente para a biblioteca de análise sintática e geração de Wire Format (`dist/lib/md-transpiler.js`) e para o Service Worker (`dist/sw.js`). O navegador consome essa biblioteca diretamente como um módulo ES puro.

### 1.2 Regras Rígidas e Restrições Arquiteturais
- **Segurança absoluta:** Nenhum uso de `dangerouslySetInnerHTML`, `eval`, `new Function` ou carregamento dinâmico de scripts não autenticados. Tags HTML no markdown cru são descartadas (`null`).
- **Isolamento de Camadas:** 
  - O **Core** (`src/plugin/core/*`) é TypeScript puro. Não acessa variáveis globais do navegador ou worker (`window`, `self`, `caches`, `fetch`, `navigator`). Todas as operações de I/O são injetadas através da interface `IO`.
  - O **Service Worker** (`src/sw.ts`) jamais importa pacotes de UI (`preact`, `htm`, `@preact/signals`). O manifesto de ilhas do SW contém estritamente strings com os nomes das ilhas.
- **Ecossistema Deno:** Sem dependências locais de `node_modules`. Importações via `deno.json` utilizando especificadores `jsr:` e `npm:`.
- **CSS e Interface:** BeerCSS (Material Design 3) via CDN + layout estruturado em `src/styles.css`.

---

## 2. Estrutura de Arquivos Planejada

```
.
├── deno.json                      # Configuração do runtime, import map e tasks
├── build.ts                       # Script de empacotamento com jsr:@vanaware/buildit/esbuild
├── index.html                     # Shell SPA base para hospedagem estática
├── CURRENT.md                     # Especificação de requisitos original
├── docs/                          # Documentação técnica e arquivos .md do site
│   ├── README.md                  # Índice da documentação
│   ├── PLANO_DESENVOLVIMENTO.md   # Este plano executivo
│   ├── ARQUITETURA_WIRE_FORMAT.md # Contrato detalhado do Wire Format
│   ├── FLUXOS_E_CICLO_DE_VIDA.md  # Detalhamento de F5, SPA, Offline e SW
│   ├── GUIA_DE_ISLANDS.md         # Manual do modelo de hidratação seletiva
│   ├── _sidebar.md                # Navegação lateral de exemplo
│   ├── _navbar.md                 # Barra superior de exemplo
│   └── guia.md                    # Conteúdo da documentação de exemplo
├── src/
│   ├── docs.ts                    # Instanciação do client fetcher (mdFetch)
│   ├── main.ts                    # Ponto de entrada da SPA no navegador
│   ├── register-sw.ts             # Registro do Service Worker e detecção
│   ├── sw.ts                      # Entrypoint isolado do Service Worker
│   ├── state.ts                   # Signals globais (@preact/signals)
│   ├── router.ts                  # Roteador reativo baseado em hash
│   ├── styles.css                 # Estilos customizados complementares ao BeerCSS
│   ├── plugin/                    # Módulo reutilizável agnóstico (JSR-ready)
│   │   ├── mod.ts                 # Exportações públicas do pacote
│   │   ├── types.ts               # Contratos (IO, Config, WireDoc)
│   │   ├── wire.ts                # Definição dos tipos do Wire Format
│   │   ├── detect.ts              # Utilitários de rota, detecção e resolução
│   │   ├── core/
│   │   │   ├── parse.ts           # Markdown -> mdast (fromMarkdown + GFM)
│   │   │   ├── to-wire.ts         # mdast -> WireFragment (com detecção de islands)
│   │   │   ├── respond.ts         # Geração de Response (JSON x HTML Shell)
│   │   │   ├── pipeline.ts        # Pipeline unificado handle() / load()
│   │   │   ├── shell.ts           # Gerador do shell HTML com script inline
│   │   │   └── io.ts              # Implementação de IO com Cache Storage
│   │   └── adapters/
│   │       ├── sw.ts              # Adapter para FetchEvent do Service Worker
│   │       └── client.ts          # Adapter para fetch local / fallback client
│   ├── render/                    # Camada de materialização Preact
│   │   ├── from-wire.ts           # wireToVNode() recursivo com registry
│   │   ├── registry.tsx           # Componentes padrão (Heading, CodeBlock, etc.)
│   │   ├── hydrate-islands.ts     # Hidratação seletiva com suporte a HTML+ES sob demanda
│   │   └── islands/               # Componentes interativos HTML+ES (htm/preact)
│   │       ├── manifest.ts        # Nomes das ilhas (compartilhável com SW)
│   │       ├── index.ts           # Mapa nome -> componente (cliente apenas)
│   │       ├── Counter.tsx        # Exemplo HTML+ES: Contador interativo
│   │       └── SearchBox.tsx      # Exemplo HTML+ES: Busca instantânea
│   └── components/                # Layout e interface da aplicação
│       ├── App.ts                 # Estrutura principal
│       ├── Navbar.ts              # Barra superior reativa
│       ├── Sidebar.ts             # Barra lateral com árvore de navegação
│       └── Content.ts             # Container do artigo renderizado via Wire
├── public/
│   └── islands/                   # Ilhas autônomas HTML+ES (.js) carregáveis sob demanda
│       ├── Counter.js             # Módulo ES nativo independente de bundle
│       └── DemoWidget.js          # Demonstração zero-compilação em runtime
└── tests/
    ├── pipeline_test.ts           # Testes BDD do parser, mdast e wire format
    ├── islands_test.ts            # Testes de serialização e sanitização de props
    └── registry_test.ts           # Testes de transformação do Wire em VNodes
```

---

## 3. Fases de Execução

### Fase 1: Configuração do Ambiente e Pipeline de Build
- **Objetivo:** Estabelecer a infraestrutura de compilação sem pacotes Node.js, com dependências declaradas em `deno.json`.
- **Atividades:**
  1. Configurar `deno.json` com `jsr:@vanaware/buildit/esbuild`, `preact`, `htm`, `@preact/signals`, `mdast-util-from-markdown`, `mdast-util-gfm`, `micromark-extension-gfm`.
  2. Implementar `build.ts` realizando dois bundles paralelos via `jsr:@vanaware/buildit/esbuild`:
     - `src/main.ts` -> `dist/bundle.js` (cliente)
     - `src/sw.ts` -> `dist/sw.js` (service worker isolado)
  3. Configurar scripts em `package.json` mantendo a ponte do contêiner e tasks do Deno (`deno task build`, `deno task dev`).

### Fase 2: Implementação do Core (Wire Format & Pipeline Agnóstico)
- **Objetivo:** Criar o coração puramente determinístico da aplicação, testável sem navegador.
- **Atividades:**
  1. Definir contratos em `src/plugin/wire.ts` (`WireElement`, `WireComponent`, `WireIsland`, `WireFragment`).
  2. Implementar `src/plugin/types.ts` com a interface `IO` (`readText`, `cacheGet`, `cachePut`).
  3. Construir `src/plugin/core/parse.ts` com suporte completo a CommonMark e GFM (tabelas, listas de tarefas, links).
  4. Desenvolver `src/plugin/core/to-wire.ts` mapeando nós `mdast` para o Wire Format, com:
     - Sanitização estrita de props (remoção de funções/referências circulares via `JSON.parse(JSON.stringify())`).
     - Detecção de nomes de ilhas baseada em `Set<string>`.
     - Descarte seguro de nós HTML (`null`).
  5. Criar `src/plugin/core/shell.ts` gerando o documento HTML com o `<script id="__md_wire" type="application/json">` seguro (com escape de `\u003c`).
  6. Desenvolver `src/plugin/core/pipeline.ts` com controle de TTL e orquestração de I/O.

### Fase 3: Adapters (Service Worker & Client Fallback)
- **Objetivo:** Conectar o pipeline aos eventos do navegador e Service Worker com cache unificado.
- **Atividades:**
  1. Implementar `src/plugin/core/io.ts` com suporte robusto ao Cache Storage compartilhado (`md-wire-v1`).
  2. Desenvolver `src/plugin/adapters/sw.ts`:
     - Interceptação de `FetchEvent` filtrando `GET`, ignorando `Range` e URLs com parâmetro `_md_raw=1` (anti-recursão).
     - Ativação com `clients.claim()` e descarte de versões antigas de cache.
  3. Desenvolver `src/plugin/adapters/client.ts` com lógica de detecção de controle do SW (`isSWControlling`).
  4. Configurar `src/register-sw.ts` para registro com escopo relativo (`./`).

### Fase 4: Renderizador Preact & Component Registry
- **Objetivo:** Converter o Wire Format em nós virtuais do Preact sem riscos de injeção HTML.
- **Atividades:**
  1. Criar `src/render/from-wire.ts`:
     - Resolução recursiva de VNodes.
     - Emissão de marcadores `<div data-island="..." data-props="...">` para nós `WireIsland`.
     - Tratamento gracioso para componentes desconhecidos ou ausentes no registry.
  2. Implementar `src/render/registry.tsx` com `htm/preact`:
     - `Heading` com id slug e âncora navegável.
     - `CodeBlock` com bloco estilizado e botão interativo "Copiar" (`navigator.clipboard`).
     - `Link` normalizando rotas relativas de Markdown para hash (`#/docs/...`).
     - `Table`, `Blockquote`, `List`, `ListItem` estilizados com classes semânticas BeerCSS.

### Fase 5: Sistema de Islands (Adoção Exclusiva da Solução HTML+ES)
- **Objetivo:** Executar componentes interativos do início ao fim no navegador sem compilação prévia pelo bundler nem transpiladores pesados em runtime.
- **Avaliação Arquitetural:**
  - *TSX Tradicional:* Exige AOT bundler (`build.ts`/esbuild) para cada nova ilha, impedindo extensões a quente pelo usuário.
  - *MDX no Navegador:* Exige carregar `@mdx-js` completo (~3MB a 5MB) em runtime e executar eval inseguro que fere CSP.
  - *JSX sem Build:* Requer transpilador cliente (Babel/Sucrase de centenas de KB) antes de rodar.
  - *Solução Adotada (HTML+ES):* Padrão oficial Preact com `htm/preact` (apenas ~600 bytes) e ES Modules nativos (`.js`). Permite escrever componentes com sintaxe semelhante a JSX via template string (`html\`...\``) e carregá-los sob demanda diretamente com `import()` nativo do browser sem tocar no build do sistema.
- **Atividades:**
  1. Manter manifesto enxuto em `src/render/islands/manifest.ts` para que o Service Worker continue 100% isolado de UI.
  2. Implementar componentes de ilha com sintaxe HTML+ES (`html\`...\`` de `htm/preact`) e reatividade via `@preact/signals`.
  3. Implementar carregamento dinâmico assíncrono em `src/render/hydrate-islands.ts`:
     - Varredura de `[data-island]`.
     - Resolução no registro ou via import dinâmico nativo do navegador (`import("./islands/${name}.js")`).
     - Prevenção de hidratação duplicada com flag `data-island-hydrated="true"`.
     - Uso de `preact.hydrate()` restrito às sub-árvores demarcadas.
  4. Disponibilizar módulos de ilhas autônomos em `public/islands/` para carregamento imediato sem build.

### Fase 6: Aplicação SPA, Roteador & Integração
- **Objetivo:** Montar a interface completa com navegação suave, suporte offline e BeerCSS.
- **Atividades:**
  1. Implementar roteamento reativo em `src/router.ts` baseado em `location.hash` sincronizado com Signals em `src/state.ts`.
  2. Desenvolver os componentes da casca visual (`Navbar.ts`, `Sidebar.ts`, `Content.ts`, `App.ts`).
  3. No `Content.ts`, extrair e consumir o `__md_wire` do DOM na carga inicial antes de efetuar fetch de rede.
  4. Executar `hydrateIslands()` após cada atualização de documento.
  5. Criar documentação modelo em `docs/` (`README.md`, `_sidebar.md`, `_navbar.md`, `guia.md`).

---

## 4. Estratégia de Testes Automatizados (BDD com Deno)

De acordo com as regras de `AGENTS.md`, todo novo código deve ser validado via `@std/testing/bdd` e `@std/assert`:

1. **`tests/pipeline_test.ts`**:
   - Parse de títulos a partir de cabeçalhos `#`.
   - Geração de nós `Heading`, `CodeBlock`, `List`, `Table`.
   - Eliminação de nós HTML crus (assegurar que retornam `null`).
   - Verificação do formato JSON emitido por `renderToWire()`.
2. **`tests/islands_test.ts`**:
   - Confirmação de que componentes em `islandNames` viram `t: "i"`.
   - Sanitização de props (assegurar que funções e referências circulares são expurgadas).
   - Validação de que o Service Worker não importa VNodes ou Preact.
3. **`tests/registry_test.ts`**:
   - Validação de que `wireToVNode` não gera propriedades `dangerouslySetInnerHTML`.
   - Validação de que ilhas não registradas geram nós de fallback estático navegáveis com `data-island-missing="true"`.

---

## 5. Matriz de Riscos e Mitigações

| Risco Identificado | Causa Potencial | Mitigação Arquitetural |
|---|---|---|
| **Recursão infinita de fetch no SW** | O SW intercepta o próprio fetch que busca o `.md` cru | Adição obrigatória do parâmetro `?_md_raw=1` e bypass imediato no `fetchHandler`. |
| **Inchaço do bundle do Service Worker** | Importação acidental de Preact ou de componentes de UI | Criação do `manifest.ts` contendo apenas strings literais dos nomes das ilhas. O SW não importa `islands/index.ts`. |
| **Divergência entre HTML inicial e hidratação** | Estrutura de children diferente entre servidor e cliente | O nó `WireIsland` pré-renderiza a mesma estrutura de fallback que a ilha emite inicialmente. |
| **Ambientes sem suporte a Service Worker / Cache Storage** | Modo de navegação anônima restritivo ou `file://` | A classe `createCacheIO` detecta a ausência de `window.caches` e degrada graciosamente para cache em memória ou no-op. |
| **Inconsistência de caminhos em subpastas (ex: GitHub Pages)** | URLs absolutas (`/sw.js`) quebram em subdiretórios | Uso estrito de caminhos relativos (`./sw.js`, `./manifest.json`, `./dist/bundle.js`). |
