#!/usr/bin/env bash
# Open the Dryad HBW dataset page in your browser.
# Save Data_S1.zip to: data/hbw/Data_S1.zip
# Then run: npm run build:hbw

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
URL="https://doi.org/10.5061/dryad.70rxwdc6s"

mkdir -p "$ROOT/data/hbw"

echo ""
echo "HBW Dryad dataset (79 MB)"
echo "========================="
echo ""
echo "1. Your browser will open the Dryad page."
echo "2. Click Download → Data_S1.zip"
echo "3. Save the file to:"
echo "   $ROOT/data/hbw/Data_S1.zip"
echo ""
echo "4. Build the full catalog:"
echo "   npm run build:hbw"
echo ""

if command -v open >/dev/null 2>&1; then
  open "$URL"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL"
else
  echo "Open this URL manually: $URL"
fi
