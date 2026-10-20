import type { Mode, RankInput, RankedModel } from "./types";

export type * from "./types";

/**
 * Rank models for the given mode. Implement exactly as specified in docs/SCORING.md.
 * Baseline stub: Phase 2 replaces this.
 */
export function rankModels(_input: RankInput, _mode: Mode): RankedModel[] {
  throw new Error("Not implemented: rankModels (see docs/SCORING.md)");
}
