import { h } from "https://esm.sh/preact@10.25.4";
import { Header } from "./components/Header.tsx";
import { StatusCard } from "./components/StatusCard.tsx";
import { ConversionTable } from "./components/ConversionTable.tsx";
import { InteractiveConverter } from "./components/InteractiveConverter.tsx";
import { ReportSummary } from "./components/ReportSummary.tsx";
import { migrationSummary, compatibilityChecks, conversionRules } from "./data.ts";

export function App() {
  return (
    <div>
      <Header summary={migrationSummary} />

      <main className="responsive padding max">
        <StatusCard summary={migrationSummary} checks={compatibilityChecks} />

        <ConversionTable rules={conversionRules} />

        <InteractiveConverter />

        <ReportSummary summary={migrationSummary} />
      </main>

      <footer className="center-align padding border-top surface">
        <p className="small-text">
          Built with <strong>Deno 2</strong> + <strong>Preact</strong> + <strong>BeerCSS</strong> • No Vite • No Node.js • No npm dependencies
        </p>
      </footer>
    </div>
  );
}

export default App;
