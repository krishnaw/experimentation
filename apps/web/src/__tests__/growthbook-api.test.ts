import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock global fetch before importing the module
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  listExperiments,
  listFeatures,
  createFeature,
  updateFeature,
  listMetrics,
  listEnvironments,
  getExperimentResults,
  addTargetingRule,
  updateTargetingRule,
  createSavedGroup,
  listSavedGroups,
  addExperimentRule,
} from "@/lib/growthbook-api";

beforeEach(() => {
  mockFetch.mockReset();
});

describe("gbFetch", () => {
  it("throws when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => "Forbidden",
    });

    await expect(listEnvironments()).rejects.toThrow(
      "Exp Engine API error 403: Forbidden"
    );
  });
});

describe("listExperiments", () => {
  it("maps response correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        experiments: [
          {
            id: "exp-1",
            name: "Test Experiment",
            status: "running",
            trackingKey: "test-exp",
            variations: [{ name: "Control" }, { name: "Variant A" }],
            results: "won",
            extraField: "ignored",
          },
        ],
      }),
    });

    const result = await listExperiments();
    expect(result).toEqual([
      {
        id: "exp-1",
        name: "Test Experiment",
        status: "running",
        trackingKey: "test-exp",
        variations: ["Control", "Variant A"],
        results: "won",
      },
    ]);
  });
});

describe("listFeatures", () => {
  it("maps response correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        features: [
          {
            id: "feature-1",
            valueType: "boolean",
            defaultValue: "true",
            description: "A test feature",
            environmentSettings: {
              production: { enabled: true },
              staging: { enabled: false },
            },
            extraField: "ignored",
          },
        ],
      }),
    });

    const result = await listFeatures();
    expect(result).toEqual([
      {
        id: "feature-1",
        valueType: "boolean",
        defaultValue: "true",
        description: "A test feature",
        environments: ["production", "staging"],
      },
    ]);
  });
});

describe("createFeature", () => {
  it("sends correct body structure with environments from listEnvironments", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        environments: [{ id: "production" }, { id: "staging" }],
      }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ feature: { id: "new-flag" } }),
    });

    await createFeature({
      id: "new-flag",
      valueType: "boolean",
      defaultValue: "true",
      description: "A new flag",
    });

    const postCall = mockFetch.mock.calls[1];
    expect(postCall[0]).toContain("/api/v1/features");
    const body = JSON.parse(postCall[1].body);
    expect(body.id).toBe("new-flag");
    expect(body.valueType).toBe("boolean");
    expect(body.defaultValue).toBe("true");
    expect(body.description).toBe("A new flag");
    expect(body.owner).toBe("AI Agent");
  });

  it("falls back to production env when listEnvironments fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ feature: { id: "fallback-flag" } }),
    });

    await createFeature({
      id: "fallback-flag",
      valueType: "boolean",
      defaultValue: "false",
    });

    const postCall = mockFetch.mock.calls[1];
    const body = JSON.parse(postCall[1].body);
    expect(body.environments).toEqual({
      production: { enabled: true, rules: [] },
    });
  });

  it("includes rules: [] in environment settings", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        environments: [{ id: "production" }, { id: "dev" }],
      }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ feature: { id: "rules-flag" } }),
    });

    await createFeature({
      id: "rules-flag",
      valueType: "string",
      defaultValue: "hello",
    });

    const postCall = mockFetch.mock.calls[1];
    const body = JSON.parse(postCall[1].body);
    expect(body.environments.production).toEqual({
      enabled: true,
      rules: [],
    });
    expect(body.environments.dev).toEqual({ enabled: true, rules: [] });
  });
});

describe("updateFeature", () => {
  it("sends correct body to correct URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ feature: { id: "existing-flag" } }),
    });

    await updateFeature("existing-flag", {
      defaultValue: "new-value",
      description: "Updated description",
    });

    const call = mockFetch.mock.calls[0];
    expect(call[0]).toContain("/api/v1/features/existing-flag");
    expect(call[1].method).toBe("POST");
    const body = JSON.parse(call[1].body);
    expect(body.defaultValue).toBe("new-value");
    expect(body.description).toBe("Updated description");
  });
});

describe("listMetrics", () => {
  it("maps response correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        metrics: [
          {
            id: "metric-1",
            name: "Conversion Rate",
            type: "binomial",
            description: "Tracks conversions",
            extraField: "ignored",
          },
        ],
      }),
    });

    const result = await listMetrics();
    expect(result).toEqual([
      {
        id: "metric-1",
        name: "Conversion Rate",
        type: "binomial",
        description: "Tracks conversions",
      },
    ]);
  });
});

describe("listEnvironments", () => {
  it("returns environments array", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        environments: [
          { id: "production", description: "Prod" },
          { id: "staging", description: "Stage" },
        ],
      }),
    });

    const result = await listEnvironments();
    expect(result).toEqual([
      { id: "production", description: "Prod" },
      { id: "staging", description: "Stage" },
    ]);
  });
});

