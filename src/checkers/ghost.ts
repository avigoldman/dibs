import type { CheckResult } from "./types";

export async function checkGhost(name: string): Promise<CheckResult> {
  const url = `https://${name}.ghost.io`;
  const res = await fetch(url, { method: "HEAD", redirect: "manual" });

  return {
    platform: "Ghost",
    status: res.status === 404 ? "available" : "taken",
    url,
  };
}
