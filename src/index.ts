#!/usr/bin/env node

import { createRequire } from "node:module";
import { defineCommand, runMain } from "citty";
import * as p from "@clack/prompts";
import pc from "picocolors";

import Conf from "conf";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

interface SavedConfig {
  platforms?: string[];
  tlds?: string[];
  variants?: boolean;
  variantPatterns?: string[];
}

const config = new Conf<SavedConfig>({
  projectName: "calldibs",
  defaults: {},
});
import {
  ALL_CHECKER_IDS,
  DEFAULT_TLDS,
  isValidTld,
  PLATFORM_CHECKERS,
  runCheckers,
  type RunOptions,
} from "./checkers/index";
import {
  ALL_PATTERNS,
  PREFIX_PATTERNS,
  SUFFIX_PATTERNS,
  cleanName,
  generateVariants,
  type Variant,
} from "./variants";
import { generateRecommendation } from "./recommend";
import {
  formatJSON,
  formatCSV,
  formatPretty,
  OUTPUT_FORMATS,
  type OutputFormat,
} from "./formatters/index";

function cancelAndExit(): never {
  p.cancel("Cancelled.");
  process.exit(0);
}

function guard<T>(value: T | symbol): T {
  if (p.isCancel(value)) cancelAndExit();
  return value;
}

const DESCRIPTION = `dibs checks whether a name is available for use as a business, product, or
project name. It queries real services to determine availability across domains,
social media handles, package registries, and US trademarks.

WHAT IT DOES:
  Given a name like "acme", dibs will:
  1. Check the exact name AND generated variants (e.g. "useacme", "acmehq")
     across all platforms simultaneously
  2. Return the availability status of each: "available", "taken", or "error"
  3. Score each variant using weighted importance (.com domain and trademarks
     matter most, social handles matter moderately, package registries less)
  4. Recommend the best variant with a verdict: great/good/fair/poor

PLATFORMS CHECKED (--only/-o to filter):
  domain      Domains via WHOIS lookup (default TLDs: .com, .dev, .io, .ai, .co, .app)
  github      GitHub username/org
  twitter     X / Twitter handle (max 15 chars)
  instagram   Instagram handle (max 30 chars)
  linkedin    LinkedIn company page
  tiktok      TikTok handle (max 24 chars)
  youtube     YouTube channel handle
  reddit      Subreddit name (3-21 chars)
  npm         npm package
  pypi        Python Package Index
  crates      Rust crates.io
  rubygems    RubyGems
  go          Go packages on pkg.go.dev
  homebrew    Homebrew formula
  dockerhub   Docker Hub image/org
  trademark   USPTO trademark search (best-effort, verify manually)

VARIANT PATTERNS (off by default):
  Use --variants/-v to also check alternate versions of the name.
  Pass "all" to try every pattern, or a comma-separated list to pick specific ones.
  Prefixes: use, get, try, go, hey, my, the, with, on, by
  Suffixes: hq, app, dev, io, labs, so, inc, co, team, run, now, ai, sh, cli, api, js
  Example: name "acme" with -v all generates "useacme", "acmehq", "acmedev", etc.

TLDs (--tlds/-t to override):
  Default: com, dev, io, ai, co, app
  Any valid IANA TLD is supported (1400+). Pass any TLD and it will be validated.

OUTPUT FORMATS (--format/-f):
  pretty    Human-readable report with colors, bars, and icons (default)
  json      Machine-readable JSON with recommendation, best variant, all results,
            and per-variant scores. Ideal for piping to jq or other tools.
  csv       One row per platform per variant. Header: variant,pattern,platform,
            status,url,message. Ideal for spreadsheets.

INTERPRETING RESULTS:
  - Score is 0-100% based on weighted availability (not a simple percentage)
  - .com domain availability is weighted 15x, trademark 12x, Twitter 8x,
    Instagram/LinkedIn 7x, GitHub 6x, while package registries are 2-3x
  - "error" means the check failed (rate limit, timeout, etc.) — it does NOT
    count against the score, but the result may be incomplete
  - Verdict thresholds: great (>=80%), good (>=60%), fair (>=35%), poor (<35%)

EXAMPLES:
  dibs acme                        Check "acme" on all platforms
  dibs acme -v all                 Check "acme" + all variant patterns
  dibs acme -v hq,use              Check "acme", "acmehq", and "useacme"
  dibs acme -o github,npm,domain   Only check GitHub, npm, and domains
  dibs acme -o domain -t com,ai    Check only .com and .ai domains
  dibs acme -f json                Full results as JSON
  dibs acme -f json | jq '.best'   Extract best variant with jq
  dibs acme -f csv > report.csv    Export full report as CSV
  dibs                             Interactive mode — prompts for everything

NON-INTERACTIVE USE (for scripts and LLMs):
  Always pass the name as a positional argument. Use --format json for
  structured output. By default only the exact name is checked — add -v all
  to also check variants. All errors are caught gracefully — the command
  always exits 0 with results unless given invalid arguments.`;

