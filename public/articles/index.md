---
title: "mdBlog - Blog & Documentação Estática"
description: "Blog de documentação estático inspirado no Docsify com arquitetura moderna baseada em Deno, Preact Signals, BeerCSS e Islands (Modo B)."
date: "2026-10-09"
author: "SyntaxMesh Team"
location: "#/articles/index.md"
tags:
  - "Deno"
  - "PWA"
  - "Preact"
  - "BeerCSS"
  - "Islands"
pages:
  - "README.md"
  - "guia.md"
  - "PLANO_DESENVOLVIMENTO.md"
---

# 📖 mdBlog — Página Inicial

Bem-vindo ao **mdBlog**, um gerador de documentação e blog estático moderno construído com **Deno, Preact Signals, BeerCSS e Wire Format AST**.

Esta página principal é carregada a partir do arquivo **`index.md`**. A navegação é descoberta lendo a lista de arquivos declarada no frontmatter de `index.md`, enquanto os títulos, ícones, datas e tags são extraídos dinamicamente do frontmatter de **cada página individual**.

---

## 🚀 Artigos em Destaque

Navegue pelas publicações e guias técnicos disponíveis:

- **[📚 Visão Geral do mdBlog](./README.md)**: Conheça a motivação, arquitetura de pipeline e princípios de segurança.
- **[🧪 Guia Prático & Demonstração de Ilhas](./guia.md)**: Veja componentes interativos (*islands*) funcionando em tempo real.
- **[⚡ Arquitetura HTML+ES (.js)](./PLANO_MIGRACAO_HTML_ES.md)**: Entenda a eliminação total de JSX e a execução nativa de módulos ES.
- **[⚙️ Especificação do Wire Format AST](./ARQUITETURA_WIRE_FORMAT.md)**: Detalhamento do contrato JSON serializável imune a XSS.
- **[🏝️ Guia de Islands (Modo B)](./GUIA_DE_ISLANDS.md)**: Manual de hidratação seletiva sob demanda no cliente.
- **[🔄 Fluxos de Navegação e Cache PWA](./FLUXOS_E_CICLO_DE_VIDA.md)**: Estratégias de Service Worker e IndexedDB (`idb-keyval`).

---

## ⚡ Demonstração Reativa (Ilha Interativa)

Abaixo temos uma ilha Preact hidratada dinamicamente:

::Counter{start: 42, step: 1, label: "Contador Interativo na Home"}

---

## 🌳 Estrutura Hierárquica e Sub-Páginas Multinível

O mdBlog suporta **sub-páginas recursivas e aninhadas** descobertas diretamente via frontmatter:

1. **Página Raiz (`index.md`)**: Declara as seções principais na lista `pages:`.
2. **Páginas Principais**: Cada página (ex: `README.md`) pode ter sua própria lista `pages:` com sub-páginas (ex: `ARQUITETURA_WIRE_FORMAT.md`).
3. **Sub-sub-páginas**: Uma sub-página também pode ter `pages:` (ex: `WIRE_SCHEMA_DETALHES.md`), e assim sucessivamente!
4. **Indentação Visual no Navbar e Drawer**: As sub-páginas aparecem identadas com ícones direcionais (`subdirectory_arrow_right`, badges de nível e trilha breadcrumb).

---

## 🛠 Como Publicar Novos Artigos ou Sub-Páginas

1. Adicione um novo arquivo `.md` na pasta `public/articles/` (ex: `public/articles/minha-subpagina.md`) contendo seu próprio frontmatter (`title`, `icon`, `date`, `tags`, etc.).
2. Adicione apenas o nome do arquivo na lista `pages:` da página pai onde deseja que ele apareça.
3. O navegador descobre a hierarquia em tempo de execução e monta o Navbar, Sidebar e Breadcrumbs automaticamente!
