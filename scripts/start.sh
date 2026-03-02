#!/bin/bash
# scripts/start.sh — Start one or all servers
# Usage: ./scripts/start.sh [web|docker|all]
# Default: all

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PIDS="$ROOT/scripts/pids"
LOGS="$ROOT/scripts/logs"
mkdir -p "$PIDS" "$LOGS"

kill_port() {
  local port="$1"
  local pid
  pid=$(lsof -ti ":$port" 2>/dev/null || true)
  if [ -z "$pid" ]; then
    pid=$(netstat -ano 2>/dev/null | grep " :$port " | grep -i "LISTENING" | awk '{print $NF}' | head -1)
  fi
  if [ -n "$pid" ]; then
    kill "$pid" 2>/dev/null || true
  fi
}

start_server() {
  local name="$1"
  local port="$2"
  local cmd="$3"
  local pidfile="$PIDS/$name.pid"
  local logfile="$LOGS/$name.log"

  # Check if already running via PID file
  if [ -f "$pidfile" ]; then
    local pid
    pid=$(cat "$pidfile")
    if kill -0 "$pid" 2>/dev/null; then
      echo "  $name already running (PID $pid) on :$port"
      return
    fi
    rm -f "$pidfile"
  fi

  # Kill anything on the port — handles stale processes not tracked by PID file
  kill_port "$port"
  sleep 0.3

  echo "  Starting $name on :$port..."
  cd "$ROOT"
  eval "$cmd" >> "$logfile" 2>&1 &
  local pid=$!
  echo "$pid" > "$pidfile"
  echo "  $name started (PID $pid) — log: scripts/logs/$name.log"
}

start_docker() {
  echo "  Starting Docker (GrowthBook)..."
  cd "$ROOT" && docker compose up -d
  echo "  GrowthBook UI:  http://localhost:3000"
  echo "  GrowthBook API: http://localhost:3100"
}

start_web() { start_server "web" "3050" "pnpm --filter web dev"; }

TARGET="${1:-all}"
echo "==> start: $TARGET"
case "$TARGET" in
  web)       start_web ;;
  docker)    start_docker ;;
  all)
    start_docker
    start_web
    ;;
  *)
    echo "Usage: $0 [web|docker|all]"
    exit 1
    ;;
esac
echo "==> done"
