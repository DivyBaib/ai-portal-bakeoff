# Scoring specification

`rankModels(input, mode)` returns the eligible models ranked best-first. Types are in `src/lib/scoring/types.ts`. The acceptance tests in `tests/acceptance/scoring.test.ts` contain worked examples.

## 1. Source weights

For each source `s` in `input.sources`:

- `freshness = 0.5 ^ (ageDays / 30)`
- `coverage = (number of models in input.models that have a score for s) / (number of models in input.models)`. It is 0 if there are no models. Count all input models, before eligibility filtering.
- `weight_s = reliability * relevance * freshness * coverage`

## 2. Quality (0 to 100)

`S_m` is the set of sources in `input.sources` for which model `m` has a score. Keys in `scores` that match no listed source are ignored.

`quality = sum(weight_s * score_s for s in S_m) / sum(weight_s for s in S_m)`

If the denominator is 0, `quality = 0`.

## 3. Confidence (0 to 1)

`confidence = sum(weight_s for s in S_m) / sum(weight_s for all sources)`

If the denominator is 0, `confidence = 0`. Confidence is reported next to the score and does not change the score.

## 4. Capacity (0 to 100)

`capacity = 100 * (0.5 * min(1, log10(max(contextWindow, 1)) / 6) + 0.5 * toolCalling)`

A 1,000,000-token context gives the full context term.

## 5. Access (0 to 100) and eligibility

Let `rpd = free.requestsPerDay ?? 50` (unknown is treated as 50).

**Mode `free-only`:**
- Exclude the model if `free.available` is false.
- `access = 100 * (0.7 * min(1, rpd / 1000) + 0.3 * (trainsOnPrompts ? 0 : 1))`

**Mode `mixed`:**
- If `free.available`: `access = 80 + 20 * min(1, rpd / 1000)`
- Else if `price` is not null: `blended = 0.75 * inputPerMTok + 0.25 * outputPerMTok`, and `access = 100 / (1 + blended)`
- Else: exclude the model.

## 6. Final score

`score = 0.55 * quality + 0.20 * capacity + 0.25 * access`

## 7. Output

- Return `{ id, score, confidence, breakdown: { quality, capacity, access } }` per eligible model.
- Sort by `score` descending. Break ties by `id` ascending (plain string comparison).
- Do not round inside the engine. Round only for display.
- Never mutate the input. The function must be deterministic.
- Empty `models` returns `[]`.

## 8. Additional export (not covered by acceptance tests)

Also export from `src/lib/scoring/index.ts`:

`computeSourceWeights(input: RankInput): Record<string, number>`

It returns `weight_s` for every listed source, keyed by source id. The "why this rank" panel uses it.