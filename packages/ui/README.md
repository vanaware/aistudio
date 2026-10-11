# @vanaware/aiStudio (UI Package)

Pacote frontend da aplicação **aiStudio**, construído com **Preact**, **@preact/signals** e **BeerCSS**.

## Tecnologias e Configuração

- **Runtime**: Deno com import maps nativos (`npm:` e `jsr:`).
- **JSX**: `"jsx": "react-jsx"` com `"jsxImportSource": "preact"`.
- **Estado Reativo**: `@preact/signals` centralizado em `src/store.ts`.
- **Interface**: BeerCSS 5.0.3 (Material Design 3) carregado via CDN.
- **Service Worker**: `src/sw.ts` para cache offline de ativos estáticos.

## Estrutura de Diretórios

- `src/components/`: Componentes visuais modulares.
- `src/store.ts`: Sinais (`signal`, `computed`) de estado, tarefas, tema e conectividade.
- `src/version.ts`: Exportação de `APP_VERSION`, preenchida no build.
- `src/sw.ts`: Lógica de cache e eventos de ciclo de vida do Service Worker.
- `public/`: Arquivos estáticos (HTML, manifest, ícone).
- `tests/`: Testes unitários com `@std/testing/bdd`.
