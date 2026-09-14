import { assertEquals, assert } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { build } from "../build.ts";

describe("Build Script", () => {
  it("bundles src/index.html and src/sw.ts with Deno.bundle", async () => {
    await build();

    // Verifica se o index.html existe em build/dist
    const indexStat = await Deno.stat("build/dist/index.html");
    assertEquals(indexStat.isFile, true);

    // Verifica se sw.js foi gerado a partir do bundle de sw.ts
    const swStat = await Deno.stat("build/dist/sw.js");
    assertEquals(swStat.isFile, true);

    // Lê o conteúdo do HTML e verifica título e ausência de tags <style>
    const htmlContent = await Deno.readTextFile("build/dist/index.html");
    assert(htmlContent.includes("<title>SyntaxMesh</title>"));
    assert(!htmlContent.includes("<style>"));
    assert(!htmlContent.includes("style="));

    // Verifica se o manifest está devidamente linkado
    assert(htmlContent.includes('rel="manifest"'));

    // Lê o sw.js compilado e verifica o conteúdo minificado
    const swContent = await Deno.readTextFile("build/dist/sw.js");
    assert(swContent.includes("syntaxmesh-pwa-v1"));
  });

  it("copies public assets and manifest into build/dist", async () => {
    const iconStat = await Deno.stat("build/dist/icon.svg");
    assertEquals(iconStat.isFile, true);

    const manifestStat = await Deno.stat("build/dist/manifest.json");
    assertEquals(manifestStat.isFile, true);

    const manifest = JSON.parse(await Deno.readTextFile("build/dist/manifest.json"));
    assertEquals(manifest.name, "SyntaxMesh");
  });
});

describe("System Environment", () => {
  it("has TaskJuggler (tj3) CLI installed and operational", async () => {
    const command = new Deno.Command("tj3", {
      args: ["--version"],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout } = await command.output();
    const output = new TextDecoder().decode(stdout);

    assertEquals(code, 0);
    assert(output.includes("TaskJuggler"));
  });
});
