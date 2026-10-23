import { describe, expect, it } from "vitest";
import { rankModels, computeSourceWeights } from "../../src/lib/scoring";
import type { ModelInput, RankInput, SourceInput } from "../../src/lib/scoring/types";

const srcA: SourceInput = { id: "srcA", reliability: 1, relevance: 1, ageDays: 0 };
const srcB: SourceInput = { id: "srcB", reliability: 0.5, relevance: 1, ageDays: 30 };

const baseModel: ModelInput = {
  id: "test",
  scores: { srcA: 80 },
  contextWindow: 100000,
  toolCalling: 0.5,
  free: { available: true, requestsPerDay: 100, trainsOnPrompts: false },
  price: null,
};

describe("rankModels: edge cases", () => {
  it("unknown requestsPerDay (null) defaults to 50 in free-only mode", () => {
    const model: ModelInput = {
      ...baseModel,
      id: "unknown-rpd",
      free: { available: true, requestsPerDay: null, trainsOnPrompts: false },
    };
    const input: RankInput = { models: [model], sources: [srcA] };
    const r = rankModels(input, "free-only");
    expect(r).toHaveLength(1);
    // rpd = 50 -> min(1, 50/1000) = 0.05 -> access = 100 * (0.7 * 0.05 + 0.3 * 1) = 100 * (0.035 + 0.3) = 33.5
    expect(r[0].breakdown.access).toBeCloseTo(33.5, 1);
  });

  it("unknown requestsPerDay (null) defaults to 50 in mixed mode", () => {
    const model: ModelInput = {
      ...baseModel,
      id: "unknown-rpd-mixed",
      free: { available: true, requestsPerDay: null, trainsOnPrompts: false },
    };
    const input: RankInput = { models: [model], sources: [srcA] };
    const r = rankModels(input, "mixed");
    expect(r).toHaveLength(1);
    // rpd = 50 -> min(1, 50/1000) = 0.05 -> access = 80 + 20 * 0.05 = 81
    expect(r[0].breakdown.access).toBeCloseTo(81, 1);
  });

  it("a source that scores no models gets weight 0", () => {
    const srcUnused: SourceInput = { id: "unused", reliability: 1, relevance: 1, ageDays: 0 };
    const model: ModelInput = {
      ...baseModel,
      scores: { srcA: 80 }, // no score for srcUnused
    };
    const input: RankInput = { models: [model], sources: [srcA, srcUnused] };
    const weights = computeSourceWeights(input);
    expect(weights.unused).toBe(0);
    expect(weights.srcA).toBeGreaterThan(0);
  });

  it("a source that scores no models does not affect quality or confidence", () => {
    const srcUnused: SourceInput = { id: "unused", reliability: 1, relevance: 1, ageDays: 0 };
    const model: ModelInput = {
      ...baseModel,
      scores: { srcA: 80 },
    };
    const input: RankInput = { models: [model], sources: [srcA, srcUnused] };
    const r = rankModels(input, "free-only");
    expect(r).toHaveLength(1);
    // quality should be exactly 80 (only srcA counts, weight 1 * 1 * 1 * 1 = 1)
    expect(r[0].breakdown.quality).toBe(80);
    // confidence should be 1 (all weight is from srcA which scored the model)
    expect(r[0].confidence).toBe(1);
  });

  it("toolCalling at 0 gives minimum capacity contribution", () => {
    const model: ModelInput = {
      ...baseModel,
      id: "tool-0",
      toolCalling: 0,
      contextWindow: 1000000, // max context term
    };
    const input: RankInput = { models: [model], sources: [srcA] };
    const r = rankModels(input, "free-only");
    expect(r).toHaveLength(1);
    // contextTerm = 1, toolTerm = 0 -> capacity = 100 * (0.5 * 1 + 0.5 * 0) = 50
    expect(r[0].breakdown.capacity).toBe(50);
  });

  it("toolCalling at 1 gives maximum capacity contribution", () => {
    const model: ModelInput = {
      ...baseModel,
      id: "tool-1",
      toolCalling: 1,
      contextWindow: 1000000, // max context term
    };
    const input: RankInput = { models: [model], sources: [srcA] };
    const r = rankModels(input, "free-only");
    expect(r).toHaveLength(1);
    // contextTerm = 1, toolTerm = 1 -> capacity = 100 * (0.5 * 1 + 0.5 * 1) = 100
    expect(r[0].breakdown.capacity).toBe(100);
  });

  it("contextWindow at 1 gives minimum context term", () => {
    const model: ModelInput = {
      ...baseModel,
      id: "ctx-1",
      toolCalling: 1,
      contextWindow: 1,
    };
    const input: RankInput = { models: [model], sources: [srcA] };
    const r = rankModels(input, "free-only");
    expect(r).toHaveLength(1);
    // log10(1) = 0 -> contextTerm = 0 -> capacity = 100 * (0.5 * 0 + 0.5 * 1) = 50
    expect(r[0].breakdown.capacity).toBe(50);
  });

  it("contextWindow at 1000000 gives full context term", () => {
    const model: ModelInput = {
      ...baseModel,
      id: "ctx-1m",
      toolCalling: 0,
      contextWindow: 1000000,
    };
    const input: RankInput = { models: [model], sources: [srcA] };
    const r = rankModels(input, "free-only");
    expect(r).toHaveLength(1);
    // log10(1000000) = 6 -> contextTerm = 1 -> capacity = 100 * (0.5 * 1 + 0.5 * 0) = 50
    expect(r[0].breakdown.capacity).toBe(50);
  });

  it("mixed mode: paid model with price computes access from blended price", () => {
    const model: ModelInput = {
      ...baseModel,
      id: "paid-model",
      free: { available: false, requestsPerDay: null, trainsOnPrompts: false },
      price: { inputPerMTok: 3, outputPerMTok: 15 },
    };
    const input: RankInput = { models: [model], sources: [srcA] };
    const r = rankModels(input, "mixed");
    expect(r).toHaveLength(1);
    // blended = 0.75 * 3 + 0.25 * 15 = 2.25 + 3.75 = 6
    // access = 100 / (1 + 6) = 100/7 ≈ 14.2857
    expect(r[0].breakdown.access).toBeCloseTo(100 / 7, 2);
  });

  it("mixed mode: model with no free and no price is excluded", () => {
    const model: ModelInput = {
      ...baseModel,
      id: "no-access",
      free: { available: false, requestsPerDay: null, trainsOnPrompts: false },
      price: null,
    };
    const input: RankInput = { models: [model], sources: [srcA] };
    const r = rankModels(input, "mixed");
    expect(r).toHaveLength(0);
  });

  it("free-only mode: model with free.available=false is excluded", () => {
    const model: ModelInput = {
      ...baseModel,
      id: "no-free",
      free: { available: false, requestsPerDay: 1000, trainsOnPrompts: false },
    };
    const input: RankInput = { models: [model], sources: [srcA] };
    const r = rankModels(input, "free-only");
    expect(r).toHaveLength(0);
  });

  it("trainsOnPrompts=true reduces access in free-only mode", () => {
    const modelTrue: ModelInput = {
      ...baseModel,
      id: "trains-true",
      free: { available: true, requestsPerDay: 1000, trainsOnPrompts: true },
    };
    const modelFalse: ModelInput = {
      ...baseModel,
      id: "trains-false",
      free: { available: true, requestsPerDay: 1000, trainsOnPrompts: false },
    };
    const input: RankInput = { models: [modelTrue, modelFalse], sources: [srcA] };
    const r = rankModels(input, "free-only");
    expect(r).toHaveLength(2);
    const byId = Object.fromEntries(r.map((m) => [m.id, m]));
    // trainsOnPrompts=true -> trainsTerm = 0 -> access = 100 * (0.7 * 1 + 0.3 * 0) = 70
    expect(byId["trains-true"].breakdown.access).toBe(70);
    // trainsOnPrompts=false -> trainsTerm = 1 -> access = 100 * (0.7 * 1 + 0.3 * 1) = 100
    expect(byId["trains-false"].breakdown.access).toBe(100);
  });

  it("trainsOnPrompts does not affect access in mixed mode when free.available=true", () => {
    const modelTrue: ModelInput = {
      ...baseModel,
      id: "trains-true-mixed",
      free: { available: true, requestsPerDay: 1000, trainsOnPrompts: true },
    };
    const modelFalse: ModelInput = {
      ...baseModel,
      id: "trains-false-mixed",
      free: { available: true, requestsPerDay: 1000, trainsOnPrompts: false },
    };
    const input: RankInput = { models: [modelTrue, modelFalse], sources: [srcA] };
    const r = rankModels(input, "mixed");
    expect(r).toHaveLength(2);
    const byId = Object.fromEntries(r.map((m) => [m.id, m]));
    // In mixed mode with free.available=true, access = 80 + 20 * min(1, rpd/1000)
    // rpd = 1000 -> min(1, 1) = 1 -> access = 100 for both
    expect(byId["trains-true-mixed"].breakdown.access).toBe(100);
    expect(byId["trains-false-mixed"].breakdown.access).toBe(100);
  });

  it("score components are within expected bounds", () => {
    const model: ModelInput = {
      ...baseModel,
      scores: { srcA: 0, srcB: 100 },
      contextWindow: 1,
      toolCalling: 0,
      free: { available: true, requestsPerDay: 0, trainsOnPrompts: true },
    };
    const input: RankInput = { models: [model], sources: [srcA, srcB] };
    const r = rankModels(input, "free-only");
    expect(r).toHaveLength(1);
    expect(r[0].breakdown.quality).toBeGreaterThanOrEqual(0);
    expect(r[0].breakdown.quality).toBeLessThanOrEqual(100);
    expect(r[0].breakdown.capacity).toBeGreaterThanOrEqual(0);
    expect(r[0].breakdown.capacity).toBeLessThanOrEqual(100);
    expect(r[0].breakdown.access).toBeGreaterThanOrEqual(0);
    expect(r[0].breakdown.access).toBeLessThanOrEqual(100);
    expect(r[0].score).toBeGreaterThanOrEqual(0);
    expect(r[0].score).toBeLessThanOrEqual(100);
    expect(r[0].confidence).toBeGreaterThanOrEqual(0);
    expect(r[0].confidence).toBeLessThanOrEqual(1);
  });
});

