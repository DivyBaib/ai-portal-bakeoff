import type { Mode, ModelInput } from "./types";

/** Unknown request limits are treated as 50 requests per day. */
const DEFAULT_REQUESTS_PER_DAY = 50;

/**
 * Access score for one model, or null when the model is not eligible in the
 * given mode (docs/SCORING.md section 5).
 */
export function computeAccess(model: ModelInput, mode: Mode): number | null {
  const requestsPerDay =
    model.free.requestsPerDay ?? DEFAULT_REQUESTS_PER_DAY;

  if (mode === "free-only") {
    if (!model.free.available) return null;
    return (
      100 *
      (0.7 * Math.min(1, requestsPerDay / 1000) +
        0.3 * (model.free.trainsOnPrompts ? 0 : 1))
    );
  }

  if (model.free.available) {
    return 80 + 20 * Math.min(1, requestsPerDay / 1000);
  }

  if (model.price !== null) {
    const blended =
      0.75 * model.price.inputPerMTok + 0.25 * model.price.outputPerMTok;
    return 100 / (1 + blended);
  }

  return null;
}
