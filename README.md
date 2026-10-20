# AI Coding Portal (bake-off repo)

A web portal that ranks AI coding agents (harnesses) and the models behind them, with two modes: "free-tier only" and "free and paid". This repo is also an experiment: several AI coding agents build the same project on separate branches, and the branches are compared.

## Branches

- `main`: the unaltered baseline (tag `baseline-v0`). Specs, tests and tooling. No agent writes here.
- `agent/<harness>--<model>`: one branch per harness/model pair. Round 1 varies the model only (harness: OpenCode).

## Quick start

```bash
npm ci
npm run dev
npm run typecheck
npm test                  # unit tests
npm run test:acceptance   # protected acceptance tests (they fail on the baseline by design)
npm run build
```

Requires Node 22 (see `.nvmrc`).

## Where things are

| Path | Purpose |
|---|---|
| `AGENTS.md` | Rules for AI coding agents |
| `docs/SPEC.md` | What to build |
| `docs/SCORING.md` | The ranking formula |
| `docs/PHASES.md` | The phase prompts used in the experiment |
| `docs/RUBRIC.md` | How branches are judged |
| `eval/PROTOCOL.md` | Experiment procedure (for the human) |
| `tests/acceptance/` | Protected tests the scoring engine must pass |
| `data/seed/` | Sample data (synthetic, not real benchmark results) |
| `agent-meta/` | Per-branch run metadata and log (branches only) |
| `scripts/` | Branch/worktree creation and protected-path check |