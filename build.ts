// build.ts - Simplificado: garante pasta de saída e copia index.html
export async function build() {
  console.log("🚀 [Deno Build] Executando build...");
  await Deno.mkdir("build/dist", { recursive: true });
  await Deno.mkdir("dist", { recursive: true });
  await Deno.copyFile("index.html", "build/dist/index.html");
  await Deno.copyFile("index.html", "dist/index.html");
  console.log("✅ [Deno Build] Build concluído com sucesso!");
}

if (import.meta.main) {
  await build();
}
