---
title: "⚙️ Wire AST Spec"
icon: "schema"
date: "2026-10-06"
badge: "AST"
author: "SyntaxMesh Team"
tags:
  - "wire-format"
  - "ast"
  - "json"
description: "Especificação formal do formato intermediário JSON agnóstico (Wire Format)."
location: "#/articles/ARQUITETURA_WIRE_FORMAT.md"
pages:
  - "WIRE_SCHEMA_DETALHES.md"
---

# 📐 Arquitetura do Wire Format

O **Wire Format** é o coração da camada de dados desta solução. Ele atua como uma linguagem franca (Intermediate Representation - IR) entre o parser Markdown e o renderizador de interface, garantindo desacoplamento, segurança e velocidade.

---

## 1. O que é o Wire Format?

Em sistemas tradicionais de documentação (como Docsify padrão ou geradores SSR clássicos), o fluxo comum é:
$$\text{Markdown} \longrightarrow \text{HTML String} \longrightarrow \text{dangerouslySetInnerHTML}$$

Esse fluxo tem problemas graves:
1. **Risco de segurança (XSS):** Exige sanitizadores complexos (como DOMPurify) para impedir scripts maliciosos injetados via Markdown.
2. **Perda de interatividade:** Strings HTML não possuem ganchos para componentes reativos sem hidratação bruta.
3. **Alto custo de transmissão:** HTML cru duplica tags, classes e wrappers redundantes.

No modelo com **Wire Format**:
$$\text{Markdown} \longrightarrow \text{mdast (AST)} \longrightarrow \text{Wire Format (JSON puro)} \longrightarrow \text{Preact VNodes}$$

O Wire Format é **100% serializável em JSON**. Ele nunca contém funções, closures, referências cíclicas ou nós DOM.

---

## 2. Definição Formal de Tipos (TypeScript)

```ts
/**
 * Tipagem unificada de qualquer nó ou valor dentro do Wire Format.
 */
export type Wire =
  | string
  | number
  | boolean
  | null
  | Wire[]
  | WireElement      // Elemento intrínseco HTML
  | WireComponent    // Componente estático resolvido no cliente
  | WireIsland       // Ilha interativa hidratada seletivamente
  | WireFragment;    // Agrupador sem elemento visual no DOM

/**
 * Elemento intrínseco do HTML: <strong>, <em>, <del>, <br>, <hr>...
 */
export interface WireElement {
  t: "e";                       // "e" de element
  n: string;                    // Nome da tag HTML ("strong", "em", "hr", etc.)
  p?: Record<string, unknown>;  // Propriedades e atributos HTML seguros
  c?: Wire[];                   // Filhos recursivos
}

/**
 * Componente nomeado: resolvido no cliente via registry de componentes.
 */
export interface WireComponent {
  t: "c";                       // "c" de component
  n: string;                    // Nome canônico ("Heading", "Paragraph", "CodeBlock"...)
  p?: Record<string, unknown>;  // Props serializáveis
  c?: Wire[];                   // Filhos recursivos
}

/**
 * Ilha interativa (Modo B): hidratada sob demanda pelo Preact no cliente.
 */
export interface WireIsland {
  t: "i";                       // "i" de island
  n: string;                    // Nome da ilha registrada ("Counter", "SearchBox"...)
  p?: Record<string, unknown>;  // Props puras (passam por JSON.parse(JSON.stringify()))
  c?: Wire[];                   // Estrutura estática de fallback pré-renderizada
}

/**
 * Fragmento: agrupa múltiplos nós filhos sem injetar um wrapper no DOM.
 */
export interface WireFragment {
  t: "f";                       // "f" de fragment
  c?: Wire[];                   // Lista de nós filhos
}

/**
 * Documento completo retornado pelo pipeline (para cache ou resposta de rede).
 */
export interface WireDoc {
  wire: WireFragment;           // Árvore do documento
  title: string;                // Título extraído do primeiro h1 ou fallback
  raw: string;                  // Conteúdo Markdown original (para debug/cache key)
  url: string;                  // Caminho resolvido do arquivo (.md)
  renderedAt: number;           // Timestamp Date.now() para expiração de cache
}
```

---

## 3. Tabela Canônica de Mapeamento: mdast $\to$ Wire

O transformador em `src/plugin/core/to-wire.ts` aplica o mapeamento abaixo:

