#!/bin/bash
# Example prepare script for the "review" command.
#
# Parses a GitHub PR URL, maps it to a local directory, and rewrites
# the arg to just the PR number.
#
# Config:
#   "review": {
#     "prompt": "Review PR {{arg}}. Leave comments in this session.",
#     "prepare": "~/.config/agent-panel/scripts/prepare-review.sh {{arg}}"
#   }
#
# Usage:
#   panel review https://github.com/your-org/your-repo/pull/42
set -euo pipefail

URL="${1:-}"

# If no URL or not a GitHub PR URL, pass through unchanged
if [[ -z "$URL" ]] || [[ ! "$URL" =~ github\.com/([^/]+/[^/]+)/pull/([0-9]+) ]]; then
  exit 0
fi

REPO="${BASH_REMATCH[1]}"
PR="${BASH_REMATCH[2]}"

# Map GitHub repos to local directories.
# Add your own repos here.
declare -A REPOS=(
  ["your-org/your-repo"]="$HOME/dev/your-repo"
  ["your-org/other-repo"]="$HOME/dev/other-repo"
)

LOCAL="${REPOS[$REPO]:-}"
if [[ -z "$LOCAL" ]]; then
  echo "Unknown repo: $REPO" >&2
  exit 1
fi

echo "{\"workdir\": \"$LOCAL\", \"arg\": \"#$PR\"}"