describe("getExperimentResults", () => {
  it("returns error object when fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => "Not found",
    });

    const result = await getExperimentResults("nonexistent-exp");
    expect(result).toEqual({
      error:
        "No results available yet — experiment may not have enough data.",
    });
  });
});

describe("addTargetingRule", () => {
  it("GETs feature then POSTs with new rule appended to existing rules", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        feature: {
          environmentSettings: {
            production: {
              enabled: true,
              rules: [{ type: "force", value: "old" }],
            },
          },
        },
      }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ feature: { id: "my-feature" } }),
    });

    await addTargetingRule("my-feature", "production", {
      type: "force",
      value: "new-val",
      condition: '{"tier":"gold"}',
    });

    const postCall = mockFetch.mock.calls[1];
    expect(postCall[0]).toContain("/api/v1/features/my-feature");
    expect(postCall[1].method).toBe("POST");
    const body = JSON.parse(postCall[1].body);
    const rules = body.environments.production.rules;
    expect(rules).toHaveLength(2);
    expect(rules[0]).toEqual({ type: "force", value: "old" });
    expect(rules[1]).toMatchObject({
      type: "force",
      value: "new-val",
      condition: '{"tier":"gold"}',
    });
  });

  it("works with empty existing rules", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        feature: {
          environmentSettings: {
            production: { enabled: true, rules: [] },
          },
        },
      }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ feature: { id: "my-feature" } }),
    });

    await addTargetingRule("my-feature", "production", {
      type: "force",
      value: "only-rule",
    });

    const postCall = mockFetch.mock.calls[1];
    const body = JSON.parse(postCall[1].body);
    const rules = body.environments.production.rules;
    expect(rules).toHaveLength(1);
    expect(rules[0]).toMatchObject({ type: "force", value: "only-rule" });
  });
});

describe("updateTargetingRule", () => {
  it("updates rule at specified index leaving other rules unchanged", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        feature: {
          environmentSettings: {
            production: {
              enabled: true,
              rules: [
                { type: "force", value: "first" },
                { type: "rollout", coverage: 0.1 },
              ],
            },
          },
        },
      }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ feature: { id: "my-feature" } }),
    });

    await updateTargetingRule("my-feature", "production", 1, {
      coverage: 0.5,
    });

    const postCall = mockFetch.mock.calls[1];
    const body = JSON.parse(postCall[1].body);
    const rules = body.environments.production.rules;
    expect(rules).toHaveLength(2);
    expect(rules[0]).toEqual({ type: "force", value: "first" });
    expect(rules[1].coverage).toBe(0.5);
  });

  it("throws when ruleIndex is out of range", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        feature: {
          environmentSettings: {
            production: {
              enabled: true,
              rules: [{ type: "force", value: "only" }],
            },
          },
        },
      }),
    });

    await expect(
      updateTargetingRule("my-feature", "production", 5, { value: "x" })
    ).rejects.toThrow("out of range");
  });
});

describe("createSavedGroup", () => {
  it("POSTs with correct body structure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ savedGroup: { id: "sg-1" } }),
    });

    await createSavedGroup({
      name: "West Coast",
      condition: '{"location":{"$in":["CA","WA"]}}',
    });

    const call = mockFetch.mock.calls[0];
    expect(call[0]).toContain("/api/v1/saved-groups");
    expect(call[1].method).toBe("POST");
    const body = JSON.parse(call[1].body);
    expect(body.name).toBe("West Coast");
    expect(body.type).toBe("condition");
    expect(body.condition).toBe('{"location":{"$in":["CA","WA"]}}');
  });
});

describe("listSavedGroups", () => {
  it("returns savedGroups from response", async () => {
    const groups = [
      { id: "sg-1", name: "West Coast" },
      { id: "sg-2", name: "Premium Users" },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ savedGroups: groups }),
    });

    const result = await listSavedGroups();
    expect(result).toEqual(groups);
  });
});

describe("addExperimentRule", () => {
  it("GETs feature then POSTs with experiment-ref rule appended", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        feature: {
          environmentSettings: {
            production: {
              enabled: true,
              rules: [{ type: "force", value: "baseline" }],
            },
          },
        },
      }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ feature: { id: "my-feature" } }),
    });

    await addExperimentRule("my-feature", "production", {
      experimentId: "exp-1",
      variations: [{ value: "a" }, { value: "b" }],
    });

    const postCall = mockFetch.mock.calls[1];
    expect(postCall[0]).toContain("/api/v1/features/my-feature");
    expect(postCall[1].method).toBe("POST");
    const body = JSON.parse(postCall[1].body);
    const rules = body.environments.production.rules;
    expect(rules).toHaveLength(2);
    expect(rules[0]).toEqual({ type: "force", value: "baseline" });
    expect(rules[1]).toEqual({
      type: "experiment-ref",
      experimentId: "exp-1",
      variations: [{ value: "a" }, { value: "b" }],
    });
  });
});
