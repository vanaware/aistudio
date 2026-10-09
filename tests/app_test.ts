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

    // Verifica se mdblog.js e main.js foram gerados a partir do bundle da biblioteca
    const mdblogStat = await Deno.stat("dist/mdblog.js");
    assertEquals(mdblogStat.isFile, true);
    const mainStat = await Deno.stat("dist/main.js");
    assertEquals(mainStat.isFile, true);

    // Lê o conteúdo do HTML e verifica script mdblog.js, título e ausência de tags <style>
    const htmlContent = await Deno.readTextFile("dist/index.html");
    assert(htmlContent.includes("<title>mdBlog</title>"));
    assert(htmlContent.includes('src="./mdblog.js"'));
    assert(!htmlContent.includes("<style>"));
    assert(!htmlContent.includes("style="));

    // Verifica se o manifest está devidamente linkado
    assert(htmlContent.includes('rel="manifest"'));

    // Verifica se a lib de transpilação markdown foi gerada em dist/lib/md-transpiler.js
    const libStat = await Deno.stat("dist/lib/md-transpiler.js");
    assertEquals(libStat.isFile, true);

    // Lê o sw.js compilado e verifica o conteúdo
    const swContent = await Deno.readTextFile("dist/sw.js");
    assert(swContent.includes("mdblog-pwa-v1"));

    // Verifica se o arquivo public/sw.js padrão demonstra o uso da biblioteca empacotada
    const publicSw = await Deno.readTextFile("public/sw.js");
    assert(publicSw.includes('from "./lib/md-transpiler.js"'), "sw.js must show how it imports bundled library");
    assert(publicSw.includes("createSWFetchHandler"), "sw.js must use createSWFetchHandler");

    // Verifica se src/main.js inclui a biblioteca com fallback quando não existe app.js
    const mainSrc = await Deno.readTextFile("src/main.js");
    assert(mainSrc.includes("export {"), "main.js must export library components and utilities");
    assert(mainSrc.includes("ComponentToMount"), "main.js must support mounting built-in App if app.js is absent");
  });

  it("copies public assets and manifest into dist", async () => {
    const iconStat = await Deno.stat("dist/icon.svg");
    assertEquals(iconStat.isFile, true);

    const manifestStat = await Deno.stat("dist/manifest.json");
    assertEquals(manifestStat.isFile, true);

    const articlesStat = await Deno.stat("dist/articles");
    assertEquals(articlesStat.isDirectory, true);

    const readmeStat = await Deno.stat("dist/articles/README.md");
    assertEquals(readmeStat.isFile, true);

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
