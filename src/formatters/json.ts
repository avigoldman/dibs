import type { Recommendation } from "../recommend";

export function formatJSON(rec: Recommendation): string {
  const output = {
    recommendation: {
      verdict: rec.verdict,
      summary: rec.summary,
      details: rec.details,
    },
    best: {
      name: rec.best.variant.name,
      pattern: rec.best.variant.pattern?.label ?? "bare",
      score: Math.round(rec.best.score * 100),
      available: rec.best.available,
      taken: rec.best.taken,
      errors: rec.best.errors,
      total: rec.best.total,
      results: rec.best.results.map((r) => ({
        platform: r.platform,
        status: r.status,
        url: r.url ?? null,
        message: r.message ?? null,
      })),
    },
    variants: rec.all.map((vr) => ({
      name: vr.variant.name,
      pattern: vr.variant.pattern?.label ?? "bare",
      score: Math.round(vr.score * 100),
      available: vr.available,
      taken: vr.taken,
      errors: vr.errors,
      total: vr.total,
    })),
  };

  return JSON.stringify(output, null, 2);
}
