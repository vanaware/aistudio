/// <reference lib="deno.ns" />

import { serveDir } from "@std/http/file-server";

const port = Number(Deno.env.get("DEV_PORT") ?? 3000);

Deno.serve({ port }, async (req) => {
  try {
    return await serveDir(req, {
      fsRoot: "./dist",
      showDirListing: false,
      quiet: true,
    });
  } catch (err) {
    console.warn(
      `[STATIC] Falha ao servir arquivo estático.`,
      err instanceof Error ? err.message : err,
    );
    return new Response("Internal Server Error", {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
});
