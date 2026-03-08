import type { CheckResult } from "./types.js";
import { Client } from "@17secrets/usernames";

const client = new Client();

export async function checkYouTube(name: string): Promise<CheckResult> {
  const handle = name.replace(/[^a-zA-Z0-9_.-]/g, "");
  const url = `https://www.youtube.com/@${handle}`;

  const res = await client.youtube(handle);

  if (res.available === true) {
    return { platform: "YouTube", status: "available", url };
  }
  if (res.available === false) {
    return { platform: "YouTube", status: "taken", url };
  }
  return {
    platform: "YouTube",
    status: "error",
    url,
    message: res.message || "Could not determine",
  };
}
