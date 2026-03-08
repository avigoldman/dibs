import type { CheckResult } from "./types";
import { whoisDomain, firstResult } from "whoiser";
import { TLDs } from "global-tld-list";

export const DEFAULT_TLDS = [".com", ".dev", ".io", ".ai", ".co", ".app"];

/**
 * All valid TLDs from the IANA registry via global-tld-list.
 * Use TLDs.isValid(tld) to check if a TLD is real.
 */
export function getAllTlds(): string[] {
  return [...TLDs.tlds.keys()].map((t) => `.${t}`);
}

/**
 * Validate that a TLD string is a real, registered TLD.
 */
export function isValidTld(tld: string): boolean {
  const clean = tld.startsWith(".") ? tld.slice(1) : tld;
  return TLDs.isValid(clean.toLowerCase());
}

type DomainStatus = "available" | "taken" | "error";

function isDomainAvailable(whoisData: Record<string, unknown>): DomainStatus {
  // If the WHOIS lookup returned an error, we can't determine availability
  if (whoisData["error"]) return "error";

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
      return "available";
    }
  }

  const domainName = whoisData["Domain Name"];
  if (domainName) return "taken";

  // No error, no domain name, no recognizable text — inconclusive
  return "error";
}

export async function checkDomain(name: string, tld: string): Promise<CheckResult> {
  const t = tld.startsWith(".") ? tld : `.${tld}`;
  const clean = name.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const domain = `${clean}${t}`;
  const url = `https://${domain}`;

  const raw = await whoisDomain(domain, { timeout: 8000, follow: 1 });
  const data = firstResult(raw);
  const status = isDomainAvailable(data);

  if (status === "error") {
    return {
      platform: `Domain ${domain}`,
      status: "error",
      url,
      message: (data["error"] as string) || "WHOIS lookup inconclusive",
    };
  }

  return { platform: `Domain ${domain}`, status, url };
}

export async function checkDomains(
  name: string,
  tlds: string[] = DEFAULT_TLDS
): Promise<CheckResult[]> {
  return Promise.all(tlds.map((tld) => checkDomain(name, tld)));
}
