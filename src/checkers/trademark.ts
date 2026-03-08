import type { CheckResult } from "./types";

export async function checkUSPTOTrademark(name: string): Promise<CheckResult> {
  const searchUrl = `https://tmsearch.uspto.gov/search/search-results?query=${encodeURIComponent(name)}&section=default`;

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
