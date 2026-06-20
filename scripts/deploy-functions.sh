#!/usr/bin/env bash
# Deploy photoSample Cloud Function (run once, or after function code changes).
# Requires firebase login or FIREBASE_SERVICE_ACCOUNT_PATH / birdpalette-firebase-adminsdk.json
set -euo pipefail
cd "$(dirname "$0")/.."

npm install --prefix functions --no-audit --no-fund

SA="${FIREBASE_SERVICE_ACCOUNT_PATH:-}"
if [[ -z "$SA" && -f "birdpalette-firebase-adminsdk.json" ]]; then
  SA="birdpalette-firebase-adminsdk.json"
fi

if [[ -n "$SA" && -f "$SA" ]]; then
  export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/$SA"
  echo "→ Deploying functions with service account: $SA"
else
  echo "→ Deploying functions with firebase login..."
fi

unset VSCODE_CWD
npx firebase deploy --only functions:photoSample --project birdpalette

echo "✓ photoSample deployed"
