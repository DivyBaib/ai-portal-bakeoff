#!/usr/bin/env bash
# Create agent branches + git worktrees from the baseline tag.
# Usage: bash scripts/create-branches.sh opencode--nemotron3-ultra opencode--deepseek-v4-flash ...
# Run from the main checkout (Git Bash / WSL on Windows).
set -euo pipefail

BASE_TAG="${BASE_TAG:-baseline-v0}"
WT_DIR="${WT_DIR:-../worktrees}"

if [ "$#" -lt 1 ]; then
  echo "usage: $0 <harness--model> [<harness--model> ...]" >&2
  exit 1
fi

git rev-parse --verify --quiet "refs/tags/$BASE_TAG" >/dev/null || {
  echo "missing tag $BASE_TAG (create it first: git tag $BASE_TAG)" >&2
  exit 1
}

mkdir -p "$WT_DIR"

for pair in "$@"; do
  branch="agent/$pair"
  path="$WT_DIR/$pair"
  if git show-ref --verify --quiet "refs/heads/$branch"; then
    echo "skip (branch exists): $branch"
    continue
  fi
  git worktree add -b "$branch" "$path" "$BASE_TAG"
  cp "$path/agent-meta/AGENT.template.json" "$path/agent-meta/AGENT.json"
  cp "$path/agent-meta/LOG.template.md" "$path/agent-meta/LOG.md"
  echo "created $branch -> $path"
done

echo
echo "Next, in each worktree: npm ci, set the model in opencode.json, fill agent-meta/AGENT.json, commit."
