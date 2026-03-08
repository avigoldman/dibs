import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Conf from "conf";
import fs from "node:fs";

interface SavedConfig {
  platforms?: string[];
  tlds?: string[];
  variants?: boolean;
  variantPatterns?: string[];
}

describe("config persistence", () => {
  let config: Conf<SavedConfig>;

  beforeEach(() => {
    config = new Conf<SavedConfig>({
      projectName: "calldibs-test",
      defaults: {},
    });
    config.clear();
  });

  afterEach(() => {
    config.clear();
    // clean up the config file
    try {
      fs.unlinkSync(config.path);
      fs.rmdirSync(config.path.replace(/\/[^/]+$/, ""));
    } catch {
      // ignore
    }
  });

  describe("platforms", () => {
    it("returns undefined when no platforms saved", () => {
      expect(config.get("platforms")).toBeUndefined();
    });

    it("saves and retrieves platforms", () => {
      const platforms = ["github", "npm", "domain"];
      config.set("platforms", platforms);
      expect(config.get("platforms")).toEqual(platforms);
    });

    it("overwrites previous platforms", () => {
      config.set("platforms", ["github", "npm"]);
      config.set("platforms", ["domain"]);
      expect(config.get("platforms")).toEqual(["domain"]);
    });
  });

  describe("tlds", () => {
    it("returns undefined when no tlds saved", () => {
      expect(config.get("tlds")).toBeUndefined();
    });

    it("saves and retrieves tlds", () => {
      const tlds = [".com", ".dev", ".io"];
      config.set("tlds", tlds);
      expect(config.get("tlds")).toEqual(tlds);
    });
  });

  describe("variants", () => {
    it("returns undefined when no variant preference saved", () => {
      expect(config.get("variants")).toBeUndefined();
    });

    it("saves variant preference as boolean", () => {
      config.set("variants", true);
      expect(config.get("variants")).toBe(true);

      config.set("variants", false);
      expect(config.get("variants")).toBe(false);
    });
  });

  describe("variantPatterns", () => {
    it("returns undefined when no patterns saved", () => {
      expect(config.get("variantPatterns")).toBeUndefined();
    });

    it("saves and retrieves variant patterns", () => {
      const patterns = ["hq", "use", "app"];
      config.set("variantPatterns", patterns);
      expect(config.get("variantPatterns")).toEqual(patterns);
    });
  });

  describe("fallback behavior", () => {
    it("uses nullish coalescing correctly for defaults", () => {
      const allPlatformIds = ["domain", "github", "npm"];
      const savedPlatforms = config.get("platforms");
      const initialValues = savedPlatforms ?? allPlatformIds;
      expect(initialValues).toEqual(allPlatformIds);
    });

    it("uses saved value over defaults when present", () => {
      const allPlatformIds = ["domain", "github", "npm"];
      config.set("platforms", ["github"]);
      const savedPlatforms = config.get("platforms");
      const initialValues = savedPlatforms ?? allPlatformIds;
      expect(initialValues).toEqual(["github"]);
    });

    it("uses false as default for variants when not saved", () => {
      const savedWantVariants = config.get("variants") ?? false;
      expect(savedWantVariants).toBe(false);
    });

    it("preserves saved true for variants", () => {
      config.set("variants", true);
      const savedWantVariants = config.get("variants") ?? false;
      expect(savedWantVariants).toBe(true);
    });
  });

  describe("persistence across instances", () => {
    it("config persists when creating a new Conf instance", () => {
      config.set("platforms", ["github", "npm"]);
      config.set("tlds", [".com", ".ai"]);
      config.set("variants", true);
      config.set("variantPatterns", ["hq", "dev"]);

      const config2 = new Conf<SavedConfig>({
        projectName: "calldibs-test",
        defaults: {},
      });

      expect(config2.get("platforms")).toEqual(["github", "npm"]);
      expect(config2.get("tlds")).toEqual([".com", ".ai"]);
      expect(config2.get("variants")).toBe(true);
      expect(config2.get("variantPatterns")).toEqual(["hq", "dev"]);
    });
  });
});
