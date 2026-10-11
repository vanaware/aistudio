import { APP_VERSION } from "../version.ts";

export function Footnote() {
  const displayVersion = APP_VERSION
    ? (APP_VERSION.startsWith("v") ? APP_VERSION : `v${APP_VERSION}`)
    : "v1.0";

  return (
    <footer class="center-align">
      <div class="space"></div>
      <div>© 2026 <strong>Vanaware</strong> • aiStudio</div>
      <div class="space"></div>
      <div class="center-align">
        <span class="chip tertiary small">
          <i>verified</i>
          <span>{displayVersion}</span>
        </span>
        <span class="chip secondary small">
          <i>bolt</i>
          <span>Deno PWA</span>
        </span>
      </div>
      <div class="space"></div>
      <div class="small-text">Progressive Web App com Preact Signals e BeerCSS</div>
      <div class="space"></div>
    </footer>
  );
}
