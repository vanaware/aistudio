import { effect, signal } from "@preact/signals";
import type { WireDoc } from "./plugin/wire.ts";
import { parseFrontmatter } from "./plugin/core/frontmatter.ts";
import { get, set } from "idb-keyval";

export type ViewMode = "preview" | "ast" | "raw";

export interface ArticleItem {
  name: string;
  slug: string;
  path: string;
  title: string;
  icon: string;
  badge?: string;
  date?: string;
  location?: string;
  author?: string;
  description?: string;
  tags?: string[];
  depth: number;            // 0 = root/index, 1 = páginas de primeiro nível, 2 = sub-páginas, 3 = sub-sub-páginas...
  parentPath?: string;       // Caminho da página pai
  children?: ArticleItem[];  // Sub-páginas diretas
}

// O estado inicial começa vazio - gerado dinamicamente no browser via index.md frontmatter recursivamente
export const articles = signal<ArticleItem[]>([]);
export const articleTree = signal<ArticleItem[]>([]);
export const isArticlesLoading = signal<boolean>(false);

export const currentPath = signal<string>("/articles/index.md");
export const currentDoc = signal<WireDoc | null>(null);
export const isLoading = signal<boolean>(true);
export const errorMessage = signal<string | null>(null);
export const isOffline = signal<boolean>(typeof navigator !== "undefined" ? !navigator.onLine : false);
export const isSWActive = signal<boolean>(false);
export const sidebarOpen = signal<boolean>(false);
export const parseTimeMs = signal<number>(0);
export const viewMode = signal<ViewMode>("preview");

/**
 * Atribui ícone semântico baseado no nome ou conteúdo do artigo.
 */
function inferArticleIcon(slug: string, title: string): string {
  const combined = `${slug} ${title}`.toLowerCase();
  if (combined.includes("index") || combined.includes("home") || combined.includes("início")) return "home";
  if (combined.includes("readme")) return "article";
  if (combined.includes("guia") || combined.includes("demo") || combined.includes("pratico")) return "science";
  if (combined.includes("html") || combined.includes("migracao") || combined.includes("code")) return "code";
  if (combined.includes("wire") || combined.includes("ast") || combined.includes("spec") || combined.includes("schema")) return "schema";
  if (combined.includes("island") || combined.includes("ilha")) return "widgets";
  if (combined.includes("fluxo") || combined.includes("ciclo") || combined.includes("vida")) return "sync";
  if (combined.includes("plano") || combined.includes("desenvolvimento")) return "checklist";
  return "description";
}

/**
 * Extrai o título principal de um texto Markdown (# Título) no browser.
 */
function extractTitleFromMarkdown(text: string, fallbackName: string): string {
  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) {
      return trimmed.replace(/^#\s+/, "").trim();
    }
  }
  return fallbackName.replace(/\.md$/, "");
}

/**
 * Achata a árvore hierárquica em uma lista sequencial em pré-ordem (preservando depth e parentPath).
 */
export function flattenArticles(items: ArticleItem[]): ArticleItem[] {
  const flattened: ArticleItem[] = [];
  function traverse(node: ArticleItem) {
    flattened.push(node);
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }
  for (const item of items) {
    traverse(item);
  }
  return flattened;
}

/**
 * Carrega recursivamente uma página e suas sub-páginas a partir do frontmatter de cada uma.
 */
