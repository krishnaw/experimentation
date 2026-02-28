import { test, expect } from "@playwright/test";

test.describe("ShopDemo UI", () => {
  test("homepage loads with hero banner", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ShopDemo/i);

    // Hero banner visible
    const hero = page.locator("text=Discover");
    await expect(hero).toBeVisible();

    // Shop Now button
    const shopBtn = page.locator("button", { hasText: "Shop Now" });
    await expect(shopBtn).toBeVisible();
  });

  test("product cards render", async ({ page }) => {
    await page.goto("/");

    // "All Products" heading
    await expect(page.locator("text=All Products")).toBeVisible();

    // 12 products total (from products.ts)
    const productCards = page.locator('[class*="product"], [class*="card"]').or(
      page.locator("text=Add to Cart").locator("..").locator(".."),
    );
    // At minimum, product names should appear
    await expect(page.locator("text=MacBook Pro")).toBeVisible();
    await expect(page.locator("text=Sony WH-1000XM5")).toBeVisible();
    await expect(page.locator("text=Running Shoes")).toBeVisible();
  });

  test("category buttons render", async ({ page }) => {
    await page.goto("/");

    // 3 categories: Electronics, Clothing, Home
    await expect(page.locator("button", { hasText: "Electronics" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Clothing" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Home" })).toBeVisible();
  });

  test("layout badge shows current layout", async ({ page }) => {
    await page.goto("/");

    // Layout indicator in the "All Products" section
    const layoutBadge = page.locator("text=grid").or(page.locator("text=large-image"));
    await expect(layoutBadge.first()).toBeVisible();
  });

  test("footer renders", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("text=ShopDemo").last()).toBeVisible();
    await expect(page.locator("text=AI Experimentation Demo")).toBeVisible();
  });
});
