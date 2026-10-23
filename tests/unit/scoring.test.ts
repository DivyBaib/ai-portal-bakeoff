import { describe, expect, it } from "vitest";
import { computeSourceWeights, rankModels } from "../../src/lib/scoring";
import type {
  Mode,
  ModelInput,
  RankInput,
  SourceInput,
} from "../../src/lib/scoring/types";

const source = (overrides: Partial<SourceInput> = {}): SourceInput => ({
  id: "s",
  reliability: 1,
  relevance: 1,
  ageDays: 0,
  ...overrides,
});

const model = (overrides: Partial<ModelInput> = {}): ModelInput => ({
  id: "m",
  scores: {},
  contextWindow: 1_000_000,
  toolCalling: 1,
  free: { available: true, requestsPerDay: 1000, trainsOnPrompts: false },
  price: null,
  ...overrides,
});

function rankOne(
  overrides: Partial<ModelInput>,
  mode: Mode = "free-only",
  sources: SourceInput[] = [source()],
) {
  const [ranked] = rankModels(
    { models: [model({ scores: { s: 0 }, ...overrides })], sources },
    mode,
  );
  return ranked;
}

function accessFor(
  overrides: Partial<ModelInput>,
  mode: Mode = "free-only",
): number | undefined {
  return rankOne(overrides, mode)?.breakdown.access;
}

function capacityFor(contextWindow: number, toolCalling: number): number {
  return rankOne({ contextWindow, toolCalling }).breakdown.capacity;
}

describe("computeSourceWeights", () => {
  it("combines reliability, relevance, freshness and coverage", () => {
    const fresh = source({ id: "fresh", reliability: 0.9, relevance: 0.8 });
    const old = source({ id: "old", ageDays: 30 });
    const unused = source({ id: "unused" });
    const input: RankInput = {
      sources: [fresh, old, unused],
      models: [
        model({ id: "a", scores: { fresh: 80, old: 20 } }),
        model({ id: "b", scores: { fresh: 60 } }),
      ],
    };

    const weights = computeSourceWeights(input);

    expect(weights.fresh).toBeCloseTo(0.9 * 0.8);
    // freshness = 0.5 ^ (30 / 30) = 0.5, coverage = 1/2.
    expect(weights.old).toBeCloseTo(0.25);
    expect(weights.unused).toBe(0);
  });

  it("returns a weight of 0 for every source when there are no models", () => {
    expect(
      computeSourceWeights({ models: [], sources: [source()] }),
    ).toEqual({ s: 0 });
  });

  it("counts models before eligibility filtering", () => {
    const eligible = model({ id: "eligible", scores: { s: 50 } });
    const ineligible = model({
      id: "ineligible",
      scores: { s: 50 },
      free: { available: false, requestsPerDay: null, trainsOnPrompts: false },
    });

    expect(
      computeSourceWeights({ models: [eligible, ineligible], sources: [source()] }),
    ).toEqual({ s: 1 });
  });

  it("treats a present score of 0 as scored and ignores unlisted keys", () => {
    const input: RankInput = {
      models: [
        model({ id: "a", scores: { s: 0 } }),
        model({ id: "b", scores: { ghost: 100 } }),
      ],
      sources: [source()],
    };

    expect(computeSourceWeights(input)).toEqual({ s: 0.5 });
  });
});

describe("quality and confidence edge cases", () => {
  it("ignores score keys that are not listed sources", () => {
    const ranked = rankOne({ scores: { s: 80, ghost: 0 } });
    expect(ranked.breakdown.quality).toBeCloseTo(80);
    expect(ranked.confidence).toBeCloseTo(1);
  });

  it("treats a present score of 0 as a real score", () => {
    const ranked = rankOne({ scores: { s: 0 } });
    expect(ranked.breakdown.quality).toBe(0);
    expect(ranked.confidence).toBe(1);
  });

  it("gives a source that scored no models no weight and no confidence", () => {
    const scored = source({ id: "scored" });
    const empty = source({ id: "empty" });
    const ranked = rankOne(
      { scores: { scored: 90 } },
      "free-only",
      [scored, empty],
    );

    expect(ranked.breakdown.quality).toBeCloseTo(90);
    expect(ranked.confidence).toBeCloseTo(1);
    expect(computeSourceWeights({
      models: [model({ scores: { scored: 90 } })],
      sources: [scored, empty],
    }).empty).toBe(0);
  });

  it("has zero quality and confidence when no listed source scored the model", () => {
    const ranked = rankOne({ scores: {} });
    expect(ranked.breakdown.quality).toBe(0);
    expect(ranked.confidence).toBe(0);
  });
});

