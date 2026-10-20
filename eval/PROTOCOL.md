# Experiment protocol (Round 1)

**Question:** with the harness fixed (OpenCode, same version), how much does the choice of model change the outcome on this project?

**Reference pair:** `agent/opencode--nemotron3-ultra`. The other three branches are compared against it.

## Controls

- Every branch starts from tag `baseline-v0` with the same lockfile, `AGENTS.md`, docs and prompts.
- Same OpenCode version on every branch. Record it in `agent-meta/AGENT.json`. `opencode.json` disables auto-update and sharing.
- Only `model` changes in each branch's `opencode.json`. Use the exact model ID printed by `opencode models`.
- Use default model settings. Do not tune temperature or system prompts.
- One fresh session per phase. Paste the phase prompt from `docs/PHASES.md` verbatim.
- Do not copy code or fixes between branches, and do not read other branches while a run is in progress.
- Do not edit code by hand on a branch. If you must (for example, a broken environment), log it under "Other human interventions". The branch is then marked human-assisted.

## Follow-up budget

- At most **3 follow-up messages per phase**.
- A follow-up may only paste verbatim error or test output, or say "continue". No hints, no solution ideas.
- Rate-limit pauses and retries after a crash do not count as follow-ups, but log them.
- After 3 follow-ups, record the phase as partial or failed and move on.

## Order

Run Phase N on all four branches before starting Phase N+1. Free-tier quotas reset daily, so spread the runs across days if you hit limits. Keep the same order every phase.

## If a model leaves the free tier mid-run

Log the date, stop the branch and mark it "interrupted". Do not substitute another model.

## After each phase, per branch

1. Commit the `agent-meta/` updates (that is the only commit you author), push the branch, and let CI run.
2. Record in `agent-meta/LOG.md`: sessions, follow-ups used, tokens or requests (OpenCode session stats or the provider dashboard), wall-clock time, outcome.
3. From the main checkout, run `bash scripts/check-protected.sh`.

## Privacy

Free-tier models may train on prompts. This repo is public and holds no secrets. Never paste keys or private data into a session.