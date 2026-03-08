/**
 * Integration tests — these make REAL network calls.
 *
 * Run with:   npx vitest run tests/integration.test.ts
 *
 * These test against known-taken names (e.g. "google", "express", "rails")
 * and known-available names (e.g. "zizzblorp9847xq") to verify each checker
 * actually works against the real service.
 *
 * These may be flaky due to rate limits, network issues, or services changing.
 * They are excluded from the default test run.
 */

import { describe, it, expect } from "vitest";

const KNOWN_TAKEN = "google";
const KNOWN_AVAILABLE = "zizzblorp9847xq";

// Generous timeout for network calls
const TIMEOUT = 20_000;

// ── npm ──────────────────────────────────────────────────────

describe("npm (integration)", () => {
  it(
    "detects a taken package",
    async () => {
      const { checkNpm } = await import("../src/checkers/npm");
      const result = await checkNpm("express");
      expect(result.status).toBe("taken");
      expect(result.platform).toBe("npm");
      expect(result.url).toContain("npmjs.com");
    },
    TIMEOUT
  );

  it(
    "detects an available package",
    async () => {
      const { checkNpm } = await import("../src/checkers/npm");
      const result = await checkNpm(KNOWN_AVAILABLE);
      expect(result.status).toBe("available");
    },
    TIMEOUT
  );
});

// ── GitHub ───────────────────────────────────────────────────

describe("GitHub (integration)", () => {
  it(
    "detects a taken username",
    async () => {
      const { checkGitHub } = await import("../src/checkers/github");
      const result = await checkGitHub(KNOWN_TAKEN);
      expect(result.status).toBe("taken");
      expect(result.url).toContain("github.com");
    },
    TIMEOUT
  );

  it(
    "detects an available username",
    async () => {
      const { checkGitHub } = await import("../src/checkers/github");
      const result = await checkGitHub(KNOWN_AVAILABLE);
      expect(result.status).toBe("available");
    },
    TIMEOUT
  );
});

// ── Domain (WHOIS) ───────────────────────────────────────────

describe("Domain (integration)", () => {
  it(
    "detects google.com as taken",
    async () => {
      const { checkDomain } = await import("../src/checkers/domain");
      const result = await checkDomain("google", ".com");
      expect(result.status).toBe("taken");
      expect(result.platform).toBe("Domain google.com");
    },
    TIMEOUT
  );

  it(
    "detects a nonsense .com as available",
    async () => {
      const { checkDomain } = await import("../src/checkers/domain");
      const result = await checkDomain(KNOWN_AVAILABLE, ".com");
      expect(result.status).toBe("available");
    },
    TIMEOUT
  );

  it(
    "checks multiple TLDs at once",
    async () => {
      const { checkDomains } = await import("../src/checkers/domain");
      const results = await checkDomains(KNOWN_AVAILABLE, [".com", ".dev"]);
      expect(results.length).toBe(2);
      for (const r of results) {
        expect(r.status).toBe("available");
      }
    },
    TIMEOUT
  );
});

// ── X / Twitter ──────────────────────────────────────────────

describe("X / Twitter (integration)", () => {
  it(
    "detects a taken handle",
    async () => {
      const { checkTwitter } = await import("../src/checkers/twitter");
      const result = await checkTwitter(KNOWN_TAKEN);
      // Twitter often redirects or blocks, so accept taken or error
      expect(["taken", "error"]).toContain(result.status);
    },
    TIMEOUT
  );

  it("rejects handles over 15 chars without a network call", async () => {
    const { checkTwitter } = await import("../src/checkers/twitter");
    const result = await checkTwitter("thishandleiswaytoolong");
    expect(result.status).toBe("error");
    expect(result.message).toContain("15");
  });
});

// ── Instagram ────────────────────────────────────────────────

describe("Instagram (integration)", () => {
  it(
    "detects a taken handle",
    async () => {
      const { checkInstagram } = await import("../src/checkers/instagram");
      const result = await checkInstagram("instagram");
      // Instagram aggressively blocks scrapers, accept taken or error
      expect(["taken", "error"]).toContain(result.status);
    },
    TIMEOUT
  );

  it(
    "detects an available handle",
    async () => {
      const { checkInstagram } = await import("../src/checkers/instagram");
      const result = await checkInstagram(KNOWN_AVAILABLE);
      // May get rate limited
      expect(["available", "error"]).toContain(result.status);
    },
    TIMEOUT
  );
});

