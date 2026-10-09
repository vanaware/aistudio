import { h } from "preact";
import { html } from "htm/preact";
import { useSignal } from "@preact/signals";

export function Heading({ depth, id, children } = {}) {
  const headingTags = ["h4", "h5", "h6", "h6", "h6", "h6"];
  const clampedDepth = Math.min(Math.max(Number(depth) || 1, 1), 6);
  const tag = headingTags[clampedDepth - 1] ?? "h6";
  const isSmall = clampedDepth >= 4;

  const anchor = id
    ? html`
      <a
        href="#${id}"
        class="surface-variant-text link small-text opacity-50 margin-left"
        title="Link direto para esta seção"
        aria-label="Link direto"
      >
        <i>link</i>
      </a>
    `
    : null;

  return h(
    tag,
    {
      id,
      class: `wrap bold margin-top margin-bottom ${isSmall ? "small" : ""}`.trim(),
    },
    children,
    anchor,
  );
}

export function Paragraph({ children } = {}) {
  return html`<p class="margin-bottom wrap">${children}</p>`;
}

export function CodeBlock({ lang, value = "" } = {}) {
  const copied = useSignal(false);

  async function handleCopy() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(value);
        copied.value = true;
        setTimeout(() => {
          copied.value = false;
        }, 2000);
      }
    } catch {
      // Ignore copy error
    }
  }

  return html`
    <article class="no-padding surface-container-highest border round margin">
      <div class="row items-center justify-between padding-left padding-right small-padding surface-container border-bottom">
        <span class="chip small primary-container bold">
          ${lang || "text"}
        </span>
        <button
          class="circle small transparent"
          onClick=${handleCopy}
          title="Copiar código"
          aria-label="Copiar código"
        >
          <i>${copied.value ? "check" : "content_copy"}</i>
        </button>
      </div>
      <div class="padding scroll">
        <pre class="no-margin"><code class="small-text">${value}</code></pre>
      </div>
    </article>
  `;
}

export function InlineCode({ value = "" } = {}) {
  return html`<code class="surface-container-high round">${value}</code>`;
}

export function Blockquote({ children } = {}) {
  return html`
    <blockquote class="surface-container-low border left-border border-primary padding round margin wrap">
      ${children}
    </blockquote>
  `;
}

export function List({ ordered, start, children } = {}) {
  if (ordered) {
    return html`<ol start=${start} class="padding-left margin-bottom wrap">${children}</ol>`;
  }
  return html`<ul class="padding-left margin-bottom wrap">${children}</ul>`;
}

export function ListItem({ checked, children } = {}) {
  if (typeof checked === "boolean") {
    return html`
      <li class="row wrap items-center gap margin-bottom">
        <label class="checkbox">
          <input type="checkbox" checked=${checked} disabled />
          <span></span>
        </label>
        <div class="max wrap">${children}</div>
      </li>
    `;
  }
  return html`<li class="margin-bottom wrap">${children}</li>`;
}

export function Table({ children } = {}) {
  return html`
    <div class="responsive scroll margin">
      <table class="border round">${children}</table>
    </div>
  `;
}

export function TableRow({ children } = {}) {
  return html`<tr>${children}</tr>`;
}

export function TableCell({ align, children } = {}) {
  return html`<td class=${align ? `align-${align}` : undefined}>${children}</td>`;
}

export function Link({ href = "", title, children } = {}) {
  let targetHref = href;
  const isExternal = href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//");

  if (!isExternal) {
    if (href.endsWith(".md") || href.includes(".md#")) {
      const cleanHref = href.startsWith("./") ? href.slice(2) : href;
      const fullPath = cleanHref.startsWith("/") ? cleanHref : `/docs/${cleanHref}`;
      targetHref = `#${fullPath}`;
    }
  }

  return html`
    <a
      href=${targetHref}
      title=${title}
      class="link primary-text bold wrap"
      target=${isExternal ? "_blank" : undefined}
      rel=${isExternal ? "noopener noreferrer" : undefined}
    >
      ${children}
    </a>
  `;
}

export function Image({ src, alt, title } = {}) {
  return html`
    <figure class="no-margin margin-top margin-bottom">
      <img src=${src} alt=${alt || ""} title=${title} class="responsive round border" loading="lazy" />
      ${alt ? html`<figcaption class="small-text surface-variant-text center-align margin-top">${alt}</figcaption>` : null}
    </figure>
  `;
}

export function Unknown({ nodeType } = {}) {
  return html`
    <span class="chip error-container small" title=${`Unknown node type: ${nodeType}`}>
      [${nodeType ?? "Unknown"}]
    </span>
  `;
}

export const defaultRegistry = {
  Heading,
  Paragraph,
  CodeBlock,
  InlineCode,
  Blockquote,
  List,
  ListItem,
  Table,
  TableRow,
  TableCell,
  Link,
  Image,
  Unknown,
};
