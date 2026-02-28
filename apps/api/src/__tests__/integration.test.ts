import { describe, it, expect, vi, afterEach, beforeAll } from "vitest";
import request from "supertest";
import http from "http";

// Mock GrowthBook init so importing index.ts doesn't try to connect
vi.mock("../lib/growthbook", () => ({
  gbClient: {},
  initGrowthBook: vi.fn().mockResolvedValue(undefined),
}));

// Prevent dotenv from running
vi.mock("dotenv/config", () => ({}));

// Make app.listen a no-op during module load so importing index.ts doesn't bind a port.
// We save the original and restore after import.
const origListen = http.Server.prototype.listen;
http.Server.prototype.listen = function (this: any, ...args: any[]) {
  // Call the callback if provided (Express passes one)
  const cb = args.find((a: any) => typeof a === "function");
  if (cb) cb();
  return this;
} as any;

// Import the REAL app — this triggers main() which calls mocked initGrowthBook + no-op listen
import { app } from "../index";

// Restore real listen so supertest can bind temp servers
beforeAll(() => {
  http.Server.prototype.listen = origListen;
});

// Capture the original fetch so we can restore it
const originalFetch = globalThis.fetch;

// Helper: create a mock fetch that returns a GrowthBook SDK features response
function mockSdkFetch(features: Record<string, any>) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ features }),
  });
}

describe("API ↔ GrowthBook SDK integration", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('SDK returns "price" → products sorted cheapest-first, meta.sortOrder === "price"', async () => {
    vi.stubGlobal(
      "fetch",
      mockSdkFetch({
        "product-sort-order": { defaultValue: "price" },
      })
    );

    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(res.body.meta.sortOrder).toBe("price");
    const prices = res.body.products.map((p: any) => p.price);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  it('SDK returns "popularity" → products sorted by popularity desc, meta.sortOrder === "popularity"', async () => {
    vi.stubGlobal(
      "fetch",
      mockSdkFetch({
        "product-sort-order": { defaultValue: "popularity" },
      })
    );

    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(res.body.meta.sortOrder).toBe("popularity");
    const pops = res.body.products.map((p: any) => p.popularity);
    for (let i = 1; i < pops.length; i++) {
      expect(pops[i]).toBeLessThanOrEqual(pops[i - 1]);
    }
  });

  it("SDK returns features without product-sort-order key → falls back to popularity", async () => {
    vi.stubGlobal(
      "fetch",
      mockSdkFetch({ "some-other-feature": { defaultValue: true } })
    );

    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(res.body.meta.sortOrder).toBe("popularity");
  });

  it("SDK fetch throws (network error) → still returns 200 with popularity sort", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED"))
    );

    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(res.body.meta.sortOrder).toBe("popularity");
    expect(res.body.products.length).toBeGreaterThan(0);
  });

  it("SDK returns 500 (non-JSON) → falls back to popularity, no crash", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("not JSON");
        },
      })
    );

    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(res.body.meta.sortOrder).toBe("popularity");
  });

  it('SDK says "price" + category filter "Electronics" → only Electronics, sorted by price', async () => {
    vi.stubGlobal(
      "fetch",
      mockSdkFetch({
        "product-sort-order": { defaultValue: "price" },
      })
    );

    const res = await request(app).get("/api/products?category=Electronics");

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
    for (const p of res.body.products) {
      expect(p.category).toBe("Electronics");
    }
    expect(res.body.meta.sortOrder).toBe("price");
    const prices = res.body.products.map((p: any) => p.price);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  it("each /api/products call makes a fresh SDK fetch with different _cb timestamp", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ features: {} }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    await request(app).get("/api/products");
    await request(app).get("/api/products");

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const url1 = fetchSpy.mock.calls[0][0] as string;
    const url2 = fetchSpy.mock.calls[1][0] as string;
    expect(url1).toContain("_cb=");
    expect(url2).toContain("_cb=");
    expect(url1).toMatch(/\/api\/features\/.*\?_cb=\d+/);
    expect(url2).toMatch(/\/api\/features\/.*\?_cb=\d+/);
  });
});
