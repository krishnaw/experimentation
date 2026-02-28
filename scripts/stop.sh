#!/bin/bash
# scripts/stop.sh — Stop one or all servers
# Usage: ./scripts/stop.sh [web|dashboard|api|docker|all]
# Default: all

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PIDS="$ROOT/scripts/pids"

kill_port() {
  local port="$1"
  local pid
  # lsof (Linux/Mac/Git Bash with extras)
  pid=$(lsof -ti ":$port" 2>/dev/null || true)
  if [ -z "$pid" ]; then
    # Windows netstat fallback
    pid=$(netstat -ano 2>/dev/null | grep " :$port " | grep -i "LISTENING" | awk '{print $NF}' | head -1)
  fi
  if [ -n "$pid" ]; then
    echo "  Killing port :$port (PID $pid)"
    kill "$pid" 2>/dev/null || taskkill.exe /F /PID "$pid" 2>/dev/null || true
  fi
}

kill_tree() {
  local pid=$1
  # Kill all children first
  local children
  children=$(pgrep -P "$pid" 2>/dev/null || true)
  for child in $children; do
    kill_tree "$child"
  done
  kill "$pid" 2>/dev/null || true
}

stop_server() {
  local name="$1"
  local port="$2"
  local pidfile="$PIDS/$name.pid"

  echo "  Stopping $name..."
  if [ -f "$pidfile" ]; then
    local pid
    pid=$(cat "$pidfile")
    kill_tree "$pid"
    rm -f "$pidfile"
    echo "  $name stopped (was PID $pid)"
  else
    echo "  $name: no PID file — killing by port :$port"
    kill_port "$port"
  fi

  # Fallback: ensure port is freed
  sleep 0.5
  kill_port "$port" 2>/dev/null || true
}

stop_docker() {
  echo "  Stopping Docker (GrowthBook)..."
  cd "$ROOT" && docker compose down
}

TARGET="${1:-all}"
echo "==> stop: $TARGET"
case "$TARGET" in
  web)       stop_server "web" "3050" ;;
  dashboard) stop_server "dashboard" "4000" ;;
  api)       stop_server "api" "3200" ;;
  docker)    stop_docker ;;
  all)
    stop_server "web" "3050"
    stop_server "dashboard" "4000"
    stop_server "api" "3200"
    stop_docker
    ;;
  *)
    echo "Usage: $0 [web|dashboard|api|docker|all]"
    exit 1
    ;;
esac
echo "==> done"
