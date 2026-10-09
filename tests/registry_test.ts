import { assertEquals, assert } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { wireToVNode } from "../src/render/from-wire.ts";
import { slugify } from "../src/plugin/detect.ts";
import type { WireFragment, WireIsland, WireComponent } from "../src/plugin/wire.ts";

describe("Render Layer & Registry", () => {
  it("slugifies heading text into URL-friendly IDs", () => {
    assertEquals(slugify("Meu Título com Acentuação!"), "meu-titulo-com-acentuacao");
    assertEquals(slugify("Getting Started & Setup"), "getting-started-setup");
    assertEquals(slugify("   Espaços extras   "), "espacos-extras");
  });

  it("converts WireFragment into Preact VNodes without dangerouslySetInnerHTML", () => {
    const fragment: WireFragment = {
      t: "f",
      c: [
        {
          t: "c",
          n: "Heading",
          p: { depth: 2, id: "subtitulo" },
          c: ["Subtítulo Teste"],
        } as WireComponent,
        {
          t: "c",
          n: "Paragraph",
          p: {},
          c: ["Texto do parágrafo."],
        } as WireComponent,
      ],
    };

    const vnode = wireToVNode(fragment);
    assert(vnode !== null);

    const serialized = JSON.stringify(vnode);
    assert(!serialized.includes("dangerouslySetInnerHTML"));
  });

  it("renders headings with BeerCSS wrap class and balanced hierarchy without non-wrapping row", async () => {
    const { Heading } = await import("../src/render/registry.js");
    const h1Node = Heading({ depth: 1, id: "titulo-principal", children: "Título Principal" }) as any;
    const h2Node = Heading({ depth: 2, id: "secao", children: "Subseção" }) as any;

    // depth 1 maps to h4 with wrap class
    assertEquals(h1Node.type, "h4");
    assert(h1Node.props.class.includes("wrap"));
    assert(!h1Node.props.class.includes("row"));

    // depth 2 maps to h5 with wrap class
    assertEquals(h2Node.type, "h5");
    assert(h2Node.props.class.includes("wrap"));
  });

  it("marks missing islands with data-island-missing", () => {
    const islandNode: WireIsland = {
      t: "i",
      n: "NonExistentIsland",
      p: { test: true },
      c: [],
    };

    const vnode = wireToVNode(islandNode, { islands: {} }) as any;
    assert(vnode !== null);
    assertEquals(vnode.props["data-island"], "NonExistentIsland");
    assertEquals(vnode.props["data-island-missing"], "true");
  });
});
