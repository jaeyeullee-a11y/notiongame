#!/usr/bin/env bash
# Idempotent cloud-agent update script.
# Reuses cached node_modules (from snapshot/checkpoint) unless the lockfile changed.
set -euo pipefail

cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

LOCKFILE="package-lock.json"
STAMP_FILE="node_modules/.package-lock.sha256"

if [[ ! -f "$LOCKFILE" ]]; then
  echo "error: $LOCKFILE not found in $(pwd)" >&2
  exit 1
fi

current_hash="$(sha256sum "$LOCKFILE" | awk '{print $1}')"

if [[ -d node_modules ]] \
  && [[ -f "$STAMP_FILE" ]] \
  && [[ "$(cat "$STAMP_FILE")" == "$current_hash" ]] \
  && [[ -f node_modules/.package-lock.json || -d node_modules/vite ]]; then
  echo "node_modules already matches $LOCKFILE ($current_hash); skipping npm ci"
  exit 0
fi

echo "Installing dependencies with npm ci (lockfile=$current_hash)..."
npm ci
printf '%s\n' "$current_hash" > "$STAMP_FILE"
echo "npm ci complete"