const main = defineCommand({
  meta: {
    name: "dibs",
    version,
    description: DESCRIPTION,
  },
  args: {
    name: {
      type: "positional",
      description: "The name to check",
      required: false,
    },
    only: {
      type: "string",
      description: `Platforms to check, comma-separated (${ALL_CHECKER_IDS.join(", ")})`,
      alias: "o",
    },
    tlds: {
      type: "string",
      description: `TLDs to check, comma-separated (default: ${DEFAULT_TLDS.map((t) => t.replace(".", "")).join(",")}). Any valid IANA TLD is supported (1400+).`,
      alias: "t",
    },
    variants: {
      type: "string",
      description: `Enable variant checking. Use "all" for every pattern, or a comma-separated list (prefixes: ${PREFIX_PATTERNS.map((p) => p.id).join(",")} | suffixes: ${SUFFIX_PATTERNS.map((p) => p.id).join(",")})`,
      alias: "v",
    },
    format: {
      type: "string",
      description: `Output format: ${OUTPUT_FORMATS.join(", ")} (default: pretty)`,
      alias: "f",
      default: "pretty",
    },
  },
  async run({ args }) {
    const format = args.format as OutputFormat;
    if (!OUTPUT_FORMATS.includes(format)) {
      console.error(`Unknown format "${format}". Choose from: ${OUTPUT_FORMATS.join(", ")}`);
      process.exit(1);
    }

    const isMachine = format !== "pretty";
    const isInteractive = !args.name && !isMachine;

    if (!isMachine) {
      p.intro(pc.bgCyan(pc.black(" dibs ")));
    }

    // ── 1. Name ──────────────────────────────────────────────
    let name = args.name;
    if (!name) {
      if (!isInteractive) {
        console.error(
          "Error: name is required in non-interactive mode. Pass it as a positional argument."
        );
        process.exit(1);
      }
      name = guard(
        await p.text({
          message: "What name do you want to check?",
          placeholder: "my-cool-project",
          validate: (v) => {
            if (!v?.trim()) return "Please enter a name";
          },
        })
      );
    }

    // ── 1b. Detect domain input (e.g. "example.com", "open.ai") ──
    let detectedTld: string | null = null;
    const dotIndex = name.lastIndexOf(".");
    if (dotIndex > 0) {
      const possibleTld = name.slice(dotIndex); // e.g. ".com"
      if (isValidTld(possibleTld)) {
        detectedTld = possibleTld;
        name = name.slice(0, dotIndex); // strip TLD from name
        if (!isMachine) {
          p.log.info(
            `Detected domain input — checking "${name}" and ensuring ${detectedTld} is included`
          );
        }
      }
    }

    // ── 2. Platforms ─────────────────────────────────────────
    let checkerIds: string[] | undefined;
    if (args.only) {
      checkerIds = args.only.split(",").map((s) => s.trim());
      const valid = new Set(ALL_CHECKER_IDS);
      const invalid = checkerIds.filter((id) => !valid.has(id));
      if (invalid.length) {
        const msg = `Unknown platform(s): ${invalid.join(", ")}. Available: ${ALL_CHECKER_IDS.join(", ")}`;
        if (isMachine) {
          console.error(msg);
          process.exit(1);
        }
        p.log.error(msg);
        process.exit(1);
      }
    } else if (isInteractive) {
      const allPlatformIds = ["domain", ...PLATFORM_CHECKERS.map((c) => c.id)];
      const savedPlatforms = config.get("platforms");
      const selected = guard(
        await p.multiselect({
          message: "Which platforms to check?",
          options: [
            { value: "domain", label: "Domains", hint: "domain" },
            ...PLATFORM_CHECKERS.map((c) => ({
              value: c.id,
              label: c.label,
              hint: c.category,
            })),
          ],
          initialValues: savedPlatforms ?? allPlatformIds,
        })
      );
      config.set("platforms", selected);
      if (selected.length < allPlatformIds.length) {
        checkerIds = selected;
      }
    }

    // ── 3. TLDs ──────────────────────────────────────────────
    const wantsDomains = !checkerIds || checkerIds.includes("domain");
    let tlds: string[] | undefined;

    if (args.tlds) {
      tlds = args.tlds.split(",").map((s) => {
        const t = s.trim();
        return t.startsWith(".") ? t : `.${t}`;
      });
      const invalid = tlds.filter((t) => !isValidTld(t));
      if (invalid.length) {
        const msg = `Unknown TLD(s): ${invalid.join(", ")}. Use any valid IANA TLD (e.g. com, dev, io, ai, co, app, org, net, xyz, ...)`;
        if (isMachine) {
          console.error(msg);
          process.exit(1);
        }
        p.log.error(msg);
        process.exit(1);
      }
    } else if (isInteractive && wantsDomains) {
      const POPULAR_TLDS = [
        ".com",
        ".dev",
        ".io",
        ".ai",
        ".co",
        ".app",
        ".org",
        ".net",
        ".sh",
        ".so",
        ".run",
        ".to",
        ".me",
        ".cc",
        ".xyz",
        ".tech",
        ".tools",
        ".design",
        ".studio",
        ".inc",
      ];
      const savedTlds = config.get("tlds");
      const selected = guard(
        await p.multiselect({
          message: "Which TLDs to check?",
          options: POPULAR_TLDS.map((tld) => ({ value: tld, label: tld })),
          initialValues: savedTlds ?? DEFAULT_TLDS,
        })
      );
      config.set("tlds", selected);
      tlds = selected;
    }

    // Ensure detected TLD is always included
    if (detectedTld && wantsDomains) {
      if (!tlds) {
        tlds = [...DEFAULT_TLDS];
      }
      if (!tlds.includes(detectedTld)) {
        tlds.unshift(detectedTld);
      }
    }

    // ── 4. Variants ──────────────────────────────────────────
    let variants: Variant[];

    if (args.variants) {
      const raw = args.variants.trim();
      if (raw === "all") {
        variants = generateVariants(name);
      } else {
        const patternIds = raw.split(",").map((s) => s.trim());
        const valid = new Set(ALL_PATTERNS.map((p) => p.id));
        const invalid = patternIds.filter((id) => !valid.has(id));
        if (invalid.length) {
          const msg = `Unknown variant(s): ${invalid.join(", ")}. Available: all, ${ALL_PATTERNS.map((p) => p.id).join(", ")}`;
          if (isMachine) {
            console.error(msg);
            process.exit(1);
          }
          p.log.error(msg);
          process.exit(1);
        }
        variants = generateVariants(name, patternIds);
      }
    } else if (isInteractive) {
      const savedWantVariants = config.get("variants") ?? false;
      const wantVariants = guard(
        await p.confirm({
          message: "Check alternate versions too? (e.g. useName, nameHQ)",
          initialValue: savedWantVariants,
        })
      );
      config.set("variants", wantVariants);

      if (wantVariants) {
        const allPatternIds = ALL_PATTERNS.map((pat) => pat.id);
        const savedPatterns = config.get("variantPatterns");
        const selected = guard(
          await p.multiselect({
            message: "Which variant patterns?",
            options: [
              ...PREFIX_PATTERNS.map((pat) => ({
                value: pat.id,
                label: pat.label.replace("___", name),
                hint: "prefix",
              })),
              ...SUFFIX_PATTERNS.map((pat) => ({
                value: pat.id,
                label: pat.label.replace("___", name),
                hint: "suffix",
              })),
            ],
            initialValues: savedPatterns ?? allPatternIds,
          })
        );
        config.set("variantPatterns", selected);
        const patternIds = selected.length < allPatternIds.length ? selected : undefined;
        variants = generateVariants(name, patternIds);
      } else {
        variants = [{ name: cleanName(name), pattern: null }];
      }
    } else {
      // Non-interactive default: exact name only
      variants = [{ name: cleanName(name), pattern: null }];
    }

    // ── 5. Run checks ────────────────────────────────────────
    const runOpts: RunOptions = { checkerIds, tlds };
    const platformCount = checkerIds ? checkerIds.length : ALL_CHECKER_IDS.length;

    let spinner: ReturnType<typeof p.spinner> | undefined;
    if (!isMachine) {
      spinner = p.spinner();
      spinner.start(
        `Checking ${variants.length} variant${variants.length === 1 ? "" : "s"} across ${platformCount} platform${platformCount === 1 ? "" : "s"}...`
      );
    }

    const variantResults = await Promise.all(
      variants.map(async (variant) => {
        const results = await runCheckers(variant.name, runOpts);
        return { variant, results };
      })
    );

    if (spinner) {
      spinner.stop(`Checked ${variants.length} variant${variants.length === 1 ? "" : "s"}`);
    }

    // ── 6. Generate recommendation ───────────────────────────
    const rec = generateRecommendation(variantResults);

    // ── 7. Output ────────────────────────────────────────────
    switch (format) {
      case "json":
        console.log(formatJSON(rec));
        break;
      case "csv":
        console.log(formatCSV(rec));
        break;
      case "pretty":
        console.log(formatPretty(rec));
        p.outro(
          (VERDICT_COLORS[rec.verdict] ?? pc.white)(`${rec.best.variant.name} — ${rec.summary}`)
        );
        break;
    }
  },
});

const VERDICT_COLORS: Record<string, (s: string) => string> = {
  great: pc.green,
  good: pc.green,
  fair: pc.yellow,
  poor: pc.red,
};

runMain(main);
