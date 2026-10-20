import { defineConfig } from "vitest/config";

// Unit tests (agents may edit this file, e.g. to add a DOM environment).
export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
