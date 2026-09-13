import { serveDir } from "jsr:@std/http/file-server";

// 1. Initial build
console.log("⚡ [Deno Dev] Running initial build...");
const initialBuild = new Deno.Command("deno", {
  args: ["run", "-A", "build.ts"],
  stdout: "inherit",
  stderr: "inherit",
});
await initialBuild.output();

// 2. Watcher for changes in src, index.html, public
(async () => {
  try {
    const watcher = Deno.watchFs(["src", "index.html", "public"]);
    let timer: number | null = null;
    for await (const event of watcher) {
      if (event.kind === "modify" || event.kind === "create") {
        if (timer) clearTimeout(timer);
        timer = setTimeout(async () => {
          console.log(`🔄 [Deno Dev] Rebuilding changes...`);
          const rebuildCmd = new Deno.Command("deno", {
            args: ["run", "-A", "build.ts"],
            stdout: "inherit",
            stderr: "inherit",
          });
          await rebuildCmd.output();
        }, 300);
      }
    }
  } catch (err) {
    console.warn("[Deno Dev] File watcher notice:", err);
  }
})();

// 3. Static server on port 3000
const PORT = 3000;
const HOST = "0.0.0.0";
console.log(`🌐 [Deno Dev] Static server listening on http://${HOST}:${PORT}`);

Deno.serve({ port: PORT, hostname: HOST }, async (req: Request) => {
  const res = await serveDir(req, {
    fsRoot: "dist",
    showDirListing: false,
    enableCors: true,
  });

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