async function loadPageRecursive(
  rawItem: any,
  depth: number,
  parentPath: string,
  visited: Set<string>,
): Promise<ArticleItem | null> {
  const cleanName = typeof rawItem === "string" ? rawItem.trim() : (rawItem?.path || "").trim();
  const normalized = cleanName.replace(/^\.?\//, "");
  if (!normalized || visited.has(normalized)) return null;
  visited.add(normalized);

  try {
    let pageText = "";
    try {
      const res = await fetch(`./articles/${normalized}?_md_raw=1`);
      if (res.ok) {
        pageText = await res.text();
      } else {
        const res2 = await fetch(`./articles/${normalized}`);
        if (res2.ok) pageText = await res2.text();
      }
    } catch {
      // offline ou falha de rede
    }

    const { frontmatter: pageFm } = parseFrontmatter(pageText);
    const slug = normalized.replace(/\.md$/, "");
    const title = pageFm.title || extractTitleFromMarkdown(pageText, normalized);
    const icon = pageFm.icon || inferArticleIcon(slug, title);
    const itemPath = `/articles/${normalized}`;

    const item: ArticleItem = {
      name: normalized,
      slug,
      path: itemPath,
      title,
      icon,
      badge: pageFm.badge,
      date: pageFm.date,
      location: pageFm.location || `#/articles/${normalized}`,
      author: pageFm.author,
      description: pageFm.description,
      tags: Array.isArray(pageFm.tags) ? pageFm.tags : (pageFm.tag ? [pageFm.tag] : []),
      depth,
      parentPath,
      children: [],
    };

    // Suporta 'pages', 'articles' ou 'subpages' no frontmatter da própria página recursivamente
    const subPagesRaw = pageFm.pages || pageFm.articles || pageFm.subpages;
    if (Array.isArray(subPagesRaw) && subPagesRaw.length > 0) {
      const children: ArticleItem[] = [];
      for (const subItem of subPagesRaw) {
        const childNode = await loadPageRecursive(subItem, depth + 1, itemPath, visited);
        if (childNode) {
          children.push(childNode);
        }
      }
      item.children = children;
    }

    return item;
  } catch (err) {
    console.warn(`[state] Falha ao processar página ${normalized}:`, err);
    const slug = normalized.replace(/\.md$/, "");
    return {
      name: normalized,
      slug,
      path: `/articles/${normalized}`,
      title: cleanName,
      icon: inferArticleIcon(slug, cleanName),
      depth,
      parentPath,
      children: [],
    };
  }
}

/**
 * Tenta descobrir a lista de arquivos .md caso index.md não forneça a lista em frontmatter.
 */
async function discoverArticleFilenamesFallback(): Promise<string[]> {
  try {
    const res = await fetch("./articles/", {
      headers: { "Accept": "application/json" },
    });

    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const files: string[] = await res.json();
        if (Array.isArray(files) && files.length > 0) {
          return files.filter((f) => typeof f === "string" && f.endsWith(".md"));
        }
      }

      const html = await res.text();
      const matches = Array.from(html.matchAll(/href="(?:\.\/)?([^"?#]+\.md)"/gi)).map(
        (m) => decodeURIComponent(m[1]),
      );
      if (matches.length > 0) {
        return Array.from(new Set(matches));
      }
    }
  } catch (_err) {
    // continua
  }

  try {
    const res = await fetch("./articles/articles.json");
    if (res.ok) {
      const files: string[] = await res.json();
      if (Array.isArray(files) && files.length > 0) {
        return files.filter((f) => typeof f === "string" && f.endsWith(".md"));
      }
    }
  } catch (_err) {
    // continua
  }

  return [];
}

/**
 * GERAÇÃO DINÂMICA RECURSIVA NO BROWSER:
 * 1. Procura o arquivo /articles/index.md como página principal (depth: 0).
 * 2. Lê seu frontmatter YAML contendo 'pages'.
 * 3. Para cada página, lê recursivamente seu frontmatter e descobre sub-páginas ('pages') sucessivamente.
 * 4. Atribui a cada item sua profundidade hierárquica (depth) para indentação no Navbar e Sidebar.
 */
