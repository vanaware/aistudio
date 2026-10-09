# 🏝 Guia Prático de Islands (Solução HTML+ES)

Este documento resume a operação do modelo de ilhas interativas (Fresh-like) adotando exclusivamente a solução **HTML+ES (`htm/preact` + ES Modules)**, que elimina a necessidade de compilação prévia pelo bundle e roda nativamente no navegador do início ao fim.

---

## 1. Por que HTML+ES?
- **Zero build para ilhas:** Novas ilhas não dependem de recompilação do bundle (`build.ts`).
- **Nativo do browser:** O navegador interpreta arquivos `.js` com ES Modules e `html` tagged templates diretamente.
- **Ultra-leve:** `htm` possui apenas ~600 bytes gzipados.
- **Seguro:** Sem `eval` nem `new Function`, em total conformidade com CSP.

---

## 2. Como Criar uma Nova Ilha em HTML+ES

### Opção A: Criar ilha autônoma em `public/islands/MeuWidget.js` (Zero Build)
Crie o arquivo diretamente na pasta estática:

```javascript
import { html } from "htm/preact";
import { signal } from "@preact/signals";

export function MeuWidget({ titulo = "Meu Widget" }) {
  const ativo = signal(false);

  return html`
    <article class="border round padding surface-container margin-bottom">
      <h6 class="no-margin bold">${titulo}</h6>
      <button class="chip margin-top" onClick=${() => (ativo.value = !ativo.value)}>
        ${ativo.value ? "Ativado" : "Desativado"}
      </button>
    </article>
  `;
}

export default MeuWidget;
```

Basta referenciar `::MeuWidget{titulo: "Exemplo"}` no Markdown! O cliente importa sob demanda via `import("./islands/MeuWidget.js")` nativo do navegador.

### Opção B: Integrar ilha no registro do core (`src/render/islands/`)
1. Crie o arquivo com sintaxe HTML+ES (`html\`...\``).
2. Adicione o nome ao manifesto `manifest.ts` e exporte em `src/render/islands/index.ts`.

---

## 3. Como o SW e o Cliente Cooperam

1. **Parser & Service Worker / Pipeline Core:**
   - O transformer `to-wire.ts` consulta `islandNamesSet`.
   - Ao encontrar uma referência à ilha, gera o nó do Wire Format com tag `t: "i"`:
     ```json
     { "t": "i", "n": "MeuWidget", "p": { "titulo": "Exemplo" }, "c": [] }
     ```
   - O Service Worker **nunca** carrega o Preact nem componentes JSX, mantendo seu tamanho mínimo e execução ultrarrápida.

2. **Renderizador do Cliente:**
   - O `wireToVNode()` converte o nó `t: "i"` em um container demarcado:
     ```html
     <div data-island="MeuWidget" data-props='{"titulo":"Exemplo"}'>
       <!-- Conteúdo inicial ou fallback estático -->
     </div>
     ```

3. **Hidratação Seletiva (`hydrateIslands`):**
   - A função busca todos os elementos com `[data-island]`.
   - Se a ilha não estiver em cache no registro, importa dinamicamente o módulo `.js` do navegador.
   - Evita dupla hidratação marcando `data-island-hydrated="true"`.
   - Invoca `hydrate(h(Comp, props), el)` exclusivamente na raiz daquele elemento, sem tocar no restante do HTML estático da página.

---

## 3. O que Acontece Quando uma Ilha Não Está Registrada

- **Sem tela branca / Zero crash:** Se o Markdown referenciar uma ilha que não está no registro do cliente (`islands[name] === undefined`), o renderizador marca o atributo `data-island-missing="true"`.
- O conteúdo de fallback pré-renderizado continua visível e navegável.
- Nenhum erro fatal é lançado no console, garantindo degradação graciosa.

---

## 4. Como Depurar a Hidratação no Navegador

1. Abra o DevTools (F12) e selecione a aba **Elements**.
2. Pressione `Ctrl + F` e procure por `[data-island]`.
3. Verifique os atributos do elemento:
   - `data-island="Counter"`: Nome da ilha identificado.
   - `data-props='{...}'`: Propriedades serializadas em JSON.
   - `data-island-hydrated="true"`: Indica que o Preact hidratou com sucesso esta ilha.
   - `data-island-missing="true"`: A ilha foi solicitada mas não foi encontrada em `src/render/islands/index.ts`.
