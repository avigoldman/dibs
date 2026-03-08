import pc from "picocolors";
import type { Recommendation, VariantResult } from "../recommend.js";

const VERDICT_COLORS: Record<string, (s: string) => string> = {
  great: pc.green,
  good: pc.green,
  fair: pc.yellow,
  poor: pc.red,
};

const VERDICT_LABELS: Record<string, string> = {
  great: "🎉 GREAT",
  good: "👍 GOOD",
  fair: "🤔 FAIR",
  poor: "👎 POOR",
};

const STATUS_ICONS: Record<string, string> = {
  available: pc.green("✔"),
  taken: pc.red("✘"),
  error: pc.yellow("⚠"),
};

function renderBar(value: number, max: number, width = 20): string {
  const filled = max > 0 ? Math.round((value / max) * width) : 0;
  const empty = width - filled;
  const pct = max > 0 ? value / max : 0;
  const color = pct >= 0.7 ? pc.green : pct >= 0.4 ? pc.yellow : pc.red;
  return color("█".repeat(filled)) + pc.dim("░".repeat(empty));
}

export function formatPretty(rec: Recommendation): string {
  const lines: string[] = [];
  const { best, all } = rec;
  const color = VERDICT_COLORS[rec.verdict] ?? pc.white;
  const verdictLabel = VERDICT_LABELS[rec.verdict] ?? rec.verdict;

  // ── Header ──
  lines.push("");
  lines.push(pc.bold(color(`  ${verdictLabel}: ${rec.summary}`)));
  lines.push("");

  // ── Recommendation details ──
  for (const detail of rec.details) {
    lines.push(`  ${detail}`);
  }
  lines.push("");

  // ── Variant summary (if more than 1) ──
  if (all.length > 1) {
    lines.push(pc.bold("  Variant Ranking"));
    lines.push(pc.dim("  ─".repeat(30)));

    for (const vr of all) {
      const pct = Math.round(vr.score * 100);
      const bar = renderBar(vr.score, 1, 16);
      const c = vr.score >= 0.7 ? pc.green : vr.score >= 0.4 ? pc.yellow : pc.red;
      const label = vr.variant.name.padEnd(24);
      const tag = vr.variant.pattern ? pc.dim(` ← ${vr.variant.pattern.label}`) : pc.dim(" ← bare");

      lines.push(`  ${c(label)} ${bar} ${c(`${pct}%`.padStart(4))}${tag}`);
    }
    lines.push("");
  }

  // ── Detailed results for the best variant ──
  lines.push(
    pc.bold(`  Results for ${pc.cyan(best.variant.name)}`) +
      (all.length > 1 ? pc.dim(" (best)") : "")
  );
  lines.push(pc.dim("  ─".repeat(30)));

  // Group by category
  const groups = groupResults(best);

  for (const [category, results] of groups) {
    lines.push(`  ${pc.bold(pc.underline(category))}`);
    for (const r of results) {
      const icon = STATUS_ICONS[r.status] ?? "?";
      const label = r.platform;
      const url = r.url ? pc.dim(` → ${r.url}`) : "";
      const msg = r.message ? pc.dim(` (${r.message})`) : "";
      lines.push(`    ${icon} ${label}${url}${msg}`);
    }
    lines.push("");
  }

  // ── Score summary ──
  const scorePct = Math.round(best.score * 100);
  lines.push(
    `  ${color(`${best.available} available`)}  ${pc.red(`${best.taken} taken`)}  ${pc.yellow(`${best.errors} errors`)}  ${pc.dim(`(score: ${scorePct}%)`)}`
  );
  lines.push("");

  return lines.join("\n");
}

function groupResults(vr: VariantResult): [string, VariantResult["results"]][] {
  const categories: Record<string, typeof vr.results> = {
    Domains: [],
    Social: [],
    "Package Registries": [],
    Legal: [],
  };

  for (const r of vr.results) {
    if (r.platform.startsWith("Domain ")) {
      categories["Domains"]!.push(r);
    } else if (
      ["GitHub", "X / Twitter", "Instagram", "LinkedIn", "TikTok", "YouTube", "Reddit"].includes(
        r.platform
      )
    ) {
      categories["Social"]!.push(r);
    } else if (r.platform.includes("Trademark")) {
      categories["Legal"]!.push(r);
    } else {
      categories["Package Registries"]!.push(r);
    }
  }

  return Object.entries(categories).filter(([, results]) => results.length > 0);
}
