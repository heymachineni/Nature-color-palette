#!/usr/bin/env bash
# Deploy static site to Firebase Hosting from your Mac.
# Usage:  npm run deploy:hosting
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ Building static site..."
node scripts/prepare-static-export.mjs hide
trap 'node scripts/prepare-static-export.mjs restore' EXIT
npm run build:hosting

SA="${FIREBASE_SERVICE_ACCOUNT_PATH:-}"
if [[ -z "$SA" && -f "birdpalette-firebase-adminsdk.json" ]]; then
  SA="birdpalette-firebase-adminsdk.json"
fi

if [[ -n "$SA" && -f "$SA" ]]; then
  export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/$SA"
  echo "→ Deploying with service account: $SA"
else
  echo "→ Deploying with firebase login (run 'npx firebase login' first if needed)..."
fi
# Cursor/VS Code sets VSCODE_CWD; firebase-tools mis-resolves template paths when it is set.
unset VSCODE_CWD
npx firebase deploy --only hosting --project birdpalette

echo "✓ Done: https://birdpalette.web.app"