describe("computeSourceWeights: edge cases", () => {
  it("returns empty object for empty sources", () => {
    const input: RankInput = { models: [baseModel], sources: [] };
    const weights = computeSourceWeights(input);
    expect(weights).toEqual({});
  });

  it("returns zero weights for all sources when no models", () => {
    const input: RankInput = { models: [], sources: [srcA, srcB] };
    const weights = computeSourceWeights(input);
    expect(weights.srcA).toBe(0);
    expect(weights.srcB).toBe(0);
  });

  it("coverage is computed across all models before eligibility filtering", () => {
    const modelWithScore: ModelInput = {
      ...baseModel,
      id: "with-score",
      scores: { srcA: 80 },
      free: { available: false, requestsPerDay: null, trainsOnPrompts: false },
      price: null,
    };
    const modelWithoutScore: ModelInput = {
      ...baseModel,
      id: "without-score",
      scores: {},
      free: { available: false, requestsPerDay: null, trainsOnPrompts: false },
      price: null,
    };
    // Both models counted for coverage even though both would be excluded in free-only
    const input: RankInput = { models: [modelWithScore, modelWithoutScore], sources: [srcA] };
    const weights = computeSourceWeights(input);
    // coverage = 1/2 = 0.5
    // freshness = 1, reliability = 1, relevance = 1
    // weight = 1 * 1 * 1 * 0.5 = 0.5
    expect(weights.srcA).toBe(0.5);
  });

  it("freshness decays correctly with ageDays", () => {
    const srcNew: SourceInput = { id: "new", reliability: 1, relevance: 1, ageDays: 0 };
    const srcOld: SourceInput = { id: "old", reliability: 1, relevance: 1, ageDays: 30 };
    const model: ModelInput = { ...baseModel, scores: { new: 80, old: 80 } };
    const input: RankInput = { models: [model], sources: [srcNew, srcOld] };
    const weights = computeSourceWeights(input);
    // new: freshness = 0.5^(0/30) = 1
    // old: freshness = 0.5^(30/30) = 0.5
    expect(weights.new).toBe(1);
    expect(weights.old).toBe(0.5);
  });

  it("ignores scores for sources not listed in input.sources", () => {
    const model: ModelInput = {
      ...baseModel,
      scores: { srcA: 80, unknownSource: 99 },
    };
    const input: RankInput = { models: [model], sources: [srcA] };
    const r = rankModels(input, "free-only");
    expect(r).toHaveLength(1);
    // quality should be 80 (only srcA counts)
    expect(r[0].breakdown.quality).toBe(80);
  });
});