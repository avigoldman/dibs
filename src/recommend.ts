import type { CheckResult } from "./checkers/types.js";
import type { Variant } from "./variants.js";

export interface VariantResult {
  variant: Variant;
  results: CheckResult[];
  available: number;
  taken: number;
  errors: number;
  total: number;
  score: number;
}

export interface Recommendation {
  verdict: "great" | "good" | "fair" | "poor";
  summary: string;
  details: string[];
  best: VariantResult;
  all: VariantResult[];
}

/**
 * Score a set of check results. Weights:
 *  - Domain .com available: big bonus
 *  - Social platforms: medium weight
 *  - Package registries: lower weight (less critical for a business)
 *  - Trademark clear: high weight
 *  - Errors: neutral (don't penalize, but note them)
 */
const PLATFORM_WEIGHTS: Record<string, number> = {
  // Domains — .com is king
  "Domain .com": 15,
  "Domain .dev": 5,
  "Domain .io": 5,
  "Domain .ai": 6,
  "Domain .co": 4,
  "Domain .app": 4,

  // Social
  GitHub: 6,
  "X / Twitter": 8,
  Instagram: 7,
  LinkedIn: 7,
  TikTok: 5,
  YouTube: 5,
  Reddit: 4,

  // Packages
  npm: 3,
  PyPI: 2,
  "crates.io": 2,
  RubyGems: 2,
  "Go (pkg.go.dev)": 2,
  Homebrew: 2,
  "Docker Hub": 2,

  // Legal
  "USPTO Trademark": 12,
};

const DEFAULT_WEIGHT = 3;

function scoreResults(results: CheckResult[]): number {
  let earned = 0;
  let possible = 0;

  for (const r of results) {
    // Match platform name to weight (domain results include the full domain)
    let weight = DEFAULT_WEIGHT;
    for (const [key, w] of Object.entries(PLATFORM_WEIGHTS)) {
      if (r.platform.startsWith(key) || r.platform === key) {
        weight = w;
        break;
      }
    }

    possible += weight;
    if (r.status === "available") {
      earned += weight;
    } else if (r.status === "error") {
      // Don't count errors against — reduce the possible
      possible -= weight;
    }
  }

  return possible > 0 ? earned / possible : 0;
}

function getVerdict(score: number): "great" | "good" | "fair" | "poor" {
  if (score >= 0.8) return "great";
  if (score >= 0.6) return "good";
  if (score >= 0.35) return "fair";
  return "poor";
}

function buildDetails(vr: VariantResult): string[] {
  const details: string[] = [];
  const { results } = vr;

  // Check .com
  const dotCom = results.find((r) => r.platform.includes(".com"));
  if (dotCom) {
    if (dotCom.status === "available") {
      details.push("✓ .com domain is available — this is a strong signal");
    } else if (dotCom.status === "taken") {
      details.push("✗ .com domain is taken — consider a variant or alternative TLD");
    }
  }

  // Social summary
  const social = results.filter((r) =>
    ["GitHub", "X / Twitter", "Instagram", "LinkedIn", "TikTok", "YouTube", "Reddit"].some(
      (s) => r.platform === s
    )
  );
  const socialAvailable = social.filter((r) => r.status === "available").length;
  const socialTotal = social.filter((r) => r.status !== "error").length;
  if (socialTotal > 0) {
    if (socialAvailable === socialTotal) {
      details.push(`✓ All ${socialTotal} social handles are available`);
    } else if (socialAvailable >= socialTotal * 0.7) {
      details.push(`◐ ${socialAvailable}/${socialTotal} social handles available — mostly clear`);
    } else {
      details.push(
        `✗ Only ${socialAvailable}/${socialTotal} social handles available — branding will be inconsistent`
      );
    }
  }

  // Package registries
  const packages = results.filter((r) =>
    ["npm", "PyPI", "crates.io", "RubyGems", "Go (pkg.go.dev)", "Homebrew", "Docker Hub"].some(
      (s) => r.platform === s
    )
  );
  const pkgAvailable = packages.filter((r) => r.status === "available").length;
  const pkgTotal = packages.filter((r) => r.status !== "error").length;
  if (pkgTotal > 0) {
    if (pkgAvailable === pkgTotal) {
      details.push(`✓ All ${pkgTotal} package registries are clear`);
    } else {
      details.push(`◐ ${pkgAvailable}/${pkgTotal} package registries available`);
    }
  }

  // Trademark
  const tm = results.find((r) => r.platform === "USPTO Trademark");
  if (tm) {
    if (tm.status === "available") {
      details.push("✓ No USPTO trademark conflicts found");
    } else if (tm.status === "taken") {
      details.push("⚠ Possible USPTO trademark conflict — consult a lawyer before proceeding");
    }
  }

  // Errors
  const errors = results.filter((r) => r.status === "error");
  if (errors.length > 0) {
    details.push(
      `⚠ ${errors.length} check(s) failed — results may be incomplete: ${errors.map((e) => e.platform).join(", ")}`
    );
  }

  return details;
}

function buildSummary(verdict: "great" | "good" | "fair" | "poor", vr: VariantResult): string {
  const name = vr.variant.name;
  switch (verdict) {
    case "great":
      return `"${name}" is widely available — grab it before someone else does.`;
    case "good":
      return `"${name}" looks good overall with minor conflicts. A solid choice.`;
    case "fair":
      return `"${name}" has some availability but notable gaps. Consider a variant.`;
    case "poor":
      return `"${name}" is largely taken. Try a different name or variant.`;
  }
}

export function generateRecommendation(
  variantResults: Array<{ variant: Variant; results: CheckResult[] }>
): Recommendation {
  const scored: VariantResult[] = variantResults.map((vr) => {
    const available = vr.results.filter((r) => r.status === "available").length;
    const taken = vr.results.filter((r) => r.status === "taken").length;
    const errors = vr.results.filter((r) => r.status === "error").length;
    return {
      ...vr,
      available,
      taken,
      errors,
      total: vr.results.length,
      score: scoreResults(vr.results),
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0]!;
  const verdict = getVerdict(best.score);
  const details = buildDetails(best);
  const summary = buildSummary(verdict, best);

  return { verdict, summary, details, best, all: scored };
}
