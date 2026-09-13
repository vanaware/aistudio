import { serveDir } from "jsr:@std/http/file-server";

const PORT = 3000;
const HOST = "0.0.0.0";

console.log(`🌐 Deno serveDir server running on http://${HOST}:${PORT}`);

Deno.serve({ port: PORT, hostname: HOST }, async (req: Request) => {
  const res = await serveDir(req, {
    fsRoot: "dist",
    showDirListing: false,
    enableCors: true,
  });

  // SPA / PWA fallback for text/html navigation requests
  if (res.status === 404 && req.headers.get("accept")?.includes("text/html")) {
    try {
      const indexHtml = await Deno.readFile("dist/index.html");
      return new Response(indexHtml, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-cache",
        },
      });
    } catch {
      return res;
    }
  }

  return res;
});
