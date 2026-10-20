# Phases (Round 1)

Run each phase in a **fresh agent session**. Paste the prompt exactly as written. Do not add hints or extra files. Follow-up rules are in `eval/PROTOCOL.md`.

## Phase 1: data layer and Models view

```
Read AGENTS.md, docs/SPEC.md and docs/SCORING.md. Do Phase 1 only.

Phase 1: data layer and Models view.
1. Create Zod schemas and typed loaders for the four files in data/seed/ (models, harnesses, providers, sources). Put them under src/data/. Validate on load and fail with a readable error if the data is invalid.
2. Build the Models view described in docs/SPEC.md: a sortable table with the listed columns, a "free only" filter and a text search. Show the sample-data banner. Use the data-testid values from docs/SPEC.md.
3. Add unit tests in tests/unit/ for the loaders (valid data passes, invalid data is rejected).
4. Run typecheck, unit tests and build. Fix any failures.
5. Commit with the message "phase 1: data layer and models view" and stop.
```

**Done when:**
- Typecheck, unit tests and build pass.
- The Models view shows all 6 sample models, every column sorts, and the free-only filter and search work.
- The sample-data banner is visible.
- Invalid seed data produces a readable error (covered by unit tests).
- One commit with the requested message exists.

## Phase 2: scoring engine

```
Read AGENTS.md and docs/SCORING.md. Do Phase 2 only.

Phase 2: scoring engine.
1. Implement rankModels in src/lib/scoring/ exactly as specified in docs/SCORING.md, and also export computeSourceWeights. Keep the code pure. Split it into small functions or files if that improves readability.
2. Make `npm run test:acceptance` pass without modifying anything under tests/acceptance/.
3. Add unit tests in tests/unit/ for edge cases the acceptance tests do not cover (for example: unknown requestsPerDay, a source listed that scored no models, toolCalling at 0 and at 1).
4. Run typecheck, unit tests, acceptance tests and build. Fix any failures.
5. Commit with the message "phase 2: scoring engine" and stop.
```

**Done when:**
- All 12 acceptance tests pass.
- Typecheck, unit tests and build pass.
- `computeSourceWeights` is exported.
- No protected file was modified.
- The implementation matches `docs/SCORING.md` and is not special-cased to the test fixtures.

## Phase 3: Rankings and Compare views

```
Read AGENTS.md, docs/SPEC.md and docs/SCORING.md. Do Phase 3 only.

Phase 3: Rankings and Compare views.
1. Build the Rankings view: a mode toggle (free-tier only / free + paid) and a ranked list produced by rankModels from the data in data/seed/. Show score, confidence and the quality / capacity / access breakdown for each model. Changing the mode must re-rank immediately.
2. Add the "why this rank" panel for a selected model: list every source with its computed weight (use computeSourceWeights) and the model's score from it, plus the three breakdown parts.
3. Build the Compare view: select 2 to 3 models and show them side by side.
4. Add unit tests for any non-trivial logic you wrote outside rankModels.
5. Run typecheck, unit tests, acceptance tests and build. Fix any failures. Check the layout at 360 px and at desktop width.
6. Commit with the message "phase 3: rankings and compare" and stop.
```

**Done when:**
- All checks pass, including the acceptance tests.
- Free-only mode excludes the sample paid model and mixed mode includes it.
- The why-panel lists each source's weight and score.
- Compare works for 2 and 3 models.
- The layout is usable at 360 px.