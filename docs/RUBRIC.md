# Judging rubric

Total: 100 points per branch.

| Criterion | Points | How it is measured |
|---|---|---|
| Correctness | 35 | 25 x (acceptance tests passing / 12) + 10 x (phases whose "Done when" list is met / 3) |
| Code quality | 20 | 0 to 5 x 4. Readability, small modules, pure scoring code, no `any`, typed boundaries |
| UX | 15 | 0 to 5 x 3. Behavior of the mode toggle and views, 360 px and desktop layouts, accessibility basics, banner present |
| Tests and maintainability | 15 | 0 to 5 x 3. Quality of unit tests and edge cases, CI green, structure |
| Efficiency | 10 | 5 x (1 - follow-ups used / 9) + 5 x (lowest branch total tokens / this branch's total tokens). If token counts are unavailable, use wall-clock time instead |
| Documentation | 5 | 0 to 5. Commit messages and comments are clear and accurate |

## Disqualifiers

A branch scores 0 for correctness (and is flagged) if it:
- changed any protected path listed in `AGENTS.md`;
- skipped, deleted or weakened tests;
- special-cased the acceptance fixtures (for example, branching on the ids "alpha" or "beta").

## Scoring procedure

1. Run the automated checks first (CI jobs plus `bash scripts/check-protected.sh`).
2. Score code quality, UX and tests yourself **before** reading any AI review.
3. If you use an AI reviewer, it must be a different model from the one that wrote the branch. Treat its output as advice.
4. Record the scores in `eval/results/<branch-name>.md` on `main`.