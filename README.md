# aiStudio — Deno PWA Showcase

> **Aplicativo conceitual de referência demonstrando como arquitetar, empacotar e executar Progressive Web Apps com Deno, Preact, Signals e BeerCSS no ambiente Google AI Studio.**

Desenvolvido por **Vanaware**.

---

## 💡 Visão Geral e Conceito

O **aiStudio** é um projeto modelo concebido para comprovar que é possível desenvolver aplicações web modernas, reativas e com suporte offline completo (PWA) utilizando o ecossistema nativo do **Deno**, sem a necessidade de gerenciadores de pacotes Node.js locais (`npm`, `yarn`, `pnpm`), bundlers pesados ou frameworks de CSS invasivos.

### Pilares da Arquitetura

1. **Deno Puro & Zero NPM Local**:
   - Todo o gerenciamento de dependências ocorre via `deno.jsonc` utilizando os seletores nativos `npm:` e `jsr:`.
   - Não requer pasta `node_modules` local nem comandos `npm install`.
   - Integração com o container do AI Studio através de uma ponte padronizada (`package.json` + `install-script.sh`), que instala o Deno sob demanda e mapeia os comandos `npm run dev` e `npm run build`.

2. **Reatividade Fina com Preact + Signals**:
   - Compilador configurado com `"jsx": "react-jsx"` e `"jsxImportSource": "preact"`, eliminando imports manuais de `h` e `Fragment`.
   - Gerenciamento de estado 100% reativo utilizando `@preact/signals` centralizado em `src/store.ts`.
   - Renderizações pontuais em nível de nó do DOM, sem re-renderizar árvores inteiras de componentes.

3. **Interface com BeerCSS (Material Design 3)**:
   - Interface construída com **BeerCSS 5.0.3** via CDN, utilizando HTML semântico (`<article>`, `<nav>`, `<button>`) e classes utilitárias do Material You.
   - Zero CSS customizado e sem overhead de pré-processadores ou utilitários utilitários como Tailwind.
   - Ícones dinâmicos via Google Material Symbols Outlined e alternância nativa de temas (claro, escuro e automático).

4. **Orquestração de Build com BuildIt**:
   - Empacotamento realizado via `jsr:@vanaware/buildit` (`scripts/esbuild.ts`), utilizando o esbuild nativo e o plugin do Deno.
   - Versionamento semântico automático sincronizado em tempo de compilação nos arquivos de distribuição, no `manifest.json`, no `version.ts` e no Service Worker.

5. **PWA Offline-First**:
   - Registro de Service Worker (`sw.ts`) com estratégia de cache para ativos estáticos e páginas HTML.
   - Nome de cache dinâmico atrelado à versão (`aistudio-pwa-${APP_VERSION}`).
   - Caminhos relativos (`./`) em todos os assets para compatibilidade nativa com GitHub Pages e subpastas.

---

## 📁 Estrutura do Repositório (Deno Workspace)

```text
├── AGENTS.md                   # Diretrizes arquiteturais e regras para agentes de IA
├── deno.jsonc                  # Configuração global do workspace Deno e catálogo de tarefas
├── install-script.sh           # Script de provisionamento do Deno no container AI Studio
├── metadata.json               # Metadados e permissões da aplicação no AI Studio
├── package.json                # Ponte do AI Studio (scripts dev, build, lint, test)
│
├── packages/
│   ├── server/                 # Servidor HTTP estático em Deno
│   │   ├── deno.jsonc          # Configurações do servidor (@vanaware/server)
│   │   ├── src/main.ts         # Ponto de entrada do servidor (porta 3000, 0.0.0.0)
│   │   └── build/dist/         # Artefatos compilados servidos pelo servidor
│   │
│   └── ui/                     # Aplicação Frontend Preact + Signals
│       ├── deno.jsonc          # Configuração do pacote UI (@vanaware/aiStudio)
│       ├── public/             # Arquivos públicos (index.html, manifest.json, icon.svg)
│       ├── src/
│       │   ├── components/     # Componentes modulares Preact (App, Header, Cards)
│       │   ├── store.ts        # Sinais reativos globais e ações da aplicação
│       │   ├── version.ts      # Versão da aplicação injetada no build
│       │   ├── sw.ts           # Service Worker da PWA com ciclo de vida e cache
│       │   └── main.tsx        # Bootstrap e montagem da aplicação Preact
│       └── tests/
│           └── app_test.ts     # Suíte de testes unitários BDD (@std/testing/bdd)
│
└── scripts/
    ├── esbuild.ts              # CLI do orquestrador BuildIt
    ├── esbuild.jsonc           # Configuração declarativa dos targets do esbuild
    └── watch.ts                # Watcher para desenvolvimento contínuo
```

---

## 🚀 Executando o Projeto

### Pré-requisitos
- [Deno](https://deno.land/) (versão 2.x recomendada).

### Comandos Principais

| Tarefa | Comando | Descrição |
|---|---|---|
| **Build** | `deno task esbuild` | Compila o frontend e o Service Worker para `packages/server/build/dist` |
| **Dev Server** | `deno task dev` | Inicia o servidor HTTP em `http://0.0.0.0:3000` |
| **Lint** | `deno task lint` | Executa o linter oficial do Deno |
| **Type Check** | `deno task check:all` | Valida tipagem TypeScript em todos os membros do workspace |
| **Testes** | `deno task test` | Executa a suíte de testes BDD (`deno test -P`) |
| **Suíte Completa** | `deno task tests` | Roda type check, lint, checagem de formatação e testes |

> **No Google AI Studio**: O comando padrão `npm run dev` dispara o script de provisionamento automático do Deno (`install-script.sh`), executa o build e inicializa o servidor na porta `3000`.

---

## 🧪 Padrão de Testes

Os testes são orientados a comportamento (BDD) utilizando os módulos padrão da biblioteca do Deno:
- `@std/testing/bdd` (`describe`, `it`)
- `@std/assert` (`assertEquals`, `assert`)

Para rodar os testes:
```bash
deno test -P
```

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais detalhes.

Copyright (c) 2026 **Vanaware**.
