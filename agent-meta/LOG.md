# Run log: agent/opencode--nemotron3-ultra

## Setup
- OpenCode version: 2.1.2
- Node version: v22.23.3
- Model ID (from `opencode models`): opencode/nemotron-3-ultra-free
- Provider / route: OpenCode Zen (Zen gateway to NVIDIA free endpoint)
- Date started: 2026-10-20

## Phase log
| Phase | Sessions | Follow-ups used (max 3) | Tokens / requests | Wall-clock | Outcome (done / partial / failed) | Notes |
|---|---|---|---|---|---|---|
| 1 | 1 | 0 | total 521100 | 00:10 | done | Started 2026-10-22 07:36, ended 2026-10-22 07:46. Local: typecheck pass, unit pass, build pass, acceptance 0/12. Prompt: phase prompt + Done-when list. FU: none. UI check: sort/filter/search/banner ok. Events: none. |
| 2 | 1 | 0 | total 279300 | 00:06 | done | Started 2026-10-23 12:19, ended 2026-10-23 12:25. Local: typecheck pass, unit pass, build pass, acceptance 12/12. Prompt: phase prompt + Done-when list. FU: none. Acceptance 12/12. Events: none. Tokens from opencode stats text report (rounded to 0.1k). |
| 3 | 1 | 1 | total 1599600 | 00:37 | done | Started 2026-10-23 13:16, ended 2026-10-23 13:54. Active 00:15 over 2 session(s). Local: typecheck pass, unit pass, build pass, acceptance 12/12. Prompt: phase prompt + Done-when list. FU1: console key warning pasted verbatim. After FU1: key warning gone; ranking-selection bug still present (selecting a model makes all list names show that model; not reported to agent). UI check: re-rank, why-panel weights, compare 2/3 ok; 360px [360,360] no overflow. Events: first-run UI testing gap included in wall-clock; session resumed for FU1. Tokens from opencode stats text report (rounded to 0.1k). |

## Interruptions
(Rate limits hit, model removed, outages: date, what happened, what you did.)

## Other human interventions
(Anything you did that the agent did not: manual fixes, config changes.)
