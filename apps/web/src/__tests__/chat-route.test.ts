/**
 * Fallback chain tests for POST /api/chat
 *
 * What IS testable here:
 *   1. Pre-marked rate limit → provider skipped, next one used
 *   2. Synchronous throw (bad config, network error before streaming) → mark
 *      rate-limited + fall through to next provider
 *   3. All free providers exhausted → Anthropic last-resort
 *   4. All providers exhausted + Anthropic rate-limited → 503
 *
 * What is NOT testable here (known gap):
 *   A real HTTP 429 arrives *asynchronously* while consuming the stream.
 *   streamText() returns a lazy object immediately — the 429 surfaces when
 *   the response body is read, after tryProvider() has already returned a
 *   Response. The catch block in tryProvider() cannot intercept it.
 *   Consequence: mid-stream 429s silently error the stream to the client
 *   rather than falling through to the next provider.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  markRateLimited,
  resetRateLimits,
  resetAnthropicUsage,
  recordAnthropicUsage,
  ANTHROPIC_LIMITS,
} from "@/lib/llm-fallback";

// vi.mock factories are hoisted to the top of the file before any variable
// declarations. Use vi.hoisted() so the mock variables are available inside
// the factory closures.
const { mockStreamText, mockBuildFallbackChain } = vi.hoisted(() => ({
  mockStreamText: vi.fn(),
  mockBuildFallbackChain: vi.fn(),
}));

// ── Mock: streamText (and required re-exports from "ai") ─────────────────────
vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return { ...actual, streamText: mockStreamText };
});

// ── Mock: buildFallbackChain — lets us inject a controlled chain per test ────
vi.mock("@/lib/llm-fallback", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/llm-fallback")>();
  return { ...actual, buildFallbackChain: mockBuildFallbackChain };
});

// ── Mock: GrowthBook API — tools execute these; we don't care about them here ─
vi.mock("@/lib/growthbook-api", () => ({
  listExperiments: vi.fn().mockResolvedValue([]),
  createExperiment: vi.fn().mockResolvedValue({}),
  getExperimentResults: vi.fn().mockResolvedValue({}),
  listFeatures: vi.fn().mockResolvedValue([]),
  createFeature: vi.fn().mockResolvedValue({}),
  updateFeature: vi.fn().mockResolvedValue({}),
  listMetrics: vi.fn().mockResolvedValue([]),
  listEnvironments: vi.fn().mockResolvedValue([]),
  addTargetingRule: vi.fn().mockResolvedValue({}),
  updateTargetingRule: vi.fn().mockResolvedValue({}),
  createSavedGroup: vi.fn().mockResolvedValue({}),
  listSavedGroups: vi.fn().mockResolvedValue([]),
  addExperimentRule: vi.fn().mockResolvedValue({}),
}));

// ── Mock: @ai-sdk/anthropic ───────────────────────────────────────────────────
vi.mock("@ai-sdk/anthropic", () => ({
  createAnthropic: vi.fn(() => vi.fn(() => "mock-anthropic-model")),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(messages = [{ role: "user", content: "List all features" }]) {
  const { NextRequest } = require("next/server");
  return new NextRequest("http://localhost:3050/api/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
    headers: { "Content-Type": "application/json" },
  });
}

function makeStreamResult() {
  const headers = new Headers();
  const response = new Response("streamed content", { headers });
  return { toTextStreamResponse: () => response };
}

function fakeChain(keys: string[]) {
  return keys.map((key) => ({ key, name: key, model: {} }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/chat — fallback chain", () => {
  let originalAnthropicKey: string | undefined;

  beforeEach(() => {
    resetRateLimits();
    resetAnthropicUsage();
    mockStreamText.mockReset();
    mockBuildFallbackChain.mockReset();
    originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
    // Disable Anthropic by default — tests that need it set it explicitly
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    if (originalAnthropicKey !== undefined) {
      process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
    vi.resetModules();
  });

  // ── 1. Pre-marked rate limit ───────────────────────────────────────────────

  it("skips a pre-marked rate-limited provider and uses the next one", async () => {
    mockBuildFallbackChain.mockReturnValue(
      fakeChain(["cerebras/gpt-oss-120b", "mistral/mistral-small-latest"])
    );
    markRateLimited("cerebras/gpt-oss-120b");
    mockStreamText.mockReturnValue(makeStreamResult());

    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(makeRequest());

    expect(res.headers.get("X-Model")).toBe("mistral/mistral-small-latest");
    // streamText called exactly once — cerebras was skipped without a call
    expect(mockStreamText).toHaveBeenCalledTimes(1);
  });

  it("skips all pre-marked providers and returns 500 when no fallback remains", async () => {
    mockBuildFallbackChain.mockReturnValue(
      fakeChain(["cerebras/gpt-oss-120b", "mistral/mistral-small-latest"])
    );
    markRateLimited("cerebras/gpt-oss-120b");
    markRateLimited("mistral/mistral-small-latest");

    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
    expect(mockStreamText).not.toHaveBeenCalled();
  });

  // ── 2. Synchronous throw → mark rate-limited + fall through ───────────────

  it("catches a sync throw, marks provider rate-limited, and falls through to next", async () => {
    mockBuildFallbackChain.mockReturnValue(
      fakeChain(["cerebras/gpt-oss-120b", "mistral/mistral-small-latest"])
    );
    mockStreamText
      .mockImplementationOnce(() => { throw new Error("Connection refused"); })
      .mockReturnValueOnce(makeStreamResult());

    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(makeRequest());

    expect(res.headers.get("X-Model")).toBe("mistral/mistral-small-latest");
    expect(mockStreamText).toHaveBeenCalledTimes(2);
    // cerebras should now be marked as rate-limited
    const { isRateLimited } = await import("@/lib/llm-fallback");
    expect(isRateLimited("cerebras/gpt-oss-120b")).toBe(true);
  });

  it("falls through entire chain of sync-throwing providers and returns 500", async () => {
    mockBuildFallbackChain.mockReturnValue(
      fakeChain(["cerebras/gpt-oss-120b", "mistral/mistral-small-latest", "groq/llama-3.3-70b-versatile"])
    );
    mockStreamText.mockImplementation(() => { throw new Error("503 Service Unavailable"); });

    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
    expect(mockStreamText).toHaveBeenCalledTimes(3);
  });

  // ── 3. Anthropic last-resort ───────────────────────────────────────────────

  it("falls through to Anthropic when all free providers are rate-limited", async () => {
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
    mockBuildFallbackChain.mockReturnValue(
      fakeChain(["cerebras/gpt-oss-120b", "mistral/mistral-small-latest"])
    );
    markRateLimited("cerebras/gpt-oss-120b");
    markRateLimited("mistral/mistral-small-latest");
    mockStreamText.mockReturnValue(makeStreamResult());

    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(makeRequest());

    expect(res.headers.get("X-Model")).toBe("anthropic/claude-haiku-4-5");
    // streamText called once for Anthropic only (free providers were skipped)
    expect(mockStreamText).toHaveBeenCalledTimes(1);
  });

  it("falls through to Anthropic when all free providers throw synchronously", async () => {
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
    mockBuildFallbackChain.mockReturnValue(
      fakeChain(["cerebras/gpt-oss-120b"])
    );
    mockStreamText
      .mockImplementationOnce(() => { throw new Error("429 Too Many Requests"); })
      .mockReturnValueOnce(makeStreamResult());

    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(makeRequest());

    expect(res.headers.get("X-Model")).toBe("anthropic/claude-haiku-4-5");
  });

  // ── 4. Anthropic rate-limited → 503 ───────────────────────────────────────

  it("returns 503 when all free providers exhausted and Anthropic sliding-window limit hit", async () => {
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
    mockBuildFallbackChain.mockReturnValue([]);
    // Fill up the 5-min burst limit
    const burstMax = ANTHROPIC_LIMITS.find((l) => l.label === "5min")!.max;
    for (let i = 0; i < burstMax; i++) recordAnthropicUsage();

    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(makeRequest());

    expect(res.status).toBe(503);
    expect(mockStreamText).not.toHaveBeenCalled();
  });

  it("returns 500 when no providers are configured at all", async () => {
    mockBuildFallbackChain.mockReturnValue([]);
    delete process.env.ANTHROPIC_API_KEY;

    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
  });

  // ── 5. Happy path ──────────────────────────────────────────────────────────

  it("uses first provider when available and returns its X-Model header", async () => {
    mockBuildFallbackChain.mockReturnValue(
      fakeChain(["cerebras/gpt-oss-120b", "mistral/mistral-small-latest"])
    );
    mockStreamText.mockReturnValue(makeStreamResult());

    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(makeRequest());

    expect(res.headers.get("X-Model")).toBe("cerebras/gpt-oss-120b");
    expect(mockStreamText).toHaveBeenCalledTimes(1);
  });
});
