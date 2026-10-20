# Product spec

## Purpose

A single-page web portal that helps a developer pick AI coding harnesses and models. It ranks models using weighted sources and lets the user switch between "free-tier only" and "free and paid" modes.

## Round 1 scope (Phases 1 to 3)

Static site, no backend. Data comes from the bundled JSON in `data/seed/`. Live data fetching, harness ranking, accounts and persistence are out of scope.

## Data

Four files in `data/seed/`: `models.json`, `harnesses.json`, `providers.json`, `sources.json`. Each has a `_notice` field. The data is synthetic sample data.

- Validate every file with Zod when loading. On invalid data, fail with a readable error.
- Unknown values are `null`. Show them as "unknown" in the UI, never as 0.
- A visible banner (`sample-data-banner`) must say the data is sample data.

To rank, map the data to `RankInput` (see `src/lib/scoring/types.ts`): `models` come from `models.json`, `sources` from `sources.json`. Drop display-only fields such as `name`.

## Views

1. **Models:** sortable table. Columns: name, vendor, context window, tool-calling reliability, free availability, requests per day, price (input / output per 1M tokens). Controls: text search and a "free only" filter.
2. **Rankings:** a mode toggle ("Free-tier only" / "Free + paid", default free-only) and a ranked list from `rankModels`. Each item shows score, confidence and the quality / capacity / access breakdown. Changing the mode re-ranks immediately. Selecting an item opens a "why this rank" panel listing every source with its computed weight and the model's score from it, plus the three breakdown parts.
3. **Compare:** pick 2 to 3 models and see them side by side.

Navigation between views is the implementer's choice (tabs or routes).

## Test ID contract

| `data-testid` | Element |
|---|---|
| `sample-data-banner` | The sample-data banner |
| `models-table` | The models table |
| `model-row` | Each table row, with `data-model-id` |
| `mode-toggle` | Container of the mode control |
| `mode-option-free-only` | The free-only option |
| `mode-option-mixed` | The free + paid option |
| `rankings-list` | The ranked list |
| `ranking-item` | Each ranked item, with `data-model-id`, in rank order |
| `why-panel` | The explanation panel |
| `compare-drawer` | The comparison container |

## Non-functional requirements

- Usable at 360 px width and on desktop.
- Keyboard accessible, with visible focus and readable contrast.
- No console errors or warnings in normal use.
- `npm run build` succeeds with no type errors.