| Tipo do nó no `mdast` | Tipo do nó no `Wire` | Nome (`n`) | Propriedades (`p`) | Tratamento de Filhos (`c`) |
|---|---|---|---|---|
| `root` | `WireFragment` (`t:"f"`) | — | — | Mapeia todos os filhos do root |
| `heading` (nível $n$) | `WireComponent` (`t:"c"`) | `"Heading"` | `{ depth: n }` | Mapeia texto/formatações internas |
| `paragraph` | `WireComponent` (`t:"c"`) | `"Paragraph"` | `{}` | Mapeia conteúdo inline |
| `blockquote` | `WireComponent` (`t:"c"`) | `"Blockquote"` | `{}` | Mapeia blocos internos |
| `list` | `WireComponent` (`t:"c"`) | `"List"` | `{ ordered: boolean, start?: number }` | Mapeia itens da lista |
| `listItem` | `WireComponent` (`t:"c"`) | `"ListItem"` | `{ checked?: boolean }` | Mapeia itens (com suporte a GFM checkbox) |
| `code` (bloco com syntax) | `WireComponent` (`t:"c"`) | `"CodeBlock"` | `{ lang?: string, value: string }` | Sem filhos (conteúdo vai em `value`) |
| `inlineCode` | `WireComponent` (`t:"c"`) | `"InlineCode"` | `{ value: string }` | Sem filhos |
| `link` | `WireComponent` (`t:"c"`) | `"Link"` | `{ href: string, title?: string }` | Mapeia texto do link |
| `image` | `WireComponent` (`t:"c"`) | `"Image"` | `{ src: string, alt?: string, title?: string }` | Sem filhos |
| `strong` | `WireElement` (`t:"e"`) | `"strong"` | `{}` | Mapeia filhos em negrito |
| `emphasis` | `WireElement` (`t:"e"`) | `"em"` | `{}` | Mapeia filhos em itálico |
| `delete` (GFM strikethrough)| `WireElement` (`t:"e"`) | `"del"` | `{}` | Mapeia filhos tachados |
| `break` | `WireElement` (`t:"e"`) | `"br"` | `{}` | Sem filhos |
| `thematicBreak` | `WireElement` (`t:"e"`) | `"hr"` | `{}` | Sem filhos |
| `table` (GFM) | `WireComponent` (`t:"c"`) | `"Table"` | `{ align?: string[] }` | Mapeia cabeçalho e corpo da tabela |
| `tableRow` (GFM) | `WireComponent` (`t:"c"`) | `"TableRow"` | `{}` | Mapeia células da linha |
| `tableCell` (GFM) | `WireComponent` (`t:"c"`) | `"TableCell"` | `{ align?: string }` | Mapeia texto da célula |
| `text` | `string` | — | — | Própria string primitiva |
| `html` | `null` | — | — | **Descartado imediatamente por segurança** |
| Nó desconhecido | `WireComponent` (`t:"c"`) | `"Unknown"` | `{ nodeType: string }` | Emite aviso não destrutivo |

---

## 4. Diferenciação Dinâmica de Islands (`WireIsland`)

Quando o gerador `to-wire.ts` encontra um componente cujo nome está presente no conjunto de ilhas declaradas (`islands.has(name)`):
- O nó é marcado como `{ t: "i", n: name, p: sanitizedProps, c: children }`.
- Isso instrui o renderizador a gerar nós HTML com atributos de hidratação:
  ```html
  <div data-island="Counter" data-props='{"start":5}'>
    <!-- Conteúdo estático de fallback pré-renderizado -->
    <div class="md-island md-counter">
      <span>Contador: 5</span>
      <button>+</button>
      <button>−</button>
    </div>
  </div>
  ```

---

## 5. Garantia de Serialização: `sanitizeProps`

Para impedir qualquer injeção acidental de funções ou estruturas não seguras, todas as propriedades atribuídas a nós do Wire Format passam pela função determinística:

```ts
export function sanitizeProps(p: Record<string, unknown>): Record<string, unknown> {
  try {
    return JSON.parse(JSON.stringify(p));
  } catch {
    return {};
  }
}
```

Isso garante que um documento `WireDoc` possa ser armazenado diretamente no Cache Storage via `new Response(JSON.stringify(doc))` ou embutido de maneira segura em tags `<script id="__md_wire">` sem causar falhas de parseamento.
