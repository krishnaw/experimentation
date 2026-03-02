import { test, expect } from "@playwright/test";

test.describe("DemoApp1 UI", () => {
  test("homepage loads with header", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Experimentation Platform/i);

    // DemoApp1 header visible
    await expect(page.locator("text=DemoApp1").first()).toBeVisible();
  });

  test("product cards render", async ({ page }) => {
    await page.goto("/");

    // "All Products" heading
    await expect(page.locator("text=All Products")).toBeVisible();

    // At minimum, product names should appear
    await expect(page.locator("text=MacBook Pro")).toBeVisible();
    await expect(page.locator("text=Sony WH-1000XM5")).toBeVisible();
    await expect(page.locator("text=Running Shoes")).toBeVisible();
  });

  test("layout badge shows current layout", async ({ page }) => {
    await page.goto("/");

    // Layout indicator in the "All Products" section
    const layoutBadge = page.locator("text=grid").or(page.locator("text=large-image"));
    await expect(layoutBadge.first()).toBeVisible();
  });

  test("cart icon visible", async ({ page }) => {
    await page.goto("/");

    // Cart bag icon in the header
    const cartButton = page.locator("header button").first();
    await expect(cartButton).toBeVisible();
  });
});
