import { hasScore } from "./weights";

/**
 * Weighted average of the scores from listed sources that scored the model
 * (docs/SCORING.md section 2). Returns 0 when no weight is available.
 */
export function computeQuality(
  scores: Record<string, number>,
  weights: Record<string, number>,
): number {
  let weightedScore = 0;
  let totalWeight = 0;

  for (const [sourceId, weight] of Object.entries(weights)) {
    if (!hasScore(scores, sourceId)) continue;
    weightedScore += weight * scores[sourceId];
    totalWeight += weight;
  }

  return totalWeight === 0 ? 0 : weightedScore / totalWeight;
}

/**
 * Share of all source weight that scored the model (docs/SCORING.md section 3).
 * Returns 0 when the total weight is 0.
 */
export function computeConfidence(
  scores: Record<string, number>,
  weights: Record<string, number>,
): number {
  let totalWeight = 0;
  let scoredWeight = 0;

  for (const [sourceId, weight] of Object.entries(weights)) {
    totalWeight += weight;
    if (hasScore(scores, sourceId)) scoredWeight += weight;
  }

  return totalWeight === 0 ? 0 : scoredWeight / totalWeight;
}
