import { computeAccess } from "./access";
import { computeCapacity } from "./capacity";
import { computeConfidence, computeQuality } from "./quality";
import type { Mode, RankInput, RankedModel } from "./types";
import { computeSourceWeights } from "./weights";

export type * from "./types";
export { computeSourceWeights } from "./weights";

/** Plain string comparison, used to break score ties deterministically. */
function compareIds(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Rank the eligible models best-first (docs/SCORING.md).
 * Pure and deterministic: the input is never mutated.
 */
export function rankModels(input: RankInput, mode: Mode): RankedModel[] {
  const weights = computeSourceWeights(input);
  const ranked: RankedModel[] = [];

  for (const model of input.models) {
    const access = computeAccess(model, mode);
    if (access === null) continue;

    const quality = computeQuality(model.scores, weights);
    const capacity = computeCapacity(model.contextWindow, model.toolCalling);
    const score = 0.55 * quality + 0.2 * capacity + 0.25 * access;

    ranked.push({
      id: model.id,
      score,
      confidence: computeConfidence(model.scores, weights),
      breakdown: { quality, capacity, access },
    });
  }

  return ranked.sort(
    (a, b) => b.score - a.score || compareIds(a.id, b.id),
  );
}
