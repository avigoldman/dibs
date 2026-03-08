import { isValidTld } from "./checkers/domain";

export interface DomainInput {
  /** The base name without TLD (e.g. "customer" from "customer.io") */
  baseName: string;
  /** The detected TLD if input was a domain (e.g. ".io") */
  detectedTld: string | null;
  /** Whether the input was a domain */
  isDomain: boolean;
}

/**
 * Parse input to detect if it's a domain.
 * e.g. "customer.io" → { baseName: "customer", detectedTld: ".io", isDomain: true }
 * e.g. "acme" → { baseName: "acme", detectedTld: null, isDomain: false }
 */
export function parseDomainInput(input: string): DomainInput {
  const dotIndex = input.lastIndexOf(".");
  if (dotIndex > 0) {
    const possibleTld = input.slice(dotIndex);
    if (isValidTld(possibleTld)) {
      return {
        baseName: input.slice(0, dotIndex),
        detectedTld: possibleTld,
        isDomain: true,
      };
    }
  }
  return { baseName: input, detectedTld: null, isDomain: false };
}

/**
 * For non-.com domains, the brand name includes the TLD.
 * e.g. "customer" + ".io" → "customerio"
 * e.g. "example" + ".com" → "example"
 */
export function brandName(baseName: string, detectedTld: string | null): string {
  if (!detectedTld || detectedTld === ".com") return baseName;
  return baseName + detectedTld.slice(1); // strip the dot
}

export interface PlatformNames {
  /** No separator: "customerio" */
  joined: string;
  /** Hyphen separator: "customer-io" */
  hyphenated: string;
  /** Underscore separator: "customer_io" */
  underscored: string;
  /** The base name without TLD: "customer" */
  base: string;
}

/**
 * Generate platform-appropriate name variants for a domain input.
 * For .com or non-domain input, all formats are the same base name.
 */
export function platformNames(baseName: string, detectedTld: string | null): PlatformNames {
  if (!detectedTld || detectedTld === ".com") {
    return {
      joined: baseName,
      hyphenated: baseName,
      underscored: baseName,
      base: baseName,
    };
  }

  const tldPart = detectedTld.slice(1);
  return {
    joined: baseName + tldPart,
    hyphenated: `${baseName}-${tldPart}`,
    underscored: `${baseName}_${tldPart}`,
    base: baseName,
  };
}
