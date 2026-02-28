# Experimentation Platform — Claude Instructions

## Apps and Ports

| App | Port | Filter |
|-----|------|--------|
| `apps/dashboard` | 4000 | `--filter dashboard` |
| `apps/web` | 3050 | `--filter web` |
| `apps/api` | 3200 | `--filter api` |
| GrowthBook UI | 3000 | Docker |
| GrowthBook API | 3100 | Docker |

## Commands

```bash
pnpm test              # all unit tests (Vitest, no servers) — 51 tests
pnpm test:integration  # integration tests (Playwright + Vitest, mocked externals)
pnpm test:e2e          # E2E tests (needs :3050 + :3100, no LLM keys) — 5 tests
pnpm test:demo         # demo scenario tests (needs all servers + LLM keys)
pnpm dev:dashboard     # Dashboard on :4000
pnpm dev:web           # ShopDemo on :3050
pnpm dev:api           # API server on :3200
```

## Test Suite Distinctions

Keep the four test suites separate — they serve different purposes:

| Suite | Command | Servers needed | Speed | Purpose |
|-------|---------|----------------|-------|---------|
| Unit | `pnpm test` | None | ~2s | Fast regression, pure logic |
| Integration | `pnpm test:integration` | Varies (mocked) | ~10s | Pairwise service contracts |
| E2E | `pnpm test:e2e` | :3050 + :3100 | ~15s | UI smoke, no LLM keys |
| Demo | `pnpm test:demo` | All 4 + LLM keys | ~5min | Storytelling / showcase flows |

**Do NOT merge demo tests into E2E.** Demo tests require LLM API keys, all four servers, 90s timeouts per test, and create/delete real GrowthBook data. E2E tests are intentionally lightweight and runnable without LLM keys.

## After Every Change

1. `pnpm test` — unit tests
2. `pnpm test:integration` — if service contracts changed
3. `pnpm test:e2e` — if UI changed (needs servers running)
4. Update the relevant MD file (see Documentation Ownership in global CLAUDE.md)

## Chat — Dashboard Only

Chat exists **only in `apps/dashboard`**. It was removed from `apps/web`.

`apps/dashboard` owns:
- `src/app/api/chat/route.ts` — AI chat (Vercel AI SDK, 7 tools, LLM fallback)
- `src/lib/growthbook-api.ts` — GrowthBook REST client

`apps/web` has **neither** of these files. Do not add chat back to web.

## LLM Fallback Chain (dashboard only)

Free providers tried in order (first available key wins):
1. **Cerebras** — llama-3.3-70b (fastest, free tier)
2. **Mistral** — mistral-small-latest, then mistral-medium-latest (free tier)
3. **Groq** — llama-3.3-70b-versatile (free tier)
4. **Anthropic** — claude-haiku-4-5 (paid last-resort, sliding-window guarded)

Anthropic usage limits (sliding-window):
- 10/5min (burst), 40/1hr, 200/24hr

Rate-limit backoff: 10 minutes per provider on error.

```typescript
createOpenAI({ baseURL, apiKey }).chat(modelId)   // Cerebras, Mistral, Groq — .chat() required
createAnthropic({ apiKey })(modelId)              // Anthropic — guarded by isAnthropicAllowed()
stopWhen: stepCountIs(5)                          // Vercel AI SDK v6 syntax
```

## GrowthBook Gotchas

- `createFeature` must pass `environments: { [envId]: { enabled: true, rules: [] } }` — `rules: []` is required or GrowthBook returns 400
- If `listEnvironments()` fails silently, fallback to `"production"` env
- SDK endpoint (`/api/features/{key}`) only returns features enabled in that environment
- Browser CORS: Dashboard must use server-side `/api/health` proxy, not direct fetch to `:3100`
- GrowthBook React SDK caches in `localStorage['gbFeaturesCache']` — clear before reload in tests
- Features endpoint: `Cache-Control: public, max-age=30, stale-while-revalidate=3600`

## Environment Files

Each app needs its own env file:

```
apps/web/.env.local        — NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY, GROWTHBOOK_SECRET_API_KEY
apps/dashboard/.env.local  — NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY, GROWTHBOOK_SECRET_API_KEY, LLM keys
apps/api/.env              — GROWTHBOOK_CLIENT_KEY, GROWTHBOOK_SECRET_API_KEY
```

Template: `env.example` at repo root.
