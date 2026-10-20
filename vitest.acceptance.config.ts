import { defineConfig } from "vitest/config";

// PROTECTED: acceptance tests only. Do not modify.
export default defineConfig({
  test: {
    include: ["tests/acceptance/**/*.test.ts"],
    environment: "node",
  },
});
