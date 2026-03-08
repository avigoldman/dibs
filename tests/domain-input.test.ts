import { describe, it, expect } from "vitest";
import { isValidTld } from "../src/checkers/domain";
import { DEFAULT_TLDS } from "../src/checkers/domain";

/**
 * Tests for domain input detection logic.
 * When a user passes "example.com" or "open.ai", we should:
 * 1. Extract the name ("example" / "open")
 * 2. Detect the TLD (".com" / ".ai")
 * 3. Ensure that TLD is always checked
 */

function parseDomainInput(input: string): { name: string; detectedTld: string | null } {
  const dotIndex = input.lastIndexOf(".");
  if (dotIndex > 0) {
    const possibleTld = input.slice(dotIndex);
    if (isValidTld(possibleTld)) {
      return { name: input.slice(0, dotIndex), detectedTld: possibleTld };
    }
  }
  return { name: input, detectedTld: null };
}

function ensureTld(tlds: string[], detectedTld: string | null): string[] {
  if (!detectedTld) return tlds;
  if (tlds.includes(detectedTld)) return tlds;
  return [detectedTld, ...tlds];
}

describe("domain input detection", () => {
  describe("parseDomainInput", () => {
    it("detects .com domain", () => {
      const result = parseDomainInput("example.com");
      expect(result).toEqual({ name: "example", detectedTld: ".com" });
    });

    it("detects .ai domain", () => {
      const result = parseDomainInput("open.ai");
      expect(result).toEqual({ name: "open", detectedTld: ".ai" });
    });

    it("detects .dev domain", () => {
      const result = parseDomainInput("toby.dev");
      expect(result).toEqual({ name: "toby", detectedTld: ".dev" });
    });

    it("detects .io domain", () => {
      const result = parseDomainInput("socket.io");
      expect(result).toEqual({ name: "socket", detectedTld: ".io" });
    });

    it("detects uncommon but valid TLD", () => {
      const result = parseDomainInput("my-app.xyz");
      expect(result).toEqual({ name: "my-app", detectedTld: ".xyz" });
    });

    it("returns plain name when no TLD detected", () => {
      const result = parseDomainInput("acme");
      expect(result).toEqual({ name: "acme", detectedTld: null });
    });

    it("returns plain name for invalid TLD", () => {
      const result = parseDomainInput("something.notarealtld");
      expect(result).toEqual({ name: "something.notarealtld", detectedTld: null });
    });

    it("handles hyphenated names with TLD", () => {
      const result = parseDomainInput("my-cool-app.dev");
      expect(result).toEqual({ name: "my-cool-app", detectedTld: ".dev" });
    });

    it("handles subdomain-like input by using last dot", () => {
      const result = parseDomainInput("api.example.com");
      expect(result).toEqual({ name: "api.example", detectedTld: ".com" });
    });
  });

  describe("ensureTld", () => {
    it("adds detected TLD to front when not in list", () => {
      const result = ensureTld([".com", ".dev"], ".ai");
      expect(result).toEqual([".ai", ".com", ".dev"]);
    });

    it("does not duplicate TLD when already in list", () => {
      const result = ensureTld([".com", ".dev", ".ai"], ".ai");
      expect(result).toEqual([".com", ".dev", ".ai"]);
    });

    it("returns original list when no detected TLD", () => {
      const result = ensureTld([".com", ".dev"], null);
      expect(result).toEqual([".com", ".dev"]);
    });

    it("adds uncommon TLD to defaults", () => {
      const result = ensureTld([...DEFAULT_TLDS], ".xyz");
      expect(result[0]).toBe(".xyz");
      expect(result).toContain(".com");
    });
  });
});
