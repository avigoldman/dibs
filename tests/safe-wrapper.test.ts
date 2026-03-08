import { describe, it, expect, vi } from "vitest";

// Mock everything to throw so we can test the safe wrapper
const mockFetch = vi.fn().mockRejectedValue(new Error("Network failure"));
vi.stubGlobal("fetch", mockFetch);

vi.mock("whoiser", () => ({
  whoisDomain: vi.fn().mockRejectedValue(new Error("Network error")),
  firstResult: vi.fn(),
}));

vi.mock("@17secrets/usernames", () => {
  const mockClient = {
    github: vi.fn().mockRejectedValue(new Error("Timeout")),
    instagram: vi.fn().mockRejectedValue(new Error("Timeout")),
    tiktok: vi.fn().mockRejectedValue(new Error("Timeout")),
    youtube: vi.fn().mockRejectedValue(new Error("Timeout")),
  };
  return { Client: vi.fn(() => mockClient) };
});

vi.mock("npm-name", () => ({
  default: vi.fn().mockRejectedValue(new Error("Network failure")),
}));

// crates.io uses fetch directly (mocked via stubGlobal above)

describe("safe wrapper / error handling", () => {
  it("returns error results instead of throwing when all checkers fail", async () => {
    const { runCheckers } = await import("../src/checkers/index.js");
    const results = await runCheckers("test", {
      checkerIds: ["github", "npm", "domain"],
      tlds: [".com"],
    });

    // All should be error status — none should throw
    for (const r of results) {
      expect(r.status).toBe("error");
      expect(r.message).toBeDefined();
      expect(r.message!.length).toBeGreaterThan(0);
    }
    expect(results.length).toBeGreaterThan(0);
  });

  it("wraps domain checker errors gracefully", async () => {
    const { runCheckers } = await import("../src/checkers/index.js");
    const results = await runCheckers("test", {
      checkerIds: ["domain"],
      tlds: [".com", ".dev"],
    });

    // Should get error results, not thrown exceptions
    for (const r of results) {
      expect(r.status).toBe("error");
    }
  });

  it("wraps social checker errors gracefully", async () => {
    const { runCheckers } = await import("../src/checkers/index.js");
    const results = await runCheckers("test", {
      checkerIds: ["github", "instagram", "tiktok", "youtube"],
    });

    for (const r of results) {
      expect(r.status).toBe("error");
      expect(r.message).toBeDefined();
    }
  });

  it("wraps fetch-based checker errors gracefully", async () => {
    const { runCheckers } = await import("../src/checkers/index.js");
    const results = await runCheckers("test", {
      checkerIds: ["twitter", "linkedin", "reddit", "npm", "pypi", "rubygems", "homebrew"],
    });

    for (const r of results) {
      expect(r.status).toBe("error");
    }
  });

  it("includes the error message in the result", async () => {
    const { runCheckers } = await import("../src/checkers/index.js");
    const results = await runCheckers("test", { checkerIds: ["npm"] });

    expect(results[0]!.message).toContain("Network failure");
  });
});
