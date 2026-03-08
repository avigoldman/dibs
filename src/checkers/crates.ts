import type { CheckResult } from "./types.js";

export async function checkCratesIO(name: string): Promise<CheckResult> {
  const url = `https://crates.io/api/v1/crates/${encodeURIComponent(name)}`;
  const crateUrl = `https://crates.io/crates/${name}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "dibs-cli (https://github.com/dibs-cli)",
    },
  });

  if (res.status === 404) {
    return { platform: "crates.io", status: "available", url: crateUrl };
  }
  return { platform: "crates.io", status: "taken", url: crateUrl };
}
