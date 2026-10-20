// PROTECTED: human-written acceptance tests. Do not modify.
// Spec: docs/SCORING.md. Contract types: src/lib/scoring/types.ts.
import { describe, expect, it } from "vitest";
import { rankModels } from "../../src/lib/scoring";
import type { ModelInput, RankInput, SourceInput } from "../../src/lib/scoring/types";

const srcA: SourceInput = { id: "srcA", reliability: 1, relevance: 1, ageDays: 0 };
const srcB: SourceInput = { id: "srcB", reliability: 0.5, relevance: 1, ageDays: 30 };

const alpha: ModelInput = {
  id: "alpha",
  scores: { srcA: 80, srcB: 70 },
  contextWindow: 1_000_000,
  toolCalling: 0.9,
  free: { available: true, requestsPerDay: 1000, trainsOnPrompts: false },
  price: null,
};
const beta: ModelInput = {
  id: "beta",
  scores: { srcA: 98 },
  contextWindow: 128_000,
  toolCalling: 0.8,
  free: { available: true, requestsPerDay: 20, trainsOnPrompts: true },
  price: null,
};
const gamma: ModelInput = {
  id: "gamma",
  scores: { srcA: 95, srcB: 90 },
  contextWindow: 200_000,
  toolCalling: 0.95,
  free: { available: false, requestsPerDay: null, trainsOnPrompts: false },
  price: { inputPerMTok: 3, outputPerMTok: 15 },
};
const delta: ModelInput = {
  id: "delta",
  scores: { srcA: 50 },
  contextWindow: 32_000,
  toolCalling: 0.5,
  free: { available: false, requestsPerDay: null, trainsOnPrompts: false },
  price: null,
};

const input: RankInput = { models: [alpha, beta, gamma, delta], sources: [srcA, srcB] };

const byId = (r: ReturnType<typeof rankModels>) => Object.fromEntries(r.map((m) => [m.id, m]));
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

describe("rankModels: eligibility", () => {
  it("free-only excludes models without a free path", () => {
    const ids = rankModels(input, "free-only").map((m) => m.id).sort();
    expect(ids).toEqual(["alpha", "beta"]);
  });

  it("mixed excludes models that are neither free nor priced", () => {
    const ids = rankModels(input, "mixed").map((m) => m.id).sort();
    expect(ids).toEqual(["alpha", "beta", "gamma"]);
  });

  it("returns an empty list for empty input", () => {
    expect(rankModels({ models: [], sources: [] }, "mixed")).toEqual([]);
  });
});

describe("rankModels: exact scores", () => {
  it("free-only scores match docs/SCORING.md", () => {
    const r = byId(rankModels(input, "free-only"));
    expect(r.alpha!.breakdown.quality).toBeCloseTo(78.8889, 2);
    expect(r.alpha!.breakdown.capacity).toBeCloseTo(95, 2);
    expect(r.alpha!.breakdown.access).toBeCloseTo(100, 2);
    expect(r.alpha!.score).toBeCloseTo(87.3889, 2);
    expect(r.beta!.breakdown.quality).toBeCloseTo(98, 2);
    expect(r.beta!.breakdown.capacity).toBeCloseTo(82.5601, 2);
    expect(r.beta!.breakdown.access).toBeCloseTo(1.4, 2);
    expect(r.beta!.score).toBeCloseTo(70.762, 2);
  });

  it("mixed scores match docs/SCORING.md", () => {
    const r = byId(rankModels(input, "mixed"));
    expect(r.alpha!.score).toBeCloseTo(87.3889, 2);
    expect(r.beta!.breakdown.access).toBeCloseTo(80.4, 2);
    expect(r.beta!.score).toBeCloseTo(90.512, 2);
    expect(r.gamma!.breakdown.quality).toBeCloseTo(94.4444, 2);
    expect(r.gamma!.breakdown.capacity).toBeCloseTo(91.6752, 2);
    expect(r.gamma!.breakdown.access).toBeCloseTo(14.2857, 2);
    expect(r.gamma!.score).toBeCloseTo(73.8509, 2);
  });

  it("confidence is the share of total source weight that scored the model", () => {
    const r = byId(rankModels(input, "mixed"));
    expect(r.alpha!.confidence).toBeCloseTo(1, 4);
    expect(r.gamma!.confidence).toBeCloseTo(1, 4);
    expect(r.beta!.confidence).toBeCloseTo(1 / 1.125, 4);
  });
});

describe("rankModels: ordering", () => {
  it("the mode changes the order", () => {
    expect(rankModels(input, "free-only").map((m) => m.id)).toEqual(["alpha", "beta"]);
    expect(rankModels(input, "mixed").map((m) => m.id)).toEqual(["beta", "alpha", "gamma"]);
  });

  it("breaks ties by id ascending", () => {
    const twinB = { ...clone(alpha), id: "b-twin" };
    const twinA = { ...clone(alpha), id: "a-twin" };
    const r = rankModels({ models: [twinB, twinA], sources: [srcA, srcB] }, "free-only");
    expect(r.map((m) => m.id)).toEqual(["a-twin", "b-twin"]);
  });
});

describe("rankModels: source weighting", () => {
  it("an older source influences quality less", () => {
    const quality = (ageDays: number) => {
      const r = rankModels(
        { models: [alpha, beta, gamma, delta], sources: [srcA, { ...srcB, ageDays }] },
        "mixed",
      );
      return byId(r).alpha!.breakdown.quality;
    };
    // alpha: srcA says 80, srcB says 70. The older srcB gets, the closer quality is to 80.
    expect(quality(0)).toBeLessThan(quality(30));
    expect(quality(30)).toBeLessThan(quality(365));
    expect(quality(365)).toBeLessThanOrEqual(80);
  });

  it("a model with no scores has zero quality and zero confidence", () => {
    const blank: ModelInput = { ...clone(alpha), id: "blank", scores: {} };
    const r = byId(rankModels({ models: [alpha, blank], sources: [srcA, srcB] }, "free-only"));
    expect(r.blank!.breakdown.quality).toBe(0);
    expect(r.blank!.confidence).toBe(0);
  });
});

describe("rankModels: hygiene", () => {
  it("does not mutate its input", () => {
    const frozen = clone(input);
    const deepFreeze = (o: unknown): void => {
      if (o && typeof o === "object") {
        Object.values(o).forEach(deepFreeze);
        Object.freeze(o);
      }
    };
    deepFreeze(frozen);
    expect(() => rankModels(frozen, "mixed")).not.toThrow();
  });

  it("returns scores within 0..100 and confidence within 0..1", () => {
    for (const mode of ["free-only", "mixed"] as const) {
      for (const m of rankModels(input, mode)) {
        expect(m.score).toBeGreaterThanOrEqual(0);
        expect(m.score).toBeLessThanOrEqual(100);
        expect(m.confidence).toBeGreaterThanOrEqual(0);
        expect(m.confidence).toBeLessThanOrEqual(1);
      }
    }
  });
});
