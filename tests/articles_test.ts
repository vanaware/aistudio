import { assertEquals, assert } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { resolveDocPath } from "../src/plugin/detect.ts";
import { getEmbeddedDoc } from "../src/embedded-docs.ts";
import { parseFrontmatter } from "../src/plugin/core/frontmatter.ts";
import { articles } from "../src/state.ts";

describe("Articles Architecture & Dynamic Blog", () => {
  it("verifies public/articles exists and contains markdown files including index.md", async () => {
    const stat = await Deno.stat("public/articles");
    assertEquals(stat.isDirectory, true);

    const files: string[] = [];
    for await (const entry of Deno.readDir("public/articles")) {
      if (entry.isFile && entry.name.endsWith(".md")) {
        files.push(entry.name);
      }
    }

    assert(files.length >= 8, `Expected at least 8 markdown articles, found ${files.length}`);
    assert(files.includes("index.md"), "index.md must be present in public/articles as home page");
    assert(files.includes("README.md"), "README.md must be present in public/articles");
    assert(files.includes("guia.md"), "guia.md must be present in public/articles");
    assert(files.includes("PLANO_MIGRACAO_HTML_ES.md"), "PLANO_MIGRACAO_HTML_ES.md must be in public/articles");
  });

  it("parses YAML frontmatter correctly (scalars, lists, and dates)", () => {
    const sample = `---
title: "Título de Teste"
date: "2026-10-09"
author: "Vanaware"
location: "#/articles/test.md"
pages:
  - path: "README.md"
    title: "Visão Geral"
    icon: "article"
  - path: "guia.md"
    title: "Guia"
    icon: "science"
---
# Corpo do Markdown
Texto normal aqui.`;

    const { frontmatter, body } = parseFrontmatter(sample);
    assertEquals(frontmatter.title, "Título de Teste");
    assertEquals(frontmatter.date, "2026-10-09");
    assertEquals(frontmatter.author, "Vanaware");
    assertEquals(frontmatter.location, "#/articles/test.md");
    assertEquals(Array.isArray(frontmatter.pages), true);
    assertEquals(frontmatter.pages.length, 2);
    assertEquals(frontmatter.pages[0].path, "README.md");
    assertEquals(frontmatter.pages[0].title, "Visão Geral");
    assert(body.includes("# Corpo do Markdown"));
    assert(!body.includes("---"));
  });

  it("verifies index.md contains frontmatter with pages navigation list", async () => {
    const raw = await Deno.readTextFile("public/articles/index.md");
    const { frontmatter, body } = parseFrontmatter(raw);

    assert(typeof frontmatter.title === "string", "index.md must have a title in frontmatter");
    assert(typeof frontmatter.date === "string", "index.md must have a date in frontmatter");
    assert(Array.isArray(frontmatter.pages), "index.md must have pages list in frontmatter");
    assert(frontmatter.pages.length >= 3, "index.md pages list must contain main sections");
    assert(body.includes("# 📖 mdBlog — Página Inicial"), "index.md body must contain content");
  });

  it("verifies child pages contain their own sub-pages in frontmatter (recursive nesting)", async () => {
    // README.md (Nível 1) tem sub-páginas (Nível 2)
    const readmeRaw = await Deno.readTextFile("public/articles/README.md");
    const { frontmatter: readmeFm } = parseFrontmatter(readmeRaw);
    assert(Array.isArray(readmeFm.pages), "README.md must declare sub-pages in frontmatter");
    assert(readmeFm.pages.includes("ARQUITETURA_WIRE_FORMAT.md"));
    assert(readmeFm.pages.includes("FLUXOS_E_CICLO_DE_VIDA.md"));

    // ARQUITETURA_WIRE_FORMAT.md (Nível 2) tem sub-sub-página (Nível 3)
    const wireRaw = await Deno.readTextFile("public/articles/ARQUITETURA_WIRE_FORMAT.md");
    const { frontmatter: wireFm } = parseFrontmatter(wireRaw);
    assert(Array.isArray(wireFm.pages), "ARQUITETURA_WIRE_FORMAT.md must declare sub-sub-pages in frontmatter");
    assert(wireFm.pages.includes("WIRE_SCHEMA_DETALHES.md"));

    // guia.md tem sub-página
    const guiaRaw = await Deno.readTextFile("public/articles/guia.md");
    const { frontmatter: guiaFm } = parseFrontmatter(guiaRaw);
    assert(Array.isArray(guiaFm.pages), "guia.md must declare sub-pages");
    assert(guiaFm.pages.includes("GUIA_DE_ISLANDS.md"));

    // PLANO_DESENVOLVIMENTO.md tem sub-página
    const planoRaw = await Deno.readTextFile("public/articles/PLANO_DESENVOLVIMENTO.md");
    const { frontmatter: planoFm } = parseFrontmatter(planoRaw);
    assert(Array.isArray(planoFm.pages), "PLANO_DESENVOLVIMENTO.md must declare sub-pages");
    assert(planoFm.pages.includes("PLANO_MIGRACAO_HTML_ES.md"));
  });

  it("verifies flattenArticles preserves depth, parentPath and recursive hierarchy", async () => {
    const { flattenArticles } = await import("../src/state.ts");
    const mockTree = [
      {
        name: "index.md",
        slug: "index",
        path: "/articles/index.md",
        title: "Home",
        icon: "home",
        depth: 0,
        children: [
          {
            name: "doc1.md",
            slug: "doc1",
            path: "/articles/doc1.md",
            title: "Doc 1",
            icon: "article",
            depth: 1,
            parentPath: "/articles/index.md",
            children: [
              {
                name: "subdoc1.md",
                slug: "subdoc1",
                path: "/articles/subdoc1.md",
                title: "SubDoc 1",
                icon: "description",
                depth: 2,
                parentPath: "/articles/doc1.md",
                children: [
                  {
                    name: "subsubdoc.md",
                    slug: "subsubdoc",
                    path: "/articles/subsubdoc.md",
                    title: "SubSubDoc",
                    icon: "description",
                    depth: 3,
                    parentPath: "/articles/subdoc1.md",
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const flat = flattenArticles(mockTree);
    assertEquals(flat.length, 4);
    assertEquals(flat[0].depth, 0);
    assertEquals(flat[1].depth, 1);
    assertEquals(flat[2].depth, 2);
    assertEquals(flat[3].depth, 3);
    assertEquals(flat[3].parentPath, "/articles/subdoc1.md");
  });

  it("confirms zero hardcoded articles lists in state.ts (starts as empty signal)", async () => {
    const stateSrc = await Deno.readTextFile("src/state.ts");
    assert(!stateSrc.includes("DEFAULT_ARTICLES"), "state.ts must NOT contain hardcoded DEFAULT_ARTICLES");
    assert(!stateSrc.includes("const QUICK_ARTICLES"), "state.ts must NOT contain QUICK_ARTICLES");
    assert(Array.isArray(articles.value), "articles signal must be an array");
  });

  it("confirms zero build-time indexing in build.ts (browser generates list)", async () => {
    const buildSrc = await Deno.readTextFile("build.ts");
    assert(!buildSrc.includes("generateArticlesIndex"), "build.ts must NOT generate articles index during build");
    assert(!buildSrc.includes("index.json"), "build.ts must NOT hardcode index.json generation");
  });

  it("resolves /articles/ routes correctly via resolveDocPath", () => {
    const res1 = resolveDocPath("/articles/guia", "/articles");
    assertEquals(res1.isDoc, true);
    assertEquals(res1.docPath, "/articles/guia.md");

    const res2 = resolveDocPath("/articles", "/articles");
    assertEquals(res2.isDoc, true);
    assertEquals(res2.docPath, "/articles/index.md");

    const res3 = resolveDocPath("/articles/README.md", "/articles");
    assertEquals(res3.isDoc, true);
    assertEquals(res3.docPath, "/articles/README.md");

    // Backward compatibility for /docs/
    const resDocs = resolveDocPath("/docs/guia.md", "/articles");
    assertEquals(resDocs.isDoc, true);
    assertEquals(resDocs.docPath, "/docs/guia.md");
  });

  it("confirms embedded-docs has been migrated to md files with zero static blob strings", () => {
    const doc = getEmbeddedDoc("/docs/README.md");
    assertEquals(doc, null, "Embedded doc should return null since docs are migrated to public/articles");
  });

  it("verifies Navbar and Sidebar render articles dynamically and indent sub-pages", async () => {
    const navbarSrc = await Deno.readTextFile("src/components/Navbar.js");
    assert(navbarSrc.includes("articles.value"), "Navbar must read articles from reactive signal");
    assert(navbarSrc.includes("art.depth"), "Navbar must inspect art.depth for indentation");
    assert(navbarSrc.includes("left-margin"), "Navbar must use left-margin indentation class for sub-pages");
    assert(navbarSrc.includes("subdirectory_arrow_right"), "Navbar must show sub-page indicator icon");
    assert(!navbarSrc.includes("const QUICK_ARTICLES"), "Navbar must not have hardcoded QUICK_ARTICLES");
    assert(!navbarSrc.includes("const SECTIONS ="), "Navbar must not have hardcoded SECTIONS");

    const sidebarSrc = await Deno.readTextFile("src/components/Sidebar.js");
    assert(sidebarSrc.includes("articles.value"), "Sidebar must read articles from reactive signal");
    assert(sidebarSrc.includes("item.depth"), "Sidebar must inspect item.depth for indentation");
    assert(sidebarSrc.includes("left-margin"), "Sidebar must use left-margin indentation class for sub-pages");
    assert(!sidebarSrc.includes("const SECTIONS ="), "Sidebar must not have hardcoded SECTIONS");
  });

  it("verifies static fallbacks for GitHub Pages exist and list raw filenames", async () => {
    const jsonContent = await Deno.readTextFile("public/articles/articles.json");
    const filenames: string[] = JSON.parse(jsonContent);
    assert(Array.isArray(filenames), "articles.json must be an array of filenames");
    assert(filenames.includes("README.md"), "articles.json must contain README.md");
    assert(filenames.every((f) => typeof f === "string" && f.endsWith(".md")), "All entries must be .md strings");

    const htmlContent = await Deno.readTextFile("public/articles/index.html");
    assert(htmlContent.includes('<a href="README.md">'), "index.html must contain link to README.md");
    assert(htmlContent.includes('<a href="guia.md">'), "index.html must contain link to guia.md");
  });

  it("verifies Content.js implements clean layout: discreet breadcrumb, title/author/date, content, sub-pages, and Made with mdBlog footer", async () => {
    const contentSrc = await Deno.readTextFile("src/components/Content.js");

    // 1. Discreet breadcrumbs
    assert(contentSrc.includes("breadcrumbs"), "Content.js must build breadcrumbs");
    assert(contentSrc.includes("chevron_right"), "Content.js must use subtle chevron_right divider");
    assert(contentSrc.includes("small-text surface-variant-text"), "Breadcrumb must be subtle and discreet");

    // 2. Header with title, author, date
    assert(contentSrc.includes("<header"), "Content.js must have clean article header");
    assert(contentSrc.includes("author"), "Header must include author");
    assert(contentSrc.includes("date"), "Header must include date");

    // 3. Article content before sub-pages list
    const articleIdx = contentSrc.indexOf("wireToVNode");
    const subpagesIdx = contentSrc.indexOf("Sub-páginas");
    assert(articleIdx > 0, "Content.js must render wireToVNode");
    assert(subpagesIdx > 0, "Content.js must render sub-pages list");
    assert(articleIdx < subpagesIdx, "Article content must be rendered BEFORE sub-pages list");

    // 4. Clean footer with only 'Made with mdBlog'
    assert(contentSrc.includes("Made with mdBlog"), "Footer must contain 'Made with mdBlog'");
    assert(!contentSrc.includes("dangerouslySetInnerHTML"), "Footer must not contain debug strings");
  });
});

