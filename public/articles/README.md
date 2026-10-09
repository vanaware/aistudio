---
title: "📚 Visão Geral do mdBlog"
icon: "article"
date: "2026-10-09"
badge: "Visão Geral"
author: "SyntaxMesh Team"
tags:
  - "visão geral"
  - "arquitetura"
  - "deno"
description: "Documentação do projeto e visão geral da arquitetura Docsify com Wire Format."
location: "#/articles/README.md"
pages:
  - "ARQUITETURA_WIRE_FORMAT.md"
  - "FLUXOS_E_CICLO_DE_VIDA.md"
---

# 📚 Documentação do Projeto: Gerador Docsify com Service Worker, Wire Format & Islands

Bem-vindo ao plano e documentação arquitetural da solução de documentação estática moderna baseada em **Deno, Service Worker, Wire Format AST e Preact Islands (Modo B)**.

---

## 📑 Índice dos Documentos

1. **[Plano de Migração HTML+ES & Lib de Transpilação](PLANO_MIGRACAO_HTML_ES.md)**
   - Migração 100% dos componentes Preact para HTML+ES (`htm/preact`).
   - Eliminação de JSX no cliente; componentes executam nativamente em browser.
   - Isolamento da biblioteca de transpilação Markdown -> Wire no bundle (`dist/lib/md-transpiler.js`).

2. **[Plano de Desenvolvimento e Implementação](PLANO_DESENVOLVIMENTO.md)**
   - Visão geral executiva, stack e restrições mandatórias.
   - Decomposição em fases de implementação detalhadas com tarefas e saídas esperadas.
   - Matriz de riscos e critérios rigorosos de aceitação.

3. **[Arquitetura do Wire Format & Pipeline Core](ARQUITETURA_WIRE_FORMAT.md)**
   - Especificação do formato intermediário JSON agnóstico (AST -> Wire).
   - Tabela canônica de transformação de nós `mdast` para `WireElement`, `WireComponent` e `WireIsland`.
   - Isolamento do Core via interface `IO` (zero globais).

4. **[Fluxos de Navegação e Ciclo de Vida](FLUXOS_E_CICLO_DE_VIDA.md)**
   - Navegação direta (First Paint / HTML Shell com wire embutido em `<script id="__md_wire">`).
   - Navegação client-side SPA com content-negotiation (`Accept: application/json`).
   - Fallback resiliente sem Service Worker.
   - Estratégia de cache unificado (`md-wire-v1`).

5. **[Arquitetura de Islands (Modo B - Fresh)](GUIA_DE_ISLANDS.md)**
   - Contrato de nós interativos `WireIsland` (`t: "i"`).
   - Manifesto estático sem dependência de UI no Service Worker.
   - Algoritmo de hidratação seletiva idempotente (`hydrateIslands`).
   - Criação de novos componentes de ilha em 3 passos.

---

## 🎯 Resumo da Solução em Poucas Linhas

```
                    ┌───────────────────────────────┐
                    │      Markdown (.md docs)      │
                    └──────────────┬────────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
   [ Service Worker Fetch ]                    [ Client Local Fallback ]
              │                                         │
              └────────────────────┬────────────────────┘
                                   │
                                   ▼
               ┌──────────────────────────────────────┐
               │    Pipeline Core (mdast -> Wire)     │
               └───────────────────┬──────────────────┘
                                   │
                          JSON Wire Format
                                   │
                                   ▼
               ┌──────────────────────────────────────┐
               │  from-wire.ts (Preact Registry + UI) │
               └───────────────────┬──────────────────┘
                                   │
                       VNodes estáticos iniciais
                                   │
                                   ▼
               ┌──────────────────────────────────────┐
               │  hydrateIslands() [data-island]      │
               └──────────────────────────────────────┘
```
