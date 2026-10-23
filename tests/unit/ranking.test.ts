import { describe, expect, it } from "vitest";
import type { Model, Source } from "../../src/data/schemas";
import {
  buildRankInput,
  formatConfidence,
  formatScore,
  formatWeight,
  getSourceContributions,
  MAX_COMPARE_MODELS,
  toggleCompareSelection,
  toModelInput,
  toSourceInput,
} from "../../src/lib/ranking";

const model: Model = {
  id: "m",
  name: "Model M",
  vendor: "Vendor V",
  parameters: null,
  license: null,
  contextWindow: 128_000,
  toolCalling: 0.8,
  scores: { a: 70 },
  free: { available: true, requestsPerDay: 50, trainsOnPrompts: false },
  price: { inputPerMTok: 1, outputPerMTok: 2 },
};

const source: Source = {
  id: "a",
  name: "Source A",
  reliability: 0.9,
  relevance: 0.8,
  ageDays: 3,
};

describe("seed to rank input mapping", () => {
  it("drops display-only fields and keeps scoring fields", () => {
    expect(toModelInput(model)).toEqual({
      id: "m",
      scores: { a: 70 },
      contextWindow: 128_000,
      toolCalling: 0.8,
      free: { available: true, requestsPerDay: 50, trainsOnPrompts: false },
      price: { inputPerMTok: 1, outputPerMTok: 2 },
    });
    expect(toModelInput(model)).not.toHaveProperty("name");
    expect(toModelInput(model)).not.toHaveProperty("vendor");
    expect(toSourceInput(source)).toEqual({
      id: "a",
      reliability: 0.9,
      relevance: 0.8,
      ageDays: 3,
    });
    expect(toSourceInput(source)).not.toHaveProperty("name");
  });

  it("copies nested objects so ranking cannot mutate the seed data", () => {
    const mapped = toModelInput(model);
    mapped.scores.a = 0;
    mapped.free.available = false;
    if (mapped.price !== null) mapped.price.inputPerMTok = 99;

    expect(model.scores.a).toBe(70);
    expect(model.free.available).toBe(true);
    expect(model.price?.inputPerMTok).toBe(1);
  });

  it("keeps a null price", () => {
    expect(toModelInput({ ...model, price: null }).price).toBeNull();
  });

  it("builds a RankInput with one entry per model and source", () => {
    const input = buildRankInput([model], [source]);
    expect(input.models).toHaveLength(1);
    expect(input.sources).toHaveLength(1);
    expect(input.models[0]?.id).toBe("m");
    expect(input.sources[0]?.id).toBe("a");
  });
});

describe("getSourceContributions", () => {
  it("lists every source, including ones that did not score the model", () => {
    const other: Source = { ...source, id: "b", name: "Source B" };
    const contributions = getSourceContributions({ ...model, scores: { a: 0 } }, [source, other], {
      a: 0.5,
      b: 0.25,
    });

    expect(contributions).toEqual([
      { id: "a", name: "Source A", weight: 0.5, score: 0 },
      { id: "b", name: "Source B", weight: 0.25, score: null },
    ]);
  });

  it("falls back to a zero weight for a source missing from the weight map", () => {
    const contributions = getSourceContributions(model, [source], {});
    expect(contributions[0]?.weight).toBe(0);
  });
});

describe("toggleCompareSelection", () => {
  it("adds and removes models", () => {
    expect(toggleCompareSelection([], "a")).toEqual(["a"]);
    expect(toggleCompareSelection(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleCompareSelection(["a", "b"], "a")).toEqual(["b"]);
  });

  it("never selects more than the maximum", () => {
    const full = ["a", "b", "c"];
    expect(full).toHaveLength(MAX_COMPARE_MODELS);
    expect(toggleCompareSelection(full, "d")).toEqual(full);
    expect(toggleCompareSelection(full, "d")).not.toBe(full);
  });

  it("still allows removing a model at the limit", () => {
    expect(toggleCompareSelection(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });
});

describe("ranking formatting", () => {
  it("rounds only for display", () => {
    expect(formatScore(87.3889)).toBe("87.4");
    expect(formatScore(0)).toBe("0.0");
    expect(formatConfidence(0.8333)).toBe("83%");
    expect(formatConfidence(1)).toBe("100%");
    expect(formatWeight(0.58784)).toBe("0.588");
    expect(formatWeight(0)).toBe("0.000");
  });
});
