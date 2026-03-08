import type { CheckResult } from "./types";

export async function checkTwitter(name: string): Promise<CheckResult> {
  const handle = name.replace(/[^a-zA-Z0-9_]/g, "");
  const url = `https://x.com/${handle}`;

  if (handle.length > 15) {
    return { platform: "X / Twitter", status: "error", message: "Handle must be ≤15 characters" };
  }

  const res = await fetch(url, {
    redirect: "manual",
    headers: { "User-Agent": "Mozilla/5.0 (compatible; dibs-cli/1.0)" },
  });

  if (res.status === 404) {
    return { platform: "X / Twitter", status: "available", url };
  }
  return { platform: "X / Twitter", status: "taken", url };
}
