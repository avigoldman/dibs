import type { CheckResult } from "./types.js";

export async function checkUSPTOTrademark(name: string): Promise<CheckResult> {
  const searchUrl = `https://tmsearch.uspto.gov/bin/gate.exe?f=searchss&state=4808:1.1.1&p_s_PARA1=${encodeURIComponent(name)}`;

  // Use the USPTO TSDR API to check for exact matches
  const res = await fetch(
    `https://tsdr.uspto.gov/caseinfo?query=${encodeURIComponent(name)}&type=default`,
    { redirect: "manual" }
  );

  if (res.status === 404 || res.status === 204) {
    return {
      platform: "USPTO Trademark",
      status: "available",
      url: searchUrl,
      message: "No exact match — do a manual search to be sure",
    };
  }

  return {
    platform: "USPTO Trademark",
    status: "taken",
    url: searchUrl,
    message: "Possible match — check manually",
  };
}
