import type { CheckResult } from "./types";

export async function checkUSPTOTrademark(name: string): Promise<CheckResult> {
  const searchUrl = `https://www.trademarkia.com/search/trademarks?query=${encodeURIComponent(name)}&country=us`;

  // USPTO and Trademarkia APIs are behind bot protection (WAF/Cloudflare).
  // We can't reliably check programmatically, so we provide the link
  // and mark as unknown for the user to verify manually.
  return {
    platform: "USPTO Trademark",
    status: "error",
    url: searchUrl,
    message: "Automated check unavailable — verify manually at the link above",
  };
}
