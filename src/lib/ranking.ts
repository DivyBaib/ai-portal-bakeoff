import type { Model, Source } from "../data/schemas";
import type { ModelInput, RankInput, SourceInput } from "./scoring/types";

/** A source's weight and the score the selected model received from it. */
export interface SourceContribution {
  id: string;
  name: string;
  weight: number;
  /** null when the model has no score from this source. */
  score: number | null;
}

export const MIN_COMPARE_MODELS = 2;
export const MAX_COMPARE_MODELS = 3;

/**
 * Maps a display model from `data/seed/models.json` to the scoring contract.
 * Display-only fields such as `name` and `vendor` are dropped.
 */
export function toModelInput(model: Model): ModelInput {
  return {
    id: model.id,
    scores: { ...model.scores },
    contextWindow: model.contextWindow,
    toolCalling: model.toolCalling,
    free: {
      available: model.free.available,
      requestsPerDay: model.free.requestsPerDay,
      trainsOnPrompts: model.free.trainsOnPrompts,
    },
    price: model.price === null ? null : { ...model.price },
  };
}

/** Maps a display source from `data/seed/sources.json` to the scoring contract. */
export function toSourceInput(source: Source): SourceInput {
  return {
    id: source.id,
    reliability: source.reliability,
    relevance: source.relevance,
    ageDays: source.ageDays,
  };
}

export function buildRankInput(
  models: readonly Model[],
  sources: readonly Source[],
): RankInput {
  return {
    models: models.map(toModelInput),
    sources: sources.map(toSourceInput),
  };
}

/**
 * One row per listed source for the "why this rank" panel. Sources the model
 * was not scored by stay in the list with a null score, so the panel never
 * hides a source.
 */
export function getSourceContributions(
  model: Model,
  sources: readonly Source[],
  weights: Readonly<Record<string, number>>,
): SourceContribution[] {
  return sources.map((source) => ({
    id: source.id,
    name: source.name,
    weight: weights[source.id] ?? 0,
    score: model.scores[source.id] ?? null,
  }));
}

/**
 * Adds or removes a model from the compare selection. A fourth model is never
 * added; callers disable further checkboxes once the maximum is reached.
 */
export function toggleCompareSelection(
  selected: readonly string[],
  id: string,
): string[] {
  if (selected.includes(id)) {
    return selected.filter((selectedId) => selectedId !== id);
  }
  if (selected.length >= MAX_COMPARE_MODELS) {
    return [...selected];
  }
  return [...selected, id];
}

const scoreFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const weightFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

export function formatScore(value: number): string {
  return scoreFormatter.format(value);
}

export function formatConfidence(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatWeight(value: number): string {
  return weightFormatter.format(value);
}
