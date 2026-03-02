import { describe, it, expect, vi, afterEach } from "vitest";

const originalFetch = globalThis.fetch;

function mockSdkFetch(features: Record<string, any>) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ features }),
  });
}

describe("API products route — Exp Engine SDK integration", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('SDK returns "price" -> products sorted cheapest-first, meta.sortOrder === "price"', async () => {
    vi.stubGlobal("fetch", mockSdkFetch({ "product-sort-order": { defaultValue: "price" } }));
    vi.resetModules();
    const { GET } = await import("@/app/api/products/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost:3050/api/products"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.meta.sortOrder).toBe("price");
    const prices = body.products.map((p: any) => p.price);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  it('SDK returns "popularity" -> products sorted by popularity desc', async () => {
    vi.stubGlobal("fetch", mockSdkFetch({ "product-sort-order": { defaultValue: "popularity" } }));
    vi.resetModules();
    const { GET } = await import("@/app/api/products/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost:3050/api/products"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.meta.sortOrder).toBe("popularity");
    const pops = body.products.map((p: any) => p.popularity);
    for (let i = 1; i < pops.length; i++) {
      expect(pops[i]).toBeLessThanOrEqual(pops[i - 1]);
    }
  });

  it("SDK returns features without product-sort-order key -> falls back to popularity", async () => {
    vi.stubGlobal("fetch", mockSdkFetch({ "some-other-feature": { defaultValue: true } }));
    vi.resetModules();
    const { GET } = await import("@/app/api/products/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost:3050/api/products"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.meta.sortOrder).toBe("popularity");
  });

  it("SDK fetch throws (network error) -> still returns 200 with popularity sort", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    vi.resetModules();
    const { GET } = await import("@/app/api/products/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost:3050/api/products"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.meta.sortOrder).toBe("popularity");
    expect(body.products.length).toBeGreaterThan(0);
  });

  it("SDK returns 500 (non-JSON) -> falls back to popularity, no crash", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => { throw new Error("not JSON"); },
    }));
    vi.resetModules();
    const { GET } = await import("@/app/api/products/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost:3050/api/products"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.meta.sortOrder).toBe("popularity");
  });

  it('SDK says "price" + category filter "Electronics" -> only Electronics, sorted by price', async () => {
    vi.stubGlobal("fetch", mockSdkFetch({ "product-sort-order": { defaultValue: "price" } }));
    vi.resetModules();
    const { GET } = await import("@/app/api/products/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost:3050/api/products?category=Electronics"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.products.length).toBeGreaterThan(0);
    for (const p of body.products) {
      expect(p.category).toBe("Electronics");
    }
    expect(body.meta.sortOrder).toBe("price");
    const prices = body.products.map((p: any) => p.price);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });
});
