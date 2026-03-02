import { describe, it, expect, vi, afterEach } from "vitest";
import { apiProducts } from "@/data/api-products";

// Helper: create a NextRequest-like object
function makeRequest(url: string) {
  return new Request(url);
}

// Helper: create a mock fetch that returns an Exp Engine SDK features response
function mockSdkFetch(features: Record<string, any>) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ features }),
  });
}

const originalFetch = globalThis.fetch;

describe("API products route", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("GET /api/products returns products array with meta", async () => {
    vi.stubGlobal("fetch", mockSdkFetch({}));
    const { GET } = await import("@/app/api/products/route");
    const req = new Request("http://localhost:3050/api/products");
    // Next.js route handlers receive a NextRequest
    const { NextRequest } = await import("next/server");
    const nextReq = new NextRequest(req);
    const res = await GET(nextReq);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body.products)).toBe(true);
    expect(body.products.length).toBeGreaterThan(0);
    expect(body.meta).toBeTruthy();
    expect(body.meta.sortOrder).toBeTruthy();
    expect(typeof body.meta.total).toBe("number");
    expect(body.meta.total).toBe(body.products.length);
  });

  it("each product has required fields", async () => {
    vi.stubGlobal("fetch", mockSdkFetch({}));
    vi.resetModules();
    const { GET } = await import("@/app/api/products/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost:3050/api/products"));
    const body = await res.json();

    for (const product of body.products) {
      expect(product.id).toBeTruthy();
      expect(product.name).toBeTruthy();
      expect(product.category).toBeTruthy();
      expect(typeof product.price).toBe("number");
      expect(typeof product.rating).toBe("number");
      expect(typeof product.popularity).toBe("number");
    }
  });

  it("filters by category", async () => {
    vi.stubGlobal("fetch", mockSdkFetch({}));
    vi.resetModules();
    const { GET } = await import("@/app/api/products/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost:3050/api/products?category=Electronics"));
    const body = await res.json();

    expect(body.products.length).toBeGreaterThan(0);
    for (const p of body.products) {
      expect(p.category.toLowerCase()).toBe("electronics");
    }
    expect(body.meta.total).toBe(body.products.length);
  });

  it("returns empty array for unknown category", async () => {
    vi.stubGlobal("fetch", mockSdkFetch({}));
    vi.resetModules();
    const { GET } = await import("@/app/api/products/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost:3050/api/products?category=NonExistentCategory"));
    const body = await res.json();

    expect(body.products).toEqual([]);
    expect(body.meta.total).toBe(0);
  });

  it("reflects userId in meta", async () => {
    vi.stubGlobal("fetch", mockSdkFetch({}));
    vi.resetModules();
    const { GET } = await import("@/app/api/products/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost:3050/api/products?userId=test-user"));
    const body = await res.json();

    expect(body.meta.userId).toBe("test-user");
  });

  it("defaults userId to anonymous", async () => {
    vi.stubGlobal("fetch", mockSdkFetch({}));
    vi.resetModules();
    const { GET } = await import("@/app/api/products/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost:3050/api/products"));
    const body = await res.json();

    expect(body.meta.userId).toBe("anonymous");
  });

  it("returns products sorted by popularity by default", async () => {
    vi.stubGlobal("fetch", mockSdkFetch({}));
    vi.resetModules();
    const { GET } = await import("@/app/api/products/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost:3050/api/products"));
    const body = await res.json();

    expect(body.meta.sortOrder).toBe("popularity");
    const pops = body.products.map((p: any) => p.popularity);
    for (let i = 1; i < pops.length; i++) {
      expect(pops[i]).toBeLessThanOrEqual(pops[i - 1]);
    }
  });

  it("sorts by price when Exp Engine returns price", async () => {
    vi.stubGlobal("fetch", mockSdkFetch({ "product-sort-order": { defaultValue: "price" } }));
    vi.resetModules();
    const { GET } = await import("@/app/api/products/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost:3050/api/products"));
    const body = await res.json();

    expect(body.meta.sortOrder).toBe("price");
    const prices = body.products.map((p: any) => p.price);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  it("combines category filter with price sort", async () => {
    vi.stubGlobal("fetch", mockSdkFetch({ "product-sort-order": { defaultValue: "price" } }));
    vi.resetModules();
    const { GET } = await import("@/app/api/products/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost:3050/api/products?category=Electronics"));
    const body = await res.json();

    expect(body.meta.sortOrder).toBe("price");
    const prices = body.products.map((p: any) => p.price);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
    for (const p of body.products) {
      expect(p.category).toBe("Electronics");
    }
  });

  it("falls back to popularity when SDK fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    vi.resetModules();
    const { GET } = await import("@/app/api/products/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://localhost:3050/api/products"));
    const body = await res.json();

    expect(body.meta.sortOrder).toBe("popularity");
    expect(body.products.length).toBeGreaterThan(0);
  });
});

describe("API products/:id route", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a product by ID", async () => {
    vi.resetModules();
    const { GET } = await import("@/app/api/products/[id]/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(
      new NextRequest("http://localhost:3050/api/products/wireless-headphones"),
      { params: Promise.resolve({ id: "wireless-headphones" }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe("wireless-headphones");
    expect(body.name).toBeTruthy();
  });

  it("returns 404 for non-existent product", async () => {
    vi.resetModules();
    const { GET } = await import("@/app/api/products/[id]/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(
      new NextRequest("http://localhost:3050/api/products/nonexistent-product"),
      { params: Promise.resolve({ id: "nonexistent-product" }) }
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Product not found");
  });
});
