# 🔄 Fluxos de Navegação e Ciclo de Vida

Este documento detalha o comportamento do sistema durante os diferentes cenários de uso: primeira carga no navegador, navegação interna via SPA, operação offline e fallback em ambientes onde o Service Worker não está ativo.

---

## 1. Fluxo 1: Navegação Direta / First Paint (F5 ou Digitar URL)

Ocorre quando o usuário acessa diretamente um caminho no navegador (ex.: `https://site.com/docs/guia` com cabeçalho `Accept: text/html`).

```
[ Usuário digita URL / Pressiona F5 ]
                  │
                  ▼
         [ Service Worker ] ── (Intercepta FetchEvent com Accept: text/html)
                  │
                  ├── Consulta Cache Storage ('md-wire-v1')
                  │     └── Cache Hit válido? Se sim, utiliza WireDoc cacheado.
                  │
                  ├── Cache Miss ou Expirado:
                  │     ├── Fetch interno: '/docs/guia.md?_md_raw=1'
                  │     ├── Parse Markdown -> AST mdast -> WireDoc
                  │     └── Salva WireDoc no Cache Storage
                  │
                  ▼
         [ defaultShell(doc) ] ── Constrói HTML Shell completo
                  │
                  ├── Injeta BeerCSS via CDN
                  ├── Injeta <script id="__md_wire" type="application/json">
                  └── Injeta <script type="module" src="./dist/bundle.js">
                  │
                  ▼
        [ Resposta HTTP 200 ] ── Devolve HTML ao Navegador
                  │
                  ▼
         [ bundle.js executa ]
                  │
                  ├── Componente Content consome e remove #__md_wire do DOM
                  ├── wireToVNode() materializa VNodes Preact instantaneamente
                  └── hydrateIslands() hidrata os nós com [data-island]
```

### Vantagens deste fluxo:
- **Zero layout shift:** O conteúdo textual e os blocos já chegam no primeiro documento HTML.
- **Rápido:** Não requer requisições adicionais de dados via AJAX/Fetch na carga inicial.
- **SEO & Acessibilidade:** Rastreadores de busca recebem a árvore de nós estruturada.

---

## 2. Fluxo 2: Navegação SPA (Transição entre Páginas)

Ocorre quando o usuário clica em um link interno ou quando a rota hash é alterada (`#/docs/outra`).

```
[ Usuário clica em link / Hash altera ]
                  │
                  ▼
        [ Router / Signals ] ── Atualiza 'currentPath.value'
                  │
                  ▼
       [ mdFetch('/docs/outra') ] ── Envia requisição com Accept: application/json
                  │
                  ▼
         [ Service Worker ] ── Intercepta e processa
                  │
                  ├── Content Negotiation: Identifica 'Accept: application/json'
                  ├── Consulta ou processa WireDoc
                  └── Retorna Response JSON com headers (x-title, x-source, etc.)
                  │
                  ▼
        [ Componente Content ] ── Recebe objeto JSON
                  │
                  ├── wireToVNode(doc.wire, registry)
                  ├── Preact reconcilia o DOM sem recarregar a página
                  └── hydrateIslands() hidrata apenas as novas ilhas criadas
```

---

## 3. Fluxo 3: Fallback Sem Service Worker (Client-Side Puro)

Ocorre quando:
- O navegador não suporta Service Workers.
- O Service Worker ainda está em processo de instalação e ainda não tomou controle da página.
- O usuário desmarcou ou cancelou o registro do Service Worker nas ferramentas de desenvolvedor.

```
[ mdFetch(url) é invocado pelo componente Content ]
                  │
                  ▼
     [ detect.ts: isSWControlling() ] ── Retorna false!
                  │
                  ▼
       [ createLocalFetcher() ] ── Ativa o Pipeline Client-Side
                  │
                  ├── IO Client lê o arquivo .md diretamente via window.fetch
                  ├── Parser client-side gera mdast -> WireDoc
                  ├── Salva no Cache Storage compartilhado 'md-wire-v1'
                  └── Retorna Response JSON
                  │
                  ▼
         [ Renderização Idêntica ] ── O usuário não percebe diferença!
```

---

## 4. Estratégia de Cache Compartilhado (`md-wire-v1`)

O Service Worker e o Client Adapter compartilham **o mesmo `cacheName`** no Cache Storage do navegador.

### Regras de Cache:
1. **Chave de Cache:** A chave é o caminho canônico do arquivo Markdown resolvido (ex.: `/docs/guia.md`).
2. **TTL (Time-to-Live):** Configurado em segundos (default: `60s`).
   - Ao ler do cache, o pipeline verifica se:
     $$\text{Date.now()} - \text{doc.renderedAt} < \text{cacheTTL} \times 1000$$
   - Se expirado, o arquivo `.md` é buscado novamente com cabeçalho `Cache-Control: no-cache`.
3. **Invalidação e Limpeza:** No evento `activate` do Service Worker, todos os caches que iniciam com o prefixo `md-wire-` mas diferem do `cacheName` ativo são eliminados automaticamente.

---

## 5. Medidas de Segurança no Service Worker

### 5.1 Prevenção de Recursão Infinita
Quando o Service Worker precisa buscar o arquivo `.md` para processamento, o `fetch` acionado dentro do worker poderia ser interceptado por ele mesmo, gerando um loop infinito.
- **Solução:** Toda requisição interna para o `.md` cru recebe o parâmetro de busca `?_md_raw=1`. O `fetchHandler` detecta esse parâmetro e imediatamente pula a interceptação (`return`).

### 5.2 Filtragem de Streaming e Mídia
Requisições que possuem o cabeçalho `Range` (comuns em áudio, vídeo ou streaming) são ignoradas pelo plugin para evitar interceptar tráfego binário impróprio.
