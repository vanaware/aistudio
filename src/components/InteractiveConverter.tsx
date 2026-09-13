import { h } from "https://esm.sh/preact@10.25.4";
import { useState } from "https://esm.sh/preact@10.25.4/hooks";

const PRESETS = [
  {
    name: "Deno Static Server",
    deno: `import { serveDir } from "jsr:@std/http/file-server";\n\nDeno.serve({ port: 3000, hostname: "0.0.0.0" }, (req) => {\n  return serveDir(req, { fsRoot: "dist", enableCors: true });\n});`,
  },
  {
    name: "Preact JSX in Deno",
    deno: `import { h, render } from "https://esm.sh/preact@10.25.4";\nimport { useState } from "https://esm.sh/preact@10.25.4/hooks";\n\nexport function Widget() {\n  const [count, setCount] = useState(0);\n  return <button className="button primary" onClick={() => setCount(c => c + 1)}>Clicks: {count}</button>;\n}`,
  },
  {
    name: "PWA Service Worker",
    deno: `const CACHE_NAME = "deno-pwa-v1";\nself.addEventListener("fetch", (e) => {\n  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));\n});`,
  },
];

export function InteractiveConverter() {
  const [activePreset, setActivePreset] = useState<number>(0);
  const [code, setCode] = useState<string>(PRESETS[0].deno);
  const [copied, setCopied] = useState<boolean>(false);

  const handleSelect = (idx: number) => {
    setActivePreset(idx);
    setCode(PRESETS[idx].deno);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="margin-bottom">
      <article className="border round surface padding">
        <div className="row items-center justify-between">
          <div>
            <h6 className="no-margin primary-text">
              <i>terminal</i> Deno + Preact + BeerCSS Interactive Playground
            </h6>
            <p className="small-text">
              Browser-only PWA patterns executing with zero Node.js and zero npm dependencies
            </p>
          </div>

          <div className="row wrap gap">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                className={`chip small ${activePreset === idx ? "primary" : "border"}`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space"></div>

        <div className="field border label round textarea">
          <textarea
            value={code}
            onInput={(e) => setCode((e.target as HTMLTextAreaElement).value)}
            rows={8}
            className="border round padding"
          />
          <label>Deno Source Code</label>
        </div>

        <div className="row items-center justify-between">
          <div className="row items-center gap">
            <span className="badge primary">Deno 2.9</span>
            <span className="small-text">Bundled via <code>deno bundle</code> to <code>dist/app.js</code></span>
          </div>

          <button onClick={handleCopy} className="button small primary round">
            <i>{copied ? "check" : "content_copy"}</i>
            <span>{copied ? "Copied" : "Copy Snippet"}</span>
          </button>
        </div>
      </article>
    </section>
  );
}
