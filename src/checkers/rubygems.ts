import type { CheckResult } from "./types.js";

export async function checkRubyGems(name: string): Promise<CheckResult> {
  const url = `https://rubygems.org/api/v1/gems/${encodeURIComponent(name)}.json`;
  const gemUrl = `https://rubygems.org/gems/${name}`;
  const res = await fetch(url);

  if (res.status === 404) {
    return { platform: "RubyGems", status: "available", url: gemUrl };
  }
  return { platform: "RubyGems", status: "taken", url: gemUrl };
}
