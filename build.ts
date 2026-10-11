/// <reference lib="deno.ns" />

async function copyDir(src: string, dest: string) {
  await Deno.mkdir(dest, { recursive: true });
  for await (const entry of Deno.readDir(src)) {
    const srcPath = `${src}/${entry.name}`;
    const destPath = `${dest}/${entry.name}`;
    if (entry.isDirectory) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile) {
      await Deno.copyFile(srcPath, destPath);
    }
  }
}

export async function build() {
  console.log("🚀 [Deno Build] Iniciando empacotamento com Deno.bundle...");

  // Limpa e prepara os diretórios de saída
  await Deno.remove("dist", { recursive: true }).catch(() => {});
  await Deno.mkdir("dist", { recursive: true });

  // 1. Empacotamento dos entrypoints: src/index.html e src/sw.ts via Deno.bundle
  // Salvaguardamos temporariamente as tags <script src="https://..."> para o Deno.bundle
  const originalHtml = await Deno.readTextFile("src/index.html");
  const remoteScriptRegex = /<script\b[^>]*src=["\']https?:\/\/[^>]*>[\s\S]*?<\/script>/gi;
  const externalScripts = originalHtml.match(remoteScriptRegex) || [];

  try {
    if (externalScripts.length > 0) {
      const sanitizedHtml = originalHtml.replace(remoteScriptRegex, "<!-- DENO_BUNDLE_REMOTE_SCRIPT -->");
      await Deno.writeTextFile("src/index.html", sanitizedHtml);
    }

    // @ts-ignore Deno.bundle é uma API instável (--unstable-bundle)
    const result = await Deno.bundle({
      entrypoints: ["src/index.html", "src/sw.ts"],
      outputDir: "dist",
      platform: "browser",
      minify: true,
    });
    console.log("📦 [Deno.bundle result]:", result);

    // Restaura scripts remotos no index.html final compilado
    if (externalScripts.length > 0) {
      let outputHtml = await Deno.readTextFile("dist/index.html");
      for (const scriptTag of externalScripts) {
        outputHtml = outputHtml.replace("<!-- DENO_BUNDLE_REMOTE_SCRIPT -->", scriptTag);
      }
      await Deno.writeTextFile("dist/index.html", outputHtml);
    }
  } finally {
    // Restaura src/index.html original intacto
    await Deno.writeTextFile("src/index.html", originalHtml);
  }

  // 2. Garante disponibilidade do Service Worker em /sw.js
  for await (const entry of Deno.readDir("dist")) {
    if (entry.name.startsWith("sw") && entry.name.endsWith(".js") && entry.name !== "sw.js") {
      await Deno.copyFile(`dist/${entry.name}`, "dist/sw.js");
    }
  }

  // 3. Copia assets estáticos da pasta public/
  try {
    const stat = await Deno.stat("public");
    if (stat.isDirectory) {
      await copyDir("public", "dist");
    }
  } catch {
    // public ausente, ignora
  }

  console.log("✅ [Deno Build] Build concluído com sucesso!");
}

if (import.meta.main) {
  await build();
}
