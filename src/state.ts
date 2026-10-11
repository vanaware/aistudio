import { effect, signal } from "@preact/signals";
import type { WireDoc } from "./plugin/wire.ts";
import { processMarkdown } from "./plugin/core/pipeline.ts";
import { islandNamesSet } from "./render/islands/manifest.ts";
import { getEmbeddedDoc } from "./embedded-docs.ts";

export type ViewMode = "preview" | "ast" | "raw";

const initialRaw = getEmbeddedDoc("/docs/guia.md") || "# Carregando documentação...";
const initialWireDoc = processMarkdown(initialRaw, "/docs/guia.md", islandNamesSet);

export const currentPath = signal<string>("/docs/guia.md");
export const currentDoc = signal<WireDoc | null>(initialWireDoc);
export const isLoading = signal<boolean>(false);
export const errorMessage = signal<string | null>(null);
export const isOffline = signal<boolean>(typeof navigator !== "undefined" ? !navigator.onLine : false);
export const isSWActive = signal<boolean>(false);
export const sidebarOpen = signal<boolean>(false);
export const parseTimeMs = signal<number>(0);
export const viewMode = signal<ViewMode>("preview");

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    isOffline.value = false;
  });
  window.addEventListener("offline", () => {
    isOffline.value = true;
  });

  if (typeof document !== "undefined") {
    effect(() => {
      // Trava rolagem do fundo (body) quando o menu lateral (gaveta) estiver aberto no mobile
      if (sidebarOpen.value && window.innerWidth < 992) {
        document.body.classList.add("no-scroll");
      } else {
        document.body.classList.remove("no-scroll");
      }
    });
  }
}
