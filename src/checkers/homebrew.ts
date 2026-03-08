import type { CheckResult } from "./types.js";

export async function checkHomebrew(name: string): Promise<CheckResult> {
  const url = `https://formulae.brew.sh/api/formula/${encodeURIComponent(name)}.json`;
  const formulaUrl = `https://formulae.brew.sh/formula/${name}`;
  const res = await fetch(url);

  if (res.status === 404) {
    return { platform: "Homebrew", status: "available", url: formulaUrl };
  }
  return { platform: "Homebrew", status: "taken", url: formulaUrl };
}
