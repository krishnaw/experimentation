# Experimentation Platform — Claude Instructions

## Apps and Ports

| App | Port | Notes |
|-----|------|-------|
| `apps/web` | 3050 | Single Next.js app (Control Room + DemoApp1 + DemoApp2 + Exp Engine pages) |
| Exp Engine UI | 3000 | Docker (GrowthBook) |
| Exp Engine API | 3100 | Docker (GrowthBook) |

> **Exp Engine** is our user-facing brand for GrowthBook. All SDK/API/Docker internals use GrowthBook; "Exp Engine" appears in the UI, system prompts, tool descriptions, and docs.

## Commands

```bash
pnpm test              # all unit tests (Vitest, no servers) — 161 tests (160 pass + 1 skipped)
pnpm test:integration  # integration tests (Playwright + Vitest, mocked externals)
pnpm test:e2e          # E2E tests (needs :3050 + :3100, no LLM keys) — 4 tests
pnpm test:demo         # demo scenario tests (needs :3050 + :3100 + LLM keys)
pnpm dev:web           # Single app on :3050
```

## Test Suite Distinctions

Keep the four test suites separate — they serve different purposes:

| Suite | Command | Servers needed | Speed | Purpose |
|-------|---------|----------------|-------|---------|
| Unit | `pnpm test` | None | ~2s | Fast regression, pure logic |
| Integration | `pnpm test:integration` | Varies (mocked) | ~10s | Pairwise service contracts |
| E2E | `pnpm test:e2e` | :3050 + :3100 | ~15s | UI smoke, no LLM keys |
| Demo | `pnpm test:demo` | :3050 + :3100 + LLM keys | ~5min | Storytelling / showcase flows |

**Do NOT merge demo tests into E2E.** Demo tests require LLM API keys, all servers, 90s timeouts per test, and create/delete real Exp Engine data. E2E tests are intentionally lightweight and runnable without LLM keys.

## After Every Change

1. `pnpm test` — unit tests
2. `pnpm test:integration` — if service contracts changed
3. `pnpm test:e2e` — if UI changed (needs servers running)
4. Update the relevant MD file (see Documentation Ownership in global CLAUDE.md)

## Control Room — apps/web Dashboard Route

Control Room lives in `apps/web` at the `/dashboard` route. Split-panel layout: context panel (left, 280px) + chat panel (right).

`apps/web` owns:
- `src/app/api/chat/route.ts` — AI chat (Vercel AI SDK, 13 tools, LLM fallback)
- `src/app/api/experiments/route.ts` — proxy for Exp Engine experiments list
- `src/app/api/features/route.ts` — proxy for Exp Engine features list
- `src/app/api/demoapp2/evaluate/route.ts` — server-side feature evaluation (remote eval)
- `src/app/api/demoapp2/layout/route.ts` — SDUI layout API (assembles full page layout server-side)
- `src/lib/layout-types.ts` — shared TypeScript types for SDUI layout sections and props
- `src/lib/growthbook-api.ts` — Exp Engine REST client (targeting rules, saved groups, experiment rules)
- `src/app/dashboard/page.tsx` — Control Room (split-panel: context + chat)

## LLM Code Conventions

> Provider overview and fallback order → see README.md "LLM Fallback Chain"

Anthropic usage limits (sliding-window): 10/5min (burst), 40/1hr, 200/24hr. Rate-limit backoff: 10 minutes per provider on error.

```typescript
createOpenAI({ baseURL, apiKey, fetch: patchSystemRole }).chat(modelId)  // .chat() + fetch patch required
createAnthropic({ apiKey })(modelId)              // Anthropic — guarded by isAnthropicAllowed()
stopWhen: stepCountIs(5)                          // Vercel AI SDK v6 syntax
```

**AI SDK v6 `developer` role bug**: `@ai-sdk/openai` v2.x treats ALL non-OpenAI model IDs as reasoning models → sends `role:"developer"` for system messages. Mistral/Groq/Cerebras reject this (422). Fix: custom `fetch` wrapper in `llm-fallback.ts` that rewrites `developer` → `system` in the request body.

## Build Notes

- **Windows build**: must use `cross-env NODE_ENV=production` — Windows sets `NODE_ENV=development` which overrides `next build`
- **`_global-error` prerendering**: fails with `NODE_ENV=development` — this is a Next.js 16 bug, not a code issue

## Exp Engine (GrowthBook) Gotchas

- `createFeature` must pass `environments: { [envId]: { enabled: true, rules: [] } }` — `rules: []` is required or Exp Engine returns 400
- If `listEnvironments()` fails silently, fallback to `"production"` env
- SDK endpoint (`/api/features/{key}`) only returns features enabled in that environment
- Browser CORS: use server-side `/api/health` proxy, not direct fetch to `:3100`
- Exp Engine React SDK caches in `localStorage['gbFeaturesCache']` — clear before reload in tests
- Features endpoint: `Cache-Control: public, max-age=30, stale-while-revalidate=3600`

## Environment Files

Only one env file needed:

```
apps/web/.env.local  — NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY, GROWTHBOOK_SECRET_API_KEY, LLM keys
```

Template: `env.example` at repo root.
