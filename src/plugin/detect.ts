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
  basePath: string = "/articles",
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
    pathname = `${basePath}/index.md`;
  }

  // Check if it pertains to articles, docs, or ends with .md
  const normalizedBase = basePath.startsWith("/") ? basePath : `/${basePath}`;
  const isDoc =
    pathname.startsWith(normalizedBase) ||
    pathname.startsWith("/articles") ||
    pathname.startsWith("/docs") ||
    pathname.endsWith(".md");

  if (!isDoc) {
    return { docPath: pathname, isDoc: false };
  }

  let docPath = pathname;
  if (!docPath.endsWith(".md")) {
    if (docPath === "/articles" || docPath === "/articles/" || docPath === "/articles/index") {
      docPath = "/articles/index.md";
    } else if (docPath === "/docs" || docPath === "/docs/") {
      docPath = "/docs/README.md";
    } else if (docPath === normalizedBase || docPath === `${normalizedBase}/`) {
      docPath = `${normalizedBase}/index.md`;
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
