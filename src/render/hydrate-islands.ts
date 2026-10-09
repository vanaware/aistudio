import { h, hydrate, type ComponentType } from "preact";

export interface HydrateOptions {
  root?: HTMLElement;
}

/**
 * Selectively hydrates DOM nodes marked with [data-island] using Preact.
 * Supports both pre-registered islands and on-demand dynamic HTML+ES browser modules.
 */
export function hydrateIslands(
  registry: Record<string, ComponentType<any>>,
  opts: HydrateOptions = {},
): number {
  if (typeof document === "undefined") {
    return 0;
  }

  const root = opts.root ?? document.body;
  const nodes = root.querySelectorAll<HTMLElement>("[data-island]");
  let hydratedCount = 0;

  for (const el of nodes) {
    // 1. Avoid double hydration
    if (el.dataset.islandHydrated === "true") {
      continue;
    }

    const name = el.dataset.island;
    if (!name) continue;

    const Comp = registry[name];
    if (!Comp) {
      // Tentativa de import dinâmico nativo do navegador para ilha HTML+ES sob demanda
      if (typeof window !== "undefined") {
        const islandUrl = `./islands/${name}.js`;
        import(/* @vite-ignore */ islandUrl)
          .then((mod) => {
            const dynamicComp = mod[name] || mod.default;
            if (dynamicComp) {
              registry[name] = dynamicComp;
              let dynamicProps = {};
              try {
                dynamicProps = JSON.parse(el.dataset.props || "{}");
              } catch (_) {}
              el.dataset.islandHydrated = "true";
              delete el.dataset.islandMissing;
              hydrate(h(dynamicComp, dynamicProps), el);
            }
          })
          .catch(() => {
            el.dataset.islandMissing = "true";
          });
      } else {
        el.dataset.islandMissing = "true";
      }
      continue;
    }

    // 2. Safely parse props
    let props = {};
    try {
      props = JSON.parse(el.dataset.props || "{}");
    } catch (err) {
      console.warn(`[hydrate] Failed to parse props for island ${name}:`, err);
    }

    // 3. Mark as hydrated before invoking hydrate
    el.dataset.islandHydrated = "true";
    delete el.dataset.islandMissing;

    // 4. Hydrate this subtree
    try {
      hydrate(h(Comp, props), el);
      hydratedCount++;
    } catch (err) {
      console.error(`[hydrate] Failed to hydrate island "${name}":`, err);
      el.dataset.islandError = "true";
    }
  }

  return hydratedCount;
}
