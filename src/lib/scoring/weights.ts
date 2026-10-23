import type { RankInput } from "./types";

/** A source "has a score" when the model lists it, even if the score is 0. */
export function hasScore(
  scores: Record<string, number>,
  sourceId: string,
): boolean {
  return Object.hasOwn(scores, sourceId);
}

/**
 * Compute `weight_s` for every listed source (docs/SCORING.md section 1).
 * Coverage is measured across all models, before eligibility filtering.
 */
export function computeSourceWeights(input: RankInput): Record<string, number> {
  const modelCount = input.models.length;
  const weights: Record<string, number> = {};

  for (const source of input.sources) {
    const freshness = 0.5 ** (source.ageDays / 30);
    const scoredCount = input.models.filter((model) =>
      hasScore(model.scores, source.id),
    ).length;
    const coverage = modelCount === 0 ? 0 : scoredCount / modelCount;

    weights[source.id] =
      source.reliability * source.relevance * freshness * coverage;
  }

  return weights;
}
