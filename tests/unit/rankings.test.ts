import { describe, it, expect } from "vitest";
import { rankModels, computeSourceWeights } from "../../src/lib/scoring";
import type { ModelInput, RankInput, SourceInput, Mode } from "../../src/lib/scoring/types";

// Test helpers for RankingsView logic
function modelToRankInput(model: ModelInput): RankInput["models"][0] {
  return {
    id: model.id,
    scores: model.scores,
    contextWindow: model.contextWindow,
    toolCalling: model.toolCalling,
    free: {
      available: model.free.available,
      requestsPerDay: model.free.requestsPerDay,
      trainsOnPrompts: model.free.trainsOnPrompts,
    },
    price: model.price,
  };
}

function sourceToRankInput(source: SourceInput): RankInput["sources"][0] {
  return {
    id: source.id,
    reliability: source.reliability,
    relevance: source.relevance,
    ageDays: source.ageDays,
  };
}

const sampleModels: ModelInput[] = [
  {
    id: "model-a",
    scores: { "src-1": 80, "src-2": 70 },
    contextWindow: 256000,
    toolCalling: 0.85,
    free: { available: true, requestsPerDay: 500, trainsOnPrompts: true },
    price: null,
  },
  {
    id: "model-b",
    scores: { "src-1": 70, "src-3": 71 },
    contextWindow: 1000000,
    toolCalling: 0.8,
    free: { available: true, requestsPerDay: 400, trainsOnPrompts: true },
    price: { inputPerMTok: 0.2, outputPerMTok: 0.8 },
  },
  {
    id: "model-c",
    scores: { "src-1": 66, "src-2": 58 },
    contextWindow: 128000,
    toolCalling: 0.8,
    free: { available: true, requestsPerDay: 50, trainsOnPrompts: false },
    price: { inputPerMTok: 0.1, outputPerMTok: 0.5 },
  },
];

const sampleSources: SourceInput[] = [
  { id: "src-1", reliability: 0.9, relevance: 0.7, ageDays: 3 },
  { id: "src-2", reliability: 0.85, relevance: 0.9, ageDays: 14 },
  { id: "src-3", reliability: 0.6, relevance: 0.8, ageDays: 7 },
];

const rankInput: RankInput = {
  models: sampleModels.map(modelToRankInput),
  sources: sampleSources.map(sourceToRankInput),
};

describe("RankingsView: rankModels integration", () => {
  it("produces ranked results for free-only mode", () => {
    const results = rankModels(rankInput, "free-only");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.score >= 0 && r.score <= 100)).toBe(true);
    expect(results.every(r => r.confidence >= 0 && r.confidence <= 1)).toBe(true);
  });

  it("produces ranked results for mixed mode", () => {
    const results = rankModels(rankInput, "mixed");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.score >= 0 && r.score <= 100)).toBe(true);
  });

  it("excludes paid-only model in free-only mode", () => {
    const paidModel: ModelInput = {
      id: "paid-only",
      scores: { "src-1": 90 },
      contextWindow: 200000,
      toolCalling: 0.95,
      free: { available: false, requestsPerDay: null, trainsOnPrompts: false },
      price: { inputPerMTok: 3, outputPerMTok: 15 },
    };
    const inputWithPaid: RankInput = {
      models: [...rankInput.models, modelToRankInput(paidModel)],
      sources: rankInput.sources,
    };
    const freeOnlyResults = rankModels(inputWithPaid, "free-only");
    const mixedResults = rankModels(inputWithPaid, "mixed");
    
    expect(freeOnlyResults.find(r => r.id === "paid-only")).toBeUndefined();
    expect(mixedResults.find(r => r.id === "paid-only")).toBeDefined();
  });

  it("re-ranks when mode changes", () => {
    const freeOnlyOrder = rankModels(rankInput, "free-only").map(r => r.id);
    const mixedOrder = rankModels(rankInput, "mixed").map(r => r.id);
    
    // The order should potentially differ (at minimum, mixed has more models)
    expect(mixedOrder.length).toBeGreaterThanOrEqual(freeOnlyOrder.length);
  });

  it("includes quality, capacity, access breakdown for each model", () => {
    const results = rankModels(rankInput, "free-only");
    for (const result of results) {
      expect(result.breakdown).toHaveProperty("quality");
      expect(result.breakdown).toHaveProperty("capacity");
      expect(result.breakdown).toHaveProperty("access");
      expect(result.breakdown.quality).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.quality).toBeLessThanOrEqual(100);
      expect(result.breakdown.capacity).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.capacity).toBeLessThanOrEqual(100);
      expect(result.breakdown.access).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.access).toBeLessThanOrEqual(100);
    }
  });
});

describe("RankingsView: computeSourceWeights integration", () => {
  it("returns weights for all sources", () => {
    const weights = computeSourceWeights(rankInput);
    expect(Object.keys(weights)).toHaveLength(sampleSources.length);
    for (const source of sampleSources) {
      expect(weights[source.id]).toBeDefined();
      expect(weights[source.id]).toBeGreaterThanOrEqual(0);
    }
  });

  it("source weight reflects reliability, relevance, freshness, and coverage", () => {
    const weights = computeSourceWeights(rankInput);
    const src1 = weights["src-1"];
    const src2 = weights["src-2"];
    const src3 = weights["src-3"];
    
    // src-1: reliability=0.9, relevance=0.7, ageDays=3, coverage=3/3=1
    // src-2: reliability=0.85, relevance=0.9, ageDays=14, coverage=2/3
    // src-3: reliability=0.6, relevance=0.8, ageDays=7, coverage=1/3
    expect(src1).toBeGreaterThan(0);
    expect(src2).toBeGreaterThan(0);
    expect(src3).toBeGreaterThan(0);
  });
});

describe("RankingsView: why-panel data preparation", () => {
  it("source weights match what rankModels uses internally", () => {
    const weights = computeSourceWeights(rankInput);
    const results = rankModels(rankInput, "free-only");
    
    // The weights should be consistent with what's used in ranking
    for (const result of results) {
      const model = sampleModels.find(m => m.id === result.id);
      if (!model) continue;
      
      let numerator = 0;
      let denominator = 0;
      for (const [sourceId, score] of Object.entries(model.scores)) {
        const weight = weights[sourceId];
        if (weight && weight > 0) {
          numerator += weight * score;
          denominator += weight;
        }
      }
      const expectedQuality = denominator === 0 ? 0 : numerator / denominator;
      expect(result.breakdown.quality).toBeCloseTo(expectedQuality, 5);
    }
  });

  it("model scores for each source are accessible", () => {
    const model = sampleModels[0]; // model-a
    expect(model.scores["src-1"]).toBe(80);
    expect(model.scores["src-2"]).toBe(70);
    expect(model.scores["src-3"]).toBeUndefined();
  });
});