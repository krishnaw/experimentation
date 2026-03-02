// Integration tests: apps/web <-> Exp Engine SDK
//
// Real system: apps/web (Next.js at http://localhost:3050)
// Mocked: Exp Engine SDK endpoint via page.route intercepting /api/features/
//
// The Exp Engine React SDK fetches features from /api/features/{clientKey}.
// We intercept this with page.route() to return controlled feature payloads,
// then verify the web app renders correctly based on feature flag values.
import { test, expect, type Page } from "@playwright/test";

// Build a Exp Engine features API response payload.
function buildFeaturesResponse(features: Record<string, unknown>) {
  const formatted: Record<string, { defaultValue: unknown }> = {};
  for (const [key, value] of Object.entries(features)) {
    formatted[key] = { defaultValue: value };
  }
  return {
    status: 200,
    features: formatted,
  };
}

// Set up the Exp Engine SDK mock via page.route, clear the localStorage cache,
// and navigate to the homepage.
async function setupWithFeatures(page: Page, features: Record<string, unknown>) {
  // Intercept Exp Engine SDK features endpoint
  await page.route("**/api/features/**", (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(buildFeaturesResponse(features)),
    });
  });

  // Navigate, clear localStorage cache, then reload so SDK fetches from our mock
  await page.goto("/", { waitUntil: "commit" });
  await page.evaluate(() => localStorage.removeItem("gbFeaturesCache"));
  await page.reload({ waitUntil: "networkidle" });
}

test.describe("web <-> Exp Engine SDK: product-card-layout", () => {
  test('layout "large-image" shows 3-column grid and layout badge', async ({ page }) => {
    await setupWithFeatures(page, { "product-card-layout": "large-image" });

    // The layout badge in the "All Products" section should show "large-image"
    const layoutBadge = page.locator("span.uppercase", { hasText: "large-image" });
    await expect(layoutBadge).toBeVisible();

    // Verify the product grid container uses lg:grid-cols-3 (large-image layout)
    // The grid is the div right after the "All Products" header row, inside the
    // same <section>. We locate the section containing "All Products" then find
    // the grid div within it.
    const allProductsSection = page.locator("section", { hasText: "All Products" }).last();
    const gridDiv = allProductsSection.locator("div[class*='grid-cols']").last();
    await expect(gridDiv).toBeVisible();
    const gridClass = await gridDiv.getAttribute("class");
    expect(gridClass).toContain("lg:grid-cols-3");

    // LargeImageCard renders product descriptions (GridCard does not)
    // This is a reliable DOM difference between the two layouts
    const descriptions = allProductsSection.locator("p.line-clamp-2");
    await expect(descriptions.first()).toBeVisible();
  });

  test('layout "grid" (default) shows 4-column grid and layout badge', async ({ page }) => {
    await setupWithFeatures(page, { "product-card-layout": "grid" });

    // The layout badge should show "grid"
    const layoutBadge = page.locator("span.uppercase", { hasText: "grid" });
    await expect(layoutBadge).toBeVisible();

    // The product grid should use 4-column layout (lg:grid-cols-4)
    const allProductsSection = page.locator("section", { hasText: "All Products" }).last();
    const gridDiv = allProductsSection.locator("div[class*='grid-cols']").last();
    await expect(gridDiv).toBeVisible();
    const gridClass = await gridDiv.getAttribute("class");
    expect(gridClass).toContain("lg:grid-cols-4");

    // GridCard uses aspect-square images; LargeImageCard uses aspect-[3/4]
    const squareImages = allProductsSection.locator("[class*='aspect-square']");
    await expect(squareImages.first()).toBeVisible();
  });
});

test.describe("web <-> Exp Engine SDK: featured-section-enabled", () => {
  test("featured section visible when enabled", async ({ page }) => {
    // useFeatureIsOn returns true for truthy defaultValue
    await setupWithFeatures(page, { "featured-section-enabled": true });

    // "Best Sellers" heading should be visible
    const bestSellers = page.locator("h2", { hasText: "Best Sellers" });
    await expect(bestSellers).toBeVisible();

    // "Our most popular picks" subtitle should be visible
    await expect(page.locator("text=Our most popular picks")).toBeVisible();
  });

  test("featured section hidden when disabled", async ({ page }) => {
    // useFeatureIsOn returns false for falsy defaultValue (false, 0, "", null)
    await setupWithFeatures(page, { "featured-section-enabled": false });

    // "Best Sellers" heading should NOT be in the DOM
    const bestSellers = page.locator("h2", { hasText: "Best Sellers" });
    await expect(bestSellers).toHaveCount(0);
  });
});

test.describe("web <-> Exp Engine SDK: combined flags", () => {
  test("large-image layout + featured section both active", async ({ page }) => {
    await setupWithFeatures(page, {
      "product-card-layout": "large-image",
      "featured-section-enabled": true,
    });

    // Layout badge shows "large-image"
    const layoutBadge = page.locator("span.uppercase", { hasText: "large-image" });
    await expect(layoutBadge).toBeVisible();

    // Best Sellers section is visible
    const bestSellers = page.locator("h2", { hasText: "Best Sellers" });
    await expect(bestSellers).toBeVisible();

    // Product grid uses 3-column large-image layout
    const allProductsSection = page.locator("section", { hasText: "All Products" }).last();
    const gridDiv = allProductsSection.locator("div[class*='grid-cols']").last();
    await expect(gridDiv).toBeVisible();
    const gridClass = await gridDiv.getAttribute("class");
    expect(gridClass).toContain("lg:grid-cols-3");
  });
});

test.describe("web <-> Exp Engine SDK: error resilience", () => {
  test("page loads with defaults when SDK endpoint is unreachable", async ({ page }) => {
    // Abort all Exp Engine SDK requests to simulate endpoint being down
    await page.route("**/api/features/**", (route) => route.abort());

    await page.goto("/", { waitUntil: "commit" });
    await page.evaluate(() => localStorage.removeItem("gbFeaturesCache"));
    await page.reload({ waitUntil: "networkidle" });

    // Default layout is "grid"
    const layoutBadge = page.locator("span.uppercase", { hasText: "grid" });
    await expect(layoutBadge).toBeVisible();

    // Default for featured-section-enabled is false (useFeatureIsOn returns false)
    const bestSellers = page.locator("h2", { hasText: "Best Sellers" });
    await expect(bestSellers).toHaveCount(0);

    // Page content still loads -- product names are visible
    await expect(page.locator("text=All Products")).toBeVisible();
    await expect(page.locator('text=MacBook Pro 14"')).toBeVisible();
  });
});