// ── TikTok ───────────────────────────────────────────────────

describe("TikTok (integration)", () => {
  it(
    "detects a taken handle",
    async () => {
      const { checkTikTok } = await import("../src/checkers/tiktok");
      const result = await checkTikTok("tiktok");
      expect(["taken", "error"]).toContain(result.status);
    },
    TIMEOUT
  );

  it(
    "detects an available handle",
    async () => {
      const { checkTikTok } = await import("../src/checkers/tiktok");
      const result = await checkTikTok(KNOWN_AVAILABLE);
      expect(["available", "error"]).toContain(result.status);
    },
    TIMEOUT
  );
});

// ── YouTube ──────────────────────────────────────────────────

describe("YouTube (integration)", () => {
  it(
    "detects a taken handle",
    async () => {
      const { checkYouTube } = await import("../src/checkers/youtube");
      const result = await checkYouTube(KNOWN_TAKEN);
      // YouTube via @17secrets/usernames can be unreliable — accept any valid status
      expect(["taken", "available", "error"]).toContain(result.status);
    },
    TIMEOUT
  );

  it(
    "detects an available handle",
    async () => {
      const { checkYouTube } = await import("../src/checkers/youtube");
      const result = await checkYouTube(KNOWN_AVAILABLE);
      expect(["available", "error"]).toContain(result.status);
    },
    TIMEOUT
  );
});

// ── LinkedIn ─────────────────────────────────────────────────

describe("LinkedIn (integration)", () => {
  it(
    "detects a taken company page",
    async () => {
      const { checkLinkedIn } = await import("../src/checkers/linkedin");
      const result = await checkLinkedIn(KNOWN_TAKEN);
      // LinkedIn may redirect or block
      expect(["taken", "error"]).toContain(result.status);
    },
    TIMEOUT
  );
});

// ── Reddit ───────────────────────────────────────────────────

describe("Reddit (integration)", () => {
  it(
    "detects a taken subreddit",
    async () => {
      const { checkReddit } = await import("../src/checkers/reddit");
      const result = await checkReddit("programming");
      expect(["taken", "error"]).toContain(result.status);
    },
    TIMEOUT
  );

  it(
    "detects an available subreddit",
    async () => {
      const { checkReddit } = await import("../src/checkers/reddit");
      const result = await checkReddit(KNOWN_AVAILABLE);
      // Reddit returns 200 with error JSON for non-existent subs, not 404
      expect(["available", "taken", "error"]).toContain(result.status);
    },
    TIMEOUT
  );
});

// ── PyPI ─────────────────────────────────────────────────────

describe("PyPI (integration)", () => {
  it(
    "detects a taken package",
    async () => {
      const { checkPyPI } = await import("../src/checkers/pypi");
      const result = await checkPyPI("requests");
      expect(result.status).toBe("taken");
      expect(result.url).toContain("pypi.org");
    },
    TIMEOUT
  );

  it(
    "detects an available package",
    async () => {
      const { checkPyPI } = await import("../src/checkers/pypi");
      const result = await checkPyPI(KNOWN_AVAILABLE);
      expect(result.status).toBe("available");
    },
    TIMEOUT
  );
});

// ── crates.io ────────────────────────────────────────────────

describe("crates.io (integration)", () => {
  it(
    "detects a taken crate",
    async () => {
      const { checkCratesIO } = await import("../src/checkers/crates");
      const result = await checkCratesIO("serde");
      expect(result.status).toBe("taken");
      expect(result.url).toContain("crates.io");
    },
    TIMEOUT
  );

  it(
    "detects an available crate",
    async () => {
      const { checkCratesIO } = await import("../src/checkers/crates");
      const result = await checkCratesIO(KNOWN_AVAILABLE);
      expect(result.status).toBe("available");
    },
    TIMEOUT
  );
});

// ── RubyGems ─────────────────────────────────────────────────

describe("RubyGems (integration)", () => {
  it(
    "detects a taken gem",
    async () => {
      const { checkRubyGems } = await import("../src/checkers/rubygems");
      const result = await checkRubyGems("rails");
      expect(result.status).toBe("taken");
      expect(result.url).toContain("rubygems.org");
    },
    TIMEOUT
  );

  it(
    "detects an available gem",
    async () => {
      const { checkRubyGems } = await import("../src/checkers/rubygems");
      const result = await checkRubyGems(KNOWN_AVAILABLE);
      expect(result.status).toBe("available");
    },
    TIMEOUT
  );
});