export async function loadArticles(): Promise<ArticleItem[]> {
  isArticlesLoading.value = true;

  try {
    // 1. Tenta carregar o index.md e analisar seu frontmatter
    let indexRaw: string | null = null;
    try {
      const res = await fetch("./articles/index.md?_md_raw=1");
      if (res.ok) {
        indexRaw = await res.text();
      } else {
        const res2 = await fetch("./articles/index.md");
        if (res2.ok) indexRaw = await res2.text();
      }
    } catch {
      // offline ou erro de rede
    }

    if (indexRaw) {
      const { frontmatter } = parseFrontmatter(indexRaw);
      const pagesList: any[] = frontmatter.pages || frontmatter.articles || frontmatter.subpages;

      if (Array.isArray(pagesList) && pagesList.length > 0) {
        const visited = new Set<string>(["index.md"]);

        // Página Inicial (Home) a partir do próprio index.md (depth: 0)
        const indexItem: ArticleItem = {
          name: "index.md",
          slug: "index",
          path: "/articles/index.md",
          title: frontmatter.title ? `🏠 ${frontmatter.title.split("-")[0].trim()}` : "🏠 Página Inicial",
          icon: "home",
          badge: "Home",
          date: frontmatter.date,
          location: frontmatter.location || "#/articles/index.md",
          author: frontmatter.author,
          description: frontmatter.description,
          tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
          depth: 0,
          children: [],
        };

        // Carrega recursivamente cada página filha declarada em index.md
        const childNodes: ArticleItem[] = [];
        for (const item of pagesList) {
          const node = await loadPageRecursive(item, 1, "/articles/index.md", visited);
          if (node) {
            childNodes.push(node);
          }
        }
        indexItem.children = childNodes;

        const tree = [indexItem];
        const flattened = flattenArticles(tree);

        articleTree.value = tree;
        articles.value = flattened;

        // Persiste cache no IndexedDB via idb-keyval
        try {
          await set("browser-articles-cache", flattened);
        } catch {
          // non-fatal
        }

        return articles.value;
      }
    }

    // 2. Se index.md não tinha pages ou falhou, tenta descoberta direta de arquivos
    const filenames = await discoverArticleFilenamesFallback();
    if (filenames.length > 0) {
      const generated: ArticleItem[] = [];
      await Promise.all(
        filenames.map(async (filename) => {
          try {
            const res = await fetch(`./articles/${filename}?_md_raw=1`);
            if (res.ok) {
              const text = await res.text();
              const { frontmatter } = parseFrontmatter(text);
              const title = frontmatter.title || extractTitleFromMarkdown(text, filename);
              const slug = filename.replace(/\.md$/, "");
              const icon = inferArticleIcon(slug, title);
              const isIndex = slug === "index";

              generated.push({
                name: filename,
                slug,
                path: `/articles/${filename}`,
                title,
                icon,
                badge: isIndex ? "Home" : undefined,
                date: frontmatter.date,
                location: frontmatter.location || `#/articles/${filename}`,
                author: frontmatter.author,
                description: frontmatter.description,
                tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
                depth: isIndex ? 0 : 1,
                parentPath: isIndex ? undefined : "/articles/index.md",
                children: [],
              });
            }
          } catch {
            // ignora
          }
        }),
      );

      generated.sort((a, b) => {
        if (a.name === "index.md") return -1;
        if (b.name === "index.md") return 1;
        if (a.name === "README.md") return -1;
        if (b.name === "README.md") return 1;
        return a.title.localeCompare(b.title);
      });

      if (generated.length > 0) {
        articles.value = generated;
        articleTree.value = generated;
        try {
          await set("browser-articles-cache", generated);
        } catch {
          // non-fatal
        }
        return articles.value;
      }
    }

    // 3. Fallback offline: busca cache salvo no IndexedDB (idb-keyval)
    try {
      const cached = await get<ArticleItem[]>("browser-articles-cache");
      if (cached && Array.isArray(cached) && cached.length > 0) {
        articles.value = cached;
        return cached;
      }
    } catch {
      // ignora
    }

    return articles.value;
  } finally {
    isArticlesLoading.value = false;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    isOffline.value = false;
    loadArticles().catch(() => {});
  });
  window.addEventListener("offline", () => {
    isOffline.value = true;
  });

  if (typeof document !== "undefined") {
    effect(() => {
      // Trava rolagem do fundo (body) quando o menu lateral estiver aberto no mobile
      if (sidebarOpen.value && window.innerWidth < 992) {
        document.body.classList.add("no-scroll");
      } else {
        document.body.classList.remove("no-scroll");
      }
    });
  }
}
