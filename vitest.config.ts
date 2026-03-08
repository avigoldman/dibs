import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 15000,
    exclude: ["tests/integration.test.ts", "node_modules/**"],
  },
});
