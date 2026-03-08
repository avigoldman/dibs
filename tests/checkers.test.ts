import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock @17secrets/usernames
const mockUsernamesClient = {
  github: vi.fn(),
  instagram: vi.fn(),
  tiktok: vi.fn(),
  youtube: vi.fn(),
};
vi.mock("@17secrets/usernames", () => ({
  Client: vi.fn(() => mockUsernamesClient),
}));

// Mock whoiser
const mockWhoisDomain = vi.fn();
const mockFirstResult = vi.fn();
vi.mock("whoiser", () => ({
  whoisDomain: mockWhoisDomain,
  firstResult: mockFirstResult,
}));

// Mock npm-name
const mockNpmName = vi.fn();
vi.mock("npm-name", () => ({ default: mockNpmName }));

// (crates.io now uses fetch directly, no mock needed)

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockReset();
});

// ── npm ──────────────────────────────────────────────────────

describe("checkNpm", () => {
  it("returns available when npm-name returns true", async () => {
    mockNpmName.mockResolvedValue(true);
    const { checkNpm } = await import("../src/checkers/npm.js");
    const result = await checkNpm("nonexistent-pkg-xyz");
    expect(result.status).toBe("available");
    expect(result.platform).toBe("npm");
    expect(result.url).toContain("npmjs.com");
  });

  it("returns taken when npm-name returns false", async () => {
    mockNpmName.mockResolvedValue(false);
    const { checkNpm } = await import("../src/checkers/npm.js");
    const result = await checkNpm("express");
    expect(result.status).toBe("taken");
  });
});

// ── GitHub ───────────────────────────────────────────────────

describe("checkGitHub", () => {
  it("returns available when client says available", async () => {
    mockUsernamesClient.github.mockResolvedValue({
      available: true, platform: "github", username: "test", message: "",
    });
    const { checkGitHub } = await import("../src/checkers/github.js");
    const result = await checkGitHub("nonexistent-user-xyz");
    expect(result.status).toBe("available");
    expect(result.platform).toBe("GitHub");
  });

  it("returns taken when client says not available", async () => {
    mockUsernamesClient.github.mockResolvedValue({
      available: false, platform: "github", username: "test", message: "",
    });
    const { checkGitHub } = await import("../src/checkers/github.js");
    const result = await checkGitHub("octocat");
    expect(result.status).toBe("taken");
  });

  it("returns error when client returns null", async () => {
    mockUsernamesClient.github.mockResolvedValue({
      available: null, platform: "github", username: "test", message: "timeout",
    });
    const { checkGitHub } = await import("../src/checkers/github.js");
    const result = await checkGitHub("test");
    expect(result.status).toBe("error");
  });
});

// ── Domains ──────────────────────────────────────────────────

describe("checkDomains", () => {
  it("returns available when WHOIS indicates no match", async () => {
    mockWhoisDomain.mockResolvedValue({});
    mockFirstResult.mockReturnValue({
      text: ['No match for "ZIZZBLORP.COM".'],
    });

    const { checkDomain } = await import("../src/checkers/domain.js");
    const result = await checkDomain("zizzblorp", ".com");
    expect(result.status).toBe("available");
    expect(result.platform).toBe("Domain zizzblorp.com");
  });

  it("returns taken when WHOIS has a Domain Name", async () => {
    mockWhoisDomain.mockResolvedValue({});
    mockFirstResult.mockReturnValue({
      "Domain Name": "GOOGLE.COM",
      text: ["Domain Name: GOOGLE.COM"],
    });

    const { checkDomain } = await import("../src/checkers/domain.js");
    const result = await checkDomain("google", ".com");
    expect(result.status).toBe("taken");
  });

  it("detects 'not found' text as available", async () => {
    mockWhoisDomain.mockResolvedValue({});
    mockFirstResult.mockReturnValue({
      text: ["Domain not found."],
    });

    const { checkDomain } = await import("../src/checkers/domain.js");
    const result = await checkDomain("xyznotreal", ".dev");
    expect(result.status).toBe("available");
  });

  it("checks multiple TLDs", async () => {
    mockWhoisDomain.mockResolvedValue({});
    mockFirstResult.mockReturnValue({ text: ["No match found"] });

    const { checkDomains } = await import("../src/checkers/domain.js");
    const results = await checkDomains("zizzblorp", [".com", ".dev"]);
    expect(results).toHaveLength(2);
    expect(results[0]!.platform).toBe("Domain zizzblorp.com");
    expect(results[1]!.platform).toBe("Domain zizzblorp.dev");
  });

  it("normalizes TLD with or without dot prefix", async () => {
    mockWhoisDomain.mockResolvedValue({});
    mockFirstResult.mockReturnValue({ text: ["No match"] });

    const { checkDomain } = await import("../src/checkers/domain.js");
    const result = await checkDomain("test", "com");
    expect(result.platform).toBe("Domain test.com");
  });
});

// ── Twitter ──────────────────────────────────────────────────