describe("access", () => {
  it("treats unknown requestsPerDay as 50 in free-only mode", () => {
    const access = accessFor({
      free: { available: true, requestsPerDay: null, trainsOnPrompts: false },
    });
    // 100 * (0.7 * 50 / 1000 + 0.3) = 33.5
    expect(access).toBeCloseTo(33.5);
  });

  it("treats unknown requestsPerDay as 50 in mixed mode", () => {
    const access = accessFor(
      { free: { available: true, requestsPerDay: null, trainsOnPrompts: false } },
      "mixed",
    );
    // 80 + 20 * 50 / 1000 = 81
    expect(access).toBeCloseTo(81);
  });

  it("handles the request-per-day bounds", () => {
    const atZero = {
      available: true,
      requestsPerDay: 0,
      trainsOnPrompts: false,
    };
    const atThousand = {
      available: true,
      requestsPerDay: 1000,
      trainsOnPrompts: false,
    };

    expect(accessFor({ free: atZero })).toBeCloseTo(30);
    expect(accessFor({ free: atZero }, "mixed")).toBeCloseTo(80);
    expect(accessFor({ free: atThousand })).toBeCloseTo(100);
    expect(accessFor({ free: atThousand }, "mixed")).toBeCloseTo(100);
  });

  it("does not penalise training-on-prompts models in mixed mode", () => {
    const free = {
      available: true,
      requestsPerDay: 1000,
      trainsOnPrompts: true,
    };
    expect(accessFor({ free })).toBeCloseTo(70);
    expect(accessFor({ free }, "mixed")).toBeCloseTo(100);
  });

  it("prices paid models by their blended token cost in mixed mode", () => {
    const access = accessFor(
      {
        free: {
          available: false,
          requestsPerDay: null,
          trainsOnPrompts: false,
        },
        price: { inputPerMTok: 3, outputPerMTok: 15 },
      },
      "mixed",
    );
    // blended = 0.75 * 3 + 0.25 * 15 = 6, access = 100 / 7
    expect(access).toBeCloseTo(100 / 7);
  });

  it("excludes ineligible models from each mode", () => {
    const unavailable = {
      available: false,
      requestsPerDay: null,
      trainsOnPrompts: false,
    };

    expect(accessFor({ free: unavailable }, "free-only")).toBeUndefined();
    expect(accessFor({ free: unavailable }, "mixed")).toBeUndefined();
    expect(
      accessFor(
        {
          free: unavailable,
          price: { inputPerMTok: 1, outputPerMTok: 2 },
        },
        "free-only",
      ),
    ).toBeUndefined();
    expect(
      rankModels(
        {
          models: [model({ free: unavailable })],
          sources: [source()],
        },
        "mixed",
      ),
    ).toEqual([]);
  });
});

describe("capacity", () => {
  it("handles toolCalling at 0 and at 1", () => {
    expect(capacityFor(1_000_000, 0)).toBeCloseTo(50);
    expect(capacityFor(1_000_000, 1)).toBeCloseTo(100);
    expect(capacityFor(1, 0)).toBeCloseTo(0);
    expect(capacityFor(1, 1)).toBeCloseTo(50);
  });

  it("treats a non-positive context window as 1 token", () => {
    expect(capacityFor(0, 0.5)).toBeCloseTo(25);
  });

  it("gives the full context term at 1,000,000 tokens", () => {
    expect(capacityFor(1_000_000, 0.5)).toBeCloseTo(75);
    expect(capacityFor(128_000, 0.5)).toBeCloseTo(
      100 * (0.5 * (Math.log10(128_000) / 6) + 0.25),
    );
  });
});

describe("final score", () => {
  it("applies the documented 55/20/25 weights", () => {
    const ranked = rankOne({
      scores: { s: 80 },
      contextWindow: 1_000_000,
      toolCalling: 0.5,
      free: { available: true, requestsPerDay: 400, trainsOnPrompts: false },
    });

    expect(ranked.breakdown.quality).toBeCloseTo(80);
    expect(ranked.breakdown.capacity).toBeCloseTo(75);
    expect(ranked.breakdown.access).toBeCloseTo(58);
    // 0.55 * 80 + 0.20 * 75 + 0.25 * 58 = 73.5
    expect(ranked.score).toBeCloseTo(73.5);
  });

  it("scores a perfect model at 100", () => {
    const ranked = rankOne({ scores: { s: 100 } });
    expect(ranked.score).toBeCloseTo(100);
    expect(ranked.confidence).toBeCloseTo(1);
  });

  it("returns an empty list when there are sources but no models", () => {
    expect(rankModels({ models: [], sources: [source()] }, "mixed")).toEqual([]);
  });
});
