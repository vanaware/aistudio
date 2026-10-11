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

  // 1. Empacotamento dos entrypoints: src/main.js, src/sw.ts e src/lib/md-transpiler.ts via Deno.bundle
  // @ts-ignore Deno.bundle é uma API instável (--unstable-bundle)
  const result = await Deno.bundle({
    entrypoints: ["src/main.js", "src/sw.ts", "src/lib/md-transpiler.ts"],
    outputDir: "dist",
    platform: "browser",
    minify: true,
  });
  console.log("📦 [Deno.bundle result]:", result);

  // Copia o index.html da aplicação
  await Deno.copyFile("src/index.html", "dist/index.html");

  // 2. Garante disponibilidade do Service Worker em /sw.js, do bundle em /main.js e da lib de transpilação em /lib/md-transpiler.js
  await Deno.mkdir("dist/lib", { recursive: true });
  for await (const entry of Deno.readDir("dist")) {
    if (entry.name.startsWith("sw") && entry.name.endsWith(".js") && entry.name !== "sw.js") {
      await Deno.copyFile(`dist/${entry.name}`, "dist/sw.js");
    }
    if (entry.name.startsWith("index-") && entry.name.endsWith(".js")) {
      await Deno.copyFile(`dist/${entry.name}`, "dist/main.js");
    }
    if (entry.name.startsWith("md-transpiler") && entry.name.endsWith(".js")) {
      await Deno.copyFile(`dist/${entry.name}`, "dist/lib/md-transpiler.js");
      await Deno.copyFile(`dist/${entry.name}`, "dist/md-transpiler.js");
    }
  }

  // Se o Deno.bundle colocou em dist/lib/md-transpiler-*.js
  try {
    for await (const entry of Deno.readDir("dist/lib")) {
      if (entry.name.startsWith("md-transpiler") && entry.name.endsWith(".js") && entry.name !== "md-transpiler.js") {
        await Deno.copyFile(`dist/lib/${entry.name}`, "dist/lib/md-transpiler.js");
        await Deno.copyFile(`dist/lib/${entry.name}`, "dist/md-transpiler.js");
      }
    }
  } catch {
    // ignora
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

  // 4. Copia arquivos de documentação para dist/docs
  try {
    const stat = await Deno.stat("docs");
    if (stat.isDirectory) {
      await copyDir("docs", "dist/docs");
    }
  } catch {
    // docs ausente, ignora
  }

  console.log("✅ [Deno Build] Build concluído com sucesso!");
}

if (import.meta.main) {
  await build();
}
