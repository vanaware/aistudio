# 🎯 Prompt completo — Gerador de documentação estilo Docsify com Service Worker + Wire Format

> Especificação de referência autossuficiente para o gerador de documentação estático com Service Worker e Wire Format.

---

## 🧭 Contexto e objetivo

Gerador de documentação estático inspirado no Docsify com arquitetura moderna:
- Runtime dev: **Deno 2.x**
- Bundler: `jsr:@vanaware/buildit/esbuild` para uso no browser
- UI: **Preact + htm + Signals + BeerCSS**
- Arquitetura principal: Um **Service Worker** intercepta requisições de páginas de documentação, lê o Markdown correspondente, converte para uma AST mdast, e devolve ao cliente um **"wire format"** — uma árvore JSON serializável que descreve *qual componente* renderizar em cada nó, sem HTML e sem `dangerouslySetInnerHTML`.
- O cliente materializa essa árvore em VNodes Preact via um registry de componentes.
- **Requisito crítico:** todo o pipeline roda tanto no Service Worker quanto no cliente (fallback transparente).

---

## 🛠 Stack obrigatória

| Item | Pacote / versão |
|---|---|
| Runtime dev | Deno 2.x |
| Bundler | `jsr:@vanaware/buildit/esbuild` |
| Import map | `deno.json` |
| UI | `preact@^10.24`, `htm@^3.1` (via `htm/preact`), `@preact/signals@^2` |
| CSS | BeerCSS via CDN (`beercss@3`) |
| Parser Markdown | `mdast-util-from-markdown@^2`, `mdast-util-gfm@^3`, `micromark-extension-gfm@^3`, `@types/mdast@^4` |
| Servidor dev | `jsr:@std/http/file-server` |

---

## 🏝 Modelo de Islands (Solução HTML+ES - Zero Bundle)

- Adoção exclusiva de **HTML+ES** (`htm/preact` + ES Modules padrão) para componentes de ilha
- Zero compilação prévia pelo bundle: execução nativa no browser do início ao fim
- Suporte a carregamento dinâmico sob demanda via `import()` do navegador
- Declaração enxuta de nomes para o SW (`manifest.ts`) mantendo isolamento de UI
- Nós `WireIsland` (`t: "i"`) no wire format
- Renderização inicial estática com atributos `data-island` e `data-props`
- Hidratação seletiva via `hydrateIslands()` com `preact.hydrate()`
- Fallback gracioso para ilhas não registradas (sem tela branca)
