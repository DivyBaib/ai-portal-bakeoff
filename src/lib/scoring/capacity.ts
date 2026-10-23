/**
 * Context-window and tool-calling capacity (docs/SCORING.md section 4).
 * A 1,000,000-token window gives the full context term.
 */
export function computeCapacity(
  contextWindow: number,
  toolCalling: number,
): number {
  const contextTerm = Math.min(
    1,
    Math.log10(Math.max(contextWindow, 1)) / 6,
  );
  return 100 * (0.5 * contextTerm + 0.5 * toolCalling);
}
