# Experimentation Platform

AI-native A/B testing demo. Chat with an AI agent to create experiments, flip feature flags, and analyze results — entirely in natural language.

Built on two demo apps where feature flags and experiments control product layouts, sort order, and UI sections live:
- **DemoApp1** — Electronics e-commerce store (tech products, grid layouts)
- **DemoApp2** — Safeway-style grocery homepage (hero carousel, category grid, 19 weekly deals, collapsible footer)

## Architecture

```
Single Next.js App (:3050)
  ├── /             — DemoApp1 e-commerce store (Exp Engine SDK, client-side flags)
  ├── /demoapp2     — DemoApp2 Safeway grocery replica (Exp Engine SDK, client-side flags)
  ├── /dashboard    — Control Room (split-panel: context + chat)
  │   └── /api/chat ─── Vercel AI SDK ─── Cerebras / Mistral / Groq / Anthropic
  │         └── Exp Engine REST API (:3100)
  ├── /growthbook   — Exp Engine UI (embedded iframe)
  └── /api/*        — Next.js API routes (chat, health, products, demoapp2/*)

Exp Engine (:3000 UI, :3100 API) — powered by GrowthBook ←── MongoDB (:27017)
```

> **What is Exp Engine?** "Exp Engine" is our branding for GrowthBook — the open-source feature flagging and A/B testing platform that powers the experimentation backend. All SDK, API, and Docker references use GrowthBook under the hood; "Exp Engine" is the user-facing name throughout this app.

## What You Can Do

Type natural language into the chat at `/dashboard` to control your experimentation stack:

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
  | Mistral    | Fast     | Free tier | console.mistral.ai      |
  | Groq       | Fast     | Free tier | console.groq.com        |
  | Anthropic  | Reliable | Paid      | console.anthropic.com   |

## Setup

### 1. Install dependencies

```bash
git clone <repo-url>
cd experimentation
pnpm install
```

### 2. Start Exp Engine (GrowthBook)

```bash
docker compose up -d
```

Opens Exp Engine UI at http://localhost:3000. Create your admin account on first run.

### 3. Get your Exp Engine keys

1. **Settings → API Keys** → create a Secret key (starts with `secret_`)
2. **SDK Connections** → New Connection → copy the Client key (starts with `sdk-`)

### 4. Configure environment

```bash
cp env.example apps/web/.env.local
```

Fill in:

```bash
GROWTHBOOK_SECRET_API_KEY=secret_xxx        # from step 3
NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY=sdk-xxx   # from step 3
CEREBRAS_API_KEY=xxx                        # at least one LLM key
```

### 5. Create feature flags

