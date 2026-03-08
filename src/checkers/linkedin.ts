import type { CheckResult } from "./types.js";

export async function checkLinkedIn(name: string): Promise<CheckResult> {
  const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const url = `https://www.linkedin.com/company/${slug}`;

  const res = await fetch(url, {
    redirect: "manual",
    headers: { "User-Agent": "Mozilla/5.0 (compatible; dibs-cli/1.0)" },
  });

  if (res.status === 404) {
    return { platform: "LinkedIn", status: "available", url };
  }
  return { platform: "LinkedIn", status: "taken", url };
}
