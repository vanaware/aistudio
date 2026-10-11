# @vanaware/server (Server Package)

Servidor HTTP de arquivos estáticos em Deno para o aplicativo **aiStudio**.

## Responsabilidades

- Servir o diretório compilado `packages/server/build/dist/` na porta `3000` (`0.0.0.0`).
- Adicionar headers de controle de cache (`no-cache`, `no-store`) para evitar dados obsoletos durante o desenvolvimento.
- Definir o cabeçalho `Service-Worker-Allowed: /` para requisições ao `sw.js`.
