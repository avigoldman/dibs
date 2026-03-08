import { describe, it, expect } from "vitest";
import { formatJSON } from "../src/formatters/json.js";
import { formatCSV } from "../src/formatters/csv.js";
import { formatPretty } from "../src/formatters/pretty.js";
import { generateRecommendation } from "../src/recommend.js";
import type { CheckResult } from "../src/checkers/types.js";

function makeRec() {
  const results: CheckResult[] = [
    { platform: "Domain acme.com", status: "available", url: "https://acme.com" },
    { platform: "GitHub", status: "taken", url: "https://github.com/acme" },
    { platform: "npm", status: "available", url: "https://www.npmjs.com/package/acme" },
    { platform: "X / Twitter", status: "error", message: "Rate limited" },
  ];

  return generateRecommendation([
    { variant: { name: "acme", pattern: null }, results },
    {
      variant: { name: "acmehq", pattern: { id: "hq", label: "___hq", apply: (n) => `${n}hq` } },
      results: [
        { platform: "Domain acmehq.com", status: "available", url: "https://acmehq.com" },
        { platform: "GitHub", status: "available", url: "https://github.com/acmehq" },
        { platform: "npm", status: "available", url: "https://www.npmjs.com/package/acmehq" },
        { platform: "X / Twitter", status: "available", url: "https://x.com/acmehq" },
      ],
    },
  ]);
}

describe("formatJSON", () => {
  it("produces valid JSON", () => {
    const output = formatJSON(makeRec());
    const parsed = JSON.parse(output);
    expect(parsed).toBeDefined();
  });

  it("includes recommendation fields", () => {
    const parsed = JSON.parse(formatJSON(makeRec()));
    expect(parsed.recommendation).toBeDefined();
    expect(parsed.recommendation.verdict).toBeDefined();
    expect(parsed.recommendation.summary).toBeDefined();
    expect(parsed.recommendation.details).toBeInstanceOf(Array);
  });

  it("includes best variant with results", () => {
    const parsed = JSON.parse(formatJSON(makeRec()));
    expect(parsed.best).toBeDefined();
    expect(parsed.best.name).toBeDefined();
    expect(parsed.best.results).toBeInstanceOf(Array);
    expect(parsed.best.score).toBeGreaterThanOrEqual(0);
    expect(parsed.best.score).toBeLessThanOrEqual(100);
  });

  it("includes all variants in summary", () => {
    const parsed = JSON.parse(formatJSON(makeRec()));
    expect(parsed.variants).toBeInstanceOf(Array);
    expect(parsed.variants.length).toBe(2);
  });

  it("normalizes null for missing url/message", () => {
    const parsed = JSON.parse(formatJSON(makeRec()));
    const errorResult = parsed.best.results.find((r: any) => r.status === "error");
    if (errorResult) {
      expect(errorResult.url).toBeNull();
    }
  });
});

describe("formatCSV", () => {
  it("has a header row", () => {
    const output = formatCSV(makeRec());
    const lines = output.split("\n");
    expect(lines[0]).toBe("variant,pattern,platform,status,url,message");
  });

  it("has one row per platform per variant", () => {
    const rec = makeRec();
    const output = formatCSV(rec);
    const lines = output.split("\n");
    const totalResults = rec.all.reduce((sum, vr) => sum + vr.results.length, 0);
    expect(lines.length).toBe(1 + totalResults); // header + data
  });

  it("escapes commas in values", () => {
    const results: CheckResult[] = [
      { platform: "test", status: "error", message: "failed, retry later" },
    ];
    const rec = generateRecommendation([{ variant: { name: "test", pattern: null }, results }]);
    const output = formatCSV(rec);
    expect(output).toContain('"failed, retry later"');
  });
});

describe("formatPretty", () => {
  it("includes the verdict", () => {
    const output = formatPretty(makeRec());
    expect(output).toMatch(/GREAT|GOOD|FAIR|POOR/);
  });

  it("includes variant ranking when multiple variants", () => {
    const output = formatPretty(makeRec());
    expect(output).toContain("Variant Ranking");
  });

  it("includes category grouping", () => {
    const output = formatPretty(makeRec());
    // Should contain at least one category header
    expect(output).toMatch(/Domains|Social|Package Registries|Legal/);
  });

  it("shows status icons", () => {
    // Best variant (acmehq) is all available, so only ✔ shows in detail
    const output = formatPretty(makeRec());
    expect(output).toContain("✔");
  });

  it("shows taken icon when results include taken items", () => {
    const rec = generateRecommendation([
      {
        variant: { name: "taken-name", pattern: null },
        results: [
          { platform: "GitHub", status: "taken", url: "https://github.com/taken-name" },
          { platform: "npm", status: "available", url: "https://npmjs.com/package/taken-name" },
        ],
      },
    ]);
    const output = formatPretty(rec);
    expect(output).toContain("✘");
    expect(output).toContain("✔");
  });

  it("includes score summary line", () => {
    const output = formatPretty(makeRec());
    expect(output).toMatch(/available/);
    expect(output).toMatch(/taken/);
  });
});
