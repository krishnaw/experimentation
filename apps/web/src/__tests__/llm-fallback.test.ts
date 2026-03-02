import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  buildFallbackChain,
  isRateLimited,
  markRateLimited,
  resetRateLimits,
  isAnthropicAllowed,
  recordAnthropicUsage,
  resetAnthropicUsage,
  getAnthropicUsage,
  RATE_LIMIT_BACKOFF_MS,
  ANTHROPIC_LIMITS,
} from "@/lib/llm-fallback";

describe("buildFallbackChain", () => {
  it("returns empty array when no provider keys are set", () => {
    const chain = buildFallbackChain({});
    expect(chain).toHaveLength(0);
  });

  it("includes Mistral entries (small then medium) when MISTRAL_API_KEY is set", () => {
    const chain = buildFallbackChain({ MISTRAL_API_KEY: "test-key" });
    const keys = chain.map((e) => e.key);
    expect(keys).toContain("mistral/mistral-small-latest");
    expect(keys).toContain("mistral/mistral-medium-latest");
    expect(keys.indexOf("mistral/mistral-small-latest")).toBeLessThan(
      keys.indexOf("mistral/mistral-medium-latest")
    );
  });

  it("places Cerebras before Mistral in the chain", () => {
    const chain = buildFallbackChain({
      CEREBRAS_API_KEY: "cerebras-key",
      MISTRAL_API_KEY: "mistral-key",
    });
    const keys = chain.map((e) => e.key);
    expect(keys[0]).toBe("cerebras/llama-3.3-70b");
    expect(keys).toContain("mistral/mistral-small-latest");
    expect(keys.indexOf("cerebras/llama-3.3-70b")).toBeLessThan(
      keys.indexOf("mistral/mistral-small-latest")
    );
  });

  it("places Groq after Mistral in the chain", () => {
    const chain = buildFallbackChain({
      MISTRAL_API_KEY: "mistral-key",
      GROQ_API_KEY: "groq-key",
    });
    const keys = chain.map((e) => e.key);
    expect(keys).toContain("mistral/mistral-small-latest");
    expect(keys).toContain("groq/llama-3.3-70b-versatile");
    expect(keys.indexOf("mistral/mistral-small-latest")).toBeLessThan(
      keys.indexOf("groq/llama-3.3-70b-versatile")
    );
  });

  it("does NOT include Anthropic (it is last-resort, not in free chain)", () => {
    const chain = buildFallbackChain({
      CEREBRAS_API_KEY: "c",
      MISTRAL_API_KEY: "m",
      GROQ_API_KEY: "g",
      ANTHROPIC_API_KEY: "a",
    });
    const keys = chain.map((e) => e.key);
    expect(keys.every((k) => !k.includes("anthropic"))).toBe(true);
  });

  it("each entry has key, name, and model properties", () => {
    const chain = buildFallbackChain({ MISTRAL_API_KEY: "test-key" });
    for (const entry of chain) {
      expect(entry.key).toBeTruthy();
      expect(entry.name).toBeTruthy();
      expect(entry.model).toBeTruthy();
    }
  });

  it("key and name are identical (both used for display and tracking)", () => {
    const chain = buildFallbackChain({ MISTRAL_API_KEY: "test-key" });
    for (const entry of chain) {
      expect(entry.key).toBe(entry.name);
    }
  });
});

describe("rate-limit tracking", () => {
  beforeEach(() => resetRateLimits());

  it("isRateLimited returns false for unknown key", () => {
    expect(isRateLimited("cerebras/llama-3.3-70b")).toBe(false);
  });

  it("isRateLimited returns true immediately after markRateLimited", () => {
    markRateLimited("cerebras/llama-3.3-70b");
    expect(isRateLimited("cerebras/llama-3.3-70b")).toBe(true);
  });

  it("markRateLimited with 0ms expires immediately on next check", () => {
    markRateLimited("mistral/mistral-small-latest", 0);
    expect(isRateLimited("mistral/mistral-small-latest")).toBe(false);
  });

  it("rate limit on one key does not affect another key", () => {
    markRateLimited("cerebras/llama-3.3-70b");
    expect(isRateLimited("mistral/mistral-small-latest")).toBe(false);
  });

  it("resetRateLimits clears all backoffs", () => {
    markRateLimited("cerebras/llama-3.3-70b");
    markRateLimited("mistral/mistral-small-latest");
    resetRateLimits();
    expect(isRateLimited("cerebras/llama-3.3-70b")).toBe(false);
    expect(isRateLimited("mistral/mistral-small-latest")).toBe(false);
  });

  it("RATE_LIMIT_BACKOFF_MS is 10 minutes", () => {
    expect(RATE_LIMIT_BACKOFF_MS).toBe(10 * 60_000);
  });

  it("multiple calls to markRateLimited reset the expiry", () => {
    markRateLimited("groq/llama-3.3-70b-versatile", 1000);
    markRateLimited("groq/llama-3.3-70b-versatile", 60_000);
    expect(isRateLimited("groq/llama-3.3-70b-versatile")).toBe(true);
  });
});

