# AGENTS.md

Instructions for AI coding agents working in this repo. Read this file at the start of every session.

## Project

A web portal that helps developers choose AI coding harnesses and models. `docs/SPEC.md` says what to build. `docs/SCORING.md` defines the ranking formula.

## Your task

Do only the phase the human gives you (see `docs/PHASES.md`). Do not start later phases. When the phase's "Done when" list is satisfied, stop and summarize what you did.

## Stack (fixed)

Vite, React 19, TypeScript (strict), Tailwind CSS v4, Zod, Vitest. Node 22.

## Commands

- `npm ci`: install
- `npm run dev`: dev server
- `npm run typecheck`
- `npm test`: unit tests
- `npm run test:acceptance`: protected acceptance tests (may fail until Phase 2 is done)
- `npm run build`

Before every commit, run typecheck, unit tests and build. They must pass.

## Protected paths (never edit)

`AGENTS.md`, `docs/`, `eval/`, `scripts/`, `tests/acceptance/`, `.github/`, `data/seed/`, `.gitignore`, `vitest.acceptance.config.ts`, `src/lib/scoring/types.ts`, `agent-meta/`

If a protected file seems wrong, say so in your final message. Do not edit it.

## Rules

- **Git:** commit on the current branch only. Make small commits with the message format `phase N: <what>`. Do not push, create or switch branches, or rewrite history.
- **Data:** `data/seed/` is SAMPLE data. Load it as-is. Never invent real-looking benchmark numbers. The UI must show a visible "sample data" banner.
- **Scoring:** implement `docs/SCORING.md` exactly. Keep it pure, in `src/lib/scoring/`, with no React or I/O imports. The contract is `src/lib/scoring/types.ts` plus `rankModels` exported from `src/lib/scoring/index.ts`.
- **Dependencies:** avoid new runtime dependencies. Testing libraries (for example `@testing-library/react`, `jsdom`) are fine. No UI component libraries. Justify any other new dependency in the commit message.
- **Tests:** add unit tests under `tests/unit/` for the code you write. Never weaken, skip or delete tests.
- **Code quality:** TypeScript strict, no `any`, no dead code, small modules, semantic and accessible HTML (labels, headings, keyboard use), responsive layout.
- **Test IDs:** use the `data-testid` values listed in `docs/SPEC.md`.
- **Secrets:** never create or commit `.env` files or keys.