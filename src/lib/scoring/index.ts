import type { Mode, RankInput, RankedModel, SourceInput, ModelInput } from "./types";

/**
 * Compute source weights for all sources in the input.
 * weight_s = reliability * relevance * freshness * coverage
 * freshness = 0.5 ^ (ageDays / 30)
 * coverage = (models with score for s) / (total models)
 */
export function computeSourceWeights(input: RankInput): Record<string, number> {
  const { models, sources } = input;
  const totalModels = models.length;
  
  if (totalModels === 0) {
    return Object.fromEntries(sources.map((s) => [s.id, 0]));
  }

  // Precompute which models have scores for each source
  const sourceCoverage = new Map<string, number>();
  for (const source of sources) {
    let count = 0;
    for (const model of models) {
      if (source.id in model.scores) {
        count++;
      }
    }
    sourceCoverage.set(source.id, count / totalModels);
  }

  const weights: Record<string, number> = {};
  for (const source of sources) {
    const freshness = Math.pow(0.5, source.ageDays / 30);
    const coverage = sourceCoverage.get(source.id) ?? 0;
    weights[source.id] = source.reliability * source.relevance * freshness * coverage;
  }

  return weights;
}

/**
 * Compute quality score for a model (0-100).
 * quality = sum(weight_s * score_s) / sum(weight_s) for sources that scored the model
 */
function computeQuality(model: ModelInput, weights: Record<string, number>): number {
  let numerator = 0;
  let denominator = 0;

  for (const [sourceId, score] of Object.entries(model.scores)) {
    const weight = weights[sourceId];
    if (weight === undefined || weight === 0) continue;
    numerator += weight * score;
    denominator += weight;
  }

  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Compute confidence for a model (0-1).
 * confidence = sum(weight_s for sources that scored model) / sum(weight_s for all sources)
 */
function computeConfidence(model: ModelInput, weights: Record<string, number>): number {
  let scoredWeight = 0;
  let totalWeight = 0;

  for (const weight of Object.values(weights)) {
    totalWeight += weight;
  }

  for (const sourceId of Object.keys(model.scores)) {
    const weight = weights[sourceId];
    if (weight !== undefined) {
      scoredWeight += weight;
    }
  }

  return totalWeight === 0 ? 0 : scoredWeight / totalWeight;
}

/**
 * Compute capacity score for a model (0-100).
 * capacity = 100 * (0.5 * min(1, log10(max(contextWindow, 1)) / 6) + 0.5 * toolCalling)
 */
function computeCapacity(model: ModelInput): number {
  const contextTerm = Math.min(1, Math.log10(Math.max(model.contextWindow, 1)) / 6);
  const toolTerm = model.toolCalling;
  return 100 * (0.5 * contextTerm + 0.5 * toolTerm);
}

/**
 * Compute access score for a model (0-100) and determine eligibility.
 * Returns { access, eligible }.
 */
function computeAccess(model: ModelInput, mode: Mode): { access: number; eligible: boolean } {
  const rpd = model.free.requestsPerDay ?? 50;

  if (mode === "free-only") {
    if (!model.free.available) {
      return { access: 0, eligible: false };
    }
    const rpdTerm = Math.min(1, rpd / 1000);
    const trainsTerm = model.free.trainsOnPrompts ? 0 : 1;
    const access = 100 * (0.7 * rpdTerm + 0.3 * trainsTerm);
    return { access, eligible: true };
  }

  // mixed mode
  if (model.free.available) {
    const rpdTerm = Math.min(1, rpd / 1000);
    const access = 80 + 20 * rpdTerm;
    return { access, eligible: true };
  }

  if (model.price !== null) {
    const blended = 0.75 * model.price.inputPerMTok + 0.25 * model.price.outputPerMTok;
    const access = 100 / (1 + blended);
    return { access, eligible: true };
  }

  return { access: 0, eligible: false };
}

/**
 * Rank models for the given mode. Implement exactly as specified in docs/SCORING.md.
 */
export function rankModels(input: RankInput, mode: Mode): RankedModel[] {
  const { models, sources } = input;

  if (models.length === 0) {
    return [];
  }

  // Compute source weights once
  const weights = computeSourceWeights(input);

  // Process each model
  const ranked: RankedModel[] = [];
  for (const model of models) {
    const { access, eligible } = computeAccess(model, mode);
    if (!eligible) continue;

    const quality = computeQuality(model, weights);
    const capacity = computeCapacity(model);
    const confidence = computeConfidence(model, weights);

    const score = 0.55 * quality + 0.20 * capacity + 0.25 * access;

    ranked.push({
      id: model.id,
      score,
      confidence,
      breakdown: { quality, capacity, access },
    });
  }

  // Sort by score descending, then by id ascending
  ranked.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.id.localeCompare(b.id);
  });

  return ranked;
}

export type * from "./types";