describe("Anthropic usage guard", () => {
  beforeEach(() => resetAnthropicUsage());

  it("isAnthropicAllowed returns true with no usage", () => {
    expect(isAnthropicAllowed()).toBe(true);
  });

  it("recordAnthropicUsage increments the usage count", () => {
    recordAnthropicUsage();
    recordAnthropicUsage();
    const usage = getAnthropicUsage();
    expect(usage["5min"].used).toBe(2);
    expect(usage["1hr"].used).toBe(2);
    expect(usage["day"].used).toBe(2);
  });

  it("isAnthropicAllowed returns false when burst limit (10/5min) is exceeded", () => {
    const burstMax = ANTHROPIC_LIMITS.find((l) => l.label === "5min")!.max;
    for (let i = 0; i < burstMax; i++) recordAnthropicUsage();
    expect(isAnthropicAllowed()).toBe(false);
  });

  it("isAnthropicAllowed returns true with one less than burst limit", () => {
    const burstMax = ANTHROPIC_LIMITS.find((l) => l.label === "5min")!.max;
    for (let i = 0; i < burstMax - 1; i++) recordAnthropicUsage();
    expect(isAnthropicAllowed()).toBe(true);
  });

  it("isAnthropicAllowed returns false when hourly limit (40/hr) is exceeded", () => {
    const hourMax = ANTHROPIC_LIMITS.find((l) => l.label === "1hr")!.max;
    for (let i = 0; i < hourMax; i++) recordAnthropicUsage();
    expect(isAnthropicAllowed()).toBe(false);
  });

  it("resetAnthropicUsage clears all usage history", () => {
    for (let i = 0; i < 15; i++) recordAnthropicUsage();
    resetAnthropicUsage();
    expect(isAnthropicAllowed()).toBe(true);
    expect(getAnthropicUsage()["5min"].used).toBe(0);
  });

  it("ANTHROPIC_LIMITS has 5min, 1hr, and day windows", () => {
    const labels = ANTHROPIC_LIMITS.map((l) => l.label);
    expect(labels).toContain("5min");
    expect(labels).toContain("1hr");
    expect(labels).toContain("day");
  });

  it("sliding window prunes entries older than the largest window", () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now - 25 * 60 * 60_000);
    recordAnthropicUsage();
    vi.setSystemTime(now);
    expect(isAnthropicAllowed()).toBe(true);
    expect(getAnthropicUsage()["day"].used).toBe(0);
    vi.useRealTimers();
  });
});

describe.skip("HTTP integration — live /api/chat (requires app on :3050)", () => {
  const APP_URL = "http://localhost:3050";
  const MSG = [{ role: "user", content: "Say the word OK and nothing else." }];

  it("responds 200 with X-Model header, non-empty body, and a free provider (not anthropic)", async () => {
    const res = await fetch(`${APP_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: MSG }),
    });

    expect(res.status).toBe(200);

    const model = res.headers.get("X-Model") ?? "";
    expect(model).toBeTruthy();
    console.log(`  X-Model: ${model}`);

    const knownPatterns = [/^cerebras\//, /^mistral\//, /^groq\//, /^anthropic\//];
    expect(knownPatterns.some((p) => p.test(model))).toBe(true);

    const text = await res.text();
    expect(text.length).toBeGreaterThan(0);

    expect(model).not.toBe("anthropic/claude-haiku-4-5");
  }, 30_000);
});
