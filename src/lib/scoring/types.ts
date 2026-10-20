// PROTECTED CONTRACT: do not modify. See docs/SCORING.md.

export type Mode = "free-only" | "mixed";

export interface SourceInput {
  id: string;
  /** 0..1: trust in the source's methodology and independence. */
  reliability: number;
  /** 0..1: relevance of the source to the user's coding task. */
  relevance: number;
  /** Days since the source last updated. */
  ageDays: number;
}

export interface ModelInput {
  id: string;
  /** Source id -> score normalized to 0..100. A missing key means "not scored by that source". */
  scores: Record<string, number>;
  /** Context window in tokens. */
  contextWindow: number;
  /** 0..1 estimate of tool-calling reliability. */
  toolCalling: number;
  free: {
    available: boolean;
    /** null = unknown. */
    requestsPerDay: number | null;
    trainsOnPrompts: boolean;
  };
  /** USD per 1M tokens. null = no paid price known. */
  price: { inputPerMTok: number; outputPerMTok: number } | null;
}

export interface RankInput {
  models: ModelInput[];
  sources: SourceInput[];
}

export interface RankedModel {
  id: string;
  /** Final score, 0..100. */
  score: number;
  /** 0..1: share of total source weight that actually scored this model. */
  confidence: number;
  breakdown: {
    quality: number;
    capacity: number;
    access: number;
  };
}
