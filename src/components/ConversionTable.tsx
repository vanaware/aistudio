import { h } from "https://esm.sh/preact@10.25.4";
import { useState } from "https://esm.sh/preact@10.25.4/hooks";
import { ConversionRule } from "../types.ts";

interface ConversionTableProps {
  rules: ConversionRule[];
}

export function ConversionTable({ rules }: ConversionTableProps) {
  const [selectedRuleId, setSelectedRuleId] = useState<string>(rules[0]?.id || "");
  const [copied, setCopied] = useState<boolean>(false);

  const selectedRule = rules.find((r) => r.id === selectedRuleId) || rules[0];

  const handleCopy = (code: string) => {
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
              <i>integration_instructions</i> Deno 2 API & Architecture Map
            </h6>
            <p className="small-text">Native tools replacing Node.js, npm, and Vite</p>
          </div>
        </div>

        <div className="space"></div>

        <div className="grid">
          <div className="s12 m5">
            <nav className="vertical">
              {rules.map((rule) => {
                const isSelected = rule.id === selectedRule?.id;
                return (
                  <button
                    key={rule.id}
                    onClick={() => setSelectedRuleId(rule.id)}
                    className={`border round margin-bottom left-align ${
                      isSelected ? "primary" : "surface"
                    }`}
                  >
                    <div className="row items-center justify-between">
                      <strong className="small-text">{rule.denoApi}</strong>
                      <span className="chip small border">{rule.category}</span>
                    </div>
                    <div className="small-text">{rule.nodeReplacement}</div>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="s12 m7">
            <article className="border round surface padding">
              <div className="row items-center justify-between">
                <div>
                  <span className="small-text">Pattern Reference</span>
                  <h6 className="no-margin">{selectedRule?.denoApi}</h6>
                </div>
                <button
                  onClick={() => handleCopy(selectedRule?.exampleDeno || "")}
                  className="button small border round"
                >
                  <i>{copied ? "check" : "content_copy"}</i>
                  <span>{copied ? "Copied" : "Copy Code"}</span>
                </button>
              </div>

              <p className="small-text">{selectedRule?.description}</p>
              <div className="space"></div>

              <span className="small-text">Implementation:</span>
              <pre className="border round padding surface">
                <code>{selectedRule?.exampleDeno}</code>
              </pre>

              <div className="space"></div>
              <span className="small-text">Outcome / Output:</span>
              <pre className="border round padding surface">
                <code>{selectedRule?.exampleNode}</code>
              </pre>
            </article>
          </div>
        </div>
      </article>
    </section>
  );
}