describe("checkTwitter", () => {
  it("returns available on 404", async () => {
    mockFetch.mockResolvedValue({ status: 404 });
    const { checkTwitter } = await import("../src/checkers/twitter.js");
    const result = await checkTwitter("nxuserxyz");
    expect(result.status).toBe("available");
    expect(result.platform).toBe("X / Twitter");
  });

  it("returns taken on 200", async () => {
    mockFetch.mockResolvedValue({ status: 200 });
    const { checkTwitter } = await import("../src/checkers/twitter.js");
    const result = await checkTwitter("twitter");
    expect(result.status).toBe("taken");
  });

  it("returns error for handles over 15 chars", async () => {
    const { checkTwitter } = await import("../src/checkers/twitter.js");
    const result = await checkTwitter("thishandleiswaytoolong");
    expect(result.status).toBe("error");
    expect(result.message).toContain("15");
  });
});

// ── Instagram ────────────────────────────────────────────────

describe("checkInstagram", () => {
  it("returns available when client says available", async () => {
    mockUsernamesClient.instagram.mockResolvedValue({
      available: true, platform: "instagram", username: "test", message: "",
    });
    const { checkInstagram } = await import("../src/checkers/instagram.js");
    const result = await checkInstagram("nxuserxyz");
    expect(result.status).toBe("available");
  });

  it("returns taken when client says not available", async () => {
    mockUsernamesClient.instagram.mockResolvedValue({
      available: false, platform: "instagram", username: "test", message: "",
    });
    const { checkInstagram } = await import("../src/checkers/instagram.js");
    const result = await checkInstagram("instagram");
    expect(result.status).toBe("taken");
  });

  it("returns error for handles over 30 chars", async () => {
    const { checkInstagram } = await import("../src/checkers/instagram.js");
    const result = await checkInstagram("a".repeat(31));
    expect(result.status).toBe("error");
  });
});

// ── TikTok ───────────────────────────────────────────────────

describe("checkTikTok", () => {
  it("returns available when client says available", async () => {
    mockUsernamesClient.tiktok.mockResolvedValue({
      available: true, platform: "tiktok", username: "test", message: "",
    });
    const { checkTikTok } = await import("../src/checkers/tiktok.js");
    const result = await checkTikTok("nxuserxyz");
    expect(result.status).toBe("available");
  });

  it("returns error for handles over 24 chars", async () => {
    const { checkTikTok } = await import("../src/checkers/tiktok.js");
    const result = await checkTikTok("a".repeat(25));
    expect(result.status).toBe("error");
  });
});

// ── YouTube ──────────────────────────────────────────────────

describe("checkYouTube", () => {
  it("returns available when client says available", async () => {
    mockUsernamesClient.youtube.mockResolvedValue({
      available: true, platform: "youtube", username: "test", message: "",
    });
    const { checkYouTube } = await import("../src/checkers/youtube.js");
    const result = await checkYouTube("nxuserxyz");
    expect(result.status).toBe("available");
  });

  it("returns taken when client says not available", async () => {
    mockUsernamesClient.youtube.mockResolvedValue({
      available: false, platform: "youtube", username: "test", message: "",
    });
    const { checkYouTube } = await import("../src/checkers/youtube.js");
    const result = await checkYouTube("google");
    expect(result.status).toBe("taken");
  });
});

// ── LinkedIn ─────────────────────────────────────────────────

describe("checkLinkedIn", () => {
  it("returns available on 404", async () => {
    mockFetch.mockResolvedValue({ status: 404 });
    const { checkLinkedIn } = await import("../src/checkers/linkedin.js");
    const result = await checkLinkedIn("nxcompanyxyz");
    expect(result.status).toBe("available");
  });

  it("returns taken on 200", async () => {
    mockFetch.mockResolvedValue({ status: 200 });
    const { checkLinkedIn } = await import("../src/checkers/linkedin.js");
    const result = await checkLinkedIn("google");
    expect(result.status).toBe("taken");
  });
});

// ── Reddit ───────────────────────────────────────────────────

describe("checkReddit", () => {
  it("returns available on 404", async () => {
    mockFetch.mockResolvedValue({ status: 404 });
    const { checkReddit } = await import("../src/checkers/reddit.js");
    const result = await checkReddit("nxsubxyz");
    expect(result.status).toBe("available");
  });

  it("returns taken on 200", async () => {
    mockFetch.mockResolvedValue({ status: 200 });
    const { checkReddit } = await import("../src/checkers/reddit.js");
    const result = await checkReddit("programming");
    expect(result.status).toBe("taken");
  });

  it("returns error for names outside 3-21 chars", async () => {
    const { checkReddit } = await import("../src/checkers/reddit.js");
    expect((await checkReddit("ab")).status).toBe("error");
    expect((await checkReddit("a".repeat(22))).status).toBe("error");
  });
});

// ── PyPI ─────────────────────────────────────────────────────

describe("checkPyPI", () => {
  it("returns available on 404", async () => {
    mockFetch.mockResolvedValue({ status: 404 });
    const { checkPyPI } = await import("../src/checkers/pypi.js");
    const result = await checkPyPI("nxpkgxyz");
    expect(result.status).toBe("available");
  });

  it("returns taken on 200", async () => {
    mockFetch.mockResolvedValue({ status: 200 });
    const { checkPyPI } = await import("../src/checkers/pypi.js");
    const result = await checkPyPI("requests");
    expect(result.status).toBe("taken");
  });
});

