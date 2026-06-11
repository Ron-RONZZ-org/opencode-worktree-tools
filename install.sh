#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
echo "opencode-worktree-tools installer"
echo "================================="
if command -v node >/dev/null 2>&1; then
  node scripts/install-global.mjs
elif command -v bun >/dev/null 2>&1; then
  bun run scripts/install-global.mjs
else
  echo "Node.js or Bun is required." >&2
  exit 1
fi
echo ""
echo "Done! Restart OpenCode to activate the plugin."