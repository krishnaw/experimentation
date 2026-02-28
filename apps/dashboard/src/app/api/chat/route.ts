import { streamText, tool, stepCountIs } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { NextRequest } from "next/server";
import {
  listExperiments,
  createExperiment,
  getExperimentResults,
  listFeatures,
  createFeature,
  updateFeature,
  listMetrics,
  listEnvironments,
} from "@/lib/growthbook-api";
import {
  buildFallbackChain,
  isRateLimited,
  markRateLimited,
  isAnthropicAllowed,
  recordAnthropicUsage,
  type ChainEntry,
} from "@/lib/llm-fallback";

const SYSTEM_PROMPT = `You are an AI assistant that helps manage A/B experiments and feature flags in GrowthBook.
You have tools to list experiments, create experiments, check results, and manage feature flags.
Be concise. When listing data, format it clearly. When creating things, confirm what was created.`;

const tools = {
  list_experiments: tool({
    description:
      "List all A/B experiments in GrowthBook. Returns experiment names, status (draft/running/stopped), tracking keys, and variations.",
    inputSchema: z.object({}),
    execute: async () => {
      const experiments = await listExperiments();
      return JSON.stringify(experiments, null, 2);
    },
  }),

  create_experiment: tool({
    description:
      "Create a new A/B experiment in GrowthBook. Requires a name, tracking key (snake_case), and at least 2 variations.",
    inputSchema: z.object({
      name: z.string().describe("Human-readable experiment name"),
      trackingKey: z
        .string()
        .describe("Unique snake_case identifier (e.g. hero_banner_test)"),
      hypothesis: z.string().optional().describe("What you expect to happen"),
      variations: z
        .string()
        .describe(
          'JSON array of variation objects, e.g. [{"name":"Control"},{"name":"Variant A"}]'
        ),
    }),
    execute: async ({ name, trackingKey, hypothesis, variations }) => {
      const parsedVariations = JSON.parse(variations);
      const result = await createExperiment({
        name,
        trackingKey,
        hypothesis,
        variations: parsedVariations,
      });
      return `Experiment created: ${result.experiment?.id || JSON.stringify(result)}`;
    },
  }),

  get_experiment_results: tool({
    description:
      "Get statistical results for a specific experiment by its ID.",
    inputSchema: z.object({
      experimentId: z
        .string()
        .describe("The experiment ID from list_experiments"),
    }),
    execute: async ({ experimentId }) => {
      const results = await getExperimentResults(experimentId);
      return JSON.stringify(results, null, 2);
    },
  }),

  list_features: tool({
    description:
      "List all feature flags in GrowthBook. Returns feature IDs, types, default values, and enabled environments.",
    inputSchema: z.object({}),
    execute: async () => {
      const features = await listFeatures();
      return JSON.stringify(features, null, 2);
    },
  }),

  create_feature: tool({
    description:
      "Create a new feature flag in GrowthBook. Value types: boolean, string, number, json.",
    inputSchema: z.object({
      id: z
        .string()
        .describe("Feature key in kebab-case (e.g. show-discount-banner)"),
      valueType: z
        .string()
        .describe("Type of value: boolean, string, number, or json"),
      defaultValue: z
        .string()
        .describe('Default value as a string (e.g. "true", "grid", "42")'),
      description: z.string().optional().describe("What this feature controls"),
    }),
    execute: async ({ id, valueType, defaultValue, description }) => {
      const result = await createFeature({
        id,
        valueType,
        defaultValue,
        description,
      });
      return `Feature created: ${result.feature?.id || JSON.stringify(result)}`;
    },
  }),

  update_feature: tool({
    description:
      "Update an existing feature flag in GrowthBook. Use this to change the default value or description of a feature that already exists.",
    inputSchema: z.object({
      id: z.string().describe("The feature flag ID to update (e.g. product-sort-order)"),
      defaultValue: z.string().optional().describe("New default value for the feature"),
      description: z.string().optional().describe("New description for the feature"),
    }),
    execute: async ({ id, defaultValue, description }) => {
      const result = await updateFeature(id, { defaultValue, description });
      return `Feature updated: ${result.feature?.id || JSON.stringify(result)}`;
    },
  }),

  list_metrics: tool({
    description:
      "List all metrics in GrowthBook that can be used to measure experiment success.",
    inputSchema: z.object({}),
    execute: async () => {
      const metrics = await listMetrics();
      return JSON.stringify(metrics, null, 2);
    },
  }),

  list_environments: tool({
    description: "List all environments in GrowthBook (e.g. development, production).",
    inputSchema: z.object({}),
    execute: async () => {
      const envs = await listEnvironments();
      return JSON.stringify(envs, null, 2);
    },
  }),
};

// ── Stream helper: attempt a provider, skip if rate-limited ───────────────────
// Synchronous so Next.js App Router can stream the response without an await
// interrupting the hot path (awaiting a streaming Response breaks body delivery).
type StreamResult = { response: Response; name: string };

function tryProvider(
  entry: ChainEntry,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any,
): StreamResult | null {
  if (isRateLimited(entry.key)) {
    console.log(`[chat] Skipping rate-limited: ${entry.key}`);
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any;
  try {
    result = streamText({ model: entry.model, system: SYSTEM_PROMPT, messages, tools, stopWhen: stepCountIs(5) });
  } catch (err) {
    console.warn(`[chat] streamText setup error for ${entry.key}:`, err);
    return null;
  }

  const streamResponse = result.toTextStreamResponse();
  streamResponse.headers.set("X-Model", entry.name);
  return { response: streamResponse, name: entry.name };
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const chain = buildFallbackChain();

  // 1. Try free providers in order (Cerebras → Mistral → Groq)
  for (const entry of chain) {
    const res = tryProvider(entry, messages);
    if (!res) continue;
    console.log(`[chat] Using provider: ${res.name}`);
    return res.response;
  }

  // 2. Last resort: Anthropic (paid) — guarded by sliding-window usage limits
  if (process.env.ANTHROPIC_API_KEY) {
    if (!isAnthropicAllowed()) {
      console.error("[chat] All free providers exhausted and Anthropic limit reached");
      return new Response("All LLM providers unavailable", { status: 503 });
    }
    try {
      const result = streamText({
        model: createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })("claude-haiku-4-5-20251001"),
        system: SYSTEM_PROMPT,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: messages as any,
        tools,
        stopWhen: stepCountIs(5),
      });
      console.log("[chat] Using provider: anthropic/claude-haiku-4-5 (last resort)");
      recordAnthropicUsage();
      const streamResponse = result.toTextStreamResponse();
      const headers = new Headers(streamResponse.headers);
      headers.set("X-Model", "anthropic/claude-haiku-4-5");
      return new Response(streamResponse.body, { status: streamResponse.status, headers });
    } catch (err) {
      console.error("[chat] Anthropic last-resort failed:", err);
    }
  }

  if (chain.length === 0 && !process.env.ANTHROPIC_API_KEY) {
    return new Response("No LLM provider configured", { status: 500 });
  }
  return new Response("All LLM providers failed", { status: 500 });
}
