/**
 * Path detection, URL normalization, and environment utilities.
 */

/**
 * Checks whether the current window is actively controlled by a Service Worker.
 */
export function isSWControlling(): boolean {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }
  return Boolean(navigator.serviceWorker.controller);
}

/**
 * Normalizes and resolves a documentation request path.
 * Maps clean paths like "/docs/guia" or "docs/guia" or "/docs/guia.md" to canonical ".md" paths.
 */
export function resolveDocPath(
  urlOrPath: string,
  basePath: string = "/docs",
): { docPath: string; isDoc: boolean } {
  let pathname = urlOrPath;
  try {
    const parsed = new URL(urlOrPath, "http://localhost");
    pathname = parsed.pathname;
  } catch {
    // Relative path or raw string
  }

  // Remove trailing slashes and hash
  pathname = pathname.replace(/#.*$/, "").replace(/\?.*$/, "");

  // If path is root or empty
  if (pathname === "" || pathname === "/") {
    pathname = `${basePath}/README.md`;
  }

  // Check if it pertains to the documentation base path
  const normalizedBase = basePath.startsWith("/") ? basePath : `/${basePath}`;
  if (!pathname.startsWith(normalizedBase) && !pathname.endsWith(".md")) {
    return { docPath: pathname, isDoc: false };
  }

  let docPath = pathname;
  if (!docPath.endsWith(".md")) {
    // If ending with slash or base, default to README.md
    if (docPath === normalizedBase || docPath === `${normalizedBase}/`) {
      docPath = `${normalizedBase}/README.md`;
    } else {
      docPath = `${docPath}.md`;
    }
  }

  // Normalize duplicate slashes
  docPath = docPath.replace(/\/+/g, "/");

  return { docPath, isDoc: true };
}

/**
 * Generates a clean URL slug for heading anchors.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
