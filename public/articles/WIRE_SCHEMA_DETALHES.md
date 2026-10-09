---
title: "📐 Schema & Nós do AST"
icon: "account_tree"
date: "2026-10-06"
badge: "Nível 3"
author: "SyntaxMesh Team"
tags:
  - "schema"
  - "ast"
  - "json-spec"
description: "Detalhamento e contrato formal dos nós do Wire Format AST (elementos, componentes e ilhas)."
location: "#/articles/WIRE_SCHEMA_DETALHES.md"
---

# 📐 Especificação Detalhada do Schema AST (Nível 3)

Esta é uma **sub-sub-página** demonstrando o suporte recursivo multinível a sub-páginas no mdBlog:

> **index.md** (Nível 0 - Home) ➔ **README.md** (Nível 1) ➔ **ARQUITETURA_WIRE_FORMAT.md** (Nível 2) ➔ **WIRE_SCHEMA_DETALHES.md** (Nível 3)

---

## 🧩 Contrato dos Nós do AST

Cada nó na árvore do Wire Format é estritamente tipado e serializável em JSON:

```typescript
export type WireNode =
  | WireElement
  | WireIsland
  | WireText;

export interface WireElement {
  type: "element";
  tag: string;
  props?: Record<string, any>;
  children?: WireNode[];
}

export interface WireIsland {
  type: "island";
  name: string;
  props?: Record<string, any>;
}

export interface WireText {
  type: "text";
  value: string;
}
```

---

## ⚡ Princípios de Segurança e Imunidade a XSS

1. **Sem HTML Crú**: Strings Markdown nunca são injetadas via `dangerouslySetInnerHTML`.
2. **Tokens Tipados**: O parser constrói nós do AST sem interpretar tags arbitrárias do navegador.
3. **Serialização Limpa**: O objeto resultante pode ser salvo no IndexedDB (`idb-keyval`) ou transmitido com segurança via Service Worker.
