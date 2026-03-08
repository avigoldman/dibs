import type { CheckResult } from "./types.js";
import { whoisDomain, firstResult } from "whoiser";

export const DEFAULT_TLDS = [".com", ".dev", ".io", ".ai", ".co", ".app"];

export const ALL_TLDS = [
  ".com", ".dev", ".io", ".ai", ".co", ".app",
  ".org", ".net", ".sh", ".so", ".run", ".to",
  ".me", ".cc", ".xyz", ".tech", ".tools",
  ".design", ".studio", ".inc",
];

function isDomainAvailable(whoisData: Record<string, unknown>): boolean {
  const text = whoisData["text"];
  if (Array.isArray(text)) {
    const joined = text.join(" ").toLowerCase();
    if (
      joined.includes("no match") ||
      joined.includes("not found") ||
      joined.includes("no data found") ||
      joined.includes("no entries found") ||
      joined.includes("domain not found") ||
      joined.includes("is available")
    ) {
      return true;
    }
  }

  const domainName = whoisData["Domain Name"];
  if (!domainName) return true;

  return false;
}

export async function checkDomain(
  name: string,
  tld: string
): Promise<CheckResult> {
  const t = tld.startsWith(".") ? tld : `.${tld}`;
  const clean = name.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const domain = `${clean}${t}`;
  const url = `https://${domain}`;

  const raw = await whoisDomain(domain, { timeout: 8000, follow: 1 });
  const data = firstResult(raw);

  if (isDomainAvailable(data)) {
    return { platform: `Domain ${domain}`, status: "available", url };
  }
  return { platform: `Domain ${domain}`, status: "taken", url };
}

export async function checkDomains(
  name: string,
  tlds: string[] = DEFAULT_TLDS
): Promise<CheckResult[]> {
  return Promise.all(tlds.map((tld) => checkDomain(name, tld)));
}
