#!/usr/bin/env bash
set -euo pipefail

REMOTE_NAME="origin"
TARGET_BRANCH="main"
EXPECTED_REMOTE_URL="https://github.com/feiniao87968492/History-Learning.git"

current_branch="$(git branch --show-current)"

if [ "$current_branch" != "$TARGET_BRANCH" ]; then
    echo "Error: GitHub sync must run from branch '$TARGET_BRANCH'."
    echo "Current branch: '$current_branch'"
    exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Error: working tree contains uncommitted changes."
    echo "Commit or stash your changes before syncing GitHub."
    git status --short
    exit 1
fi

actual_remote_url="$(git remote get-url "$REMOTE_NAME" 2>/dev/null || true)"

if [ "$actual_remote_url" != "$EXPECTED_REMOTE_URL" ]; then
    echo "Error: remote '$REMOTE_NAME' does not match the expected GitHub URL."
    echo "Expected: $EXPECTED_REMOTE_URL"
    echo "Actual:   ${actual_remote_url:-<missing>}"
    exit 1
fi

echo "[github] Fetching remote state..."
git fetch "$REMOTE_NAME" "$TARGET_BRANCH" 2>/dev/null || true

if git show-ref --verify --quiet "refs/remotes/$REMOTE_NAME/$TARGET_BRANCH"; then
    if ! git merge-base --is-ancestor \
        "$REMOTE_NAME/$TARGET_BRANCH" \
        "$TARGET_BRANCH"; then
        echo "Error: remote history is not an ancestor of local '$TARGET_BRANCH'."
        echo "The histories may have diverged."
        echo "Resolve the difference manually. Force push is intentionally disabled."
        exit 1
    fi
fi

echo "[github] Pushing '$TARGET_BRANCH' to '$REMOTE_NAME'..."
git push "$REMOTE_NAME" "$TARGET_BRANCH"

echo "[github] Sync completed successfully."
echo "[github] Repository: https://github.com/feiniao87968492/History-Learning"
