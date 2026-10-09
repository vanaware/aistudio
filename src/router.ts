import { currentPath, currentDoc, isLoading, errorMessage, parseTimeMs, viewMode } from "./state.ts";
import { mdFetch } from "./plugin/adapters/client.ts";
import { createBrowserIO } from "./plugin/core/io.ts";
import { islandNamesSet } from "./render/islands/manifest.ts";
import { islands } from "./render/islands/index.js";
import { hydrateIslands } from "./render/hydrate-islands.ts";

const io = createBrowserIO({
  cacheName: "mdblog-pwa-v1",
  useIndexedDB: true,
});

const config = {
  basePath: "/docs",
  cacheTTLSeconds: 60,
  islands: islandNamesSet,
};

export async function navigateTo(path: string): Promise<void> {
  let cleanPath = path;
  if (cleanPath.startsWith("#")) {
    cleanPath = cleanPath.slice(1);
  }
  if (!cleanPath || cleanPath === "/") {
    cleanPath = "/docs/guia.md";
  }
  if (!cleanPath.startsWith("/")) {
    cleanPath = `/${cleanPath}`;
  }
  if (!cleanPath.endsWith(".md")) {
    cleanPath = `${cleanPath}.md`;
  }

  currentPath.value = cleanPath;
  viewMode.value = "preview";
  isLoading.value = true;
  errorMessage.value = null;

  try {
    const t0 = performance.now();
    const doc = await mdFetch(cleanPath, io, config);
    const t1 = performance.now();
    parseTimeMs.value = Math.max(0.1, Number((t1 - t0).toFixed(1)));

    currentDoc.value = doc;
    document.title = `${doc.title} - mdBlog`;

    // Schedule selective island hydration
    setTimeout(() => {
      hydrateIslands(islands);
    }, 50);
  } catch (err) {
    console.error(`[router] Error loading ${cleanPath}:`, err);
    errorMessage.value = err instanceof Error ? err.message : String(err);
  } finally {
    isLoading.value = false;
  }
}

export function initRouter(): void {
  if (typeof window === "undefined") return;

  function handleRoute() {
    const hash = window.location.hash;
    if (hash) {
      navigateTo(hash);
    } else {
      navigateTo("/docs/guia.md");
    }
  }

  window.addEventListener("hashchange", handleRoute);

  // Check if first paint has pre-rendered wire in DOM
  const preRenderedScript = document.getElementById("__md_wire");
  if (preRenderedScript && preRenderedScript.textContent) {
    try {
      const doc = JSON.parse(preRenderedScript.textContent);
      currentDoc.value = doc;
      currentPath.value = doc.url || "/docs/guia.md";
      document.title = `${doc.title} - mdBlog`;
      // Remove payload to save memory
      preRenderedScript.remove();
      setTimeout(() => {
        hydrateIslands(islands);
      }, 50);
      return;
    } catch (err) {
      console.warn("[router] Failed to parse inline __md_wire script:", err);
    }
  }

  // Otherwise, perform initial fetch
  handleRoute();
}
