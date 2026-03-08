import { describe, it, expect } from "vitest";
import { generateRecommendation } from "../src/recommend.js";
import type { CheckResult } from "../src/checkers/types.js";

function makeResults(statuses: Record<string, "available" | "taken" | "error">): CheckResult[] {
  return Object.entries(statuses).map(([platform, status]) => ({
    platform,
    status,
  }));
}

describe("generateRecommendation", () => {
  it("returns 'great' when everything is available", () => {
    const results = makeResults({
      "Domain acme.com": "available",
      "Domain acme.dev": "available",
      GitHub: "available",
      "X / Twitter": "available",
      Instagram: "available",
      npm: "available",
      "USPTO Trademark": "available",
    });

    const rec = generateRecommendation([{ variant: { name: "acme", pattern: null }, results }]);

    expect(rec.verdict).toBe("great");
    expect(rec.best.variant.name).toBe("acme");
    expect(rec.best.score).toBeGreaterThan(0.8);
  });

  it("returns 'poor' when everything is taken", () => {
    const results = makeResults({
      "Domain acme.com": "taken",
      "Domain acme.dev": "taken",
      GitHub: "taken",
      "X / Twitter": "taken",
      Instagram: "taken",
      npm: "taken",
      "USPTO Trademark": "taken",
    });

    const rec = generateRecommendation([{ variant: { name: "acme", pattern: null }, results }]);

    expect(rec.verdict).toBe("poor");
    expect(rec.best.score).toBe(0);
  });

  it("picks the best variant by weighted score", () => {
    const taken = makeResults({
      "Domain acme.com": "taken",
      GitHub: "taken",
      npm: "taken",
    });
    const available = makeResults({
      "Domain acmehq.com": "available",
      GitHub: "available",
      npm: "available",
    });

    const rec = generateRecommendation([
      { variant: { name: "acme", pattern: null }, results: taken },
      {
        variant: { name: "acmehq", pattern: { id: "hq", label: "___hq", apply: (n) => `${n}hq` } },
        results: available,
      },
    ]);

    expect(rec.best.variant.name).toBe("acmehq");
    expect(rec.all[0]!.variant.name).toBe("acmehq"); // sorted by score
  });

  it("does not penalize errors in the score", () => {
    const withErrors = makeResults({
      "Domain acme.com": "available",
      GitHub: "error",
      npm: "available",
    });

    const rec = generateRecommendation([
      { variant: { name: "acme", pattern: null }, results: withErrors },
    ]);

    // Score should be based on available / (total - errors)
    // 2 available, 0 taken, 1 error → score = 2/(2) = 1.0 (weighted)
    expect(rec.best.score).toBeGreaterThan(0.5);
    expect(rec.best.errors).toBe(1);
  });

  it("includes error warnings in details", () => {
    const results = makeResults({
      "Domain acme.com": "available",
      GitHub: "error",
    });

    const rec = generateRecommendation([{ variant: { name: "acme", pattern: null }, results }]);

    const errorDetail = rec.details.find((d) => d.includes("failed"));
    expect(errorDetail).toBeDefined();
    expect(errorDetail).toContain("GitHub");
  });

  it("highlights .com availability in details", () => {
    const results = makeResults({
      "Domain acme.com": "available",
    });

    const rec = generateRecommendation([{ variant: { name: "acme", pattern: null }, results }]);

    expect(rec.details.some((d) => d.includes(".com") && d.includes("✓"))).toBe(true);
  });

  it("warns about .com being taken in details", () => {
    const results = makeResults({
      "Domain acme.com": "taken",
    });

    const rec = generateRecommendation([{ variant: { name: "acme", pattern: null }, results }]);

    expect(rec.details.some((d) => d.includes(".com") && d.includes("✗"))).toBe(true);
  });

  it("handles single variant with mixed results", () => {
    const results = makeResults({
      "Domain acme.com": "taken",
      "Domain acme.dev": "available",
      GitHub: "available",
      "X / Twitter": "taken",
      Instagram: "available",
      npm: "available",
      "USPTO Trademark": "available",
    });

    const rec = generateRecommendation([{ variant: { name: "acme", pattern: null }, results }]);

    expect(["good", "fair"]).toContain(rec.verdict);
    expect(rec.best.available).toBe(5);
    expect(rec.best.taken).toBe(2);
  });
});
