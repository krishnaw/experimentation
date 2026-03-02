/**
 * LLM fallback chain — rate-limit tracking and Anthropic usage guard.
 */

import { createOpenAI } from "@ai-sdk/openai";

// ── Rate-limit backoff ────────────────────────────────────────────────────────
export const RATE_LIMIT_BACKOFF_MS = 10 * 60_000; // 10 minutes

const rateLimitUntil = new Map<string, number>(); // key → expiry timestamp (ms)

export function isRateLimited(key: string): boolean {
  const until = rateLimitUntil.get(key);
  if (!until) return false;
  if (Date.now() >= until) {
    rateLimitUntil.delete(key);
    return false;
  }
  return true;
}

export function markRateLimited(key: string, ms = RATE_LIMIT_BACKOFF_MS): void {
  rateLimitUntil.set(key, Date.now() + ms);
}

/** Clear all rate-limit state (use in tests). */
export function resetRateLimits(): void {
  rateLimitUntil.clear();
}

// ── Anthropic sliding-window usage guard ──────────────────────────────────────
export const ANTHROPIC_LIMITS = [
  { label: "5min", window: 5 * 60_000,       max: 10  },
  { label: "1hr",  window: 60 * 60_000,      max: 40  },
  { label: "day",  window: 24 * 60 * 60_000, max: 200 },
];

const anthropicUsage: number[] = []; // timestamps of successful calls

export function isAnthropicAllowed(): boolean {
  const now = Date.now();
  const maxWindow = Math.max(...ANTHROPIC_LIMITS.map((l) => l.window));
  while (anthropicUsage.length > 0 && anthropicUsage[0] < now - maxWindow) {
    anthropicUsage.shift();
  }
  for (const { label, window, max } of ANTHROPIC_LIMITS) {
    const count = anthropicUsage.filter((t) => t >= now - window).length;
    if (count >= max) {
      console.warn(`[llm] Anthropic ${label} limit: ${count}/${max}`);
      return false;
    }
  }
  return true;
}

export function recordAnthropicUsage(): void {
  anthropicUsage.push(Date.now());
}

/** Clear Anthropic usage history (use in tests). */
export function resetAnthropicUsage(): void {
  anthropicUsage.length = 0;
}

/** Expose current usage counts for diagnostics / tests. */
export function getAnthropicUsage(): Record<string, { used: number; max: number }> {
  const now = Date.now();
  const result: Record<string, { used: number; max: number }> = {};
  for (const { label, window, max } of ANTHROPIC_LIMITS) {
    result[label] = {
      used: anthropicUsage.filter((t) => t >= now - window).length,
      max,
    };
  }
  return result;
}

// ── Free-tier fallback chain ──────────────────────────────────────────────────
export type ChainEntry = {
  key: string;   // rate-limit tracking key, e.g. "mistral/mistral-small-latest"
  name: string;  // shown in X-Model response header
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any;    // LanguageModelV2 — typed as any to avoid AI SDK generic complexity
};

/**
 * Custom fetch that rewrites "developer" role to "system" in the request body.
 * AI SDK v6 + @ai-sdk/openai treats non-OpenAI model IDs as "reasoning models"
 * and sends role:"developer", which Mistral/Groq/Cerebras reject (422).
 */
const patchSystemRole: typeof globalThis.fetch = async (input, init) => {
  if (init?.body && typeof init.body === "string") {
    try {
      const body = JSON.parse(init.body);
      if (Array.isArray(body.messages)) {
        let patched = false;
        for (const msg of body.messages) {
          if (msg.role === "developer") {
            msg.role = "system";
            patched = true;
          }
        }
        if (patched) {
          init = { ...init, body: JSON.stringify(body) };
        }
      }
    } catch {
      // not JSON, pass through
    }
  }
  return globalThis.fetch(input, init);
};

/**
 * Build the ordered free-provider fallback chain from available API keys.
 * Anthropic is NOT included here — it is the paid last-resort in route.ts.
 */
export function buildFallbackChain(env: Record<string, string | undefined> = process.env): ChainEntry[] {
  const chain: ChainEntry[] = [];

  if (env.CEREBRAS_API_KEY) {
    const c = createOpenAI({ baseURL: "https://api.cerebras.ai/v1", apiKey: env.CEREBRAS_API_KEY, fetch: patchSystemRole });
    chain.push({ key: "cerebras/gpt-oss-120b", name: "cerebras/gpt-oss-120b", model: c.chat("gpt-oss-120b") });
  }

  if (env.MISTRAL_API_KEY) {
    const c = createOpenAI({ baseURL: "https://api.mistral.ai/v1", apiKey: env.MISTRAL_API_KEY, fetch: patchSystemRole });
    chain.push({ key: "mistral/mistral-small-latest",  name: "mistral/mistral-small-latest",  model: c.chat("mistral-small-latest") });
    chain.push({ key: "mistral/mistral-medium-latest", name: "mistral/mistral-medium-latest", model: c.chat("mistral-medium-latest") });
  }

  if (env.GROQ_API_KEY) {
    const c = createOpenAI({ baseURL: "https://api.groq.com/openai/v1", apiKey: env.GROQ_API_KEY, fetch: patchSystemRole });
    chain.push({ key: "groq/llama-3.3-70b-versatile", name: "groq/llama-3.3-70b-versatile", model: c.chat("llama-3.3-70b-versatile") });
  }

  return chain;
}
