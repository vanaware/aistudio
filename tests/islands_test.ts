import { assertEquals, assert } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { islandNames, islandNamesSet, resolveIslandFileName } from "../src/render/islands/manifest.ts";
import { parseMarkdown } from "../src/plugin/core/parse.ts";
import { mdastToWire } from "../src/plugin/core/to-wire.ts";
import type { WireIsland } from "../src/plugin/wire.ts";

describe("Islands Architecture (Dynamic File-Based, Zero Fixed Lists)", () => {
  it("enforces zero hardcoded islands list in code", () => {
    // Não pode haver lista fixa de ilhas no código
    assertEquals(islandNames.length, 0, "No fixed island names should exist in code");
    assertEquals(islandNamesSet.size, 0, "islandNamesSet must be empty (dynamic discovery)");
    assertEquals(resolveIslandFileName("Counter"), "Counter.js");
    assertEquals(resolveIslandFileName("DemoWidget.js"), "DemoWidget.js");
  });

  it("identifies code block islands by filename (```island:Counter.js)", () => {
    const md = `
# Teste de Ilha

\`\`\`island:Counter.js
{"start": 15, "step": 3}
\`\`\`
`;
    const root = parseMarkdown(md);
    // Não precisa de conjunto fixo passado - descobre dinamicamente pelo arquivo
    const { wire } = mdastToWire(root);

    assert(wire.c && wire.c.length >= 2);
    const islandNode = wire.c[1] as WireIsland;
    assertEquals(islandNode.t, "i");
    assertEquals(islandNode.n, "Counter.js");
    assertEquals(islandNode.p?.start, 15);
    assertEquals(islandNode.p?.step, 3);
  });

  it("identifies directive islands by filename (::Counter.js{start: 20})", () => {
    const md = "::Counter.js{start: 20, step: 2}";
    const root = parseMarkdown(md);
    const { wire } = mdastToWire(root);

    assert(wire.c && wire.c.length === 1);
    const islandNode = wire.c[0] as WireIsland;
    assertEquals(islandNode.t, "i");
    assertEquals(islandNode.n, "Counter.js");
    assertEquals(islandNode.p?.start, 20);
    assertEquals(islandNode.p?.step, 2);
  });

  it("does not convert regular code blocks to islands", () => {
    const md = "```typescript\nconsole.log(123);\n```";
    const root = parseMarkdown(md);
    const { wire } = mdastToWire(root);

    assert(wire.c && wire.c.length === 1);
    const node = wire.c[0] as any;
    assertEquals(node.t, "c");
    assertEquals(node.n, "CodeBlock");
    assertEquals(node.p?.lang, "typescript");
  });

  it("verifies dynamic islands exist as pure HTML+ES files in islands and island folders", async () => {
    // Verifica que ilhas estáticas isoladas existem em public/islands como ES Modules
    const demoWidgetCode = await Deno.readTextFile("public/islands/DemoWidget.js");
    assert(demoWidgetCode.includes('from "htm/preact"'));
    assert(demoWidgetCode.includes("html`"));
    assert(demoWidgetCode.includes("export function DemoWidget"));

    const publicCounterCode = await Deno.readTextFile("public/islands/Counter.js");
    assert(publicCounterCode.includes('from "htm/preact"'));
    assert(publicCounterCode.includes("html`"));

    // Verifica que a pasta public/island (singular) também contém as ilhas
    const islandDirStat = await Deno.stat("public/island");
    assertEquals(islandDirStat.isDirectory, true);
    const islandCounterCode = await Deno.readTextFile("public/island/Counter.js");
    assert(islandCounterCode.includes("export function Counter"));
  });
});
