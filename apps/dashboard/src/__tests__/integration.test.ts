import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const GB_API_URL = "http://localhost:3100";
const GB_SECRET_KEY = "test-secret-key";

// Capture original fetch
const originalFetch = globalThis.fetch;

// Helper to create a mock fetch for specific URL patterns
function createMockFetch(handlers: Record<string, { body: any; status?: number }>) {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    for (const [pattern, { body, status }] of Object.entries(handlers)) {
      if (url.includes(pattern)) {
        return {
          ok: (status ?? 200) < 400,
          status: status ?? 200,
          json: async () => body,
          text: async () => JSON.stringify(body),
        } as Response;
      }
    }

    // Default: 404
    return {
      ok: false,
      status: 404,
      json: async () => ({ error: "not found" }),
      text: async () => "not found",
    } as Response;
  });
}

describe("Dashboard growthbook-api.ts ↔ GrowthBook REST API integration", () => {
  beforeEach(() => {
    vi.resetModules();
    // Set env vars before importing the module
    process.env.GROWTHBOOK_API_URL = GB_API_URL;
    process.env.GROWTHBOOK_SECRET_API_KEY = GB_SECRET_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
    delete process.env.GROWTHBOOK_API_URL;
    delete process.env.GROWTHBOOK_SECRET_API_KEY;
  });

  describe("listExperiments", () => {
    it("calls GET /api/v1/experiments?limit=25 with Bearer auth and maps response", async () => {
      const mockFetch = createMockFetch({
        "/api/v1/experiments": {
          body: {
            experiments: [
              {
                id: "exp-1",
                name: "Test Experiment",
                status: "running",
                trackingKey: "test_exp",
                variations: [{ name: "Control" }, { name: "Variant A" }],
                results: "won",
              },
            ],
          },
        },
      });
      vi.stubGlobal("fetch", mockFetch);

      const { listExperiments } = await import("@/lib/growthbook-api");
      const result = await listExperiments();

      expect(result).toEqual([
        {
          id: "exp-1",
          name: "Test Experiment",
          status: "running",
          trackingKey: "test_exp",
          variations: ["Control", "Variant A"],
          results: "won",
        },
      ]);

      // Verify Bearer auth header
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toContain("/api/v1/experiments?limit=25");
      const headers = callArgs[1]?.headers as Record<string, string>;
      expect(headers.Authorization).toBe(`Bearer ${GB_SECRET_KEY}`);
    });
  });

  describe("createExperiment", () => {
    it("fetches projects + datasources then POSTs experiment with assignmentQueryId", async () => {
      const mockFetch = createMockFetch({
        "/api/v1/projects": {
          body: { projects: [{ id: "proj-1" }] },
        },
        "/api/v1/datasources": {
          body: {
            datasources: [
              {
                id: "ds-1",
                settings: {
                  queries: {
                    exposure: [{ id: "eq-1" }],
                  },
                },
              },
            ],
          },
        },
        "/api/v1/experiments": {
          body: { experiment: { id: "exp-new" } },
        },
      });
      vi.stubGlobal("fetch", mockFetch);

      const { createExperiment } = await import("@/lib/growthbook-api");
      const result = await createExperiment({
        name: "New Experiment",
        trackingKey: "new_exp",
        hypothesis: "Testing hypothesis",
        variations: [
          { name: "Control" },
          { name: "Variant A", description: "The variant" },
        ],
      });

      expect(result).toEqual({ experiment: { id: "exp-new" } });

      // Find the POST call to /experiments
      const postCall = mockFetch.mock.calls.find((call: any[]) => {
        const opts = call[1] as RequestInit | undefined;
        return opts?.method === "POST" && (call[0] as string).includes("/experiments");
      });
      expect(postCall).toBeDefined();
      const body = JSON.parse(postCall![1]!.body as string);
      expect(body.name).toBe("New Experiment");
      expect(body.trackingKey).toBe("new_exp");
      expect(body.assignmentQueryId).toBe("eq-1");
      expect(body.project).toBe("proj-1");
      expect(body.datasourceId).toBe("ds-1");
      expect(body.variations).toEqual([
        { key: "0", name: "Control", description: "" },
        { key: "1", name: "Variant A", description: "The variant" },
      ]);
    });

    it("when no datasource exposure query → assignmentQueryId is empty string", async () => {
      const mockFetch = createMockFetch({
        "/api/v1/projects": {
          body: { projects: [] },
        },
        "/api/v1/datasources": {
          body: { datasources: [] },
        },
        "/api/v1/experiments": {
          body: { experiment: { id: "exp-2" } },
        },
      });
      vi.stubGlobal("fetch", mockFetch);

      const { createExperiment } = await import("@/lib/growthbook-api");
      await createExperiment({
        name: "No DS Experiment",
        trackingKey: "no_ds",
        variations: [{ name: "A" }, { name: "B" }],
      });

      const postCall = mockFetch.mock.calls.find((call: any[]) => {
        const opts = call[1] as RequestInit | undefined;
        return opts?.method === "POST";
      });
      const body = JSON.parse(postCall![1]!.body as string);
      expect(body.assignmentQueryId).toBe("");
      expect(body.datasourceId).toBeUndefined();
      expect(body.project).toBeUndefined();
    });
  });

  describe("getExperimentResults", () => {
    it("calls GET /experiments/{id}/results and returns data", async () => {
      const mockFetch = createMockFetch({
        "/api/v1/experiments/exp-1/results": {
          body: {
            id: "exp-1",
            results: [{ variation: 0, users: 1000 }],
          },
        },
      });
      vi.stubGlobal("fetch", mockFetch);

      const { getExperimentResults } = await import("@/lib/growthbook-api");
      const result = await getExperimentResults("exp-1");

      expect(result).toEqual({
        id: "exp-1",
        results: [{ variation: 0, users: 1000 }],
      });
    });

    it("when endpoint returns error → returns error message", async () => {
      const mockFetch = createMockFetch({
        "/api/v1/experiments/exp-bad/results": {
          body: "Not found",
          status: 404,
        },
      });
      vi.stubGlobal("fetch", mockFetch);

      const { getExperimentResults } = await import("@/lib/growthbook-api");
      const result = await getExperimentResults("exp-bad");

      expect(result).toEqual({
        error: "No results available yet — experiment may not have enough data.",
      });
    });
  });

  describe("listFeatures", () => {
    it("calls GET /api/v1/features?limit=25 and maps response", async () => {
      const mockFetch = createMockFetch({
        "/api/v1/features": {
          body: {
            features: [
              {
                id: "feature-1",
                valueType: "boolean",
                defaultValue: "true",
                description: "Test feature",
                environmentSettings: {
                  production: { enabled: true },
                  development: { enabled: false },
                },
              },
            ],
          },
        },
      });
      vi.stubGlobal("fetch", mockFetch);

      const { listFeatures } = await import("@/lib/growthbook-api");
      const result = await listFeatures();

      expect(result).toEqual([
        {
          id: "feature-1",
          valueType: "boolean",
          defaultValue: "true",
          description: "Test feature",
          environments: ["production", "development"],
        },
      ]);
    });
  });

  describe("createFeature", () => {
    it("fetches environments then POSTs feature with environments field including rules: []", async () => {
      const mockFetch = createMockFetch({
        "/api/v1/environments": {
          body: {
            environments: [
              { id: "production" },
              { id: "development" },
            ],
          },
        },
        "/api/v1/features": {
          body: { feature: { id: "new-flag" } },
        },
      });
      vi.stubGlobal("fetch", mockFetch);

      const { createFeature } = await import("@/lib/growthbook-api");
      const result = await createFeature({
        id: "new-flag",
        valueType: "boolean",
        defaultValue: "true",
        description: "A new flag",
      });

      expect(result).toEqual({ feature: { id: "new-flag" } });

      // Find the POST call
      const postCall = mockFetch.mock.calls.find((call: any[]) => {
        const opts = call[1] as RequestInit | undefined;
        return opts?.method === "POST";
      });
      expect(postCall).toBeDefined();
      const body = JSON.parse(postCall![1]!.body as string);
      expect(body.id).toBe("new-flag");
      expect(body.valueType).toBe("boolean");
      expect(body.defaultValue).toBe("true");
      expect(body.owner).toBe("AI Agent");
      expect(body.environments).toEqual({
        production: { enabled: true, rules: [] },
        development: { enabled: true, rules: [] },
      });
    });

    it("when listEnvironments fails → falls back to production environment", async () => {
      const mockFetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

        if (url.includes("/api/v1/environments")) {
          return {
            ok: false,
            status: 500,
            json: async () => ({ error: "server error" }),
            text: async () => "server error",
          } as Response;
        }

        if (url.includes("/api/v1/features") && init?.method === "POST") {
          return {
            ok: true,
            status: 200,
            json: async () => ({ feature: { id: "fallback-flag" } }),
            text: async () => JSON.stringify({ feature: { id: "fallback-flag" } }),
          } as Response;
        }

        return {
          ok: false,
          status: 404,
          json: async () => ({ error: "not found" }),
          text: async () => "not found",
        } as Response;
      });
      vi.stubGlobal("fetch", mockFetch);

      const { createFeature } = await import("@/lib/growthbook-api");
      const result = await createFeature({
        id: "fallback-flag",
        valueType: "boolean",
        defaultValue: "false",
      });

      expect(result).toEqual({ feature: { id: "fallback-flag" } });

      const postCall = mockFetch.mock.calls.find((call: any[]) => {
        const opts = call[1] as RequestInit | undefined;
        return opts?.method === "POST";
      });
      const body = JSON.parse(postCall![1]!.body as string);
      expect(body.environments).toEqual({
        production: { enabled: true, rules: [] },
      });
    });
  });

  describe("updateFeature", () => {
    it("POSTs to /features/{id} with correct body", async () => {
      const mockFetch = createMockFetch({
        "/api/v1/features/my-flag": {
          body: { feature: { id: "my-flag" } },
        },
      });
      vi.stubGlobal("fetch", mockFetch);

      const { updateFeature } = await import("@/lib/growthbook-api");
      const result = await updateFeature("my-flag", {
        defaultValue: "false",
        description: "Updated description",
      });

      expect(result).toEqual({ feature: { id: "my-flag" } });

      const postCall = mockFetch.mock.calls[0];
      expect(postCall[0]).toContain("/api/v1/features/my-flag");
      expect(postCall[1]?.method).toBe("POST");
      const body = JSON.parse(postCall[1]!.body as string);
      expect(body.defaultValue).toBe("false");
      expect(body.description).toBe("Updated description");
    });
  });

  describe("listMetrics", () => {
    it("calls GET /api/v1/metrics?limit=25 and maps response", async () => {
      const mockFetch = createMockFetch({
        "/api/v1/metrics": {
          body: {
            metrics: [
              {
                id: "metric-1",
                name: "Click Rate",
                type: "proportion",
                description: "Clicks per user",
              },
            ],
          },
        },
      });
      vi.stubGlobal("fetch", mockFetch);

      const { listMetrics } = await import("@/lib/growthbook-api");
      const result = await listMetrics();

      expect(result).toEqual([
        {
          id: "metric-1",
          name: "Click Rate",
          type: "proportion",
          description: "Clicks per user",
        },
      ]);
    });
  });

  describe("listEnvironments", () => {
    it("calls GET /api/v1/environments and returns environments", async () => {
      const mockFetch = createMockFetch({
        "/api/v1/environments": {
          body: {
            environments: [
              { id: "production", description: "Prod" },
              { id: "staging", description: "Stage" },
            ],
          },
        },
      });
      vi.stubGlobal("fetch", mockFetch);

      const { listEnvironments } = await import("@/lib/growthbook-api");
      const result = await listEnvironments();

      expect(result).toEqual([
        { id: "production", description: "Prod" },
        { id: "staging", description: "Stage" },
      ]);
    });
  });

  describe("gbFetch error handling", () => {
    it('when response not ok → throws "GrowthBook API error {status}: {text}"', async () => {
      const mockFetch = createMockFetch({
        "/api/v1/experiments": {
          body: "Unauthorized",
          status: 401,
        },
      });
      vi.stubGlobal("fetch", mockFetch);

      const { listExperiments } = await import("@/lib/growthbook-api");

      await expect(listExperiments()).rejects.toThrow(
        /GrowthBook API error 401/
      );
    });
  });

  describe("Bearer auth", () => {
    it("sends Authorization: Bearer header on every request", async () => {
      const mockFetch = createMockFetch({
        "/api/v1/features": {
          body: { features: [] },
        },
        "/api/v1/experiments": {
          body: { experiments: [] },
        },
      });
      vi.stubGlobal("fetch", mockFetch);

      const { listFeatures, listExperiments } = await import(
        "@/lib/growthbook-api"
      );

      await listFeatures();
      await listExperiments();

      expect(mockFetch).toHaveBeenCalledTimes(2);
      for (const call of mockFetch.mock.calls) {
        const headers = call[1]?.headers as Record<string, string>;
        expect(headers.Authorization).toBe(`Bearer ${GB_SECRET_KEY}`);
        expect(headers["Content-Type"]).toBe("application/json");
      }
    });
  });
});
