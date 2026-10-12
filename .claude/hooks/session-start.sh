#!/bin/bash
# Claude Code on the web: install dependencies before the session starts, so
# every `npm run …` works from the first message. Local sessions skip this.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"
# Output goes to stderr: whatever this prints on stdout lands in Claude's context.
npm install --no-audit --no-fund --loglevel=error >&2
