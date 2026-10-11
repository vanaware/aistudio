/// <reference lib="deno.ns" />

import { serveDir } from "@std/http/file-server";

// No ambiente AI Studio/Cloud Run, o proxy reverso escuta exclusivamente na porta 3000
const port = Number(Deno.env.get("DEV_PORT") ?? 3000);

async function findActiveBundles(): Promise<{ indexBundle?: string; chunkBundle?: string }> {
  try {
    let indexBundle: string | undefined;
    let chunkBundle: string | undefined;
    for await (const entry of Deno.readDir("./dist")) {
      if (entry.isFile) {
        if (entry.name.startsWith("index-") && entry.name.endsWith(".js")) {
          indexBundle = entry.name;
        } else if (entry.name.startsWith("chunk-") && entry.name.endsWith(".js")) {
          chunkBundle = entry.name;
        }
      }
    }
    return { indexBundle, chunkBundle };
  } catch {
    return {};
  }
}

Deno.serve({ port }, async (req) => {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // 1. Sempre servir index.html sem cache para evitar que o preview fique preso
    if (pathname === "/" || pathname === "/index.html" || pathname.endsWith("/index.html")) {
      try {
        const content = await Deno.readTextFile("./dist/index.html");
        return new Response(content, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-cache, no-store, must-revalidate",
            "pragma": "no-cache",
            "expires": "0",
          },
        });
      } catch {
        // Prossegue para o serveDir
      }
    }

    // 2. Sempre servir sw.js sem cache
    if (pathname === "/sw.js" || pathname.endsWith("/sw.js")) {
      try {
        const content = await Deno.readTextFile("./dist/sw.js");
        return new Response(content, {
          status: 200,
          headers: {
            "content-type": "text/javascript; charset=utf-8",
            "cache-control": "no-cache, no-store, must-revalidate",
            "service-worker-allowed": "/",
          },
        });
      } catch {
        // Prossegue para o serveDir
      }
    }

    // 3. Resolução e fallback para hashes de scripts antigos
    if (
      pathname === "/main.js" ||
      (pathname.includes("/index-") && pathname.endsWith(".js"))
    ) {
      const exists = await Deno.stat(`./dist${pathname}`).then(() => true).catch(() => false);
      if (!exists) {
        const { indexBundle } = await findActiveBundles();
        if (indexBundle) {
          const content = await Deno.readTextFile(`./dist/${indexBundle}`);
          return new Response(content, {
            status: 200,
            headers: {
              "content-type": "text/javascript; charset=utf-8",
              "cache-control": "no-cache, no-store, must-revalidate",
            },
          });
        }
      }
    }

    if (pathname.includes("/chunk-") && pathname.endsWith(".js")) {
      const exists = await Deno.stat(`./dist${pathname}`).then(() => true).catch(() => false);
      if (!exists) {
        const { chunkBundle } = await findActiveBundles();
        if (chunkBundle) {
          const content = await Deno.readTextFile(`./dist/${chunkBundle}`);
          return new Response(content, {
            status: 200,
            headers: {
              "content-type": "text/javascript; charset=utf-8",
              "cache-control": "no-cache, no-store, must-revalidate",
            },
          });
        }
      }
    }

    const staticResponse = await serveDir(req, {
      fsRoot: "./dist",
      showDirListing: false,
      quiet: true,
    });

    return staticResponse;
  } catch (err) {
    console.warn(
      `[STATIC] Falha ao servir arquivo estático. Build ainda não foi executado?`,
      err instanceof Error ? err.message : err,
    );

    return new Response("Internal Server Error", {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
});
