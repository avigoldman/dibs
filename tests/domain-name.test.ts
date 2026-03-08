import { describe, it, expect } from "vitest";
import { parseDomainInput, brandName, platformNames } from "../src/domain-name";

describe("parseDomainInput", () => {
  it("detects .com domain", () => {
    expect(parseDomainInput("example.com")).toEqual({
      baseName: "example",
      detectedTld: ".com",
      isDomain: true,
    });
  });

  it("detects .ai domain", () => {
    expect(parseDomainInput("open.ai")).toEqual({
      baseName: "open",
      detectedTld: ".ai",
      isDomain: true,
    });
  });

  it("detects .io domain", () => {
    expect(parseDomainInput("customer.io")).toEqual({
      baseName: "customer",
      detectedTld: ".io",
      isDomain: true,
    });
  });

  it("detects .dev domain", () => {
    expect(parseDomainInput("toby.dev")).toEqual({
      baseName: "toby",
      detectedTld: ".dev",
      isDomain: true,
    });
  });

  it("returns plain name when no TLD", () => {
    expect(parseDomainInput("acme")).toEqual({
      baseName: "acme",
      detectedTld: null,
      isDomain: false,
    });
  });

  it("returns plain name for invalid TLD", () => {
    expect(parseDomainInput("something.notarealtld")).toEqual({
      baseName: "something.notarealtld",
      detectedTld: null,
      isDomain: false,
    });
  });

  it("handles hyphenated names", () => {
    expect(parseDomainInput("my-app.dev")).toEqual({
      baseName: "my-app",
      detectedTld: ".dev",
      isDomain: true,
    });
  });
});

describe("brandName", () => {
  it("returns base name for .com", () => {
    expect(brandName("example", ".com")).toBe("example");
  });

  it("appends TLD for .io", () => {
    expect(brandName("customer", ".io")).toBe("customerio");
  });

  it("appends TLD for .ai", () => {
    expect(brandName("open", ".ai")).toBe("openai");
  });

  it("returns base name when no TLD", () => {
    expect(brandName("acme", null)).toBe("acme");
  });
});

describe("platformNames", () => {
  describe("with .com (TLD not part of brand)", () => {
    it("returns same name for all formats", () => {
      const names = platformNames("example", ".com");
      expect(names.joined).toBe("example");
      expect(names.hyphenated).toBe("example");
      expect(names.underscored).toBe("example");
      expect(names.base).toBe("example");
    });
  });

  describe("with null TLD (not a domain input)", () => {
    it("returns same name for all formats", () => {
      const names = platformNames("acme", null);
      expect(names.joined).toBe("acme");
      expect(names.hyphenated).toBe("acme");
      expect(names.underscored).toBe("acme");
      expect(names.base).toBe("acme");
    });
  });

  describe("with .io (TLD is part of brand)", () => {
    it("generates correct formats", () => {
      const names = platformNames("customer", ".io");
      expect(names.joined).toBe("customerio");
      expect(names.hyphenated).toBe("customer-io");
      expect(names.underscored).toBe("customer_io");
      expect(names.base).toBe("customer");
    });
  });

  describe("with .ai", () => {
    it("generates correct formats", () => {
      const names = platformNames("open", ".ai");
      expect(names.joined).toBe("openai");
      expect(names.hyphenated).toBe("open-ai");
      expect(names.underscored).toBe("open_ai");
      expect(names.base).toBe("open");
    });
  });

  describe("with .dev", () => {
    it("generates correct formats", () => {
      const names = platformNames("toby", ".dev");
      expect(names.joined).toBe("tobydev");
      expect(names.hyphenated).toBe("toby-dev");
      expect(names.underscored).toBe("toby_dev");
      expect(names.base).toBe("toby");
    });
  });

  describe("platform format mapping", () => {
    it("social platforms use joined for customer.io", () => {
      const names = platformNames("customer", ".io");
      // GitHub, Twitter, Instagram, TikTok, YouTube, Reddit → joined
      expect(names.joined).toBe("customerio");
    });

    it("package registries use hyphenated for customer.io", () => {
      const names = platformNames("customer", ".io");
      // npm, PyPI, crates, RubyGems, Go, Homebrew → hyphenated
      expect(names.hyphenated).toBe("customer-io");
    });

    it("domain checker uses base name for customer.io", () => {
      const names = platformNames("customer", ".io");
      // Domain checker adds TLDs itself
      expect(names.base).toBe("customer");
    });
  });
});

describe("domain input → no variants", () => {
  it("domain inputs should be flagged so variants are skipped", () => {
    const result = parseDomainInput("customer.io");
    expect(result.isDomain).toBe(true);
    // The CLI uses isDomain to skip variant generation
  });

  it("non-domain inputs allow variants", () => {
    const result = parseDomainInput("acme");
    expect(result.isDomain).toBe(false);
  });
});
