# Experimentation Platform

AI-native A/B testing demo. Chat with an AI agent to create experiments, flip feature flags, and analyze results — entirely in natural language.

Built on a "ShopDemo" e-commerce store where feature flags and experiments control product layouts, sort order, and UI sections live.

## Architecture

```
Dashboard (:4000)     ── Standalone Experiment Manager (full-screen chat)
  └── /api/chat ─── Vercel AI SDK ─── Anthropic / Groq / Cerebras
        └── GrowthBook REST API (:3100)

ShopDemo (:3050)      ── E-commerce store with live feature flags (no chat)
  └── GrowthBook React SDK (client-side feature flags)

API Server (:3200)    ── Express, server-side feature flags

GrowthBook (:3000 UI, :3100 API) ←── MongoDB (:27017)
```

**Two demo surfaces:**
- **Dashboard** (port 4000) — full-screen Experiment Manager with chat, best for demos
- **ShopDemo** (port 3050) — live store where feature flags update UI in real time

## What You Can Do

Type natural language into the chat to control your experimentation stack:

```
"List all running experiments"
"Create an experiment called Hero Banner Test with Control and Variant A"
"What feature flags are active?"
"Create a boolean feature flag called show-promo-banner with default true"
"Get results for experiment exp_xxx"
```

## Prerequisites

- **Node.js** 20+ and **pnpm** (`npm install -g pnpm`)
- **Docker Desktop** (for GrowthBook + MongoDB)
- **At least one LLM API key:**

  | Provider   | Speed    | Cost      | Sign up at              |
  |------------|----------|-----------|-------------------------|
  | Cerebras   | Fastest  | Free tier | cloud.cerebras.ai       |
  | Groq       | Fast     | Free tier | console.groq.com        |
  | Anthropic  | Reliable | Paid      | console.anthropic.com   |

## Setup

### 1. Install dependencies

```bash
git clone <repo-url>
cd experimentation
pnpm install
```

### 2. Start GrowthBook

```bash
docker compose up -d
```

Opens GrowthBook UI at http://localhost:3000. Create your admin account on first run.

### 3. Get your GrowthBook keys

1. **Settings → API Keys** → create a Secret key (starts with `secret_`)
2. **SDK Connections** → New Connection → copy the Client key (starts with `sdk-`)

### 4. Configure environment

```bash
cp env.example apps/web/.env.local
cp env.example apps/api/.env
cp env.example apps/dashboard/.env.local
```

Fill in each file:

```bash
GROWTHBOOK_SECRET_API_KEY=secret_xxx        # from step 3 (all three apps)
NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY=sdk-xxx   # web + dashboard only
GROWTHBOOK_CLIENT_KEY=sdk-xxx               # api only
CEREBRAS_API_KEY=xxx                        # at least one LLM key
```

### 5. Create feature flags

In the GrowthBook UI (http://localhost:3000), go to **Features** and create:

| Feature Key                | Type    | Default  | Controls                             |
|----------------------------|---------|----------|--------------------------------------|
| `product-card-layout`      | string  | `grid`   | Product grid vs large-image layout   |
| `featured-section-enabled` | boolean | `true`   | Show/hide Best Sellers section        |
| `product-sort-order`       | string  | `popularity` | API sort: popularity or price    |

Make sure each flag is **enabled** in your environment (SDK Connections → environment).

### 6. Start the servers

```bash
pnpm dev:dashboard   # http://localhost:4000 — Experiment Manager (recommended)
pnpm dev:web         # http://localhost:3050 — ShopDemo with live flags
pnpm dev:api         # http://localhost:3200 — API server
```

## Running Tests

```bash
# Unit tests (Vitest, no servers needed) — 51 tests
pnpm test

# Integration tests (Playwright + Vitest, mocked externals)
pnpm test:integration

# E2E tests (Playwright headless, requires :3050 + GrowthBook :3100) — 5 tests
pnpm test:e2e

# Demo scenario tests (requires all servers + LLM API keys)
pnpm test:demo
```

## Project Structure

```
experimentation/
├── apps/
│   ├── dashboard/          # Experiment Manager (port 4000) — chat lives here
│   │   └── src/
│   │       ├── app/api/chat/   # AI chat endpoint (Vercel AI SDK, 7 GrowthBook tools)
│   │       ├── app/api/health/ # Server-side GrowthBook health proxy
│   │       ├── app/page.tsx    # Full-screen chat UI
│   │       └── __tests__/      # Vitest unit + integration tests
│   ├── web/                # ShopDemo (port 3050) — feature flags, no chat
│   │   └── src/
│   │       ├── components/     # ProductCard, GrowthBookProvider
│   │       └── lib/            # GrowthBook SDK singleton, products data
│   └── api/                # Express API server (port 3200)
│       └── src/
│           ├── lib/        #   GrowthBook Node SDK singleton
│           └── __tests__/  #   Vitest unit + integration tests
├── tests/
│   ├── e2e/                # Playwright E2E tests (fast, no LLM keys)
│   ├── integration/        # Playwright integration tests (mocked externals)
│   └── demo/               # Demo scenario tests (full AI → UI flow, LLM keys required)
├── scripts/                # start.sh, stop.sh, restart.sh — server management
├── docker-compose.yml      # GrowthBook + MongoDB
├── playwright.config.ts    # E2E config (workers: 4)
├── playwright.integration.config.ts # Integration test config
├── playwright.demo.config.ts # Demo test config (workers: 1, 90s timeout)
└── env.example             # Template — copy to all three apps
```

## LLM Fallback Chain

The chat endpoint tries providers in order (first with a valid key wins):

1. **Cerebras** — llama-3.3-70b, fastest, free tier
2. **Groq** — llama-3.3-70b-versatile, fast, free tier
3. **Anthropic** — Claude Haiku 4.5, most reliable, paid

## Demo Scenarios

Good prompts for a live demo:

1. **Flip a layout** — "Create a string feature flag called product-card-layout with default value large-image" → ShopDemo shows large cards after reload
2. **Toggle a section** — "Create a boolean feature flag called featured-section-enabled with default true" → Best Sellers section appears
3. **Run an experiment** — "Create an experiment called Hero Banner Test with Control and Variant A"
4. **Check status** — "What feature flags are active?" / "List all running experiments"
5. **API-side flag** — Hit http://localhost:3200/api/products to see sort order change when `product-sort-order` flag changes

## Stopping

```bash
# Stop dev servers: Ctrl+C in each terminal

# Stop GrowthBook + MongoDB
docker compose down

# Delete all experiment data too
docker compose down -v
```
