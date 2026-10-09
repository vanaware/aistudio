import { assertEquals, assert } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { islandNames, islandNamesSet } from "../src/render/islands/manifest.ts";
import { parseMarkdown } from "../src/plugin/core/parse.ts";
import { mdastToWire } from "../src/plugin/core/to-wire.ts";
import type { WireIsland } from "../src/plugin/wire.ts";

describe("Islands Architecture (Mode B)", () => {
  it("provides a pure string manifest without UI dependencies", () => {
    assert(islandNames.includes("Counter"));
    assert(islandNames.includes("SearchBox"));
    assert(islandNames.includes("ThemeToggle"));
    assertEquals(islandNamesSet.has("Counter"), true);
  });

  it("identifies code block islands (```island:Counter)", () => {
    const md = `
# Teste de Ilha

\`\`\`island:Counter
{"start": 15, "step": 3}
\`\`\`
`;
    const root = parseMarkdown(md);
    const { wire } = mdastToWire(root, islandNamesSet);

    assert(wire.c && wire.c.length >= 2);
    const islandNode = wire.c[1] as WireIsland;
    assertEquals(islandNode.t, "i");
    assertEquals(islandNode.n, "Counter");
    assertEquals(islandNode.p?.start, 15);
    assertEquals(islandNode.p?.step, 3);
  });

  it("identifies directive islands (::Counter{start: 20})", () => {
    const md = "::Counter{start: 20, step: 2}";
    const root = parseMarkdown(md);
    const { wire } = mdastToWire(root, islandNamesSet);

    assert(wire.c && wire.c.length === 1);
    const islandNode = wire.c[0] as WireIsland;
    assertEquals(islandNode.t, "i");
    assertEquals(islandNode.n, "Counter");
    assertEquals(islandNode.p?.start, 20);
    assertEquals(islandNode.p?.step, 2);
  });

  it("does not convert regular code blocks to islands", () => {
    const md = "```typescript\nconsole.log(123);\n```";
    const root = parseMarkdown(md);
    const { wire } = mdastToWire(root, islandNamesSet);

    assert(wire.c && wire.c.length === 1);
    const node = wire.c[0] as any;
    assertEquals(node.t, "c");
    assertEquals(node.n, "CodeBlock");
    assertEquals(node.p?.lang, "typescript");
  });

  it("implements islands using HTML+ES (htm/preact) with zero-bundle browser capability", async () => {
    // Verifica que Counter.js utiliza htm/preact como ES Module puro
    const counterCode = await Deno.readTextFile("src/render/islands/Counter.js");
    assert(counterCode.includes('from "htm/preact"'));
    assert(counterCode.includes("html`"));

    // Verifica que ilhas estáticas isoladas existem em public/islands como ES Modules
    const demoWidgetCode = await Deno.readTextFile("public/islands/DemoWidget.js");
    assert(demoWidgetCode.includes('from "htm/preact"'));
    assert(demoWidgetCode.includes("html`"));
    assert(demoWidgetCode.includes("export function DemoWidget"));

    const publicCounterCode = await Deno.readTextFile("public/islands/Counter.js");
    assert(publicCounterCode.includes('from "htm/preact"'));
    assert(publicCounterCode.includes("html`"));
  });
});
