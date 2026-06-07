#!/usr/bin/env bash
set -euo pipefail

echo "[publish] Step 1/2: syncing GitHub..."
./scripts/push-github.sh

echo "[publish] Step 2/2: deploying website..."
./scripts/deploy.sh

echo "[publish] Completed successfully."
echo "[publish] GitHub: https://github.com/feiniao87968492/History-Learning"
echo "[publish] Website: http://118.178.140.171:9090"
