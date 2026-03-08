import type { CheckResult } from "./types.js";
import { Client } from "@17secrets/usernames";

const client = new Client();

export async function checkGitHub(name: string): Promise<CheckResult> {
  const url = `https://github.com/${encodeURIComponent(name)}`;
  const res = await client.github(name);

  if (res.available === true) {
    return { platform: "GitHub", status: "available", url };
  }
  if (res.available === false) {
    return { platform: "GitHub", status: "taken", url };
  }
  return { platform: "GitHub", status: "error", url, message: res.message || "Could not determine" };
}
