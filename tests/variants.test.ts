import { describe, it, expect } from "vitest";
import {
  cleanName,
  generateVariants,
  ALL_PATTERNS,
  PREFIX_PATTERNS,
  SUFFIX_PATTERNS,
} from "../src/variants.js";

describe("cleanName", () => {
  it("lowercases and strips invalid chars", () => {
    expect(cleanName("My Cool App!")).toBe("mycoolapp");
  });

  it("preserves hyphens", () => {
    expect(cleanName("my-app")).toBe("my-app");
  });

  it("preserves numbers", () => {
    expect(cleanName("app2go")).toBe("app2go");
  });

  it("handles empty string", () => {
    expect(cleanName("")).toBe("");
  });
});

describe("generateVariants", () => {
  it("always includes the bare name first", () => {
    const variants = generateVariants("acme");
    expect(variants[0]).toEqual({ name: "acme", pattern: null });
  });

  it("generates all prefix and suffix variants by default", () => {
    const variants = generateVariants("acme");
    // bare + all patterns
    expect(variants.length).toBe(1 + ALL_PATTERNS.length);
  });

  it("filters to specific patterns when patternIds are given", () => {
    const variants = generateVariants("acme", ["hq", "use"]);
    expect(variants.length).toBe(3); // bare + hq + use
    expect(variants.map((v) => v.name)).toContain("acmehq");
    expect(variants.map((v) => v.name)).toContain("useacme");
  });

  it("applies prefix patterns correctly", () => {
    for (const pat of PREFIX_PATTERNS) {
      const result = pat.apply("test");
      expect(result).toBe(`${pat.id}test`);
    }
  });

  it("applies suffix patterns correctly", () => {
    for (const pat of SUFFIX_PATTERNS) {
      const result = pat.apply("test");
      expect(result).toBe(`test${pat.id}`);
    }
  });

  it("does not duplicate the bare name in variants", () => {
    const variants = generateVariants("acme", ["hq"]);
    const names = variants.map((v) => v.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it("cleans the base name before generating", () => {
    const variants = generateVariants("My App!", ["hq"]);
    expect(variants[0]!.name).toBe("myapp");
    expect(variants[1]!.name).toBe("myapphq");
  });
});