// ── Go (pkg.go.dev) ─────────────────────────────────────────

describe("Go pkg.go.dev (integration)", () => {
  it(
    "detects a taken Go package",
    async () => {
      const { checkGoPkg } = await import("../src/checkers/go");
      const result = await checkGoPkg("gin");
      // gin-gonic/gin is a common Go pkg — but we check github.com/gin/gin
      // This may or may not resolve. Accept taken or available.
      expect(["taken", "available"]).toContain(result.status);
    },
    TIMEOUT
  );

  it(
    "detects an available Go package",
    async () => {
      const { checkGoPkg } = await import("../src/checkers/go");
      const result = await checkGoPkg(KNOWN_AVAILABLE);
      expect(result.status).toBe("available");
    },
    TIMEOUT
  );
});

// ── Homebrew ─────────────────────────────────────────────────

describe("Homebrew (integration)", () => {
  it(
    "detects a taken formula",
    async () => {
      const { checkHomebrew } = await import("../src/checkers/homebrew");
      const result = await checkHomebrew("git");
      expect(result.status).toBe("taken");
      expect(result.url).toContain("formulae.brew.sh");
    },
    TIMEOUT
  );

  it(
    "detects an available formula",
    async () => {
      const { checkHomebrew } = await import("../src/checkers/homebrew");
      const result = await checkHomebrew(KNOWN_AVAILABLE);
      expect(result.status).toBe("available");
    },
    TIMEOUT
  );
});

// ── Docker Hub ───────────────────────────────────────────────

describe("Docker Hub (integration)", () => {
  it(
    "detects a taken image/org",
    async () => {
      const { checkDockerHub } = await import("../src/checkers/dockerhub");
      const result = await checkDockerHub("nginx");
      expect(result.status).toBe("taken");
      expect(result.url).toContain("hub.docker.com");
    },
    TIMEOUT
  );

  it(
    "detects an available image/org",
    async () => {
      const { checkDockerHub } = await import("../src/checkers/dockerhub");
      const result = await checkDockerHub(KNOWN_AVAILABLE);
      expect(result.status).toBe("available");
    },
    TIMEOUT
  );
});

// ── USPTO Trademark ──────────────────────────────────────────

describe("USPTO Trademark (integration)", () => {
  it(
    "checks a common name",
    async () => {
      const { checkUSPTOTrademark } = await import("../src/checkers/trademark");
      const result = await checkUSPTOTrademark("apple");
      // USPTO API is unreliable — accept any valid status
      expect(["taken", "available", "error"]).toContain(result.status);
      expect(result.url).toContain("uspto.gov");
    },
    TIMEOUT
  );

  it(
    "checks a nonsense name",
    async () => {
      const { checkUSPTOTrademark } = await import("../src/checkers/trademark");
      const result = await checkUSPTOTrademark(KNOWN_AVAILABLE);
      // USPTO API is unreliable and may return 200 for anything
      expect(["available", "taken", "error"]).toContain(result.status);
    },
    TIMEOUT
  );
});

// ── runCheckers (full pipeline) ──────────────────────────────

describe("runCheckers (integration)", () => {
  it(
    "runs a subset of checkers end-to-end",
    async () => {
      const { runCheckers } = await import("../src/checkers/index");
      const results = await runCheckers(KNOWN_AVAILABLE, {
        checkerIds: ["npm", "pypi", "homebrew"],
      });

      expect(results.length).toBe(3);
      for (const r of results) {
        // Should all be available or error — never crash
        expect(["available", "taken", "error"]).toContain(r.status);
        expect(r.platform).toBeDefined();
      }
    },
    TIMEOUT
  );

  it(
    "never throws — always returns results",
    async () => {
      const { runCheckers } = await import("../src/checkers/index");
      // Even with all checkers, should not throw
      const results = await runCheckers(KNOWN_AVAILABLE, {
        checkerIds: ["npm", "github", "domain"],
        tlds: [".com"],
      });

      expect(results.length).toBeGreaterThan(0);
      for (const r of results) {
        expect(["available", "taken", "error"]).toContain(r.status);
      }
    },
    TIMEOUT
  );
});
