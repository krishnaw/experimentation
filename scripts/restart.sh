#!/bin/bash
# scripts/restart.sh — Restart one or all servers
# Usage: ./scripts/restart.sh [web|dashboard|api|docker|all]
# Default: all

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

TARGET="${1:-all}"
echo "==> restart: $TARGET"
"$ROOT/scripts/stop.sh" "$TARGET"
sleep 1
"$ROOT/scripts/start.sh" "$TARGET"