In the Exp Engine UI (http://localhost:3000), go to **Features** and create:

| Feature Key                | Type    | Default  | Controls                             |
|----------------------------|---------|----------|--------------------------------------|
| `product-card-layout`      | string  | `grid`   | DemoApp1: product grid vs large-image layout |
| `featured-section-enabled` | boolean | `true`   | DemoApp1: show/hide Best Sellers section |
| `product-sort-order`       | string  | `popularity` | DemoApp1: product sort: popularity or price |
| `demoapp2-hero-layout`     | string  | `carousel` | DemoApp2: hero carousel vs static banner |
| `demoapp2-fresh-section`   | boolean | `true`   | DemoApp2: show/hide "Shop What's Fresh" |
| `demoapp2-deals-sort`      | string  | `popularity` | DemoApp2: weekly deals sort order |

Make sure each flag is **enabled** in your environment (SDK Connections → environment).

### 6. Start the app

```bash
pnpm dev:web   # http://localhost:3050
```

Visit:
- http://localhost:3050 — DemoApp1 (electronics store) with live feature flags
- http://localhost:3050/demoapp2 — DemoApp2 (Safeway grocery) with live feature flags
- http://localhost:3050/dashboard — Control Room (chat)
- http://localhost:3050/growthbook — Exp Engine UI (embedded)

## Running Tests

```bash
# Unit tests (Vitest, no servers needed) — 161 tests (160 pass + 1 skipped)
pnpm test

# Integration tests (Playwright + Vitest, mocked externals)
pnpm test:integration

# E2E tests (Playwright headless, requires :3050 + Exp Engine :3100) — 4 tests
pnpm test:e2e

# Demo scenario tests (requires :3050 + :3100 + LLM API keys)
pnpm test:demo
```

## Project Structure

```
experimentation/
├── apps/
│   └── web/                # Single Next.js app (port 3050)
│       └── src/
│           ├── app/
│           │   ├── page.tsx            # DemoApp1 (/)
│           │   ├── demoapp2/page.tsx   # DemoApp2 (/demoapp2)
│           │   ├── dashboard/page.tsx  # Control Room (/dashboard)
│           │   ├── growthbook/page.tsx # Exp Engine iframe (/growthbook)
│           │   └── api/
│           │       ├── chat/           # AI chat (Vercel AI SDK, 7 Exp Engine tools)
│           │       ├── health/         # Server-side Exp Engine health proxy
│           │       ├── products/       # DemoApp1 product list with Exp Engine sort flag
│           │       ├── products/[id]/  # Single product lookup
│           │       └── demoapp2/       # DemoApp2 API (products, categories)
│           ├── components/
│           │   ├── Sidebar.tsx         # Left nav (Control Room / DemoApp1 / DemoApp2 / Exp Engine)
│           │   ├── ProductCard.tsx
│           │   ├── GrowthBookProvider.tsx
│           │   └── demoapp2/           # DemoApp2 components (SafewayHeader, HeroBanner, etc.)
│           └── lib/
│               ├── growthbook.ts       # Exp Engine React SDK singleton
│               ├── growthbook-api.ts   # Exp Engine REST client
│               └── llm-fallback.ts     # LLM provider fallback + rate-limit tracking
├── tests/
│   ├── e2e/                # Playwright E2E tests (fast, no LLM keys)
│   ├── integration/        # Playwright integration tests (mocked externals)
│   └── demo/               # Demo scenario tests (full AI → UI flow, LLM keys required)
├── scripts/                # start.sh, stop.sh, restart.sh — server management
├── docker-compose.yml      # Exp Engine (GrowthBook) + MongoDB
├── playwright.config.ts    # E2E config (workers: 4)
├── playwright.integration.config.ts # Integration test config
├── playwright.demo.config.ts # Demo test config (workers: 1, 90s timeout)
└── env.example             # Template — copy to apps/web/.env.local
```

## LLM Fallback Chain

The chat endpoint tries providers in order (first with a valid key wins):

1. **Cerebras** — gpt-oss-120b, fastest, free tier
2. **Mistral** — mistral-small-latest / mistral-medium-latest, free tier
3. **Groq** — llama-3.3-70b-versatile, fast, free tier
4. **Anthropic** — Claude Haiku 4.5, most reliable, paid (rate-limited)

## Adding a New Feature Flag — What Needs to Change

DemoApp1 and DemoApp2 use different flag evaluation architectures, so the work required differs.

---

### DemoApp1 (client-side SDK flags)

DemoApp1 reads flags directly in the browser via `useFeatureValue()` from the GrowthBook React SDK.

| Step | File | Required? |
|------|------|-----------|
| Create flag in Exp Engine (UI or chat) | — | Yes |
| Call `useFeatureValue("flag-id", defaultValue)` in the component or page | `apps/web/src/app/page.tsx` or a component | **Yes** |
| For API-side flags (e.g. sort order): read flag in the API route | `apps/web/src/app/api/products/route.ts` | If server-side |
| Deploy `apps/web` | Next.js server | **Yes** |

React components in DemoApp1 **do** need code changes — each new flag needs a `useFeatureValue()` call wired to a conditional render.

---

### DemoApp2 (Server-Driven UI — SDUI)

DemoApp2 uses a server-side layout API. The server evaluates all flags and returns a complete `PageLayout` object. React components are pure renderers — they accept typed props only and contain no flag logic.

| Step | File | Required? |
|------|------|-----------|
| Create flag in Exp Engine (UI or chat) | — | Yes |
| Evaluate the flag and translate it to props | `apps/web/src/app/api/demoapp2/layout/route.ts` | **Yes** |
| Add new prop fields if the component needs new data | `apps/web/src/lib/layout-types.ts` | Only if new prop shape |
| Update the React component to render the new prop | `apps/web/src/components/demoapp2/` | Only if new prop shape |
| Deploy `apps/web` | Next.js server | **Yes** |

**Zero React component changes** for most experiments — if the relevant prop already exists (e.g. `mode`, `layout`, `title`), only the layout API needs updating. The React component already knows how to render all the variations it accepts.

**Example**: Adding a `demoapp2-deals-sort` flag required:
1. One code change in `layout/route.ts` (evaluate flag → pass `sortOrder` prop)
2. No changes to `WeeklyDeals.tsx` — it already accepted a `sortOrder` prop

**Example**: Adding a brand-new UI element (e.g. a loyalty badge that didn't exist before) requires:
1. Code change in `layout-types.ts` (add prop field)
2. Code change in the component (render the new prop)
3. Code change in `layout/route.ts` (evaluate flag → set the prop)

---

### FAQ: Can I add a flag without touching code?

**No** — creating the flag in Exp Engine (via chat or UI) sets up the targeting rules, but the app needs to know how to respond to it. The code change is always server-side (the layout API or an API route), never in the React components for DemoApp2. For DemoApp1, the component itself needs a `useFeatureValue()` call.

The AI agent can create and configure flags instantly via chat — but deploying the server code that acts on those flags still requires a code change and redeploy of `apps/web`.

---

## Demo Scenarios

Good prompts for a live demo:

1. **Flip a layout** — "Create a string feature flag called product-card-layout with default value large-image" → DemoApp1 shows large cards after reload
2. **Toggle a section** — "Create a boolean feature flag called featured-section-enabled with default true" → Best Sellers section appears in DemoApp1
3. **Run an experiment** — "Create an experiment called Hero Banner Test with Control and Variant A"
4. **Check status** — "What feature flags are active?" / "List all running experiments"
5. **API-side flag** — Hit http://localhost:3050/api/products to see sort order change when `product-sort-order` flag changes

## Stopping

```bash
# Stop dev server: Ctrl+C in terminal

# Stop Exp Engine + MongoDB
docker compose down

# Delete all experiment data too
docker compose down -v
```
