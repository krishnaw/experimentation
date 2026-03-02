#!/bin/bash
# scripts/demo-reset.sh — Pre-demo reset and health check
#
# Cleans all leftover demo state, validates servers are healthy,
# and warms up Exp Engine's server-side response cache.
#
# Usage: ./scripts/demo-reset.sh
# Run this before every live demo session.

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
WARN=0

green()  { echo "  ✅ $*"; }
red()    { echo "  ❌ $*"; FAIL=$((FAIL+1)); }
yellow() { echo "  ⚠️  $*"; WARN=$((WARN+1)); }

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  DEMO RESET — $(date '+%H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Load env ──────────────────────────────────────────────────────────────
ENV_FILE="$ROOT/apps/web/.env.local"
if [ -f "$ENV_FILE" ]; then
  set -o allexport
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +o allexport
  green "Loaded env from apps/web/.env.local"
else
  red "apps/web/.env.local not found — create from env.example"
fi

# ── 2. Validate required env vars ────────────────────────────────────────────
echo ""
echo "  Checking environment..."
[ -n "$NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY" ] && green "NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY set" || red "NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY missing"
[ -n "$GROWTHBOOK_SECRET_API_KEY" ]         && green "GROWTHBOOK_SECRET_API_KEY set"         || red "GROWTHBOOK_SECRET_API_KEY missing"

LLM_OK=false
[ -n "$CEREBRAS_API_KEY" ] && LLM_OK=true && green "LLM provider: Cerebras"
[ -n "$GROQ_API_KEY" ]     && LLM_OK=true && green "LLM provider: Groq"
[ -n "$ANTHROPIC_API_KEY" ] && LLM_OK=true && green "LLM provider: Anthropic"
$LLM_OK || red "No LLM provider key set (need at least one of CEREBRAS_API_KEY, GROQ_API_KEY, ANTHROPIC_API_KEY)"

# ── 3. Check all servers are up ───────────────────────────────────────────────
echo ""
echo "  Checking servers..."

check_server() {
  local name="$1" url="$2"
  local status
  status=$(node -e "
    fetch('$url', { signal: AbortSignal.timeout(3000) })
      .then(r => process.stdout.write(String(r.status)))
      .catch(() => process.stdout.write('ERR'));
  " 2>/dev/null)
  if [ "$status" = "200" ]; then
    green "$name :${url##*:} responding"
    return 0
  else
    red "$name not responding (${url}) — run: bash scripts/start.sh"
    return 1
  fi
}

check_server "DemoApp1"  "http://localhost:3050"
check_server "Exp Engine" "http://localhost:3100/healthcheck"

# ── 4. Clean leftover demo state from Exp Engine ──────────────────────────────
echo ""
echo "  Cleaning demo state..."

if [ -z "$GROWTHBOOK_SECRET_API_KEY" ]; then
  yellow "Skipping cleanup — GROWTHBOOK_SECRET_API_KEY not set"
else
  delete_feature() {
    local id="$1"
    local res
    res=$(node -e "
      fetch('http://localhost:3100/api/v1/features/$id', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer $GROWTHBOOK_SECRET_API_KEY' },
        signal: AbortSignal.timeout(3000),
      }).then(r => process.stdout.write(String(r.status))).catch(() => process.stdout.write('ERR'));
    " 2>/dev/null)
    if [ "$res" = "200" ]; then
      echo "    🗑  Deleted feature: $id"
    fi
  }

  delete_feature "product-card-layout"
  delete_feature "featured-section-enabled"
  delete_feature "product-sort-order"

  # Clean leftover experiments via MongoDB
  MONGO_CLEAN='db.experiments.deleteMany({ name: /Hero Banner Test/i })'
  if docker exec growthbook-mongo mongosh growthbook --quiet --eval "$MONGO_CLEAN" > /dev/null 2>&1; then
    echo "    🗑  Cleaned Hero Banner Test experiments"
  fi

  green "Demo state cleaned"
fi

# ── 5. Warm up Exp Engine server-side response cache ──────────────────────────
echo ""
echo "  Warming Exp Engine cache..."
if [ -n "$NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY" ]; then
  node -e "
    const warmup = async () => {
      for (let i = 0; i < 3; i++) {
        await fetch('http://localhost:3100/api/features/$NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY?_cb=' + Date.now())
          .catch(() => {});
        await new Promise(r => setTimeout(r, 300));
      }
      process.stdout.write('done');
    };
    warmup();
  " 2>/dev/null
  green "Exp Engine SDK endpoint warmed (3 requests)"
else
  yellow "Skipping cache warmup — client key not set"
fi

# ── 6. Final summary ──────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$FAIL" -eq 0 ]; then
  echo "  🟢 READY FOR DEMO"
  echo ""
  echo "  Before each demo scenario, navigate to:"
  echo "    http://localhost:3050/?reset   (clears SDK cache + localStorage)"
  echo ""
  echo "  After creating a flag via chat, wait ~2s then reload DemoApp1."
else
  echo "  🔴 NOT READY — $FAIL issue(s) found, $WARN warning(s)"
  echo "     Fix the errors above before starting the demo."
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

[ "$FAIL" -eq 0 ]  # exit 0 if ready, 1 if issues
