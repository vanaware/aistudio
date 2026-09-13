import { h } from "https://esm.sh/preact@10.25.4";
import { MigrationSummary } from "../types.ts";

interface HeaderProps {
  summary: MigrationSummary;
}

export function Header({ summary }: HeaderProps) {
  return (
    <header className="top surface shadow">
      <nav className="responsive">
        <div className="max">
          <div className="row wrap items-center gap">
            <span className="chip primary">
              <i>bolt</i>
              <span>Native Deno 2.9</span>
            </span>
            <span className="chip border">
              <i>install_mobile</i>
              <span>PWA Offline Ready</span>
            </span>
            <span className="chip border">
              <i>palette</i>
              <span>BeerCSS Pure Styling</span>
            </span>
          </div>
          <h4 className="no-margin primary-text">{summary.repoName}</h4>
          <p className="small-text">{summary.description}</p>
        </div>

        <div className="row wrap items-center gap">
          <span className="chip surface">
            <i>dns</i>
            <span>Port {summary.port}</span>
          </span>
          <span className="chip surface">
            <i>verified</i>
            <span>MIT License</span>
          </span>
          <a
            href={summary.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button border round"
          >
            <i>open_in_new</i>
            <span>GitHub</span>
          </a>
        </div>
      </nav>
    </header>
  );
}
