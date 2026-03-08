import type { CheckResult } from "./types.js";
import { Client } from "@17secrets/usernames";

const client = new Client();

export async function checkTikTok(name: string): Promise<CheckResult> {
  const handle = name.replace(/[^a-zA-Z0-9_.]/g, "");
  const url = `https://www.tiktok.com/@${handle}`;

  if (handle.length > 24) {
    return { platform: "TikTok", status: "error", message: "Handle must be ≤24 characters" };
  }

  const res = await client.tiktok(handle);

  if (res.available === true) {
    return { platform: "TikTok", status: "available", url };
  }
  if (res.available === false) {
    return { platform: "TikTok", status: "taken", url };
  }
  return {
    platform: "TikTok",
    status: "error",
    url,
    message: res.message || "Could not determine",
  };
}
