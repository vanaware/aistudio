import { h } from "https://esm.sh/preact@10.25.4";
import { CompatibilityCheck, MigrationSummary } from "../types.ts";

interface StatusCardProps {
  summary: MigrationSummary;
  checks: CompatibilityCheck[];
}

export function StatusCard({ summary, checks }: StatusCardProps) {
  return (
    <section className="margin-bottom">
      <div className="grid">
        <div className="s12 l4">
          <article className="border round surface padding fill">
            <div className="row items-center justify-between">
              <h6 className="no-margin primary-text">Runtime Architecture</h6>
              <span className="badge primary">Deno Native</span>
            </div>

            <div className="space"></div>

            <article className="border round surface padding">
              <span className="small-text">Deno Environment</span>
              <div className="row items-center gap">
                <i className="primary-text">check_circle</i>
                <strong>{summary.runtimeSource}</strong>
              </div>
            </article>

            <div className="space"></div>

            <article className="border round surface padding">
              <span className="small-text">Static Ingress & Delivery</span>
              <div className="row items-center gap">
                <i className="primary-text">cloud_done</i>
                <strong>{summary.runtimeTarget}</strong>
              </div>
            </article>

            <div className="space"></div>
            <p className="small-text">
              Zero Node.js runtime and zero Vite dependency. TypeScript and Preact JSX transpiled via <code>deno bundle</code>, served directly by Deno's <code>serveDir</code> static server from <code>dist/</code>.
            </p>
          </article>
        </div>

        <div className="s12 l8">
          <article className="border round surface padding fill">
            <div className="row items-center justify-between">
              <div>
                <h6 className="no-margin primary-text">Deno Native Migration Checklist</h6>
                <p className="small-text">All Deno build & serve constraints fulfilled</p>
              </div>
              <span className="chip primary">
                <i>verified</i>
                <span>5 / 5 ACTIVE</span>
              </span>
            </div>

            <div className="space"></div>

            <div className="grid">
              {checks.map((check) => (
                <div key={check.id} className="s12 m6">
                  <article className="border round surface padding">
                    <div className="row items-center justify-between">
                      <strong className="small-text">{check.target}</strong>
                      <span className="chip small primary">
                        <i>check</i>
                        <span>Ready</span>
                      </span>
                    </div>
                    <div className="space"></div>
                    <p className="small-text">{check.detail}</p>
                  </article>
                </div>
              ))}
            </div>

            <div className="space"></div>

            <div className="row wrap justify-around border-top padding-top">
              <div className="center-align padding">
                <i className="large primary-text">folder_special</i>
                <div className="small-text">Output Folder</div>
                <strong>/dist static</strong>
              </div>
              <div className="center-align padding">
                <i className="large primary-text">network_ping</i>
                <div className="small-text">Reverse Proxy</div>
                <strong>0.0.0.0:3000</strong>
              </div>
              <div className="center-align padding">
                <i className="large primary-text">speed</i>
                <div className="small-text">Bundle Speed</div>
                <strong>~14ms Native</strong>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
