#!/usr/bin/env bash
set -euo pipefail

REMOTE_NAME="deploy"
DEPLOY_BRANCH="main"

current_branch="$(git branch --show-current)"

if [ "$current_branch" != "$DEPLOY_BRANCH" ]; then
    echo "Error: deploy must run from branch '$DEPLOY_BRANCH'."
    echo "Current branch: '$current_branch'"
    exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Error: working tree contains uncommitted changes."
    exit 1
fi

echo "[deploy] Checking SSH connection..."
ssh xuedeshi-server "echo '[deploy] SSH connection OK'"

echo "[deploy] Pushing '$DEPLOY_BRANCH' to '$REMOTE_NAME'..."
git push "$REMOTE_NAME" "$DEPLOY_BRANCH"

echo "[deploy] Verifying website..."
curl --fail --silent --show-error --head \
  "http://118.178.140.171:9090" >/dev/null

echo "[deploy] Success: http://118.178.140.171:9090"
