export type { CheckResult, CheckStatus } from "./types.js";
export { DEFAULT_TLDS, getAllTlds, isValidTld } from "./domain.js";

import type { CheckResult } from "./types.js";
import { checkNpm } from "./npm.js";
import { checkGitHub } from "./github.js";
import { checkDomains, DEFAULT_TLDS } from "./domain.js";
import { checkTwitter } from "./twitter.js";
import { checkInstagram } from "./instagram.js";
import { checkUSPTOTrademark } from "./trademark.js";
import { checkPyPI } from "./pypi.js";
import { checkCratesIO } from "./crates.js";
import { checkHomebrew } from "./homebrew.js";
import { checkLinkedIn } from "./linkedin.js";
import { checkTikTok } from "./tiktok.js";
import { checkYouTube } from "./youtube.js";
import { checkReddit } from "./reddit.js";
import { checkDockerHub } from "./dockerhub.js";
import { checkGoPkg } from "./go.js";
import { checkRubyGems } from "./rubygems.js";

export interface CheckerDef {
  id: string;
  label: string;
  category: "domain" | "social" | "package" | "legal";
  run: (name: string) => Promise<CheckResult | CheckResult[]>;
}

/**
 * Wraps a checker so thrown errors become graceful { status: "error" } results.
 */
function safe(
  platform: string,
  fn: (name: string) => Promise<CheckResult | CheckResult[]>
): (name: string) => Promise<CheckResult | CheckResult[]> {
  return async (name) => {
    try {
      const result = await fn(name);
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return { platform, status: "error", message };
    }
  };
}

// Non-domain checkers
export const PLATFORM_CHECKERS: CheckerDef[] = [
  // Social
  { id: "github", label: "GitHub", category: "social", run: safe("GitHub", checkGitHub) },
  {
    id: "twitter",
    label: "X / Twitter",
    category: "social",
    run: safe("X / Twitter", checkTwitter),
  },
  {
    id: "instagram",
    label: "Instagram",
    category: "social",
    run: safe("Instagram", checkInstagram),
  },
  { id: "linkedin", label: "LinkedIn", category: "social", run: safe("LinkedIn", checkLinkedIn) },
  { id: "tiktok", label: "TikTok", category: "social", run: safe("TikTok", checkTikTok) },
  { id: "youtube", label: "YouTube", category: "social", run: safe("YouTube", checkYouTube) },
  { id: "reddit", label: "Reddit", category: "social", run: safe("Reddit", checkReddit) },

  // Package registries
  { id: "npm", label: "npm", category: "package", run: safe("npm", checkNpm) },
  { id: "pypi", label: "PyPI", category: "package", run: safe("PyPI", checkPyPI) },
  { id: "crates", label: "crates.io", category: "package", run: safe("crates.io", checkCratesIO) },
  { id: "rubygems", label: "RubyGems", category: "package", run: safe("RubyGems", checkRubyGems) },
  {
    id: "go",
    label: "Go (pkg.go.dev)",
    category: "package",
    run: safe("Go (pkg.go.dev)", checkGoPkg),
  },
  { id: "homebrew", label: "Homebrew", category: "package", run: safe("Homebrew", checkHomebrew) },
  {
    id: "dockerhub",
    label: "Docker Hub",
    category: "package",
    run: safe("Docker Hub", checkDockerHub),
  },

  // Legal
  {
    id: "trademark",
    label: "USPTO Trademark",
    category: "legal",
    run: safe("USPTO Trademark", checkUSPTOTrademark),
  },
];

export const ALL_CHECKER_IDS = ["domain", ...PLATFORM_CHECKERS.map((c) => c.id)];

export interface RunOptions {
  checkerIds?: string[];
  tlds?: string[];
}

export async function runCheckers(name: string, opts: RunOptions = {}): Promise<CheckResult[]> {
  const { checkerIds, tlds } = opts;
  const promises: Promise<CheckResult | CheckResult[]>[] = [];

  // Domain checks
  if (!checkerIds || checkerIds.includes("domain")) {
    const domainCheck = async (): Promise<CheckResult[]> => {
      try {
        return await checkDomains(name, tlds ?? DEFAULT_TLDS);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return [{ platform: "Domains", status: "error", message }];
      }
    };
    promises.push(domainCheck());
  }

  // Platform checks
  const platforms = checkerIds
    ? PLATFORM_CHECKERS.filter((c) => checkerIds.includes(c.id))
    : PLATFORM_CHECKERS;

  for (const checker of platforms) {
    promises.push(checker.run(name));
  }

  const results = await Promise.all(promises);
  return results.flat();
}
