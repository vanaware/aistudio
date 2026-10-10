---
title: "🧪 Guia Prático & Ilhas Reativas"
icon: "science"
date: "2026-10-08"
badge: "Ilhas"
author: "SyntaxMesh Team"
tags:
  - "guia"
  - "islands"
  - "signals"
description: "Guia prático com demonstração viva de ilhas reativas em HTML+ES."
location: "#/articles/guia.md"
pages:
  - "GUIA_DE_ISLANDS.md"
---

# 🧪 Guia Prático e Demonstração de Recursos

Bem-vindo à demonstração viva da arquitetura **Docsify com Service Worker e Wire Format**!

Este documento é processado pelo parser Markdown, transformado em nós JSON serializáveis (*Wire Format*) e materializado pelo Preact no navegador sem o uso de `dangerouslySetInnerHTML`.

---

## ⚡ Demonstração de Ilhas Interativas (Solução HTML+ES)

Abaixo temos uma ilha reativa construída com **HTML+ES (`htm/preact` + ES Modules)**, executada diretamente no navegador sem compilação prévia pelo bundle:

::Counter.js{start: 10, step: 1, label: "Contador Interativo Reativo"}

### Segunda Ilha (Configuração Diferente)

Você pode instanciar múltiplas ilhas com propriedades independentes isoladas via `@preact/signals`:

```island:Counter.js
{
  "start": 100,
  "step": 5,
  "label": "Contador em Lote (+5)"
}
```

---

## 🧩 Ilhas Dinâmicas sob Demanda (Zero Build)

Graças ao padrão **HTML+ES**, uma nova ilha pode ser criada como um simples arquivo `.js` (ex.: `public/islands/DemoWidget.js`) e carregada sob demanda via `import()` nativo do navegador sem precisar reexecutar `build.ts`:

```markdown
::DemoWidget{title: "Minha Ilha Dinâmica", step: 2}
```

---

## 📊 Tabelas Formatadas (GFM)

O Wire Format converte tabelas Markdown em componentes Preact com layout responsivo do BeerCSS:

| Recurso | Tradicional (Docsify) | Wire Format (Este Projeto) |
|---|---|---|
| Injeção HTML | `dangerouslySetInnerHTML` | Nós VNode Preact puros |
| Interceptação SW | Não nativo | Transforma `.md` em AST no worker |
| Interatividade | Requer scripts soltos no DOM | Preact Islands com `@preact/signals` |
| Risco XSS | Elevado sem DOMPurify | Impossível por arquitetura |
| Suporte Offline | Básico | Cache Storage + IndexedDB (`idb-keyval`) |

---

## ✅ Listas de Tarefas (GFM Task Lists)

- [x] Especificação da arquitetura e contratos no `CURRENT.md`
- [x] Parser `mdast` com extensões GFM ativas
- [x] Transformador de AST para Wire Format JSON
- [x] Hidratação seletiva de Islands (`[data-island]`)
- [x] Adapters para Service Worker e Fallback Client-side
- [ ] Novas ilhas customizadas desenvolvidas pela comunidade

---

## 💻 Blocos de Código com Botão de Copiar

Você pode copiar facilmente os trechos de código clicando no botão no canto superior direito:

```ts
import { mdFetch } from "./src/plugin/adapters/client.ts";
import { createBrowserIO } from "./src/plugin/core/io.ts";

const io = createBrowserIO();
const doc = await mdFetch("/docs/README.md", io);

console.log("Título do Documento:", doc.title);
console.log("Nós no Wire Format:", doc.wire.c?.length);
```

---

## 💬 Citações e Notas

> **Nota Arquitetural:** O Wire Format é 100% serializável. Nenhuma closure, função ou nó do DOM transita entre o Service Worker e o cliente. Isso garante imunidade a bugs de serialização estruturada (`DataCloneError`).

Para explorar mais detalhes do projeto, navegue pelas seções no menu lateral ou consulte a [Arquitetura do Wire Format](./ARQUITETURA_WIRE_FORMAT.md).
