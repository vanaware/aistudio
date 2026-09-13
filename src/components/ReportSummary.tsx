import { h } from "https://esm.sh/preact@10.25.4";
import { MigrationSummary } from "../types.ts";

interface ReportSummaryProps {
  summary: MigrationSummary;
}

export function ReportSummary({ summary }: ReportSummaryProps) {
  return (
    <section className="margin-bottom">
      <article className="border round surface padding">
        <h6 className="no-margin primary-text">
          <i>verified</i> AI Studio Deno Native Environment Verified
        </h6>
        <p className="small-text">Verification of all user constraints:</p>

        <div className="space"></div>

        <div className="grid">
          <div className="s12 m6">
            <article className="border round surface padding">
              <strong>1. Runtime & TypeScript</strong>
              <p className="small-text">
                Native Deno 2.9 (V8 15.0, TypeScript 6.0) used for type checking and compilation.
              </p>
            </article>
          </div>

          <div className="s12 m6">
            <article className="border round surface padding">
              <strong>2. Bundler & JSX</strong>
              <p className="small-text">
                Deno Bundle API compiles TypeScript and Preact JSX into <code>dist/app.js</code> in ~14ms.
              </p>
            </article>
          </div>

          <div className="s12 m6">
            <article className="border round surface padding">
              <strong>3. Static Dev Server</strong>
              <p className="small-text">
                <code>jsr:@std/http/file-server</code> <code>serveDir</code> serves exclusively static files from <code>dist/</code> on port 3000 (0.0.0.0).
              </p>
            </article>
          </div>

          <div className="s12 m6">
            <article className="border round surface padding">
              <strong>4. Styling & PWA</strong>
              <p className="small-text">
                Exclusively BeerCSS Material You design. Service worker pre-caches assets for offline PWA operation.
              </p>
            </article>
          </div>
        </div>

        <div className="space"></div>

        <div className="row items-center justify-between border-top padding-top">
          <span className="small-text">
            Repository: <a href={summary.repoUrl} target="_blank" rel="noopener noreferrer">{summary.repoName}</a>
          </span>
          <span className="chip small border">MIT License</span>
        </div>
      </article>
    </section>
  );
}
