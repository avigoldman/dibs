import type { CheckResult } from "./types.js";

export async function checkReddit(name: string): Promise<CheckResult> {
  const sub = name.replace(/[^a-zA-Z0-9_]/g, "");
  const url = `https://www.reddit.com/r/${sub}`;

  if (sub.length < 3 || sub.length > 21) {
    return {
      platform: "Reddit",
      status: "error",
      message: "Subreddit name must be 3–21 characters",
    };
  }

  const res = await fetch(`${url}/about.json`, {
    redirect: "manual",
    headers: { "User-Agent": "Mozilla/5.0 (compatible; dibs-cli/1.0)" },
  });

  if (res.status === 404) {
    return { platform: "Reddit", status: "available", url };
  }
  return { platform: "Reddit", status: "taken", url };
}
