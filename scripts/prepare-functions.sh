#!/usr/bin/env bash
# Write functions/.env before deploy (required for non-interactive firebase deploy with params).
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -z "${XENO_CANTO_API_KEY:-}" && -f .env ]]; then
  XENO_CANTO_API_KEY="$(grep -E '^XENO_CANTO_API_KEY=' .env | head -1 | cut -d= -f2- | tr -d '"'"'"'"' || true)"
fi

printf 'XENO_CANTO_API_KEY=%s\n' "${XENO_CANTO_API_KEY:-}" > functions/.env
echo "→ Wrote functions/.env for deploy"
