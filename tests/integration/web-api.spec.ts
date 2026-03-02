/**
 * Integration tests: web API routes
 *
 * Real systems: apps/web (Next.js at :3050) — all API routes are in-app
 * Mocked: nothing — real server
 *
 * Tests the API's product and health endpoints as a black-box contract.
 * Uses Playwright's request context to make HTTP calls.
 */
import { test, expect } from "@playwright/test";

const API_BASE = "http://localhost:3050";

test.describe("web <-> api: health check", () => {
  test("GET /api/health returns 200 with ok field", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("ok");
    expect(typeof body.ok).toBe("boolean");
  });
});

test.describe("web <-> api: product listing", () => {
  test("GET /api/products returns products array with meta", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/products`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.products)).toBe(true);
    expect(body.products.length).toBeGreaterThan(0);
    expect(body.meta).toBeTruthy();
    expect(body.meta.sortOrder).toBeTruthy();
    expect(typeof body.meta.total).toBe("number");
    expect(body.meta.total).toBe(body.products.length);
  });

  test("each product has required fields", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/products`);
    const body = await response.json();

    for (const product of body.products) {
      expect(product.id).toBeTruthy();
      expect(product.name).toBeTruthy();
      expect(product.category).toBeTruthy();
      expect(typeof product.price).toBe("number");
      expect(typeof product.rating).toBe("number");
      expect(typeof product.popularity).toBe("number");
    }
  });
});

test.describe("web <-> api: category filtering", () => {
  test("GET /api/products?category=Electronics filters correctly", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/products?category=Electronics`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.products.length).toBeGreaterThan(0);

    for (const product of body.products) {
      expect(product.category.toLowerCase()).toBe("electronics");
    }

    expect(body.meta.total).toBe(body.products.length);
  });

  test("GET /api/products?category=nonexistent returns empty array", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/products?category=nonexistent`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.products).toEqual([]);
    expect(body.meta.total).toBe(0);
  });
});

test.describe("web <-> api: single product", () => {
  test("GET /api/products/:id returns the correct product", async ({ request }) => {
    // First get the product list to find a valid ID
    const listResponse = await request.get(`${API_BASE}/api/products`);
    const listBody = await listResponse.json();
    const firstProduct = listBody.products[0];

    const response = await request.get(`${API_BASE}/api/products/${firstProduct.id}`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.id).toBe(firstProduct.id);
    expect(body.name).toBe(firstProduct.name);
    expect(body.price).toBe(firstProduct.price);
  });

  test("GET /api/products/does-not-exist returns 404", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/products/does-not-exist`);
    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body.error).toBe("Product not found");
  });
});

test.describe("web <-> api: userId passthrough", () => {
  test("GET /api/products?userId=test-user returns userId in meta", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/products?userId=test-user`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.meta.userId).toBe("test-user");
  });

  test("GET /api/products without userId defaults to anonymous", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/products`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.meta.userId).toBe("anonymous");
  });
});
