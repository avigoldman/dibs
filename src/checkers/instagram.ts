import type { CheckResult } from "./types";
import { Client } from "@17secrets/usernames";

const client = new Client();

export async function checkInstagram(name: string): Promise<CheckResult> {
  const handle = name.replace(/[^a-zA-Z0-9_.]/g, "");
  const url = `https://www.instagram.com/${handle}/`;

  if (handle.length > 30) {
    return { platform: "Instagram", status: "error", message: "Handle must be ≤30 characters" };
  }

  const res = await client.instagram(handle);

  if (res.available === true) {
    return { platform: "Instagram", status: "available", url };
  }
  if (res.available === false) {
    return { platform: "Instagram", status: "taken", url };
  }
  return {
    platform: "Instagram",
    status: "error",
    url,
    message: res.message || "Could not determine",
  };
}
