import { describe, expect, it } from "vitest";
import { rankModels } from "../../src/lib/scoring";

describe("smoke", () => {
  it("exposes rankModels", () => {
    expect(typeof rankModels).toBe("function");
  });
});
