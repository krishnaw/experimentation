import { describe, it, expect, vi, afterEach } from "vitest";

// Helper: create a mock fetch that returns a GrowthBook features response
function mockFeaturesFetch(features: Record<string, any>) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ features }),
  });
}

const DEMOAPP2_FEATURES = {
  "demoapp2-hero-layout": { defaultValue: "carousel" },
  "demoapp2-deals-sort": { defaultValue: "popularity" },
  "other-feature": { defaultValue: "test" },
};

describe("POST /api/demoapp2/evaluate", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns evaluated features for demoapp2-* keys only", async () => {
    vi.stubGlobal("fetch", mockFeaturesFetch(DEMOAPP2_FEATURES));
    vi.resetModules();
    const { POST } = await import("@/app/api/demoapp2/evaluate/route");
    const { NextRequest } = await import("next/server");

    const req = new NextRequest("http://localhost:3050/api/demoapp2/evaluate", {
      method: "POST",
      body: JSON.stringify({ userId: "user-123", attributes: { membership_tier: "gold" } }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.features).toBeDefined();

    // Only demoapp2-* keys should be present
    const keys = Object.keys(body.features);
    expect(keys).toContain("demoapp2-hero-layout");
    expect(keys).toContain("demoapp2-deals-sort");
    expect(keys).not.toContain("other-feature");

    // Values should be the defaultValues (no targeting rules → default)
    expect(body.features["demoapp2-hero-layout"]).toBe("carousel");
    expect(body.features["demoapp2-deals-sort"]).toBe("popularity");
  });

  it("returns 400 for invalid JSON body", async () => {
    vi.stubGlobal("fetch", mockFeaturesFetch(DEMOAPP2_FEATURES));
    vi.resetModules();
    const { POST } = await import("@/app/api/demoapp2/evaluate/route");
    const { NextRequest } = await import("next/server");

    const req = new NextRequest("http://localhost:3050/api/demoapp2/evaluate", {
      method: "POST",
      body: "this is not json{{{",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeTruthy();
    expect(typeof body.error).toBe("string");
  });

  it("returns 502 when GrowthBook features endpoint is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    vi.resetModules();
    const { POST } = await import("@/app/api/demoapp2/evaluate/route");
    const { NextRequest } = await import("next/server");

    const req = new NextRequest("http://localhost:3050/api/demoapp2/evaluate", {
      method: "POST",
      body: JSON.stringify({ userId: "user-123" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.error).toBeTruthy();
  });

  it("returns 502 when GrowthBook features endpoint returns non-ok status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
      })
    );
    vi.resetModules();
    const { POST } = await import("@/app/api/demoapp2/evaluate/route");
    const { NextRequest } = await import("next/server");

    const req = new NextRequest("http://localhost:3050/api/demoapp2/evaluate", {
      method: "POST",
      body: JSON.stringify({ userId: "user-123" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.error).toBeTruthy();
    expect(body.detail).toContain("503");
  });

  it("returns empty features when no demoapp2-* features exist", async () => {
    vi.stubGlobal(
      "fetch",
      mockFeaturesFetch({
        "other-feature": { defaultValue: "test" },
        "product-sort-order": { defaultValue: "price" },
        "unrelated-flag": { defaultValue: true },
      })
    );
    vi.resetModules();
    const { POST } = await import("@/app/api/demoapp2/evaluate/route");
    const { NextRequest } = await import("next/server");

    const req = new NextRequest("http://localhost:3050/api/demoapp2/evaluate", {
      method: "POST",
      body: JSON.stringify({ userId: "user-123" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.features).toEqual({});
  });

  it("defaults userId to anonymous when not provided", async () => {
    vi.stubGlobal("fetch", mockFeaturesFetch(DEMOAPP2_FEATURES));
    vi.resetModules();
    const { POST } = await import("@/app/api/demoapp2/evaluate/route");
    const { NextRequest } = await import("next/server");

    const req = new NextRequest("http://localhost:3050/api/demoapp2/evaluate", {
      method: "POST",
      body: JSON.stringify({ attributes: { membership_tier: "silver" } }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    // Should succeed even without userId
    expect(res.status).toBe(200);
    expect(body.features).toBeDefined();
    expect(Object.keys(body.features).every((k) => k.startsWith("demoapp2-"))).toBe(true);
  });

  it("sets user attributes for evaluation", async () => {
    vi.stubGlobal("fetch", mockFeaturesFetch(DEMOAPP2_FEATURES));
    vi.resetModules();
    const { POST } = await import("@/app/api/demoapp2/evaluate/route");
    const { NextRequest } = await import("next/server");

    const req = new NextRequest("http://localhost:3050/api/demoapp2/evaluate", {
      method: "POST",
      body: JSON.stringify({
        userId: "gold-member-42",
        attributes: { membership_tier: "gold", country: "US" },
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.features).toBeDefined();
    // With no targeting rules in mock, values fall back to defaultValue
    expect(body.features["demoapp2-hero-layout"]).toBe("carousel");
    expect(body.features["demoapp2-deals-sort"]).toBe("popularity");
  });

  it("handles empty body (no userId, no attributes) gracefully", async () => {
    vi.stubGlobal("fetch", mockFeaturesFetch(DEMOAPP2_FEATURES));
    vi.resetModules();
    const { POST } = await import("@/app/api/demoapp2/evaluate/route");
    const { NextRequest } = await import("next/server");

    const req = new NextRequest("http://localhost:3050/api/demoapp2/evaluate", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.features).toBeDefined();
  });
});
