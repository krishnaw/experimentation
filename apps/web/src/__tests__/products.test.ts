import { describe, it, expect } from "vitest";
import { apiProducts, type ApiProduct } from "@/data/api-products";

describe("Product catalog", () => {
  it("should contain exactly 12 products", () => {
    expect(apiProducts).toHaveLength(12);
  });

  it("every product has required fields", () => {
    for (const p of apiProducts) {
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("name");
      expect(p).toHaveProperty("category");
      expect(p).toHaveProperty("price");
      expect(p).toHaveProperty("rating");
      expect(p).toHaveProperty("description");
      expect(typeof p.id).toBe("string");
      expect(typeof p.name).toBe("string");
      expect(typeof p.category).toBe("string");
      expect(typeof p.price).toBe("number");
      expect(typeof p.rating).toBe("number");
      expect(typeof p.description).toBe("string");
    }
  });

  it("all prices are positive", () => {
    for (const p of apiProducts) {
      expect(p.price).toBeGreaterThan(0);
    }
  });

  it("all ratings are between 1 and 5", () => {
    for (const p of apiProducts) {
      expect(p.rating).toBeGreaterThanOrEqual(1);
      expect(p.rating).toBeLessThanOrEqual(5);
    }
  });

  it("categories are one of the expected values", () => {
    const validCategories = ["Electronics", "Grocery", "Sports", "Home"];
    for (const p of apiProducts) {
      expect(validCategories).toContain(p.category);
    }
  });

  it("has no duplicate product IDs", () => {
    const ids = apiProducts.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("has no duplicate product names", () => {
    const names = apiProducts.map((p) => p.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it("all popularity values are numbers >= 0", () => {
    for (const p of apiProducts) {
      expect(typeof p.popularity).toBe("number");
      expect(p.popularity).toBeGreaterThanOrEqual(0);
    }
  });
});
