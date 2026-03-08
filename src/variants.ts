export interface VariantPattern {
  id: string;
  label: string;
  apply: (name: string) => string;
}

export const PREFIX_PATTERNS: VariantPattern[] = [
  { id: "use", label: "use___", apply: (n) => `use${n}` },
  { id: "get", label: "get___", apply: (n) => `get${n}` },
  { id: "try", label: "try___", apply: (n) => `try${n}` },
  { id: "go", label: "go___", apply: (n) => `go${n}` },
  { id: "hey", label: "hey___", apply: (n) => `hey${n}` },
  { id: "my", label: "my___", apply: (n) => `my${n}` },
  { id: "the", label: "the___", apply: (n) => `the${n}` },
  { id: "with", label: "with___", apply: (n) => `with${n}` },
  { id: "on", label: "on___", apply: (n) => `on${n}` },
  { id: "by", label: "by___", apply: (n) => `by${n}` },
];

export const SUFFIX_PATTERNS: VariantPattern[] = [
  { id: "hq", label: "___hq", apply: (n) => `${n}hq` },
  { id: "app", label: "___app", apply: (n) => `${n}app` },
  { id: "dev", label: "___dev", apply: (n) => `${n}dev` },
  { id: "io", label: "___io", apply: (n) => `${n}io` },
  { id: "labs", label: "___labs", apply: (n) => `${n}labs` },
  { id: "so", label: "___so", apply: (n) => `${n}so` },
  { id: "inc", label: "___inc", apply: (n) => `${n}inc` },
  { id: "co", label: "___co", apply: (n) => `${n}co` },
  { id: "team", label: "___team", apply: (n) => `${n}team` },
  { id: "run", label: "___run", apply: (n) => `${n}run` },
  { id: "now", label: "___now", apply: (n) => `${n}now` },
  { id: "ai", label: "___ai", apply: (n) => `${n}ai` },
  { id: "sh", label: "___sh", apply: (n) => `${n}sh` },
  { id: "cli", label: "___cli", apply: (n) => `${n}cli` },
  { id: "api", label: "___api", apply: (n) => `${n}api` },
  { id: "js", label: "___js", apply: (n) => `${n}js` },
];

export const ALL_PATTERNS = [...PREFIX_PATTERNS, ...SUFFIX_PATTERNS];

export interface Variant {
  name: string;
  pattern: VariantPattern | null; // null = bare name
}

export function cleanName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export function generateVariants(baseName: string, patternIds?: string[]): Variant[] {
  const clean = cleanName(baseName);

  // Always include the bare name first
  const variants: Variant[] = [{ name: clean, pattern: null }];

  const patterns = patternIds
    ? ALL_PATTERNS.filter((p) => patternIds.includes(p.id))
    : ALL_PATTERNS;

  for (const pattern of patterns) {
    const variant = pattern.apply(clean);
    if (variant !== clean) {
      variants.push({ name: variant, pattern });
    }
  }

  return variants;
}
