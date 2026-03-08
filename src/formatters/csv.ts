import type { Recommendation } from "../recommend.js";

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function formatCSV(rec: Recommendation): string {
  const lines: string[] = [];

  lines.push("variant,pattern,platform,status,url,message");

  for (const vr of rec.all) {
    for (const r of vr.results) {
      lines.push(
        [
          escapeCSV(vr.variant.name),
          escapeCSV(vr.variant.pattern?.label ?? "bare"),
          escapeCSV(r.platform),
          r.status,
          escapeCSV(r.url ?? ""),
          escapeCSV(r.message ?? ""),
        ].join(",")
      );
    }
  }

  return lines.join("\n");
}
