import { assertEquals, assert } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { build } from "../build.ts";

describe("Build Script", () => {
  it("bundles src/index.html and src/sw.ts with Deno.bundle", async () => {
    await build();

    // Verifica se o index.html existe em dist
    const indexStat = await Deno.stat("dist/index.html");
    assertEquals(indexStat.isFile, true);

    // Verifica se sw.js foi gerado a partir do bundle de sw.ts
    const swStat = await Deno.stat("dist/sw.js");
    assertEquals(swStat.isFile, true);

    // Lê o conteúdo do HTML e verifica título e ausência de tags <style>
    const htmlContent = await Deno.readTextFile("dist/index.html");
    assert(htmlContent.includes("<title>mdBlog</title>"));
    assert(!htmlContent.includes("<style>"));
    assert(!htmlContent.includes("style="));

    // Verifica se o manifest está devidamente linkado
    assert(htmlContent.includes('rel="manifest"'));

    // Verifica se a lib de transpilação markdown foi gerada em dist/lib/md-transpiler.js
    const libStat = await Deno.stat("dist/lib/md-transpiler.js");
    assertEquals(libStat.isFile, true);

    // Lê o sw.js compilado e verifica o conteúdo minificado
    const swContent = await Deno.readTextFile("dist/sw.js");
    assert(swContent.includes("mdblog-pwa-v1"));
  });

  it("copies public assets and manifest into dist", async () => {
    const iconStat = await Deno.stat("dist/icon.svg");
    assertEquals(iconStat.isFile, true);

    const manifestStat = await Deno.stat("dist/manifest.json");
    assertEquals(manifestStat.isFile, true);

    const manifest = JSON.parse(await Deno.readTextFile("dist/manifest.json"));
    assertEquals(manifest.name, "mdBlog");
  });

  it("verifies Sidebar uses BeerCSS scroll and compact classes in pure HTML+ES .js", async () => {
    const sidebarSrc = await Deno.readTextFile("src/components/Sidebar.js");
    assert(sidebarSrc.includes("drawer scroll"));
    assert(sidebarSrc.includes("small-padding"));
    assert(sidebarSrc.includes('from "htm/preact"'));
    assert(sidebarSrc.includes("html`"));
    assert(!sidebarSrc.includes("style="));
    assert(!sidebarSrc.includes("<style>"));
  });

  it("confirms zero .tsx files exist in src and all components use HTML+ES (.js)", async () => {
    async function checkDir(dir: string) {
      for await (const entry of Deno.readDir(dir)) {
        const path = `${dir}/${entry.name}`;
        if (entry.isDirectory) {
          await checkDir(path);
        } else if (entry.isFile) {
          assert(!entry.name.endsWith(".tsx"), `Encontrado arquivo .tsx não migrado: ${path}`);
        }
      }
    }
    await checkDir("src/components");
    await checkDir("src/render");
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