// ── crates.io ────────────────────────────────────────────────

describe("checkCratesIO", () => {
  it("returns available on 404", async () => {
    mockFetch.mockResolvedValue({ status: 404 });
    const { checkCratesIO } = await import("../src/checkers/crates.js");
    const result = await checkCratesIO("nxcratexyz");
    expect(result.status).toBe("available");
    expect(result.url).toContain("crates.io");
  });

  it("returns taken on 200", async () => {
    mockFetch.mockResolvedValue({ status: 200 });
    const { checkCratesIO } = await import("../src/checkers/crates.js");
    const result = await checkCratesIO("serde");
    expect(result.status).toBe("taken");
  });
});

// ── RubyGems ─────────────────────────────────────────────────

describe("checkRubyGems", () => {
  it("returns available on 404", async () => {
    mockFetch.mockResolvedValue({ status: 404 });
    const { checkRubyGems } = await import("../src/checkers/rubygems.js");
    const result = await checkRubyGems("nxgemxyz");
    expect(result.status).toBe("available");
  });

  it("returns taken on 200", async () => {
    mockFetch.mockResolvedValue({ status: 200 });
    const { checkRubyGems } = await import("../src/checkers/rubygems.js");
    const result = await checkRubyGems("rails");
    expect(result.status).toBe("taken");
  });
});

// ── Go (pkg.go.dev) ─────────────────────────────────────────

describe("checkGoPkg", () => {
  it("returns available when all paths 404", async () => {
    mockFetch.mockResolvedValue({ status: 404 });
    const { checkGoPkg } = await import("../src/checkers/go.js");
    const result = await checkGoPkg("nxgopkgxyz");
    expect(result.status).toBe("available");
  });

  it("returns taken when any path resolves", async () => {
    mockFetch.mockResolvedValueOnce({ status: 200 });
    mockFetch.mockResolvedValueOnce({ status: 404 });
    const { checkGoPkg } = await import("../src/checkers/go.js");
    const result = await checkGoPkg("gin");
    expect(result.status).toBe("taken");
  });
});

// ── Homebrew ─────────────────────────────────────────────────

describe("checkHomebrew", () => {
  it("returns available on 404", async () => {
    mockFetch.mockResolvedValue({ status: 404 });
    const { checkHomebrew } = await import("../src/checkers/homebrew.js");
    const result = await checkHomebrew("nxformulaxyz");
    expect(result.status).toBe("available");
  });

  it("returns taken on 200", async () => {
    mockFetch.mockResolvedValue({ status: 200 });
    const { checkHomebrew } = await import("../src/checkers/homebrew.js");
    const result = await checkHomebrew("git");
    expect(result.status).toBe("taken");
  });
});

// ── Docker Hub ───────────────────────────────────────────────

describe("checkDockerHub", () => {
  it("returns available when both library and org 404", async () => {
    mockFetch.mockResolvedValue({ status: 404 });
    const { checkDockerHub } = await import("../src/checkers/dockerhub.js");
    const result = await checkDockerHub("nxdockerxyz");
    expect(result.status).toBe("available");
  });

  it("returns taken when org exists", async () => {
    mockFetch.mockResolvedValueOnce({ status: 404 });
    mockFetch.mockResolvedValueOnce({ status: 200 });
    const { checkDockerHub } = await import("../src/checkers/dockerhub.js");
    const result = await checkDockerHub("nginx");
    expect(result.status).toBe("taken");
  });

  it("returns taken when library image exists", async () => {
    mockFetch.mockResolvedValueOnce({ status: 200 });
    mockFetch.mockResolvedValueOnce({ status: 404 });
    const { checkDockerHub } = await import("../src/checkers/dockerhub.js");
    const result = await checkDockerHub("alpine");
    expect(result.status).toBe("taken");
  });
});

// ── USPTO Trademark ──────────────────────────────────────────

describe("checkUSPTOTrademark", () => {
  it("returns available on 404", async () => {
    mockFetch.mockResolvedValue({ status: 404 });
    const { checkUSPTOTrademark } = await import("../src/checkers/trademark.js");
    const result = await checkUSPTOTrademark("zizzblorp");
    expect(result.status).toBe("available");
    expect(result.message).toContain("manual");
  });

  it("returns available on 204", async () => {
    mockFetch.mockResolvedValue({ status: 204 });
    const { checkUSPTOTrademark } = await import("../src/checkers/trademark.js");
    const result = await checkUSPTOTrademark("zizzblorp");
    expect(result.status).toBe("available");
  });

  it("returns taken on 200", async () => {
    mockFetch.mockResolvedValue({ status: 200 });
    const { checkUSPTOTrademark } = await import("../src/checkers/trademark.js");
    const result = await checkUSPTOTrademark("apple");
    expect(result.status).toBe("taken");
  });
});
