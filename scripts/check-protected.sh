#!/usr/bin/env bash
# Fail if any branch changed a protected path relative to the baseline tag.
# Usage: bash scripts/check-protected.sh [branch-or-ref ...]
# Default: every local agent/* branch. Run it from the main checkout for a trusted check.
set -euo pipefail

BASE_REF="${BASE_REF:-baseline-v0}"
PROTECTED='^(AGENTS\.md|docs/|eval/|scripts/|tests/acceptance/|\.github/|data/seed/|vitest\.acceptance\.config\.ts|src/lib/scoring/types\.ts)'

refs=("$@")
if [ "${#refs[@]}" -eq 0 ]; then
  refs=()
  while IFS= read -r line; do refs+=("$line"); done < <(git for-each-ref --format='%(refname:short)' 'refs/heads/agent/*')
fi

status=0
for ref in "${refs[@]}"; do
  bad=$(git diff --name-only "$BASE_REF...$ref" | grep -E "$PROTECTED" || true)
  if [ -n "$bad" ]; then
    echo "FAIL $ref touched protected paths:"
    echo "$bad" | sed 's/^/  - /'
    status=1
  else
    echo "ok   $ref"
  fi
done
exit $status
