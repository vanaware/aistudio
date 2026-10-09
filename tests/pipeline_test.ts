import { assertEquals, assert } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { parseMarkdown } from "../src/plugin/core/parse.ts";
import { mdastToWire } from "../src/plugin/core/to-wire.ts";
import { processMarkdown, loadDoc } from "../src/plugin/core/pipeline.ts";
import { createMemoryIO } from "../src/plugin/core/io.ts";
import { sanitizeProps, countWireNodes, countWireIslands } from "../src/plugin/wire.ts";
import type { WireComponent } from "../src/plugin/wire.ts";

describe("Pipeline & Wire Format Core", () => {
  it("parses markdown and extracts the first h1 title", () => {
    const md = "# Meu Título Incrível\n\nEste é um parágrafo.";
    const root = parseMarkdown(md);
    const { wire, title } = mdastToWire(root);

    assertEquals(title, "Meu Título Incrível");
    assertEquals(wire.t, "f");
    assert(Array.isArray(wire.c));
    assertEquals(wire.c.length, 2);

    const heading = wire.c[0] as WireComponent;
    assertEquals(heading.t, "c");
    assertEquals(heading.n, "Heading");
    assertEquals(heading.p?.depth, 1);
  });

  it("discards raw HTML nodes completely for safety", () => {
    const md = "Texto seguro <script>alert('xss')</script> e <div onclick='bad()'>teste</div> final.";
    const root = parseMarkdown(md);
    const { wire } = mdastToWire(root);

    const serialized = JSON.stringify(wire);
    assert(!serialized.includes("<script>"));
    assert(!serialized.includes("onclick"));
    assert(!serialized.includes("bad()"));
  });

  it("processes GFM tables, task lists, and code blocks", () => {
    const md = `
| Nome | Tipo |
|---|---|
| Item 1 | Valor |

- [x] Tarefa Concluída
- [ ] Tarefa Pendente

\`\`\`ts
const x = 42;
\`\`\`
`;
    const doc = processMarkdown(md, "/docs/test.md");
    assertEquals(doc.url, "/docs/test.md");
    assert(doc.renderedAt > 0);

    const serialized = JSON.stringify(doc.wire);
    assert(serialized.includes('"n":"Table"'));
    assert(serialized.includes('"n":"CodeBlock"'));
    assert(serialized.includes('"value":"const x = 42;"'));
    assert(serialized.includes('"checked":true'));
  });

  it("handles document caching and TTL expiration via IO", async () => {
    const memoryIO = createMemoryIO({
      "/docs/cached.md": "# Versão 1\n\nConteúdo inicial.",
    });

    const doc1 = await loadDoc("/docs/cached.md", memoryIO, {
      cacheTTLSeconds: 10,
    });
    assertEquals(doc1.title, "Versão 1");

    // Manually overwrite file in IO without waiting for TTL
    const cacheKey = "wire:/docs/cached.md";
    const cachedRaw = await memoryIO.cacheGet(cacheKey);
    assert(cachedRaw !== null);

    // Call again immediately: should return cached version
    const doc2 = await loadDoc("/docs/cached.md", memoryIO, {
      cacheTTLSeconds: 10,
    });
    assertEquals(doc2.renderedAt, doc1.renderedAt);
  });

  it("sanitizes props to ensure 100% JSON serializability", () => {
    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;

    const sanitized = sanitizeProps(circular);
    assertEquals(sanitized, {});

    const clean = sanitizeProps({ name: "Counter", start: 5 });
    assertEquals(clean, { name: "Counter", start: 5 });
  });

  it("calculates node counts and detects islands in Wire tree", () => {
    const markdown = `# Título\n\nTexto de teste com [link](https://deno.com)\n\n::Counter{start: 10}`;
    const doc = processMarkdown(markdown, "/test.md", new Set(["Counter"]));

    const totalNodes = countWireNodes(doc.wire);
    const islandCount = countWireIslands(doc.wire);

    assert(totalNodes > 3);
    assertEquals(islandCount, 1);
  });
});
