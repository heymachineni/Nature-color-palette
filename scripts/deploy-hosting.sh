#!/usr/bin/env bash
# Deploy static site to Firebase Hosting from your Mac.
# Usage:  npm run deploy:hosting
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ Building static site..."
npm run build:hosting

if [[ -f "nature-colorpalette-firebase-adminsdk-fbsvc-70838260b8.json" ]]; then
  export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/nature-colorpalette-firebase-adminsdk-fbsvc-70838260b8.json"
  echo "→ Deploying with service account JSON..."
else
  echo "→ Deploying with firebase login (run 'npx firebase login' first if needed)..."
fi
# Cursor/VS Code sets VSCODE_CWD; firebase-tools mis-resolves template paths when it is set.
unset VSCODE_CWD
npx firebase deploy --only hosting --project nature-colorpalette

echo "✓ Done: https://nature-colorpalette.web.app"
