/**
 * DEMO 4: API Sort Order — Live Feature Flag Control
 *
 * Story: A product manager uses the AI to change how the API sorts products
 *        for every user — no code change, no server restart.
 *
 * Steps:
 *   1. API returns products sorted by popularity (default)
 *   2. Dashboard chat: "Update product-sort-order to price"
 *   3. AI calls update_feature → Exp Engine updates the flag
 *   4. API immediately returns price-sorted products (no reload needed)
 *   5. Dashboard chat: "Switch product-sort-order back to popularity"
 *   6. API returns popularity-sorted products again
 *
 * Visual proof: screenshots/demo/04a-popularity.png → 04b-price.png → 04c-back-to-popularity.png
 *
 * Cleanup: flag deleted in afterAll (API falls back to popularity by default)
 */

import { test, expect } from "@playwright/test";
import {
  SCREENSHOT_DIR,
  sendChatMessage,
  waitForChatResponse,
  deleteGrowthBookFeature,
} from "./helpers";

const API_BASE = "http://localhost:3050";
const FEATURE_ID = "product-sort-order";

/** Ensure the product-sort-order flag exists with a known starting value via REST API. */
async function ensureFeatureExists(
  request: import("@playwright/test").APIRequestContext,
  defaultValue: string
): Promise<void> {
  const apiKey = process.env.GROWTHBOOK_SECRET_API_KEY;
  if (!apiKey) return;

  // Try update first (flag may already exist)
  const updateRes = await request.post(
    `http://localhost:3100/api/v1/features/${FEATURE_ID}`,
    {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      data: { defaultValue },
    }
  );

  if (!updateRes.ok()) {
    // Flag doesn't exist — fetch available environments then create it
    const envRes = await request.get("http://localhost:3100/api/v1/environments", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const envData = envRes.ok() ? await envRes.json() : { environments: [] };
    const environments: Record<string, { enabled: boolean; rules: [] }> = {};
    for (const env of envData.environments || []) {
      environments[env.id] = { enabled: true, rules: [] };
    }
    if (Object.keys(environments).length === 0) {
      environments["production"] = { enabled: true, rules: [] };
    }

    await request.post("http://localhost:3100/api/v1/features", {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      data: {
        id: FEATURE_ID,
        valueType: "string",
        defaultValue,
        description: "Controls product sort order: popularity | price",
        owner: "Demo Test",
        environments,
      },
    });
  }
}

test.describe("Demo 4: API Sort Order via Chat", () => {
  test.beforeAll(async ({ request }) => {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  DEMO 4: API Sort Order — Live Feature Flag Control");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    // Ensure flag starts in a known state (popularity)
    await ensureFeatureExists(request, "popularity");
  });

  test.afterAll(async ({ request }) => {
    await deleteGrowthBookFeature(request, FEATURE_ID);
    console.log(`  🧹 Cleanup: deleted ${FEATURE_ID}`);
  });

  test("AI updates sort order flag → API immediately re-sorts products", async ({
    page,
    context,
    request,
  }) => {
    test.setTimeout(90000);

    // ── Step 1: Verify API starts in popularity order ───────────────────────
    await test.step("Step 1 — API returns products sorted by popularity (default)", async () => {
      const res = await request.get(`${API_BASE}/api/products`);
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.meta.sortOrder).toBe("popularity");

      // Verify popularity order: each product's popularity >= next product's popularity
      const popularities = data.products.map((p: { popularity: number }) => p.popularity);
      for (let i = 0; i < popularities.length - 1; i++) {
        expect(popularities[i]).toBeGreaterThanOrEqual(popularities[i + 1]);
      }

      // Screenshot the API response via the DemoApp1 page (shows products in order)
      await page.goto("/", { waitUntil: "networkidle" });
      await page.screenshot({ path: `${SCREENSHOT_DIR}/04a-before-popularity-sort.png` });
      console.log("\n  📸 04a — API: popularity sort (before)");
      console.log(`     First 3: ${data.products.slice(0, 3).map((p: { name: string; popularity: number }) => `${p.name} (pop:${p.popularity})`).join(", ")}`);
    });

    // ── Step 2: Use Dashboard chat to switch to price sort ──────────────────
    await test.step("Step 2 — Ask AI to switch sort order to price", async () => {
      const dashPage = await context.newPage();
      await dashPage.goto("http://localhost:3050/dashboard", { waitUntil: "networkidle" });
      await dashPage.waitForSelector("textarea", { state: "visible" });

      const prompt = `Update the feature flag "${FEATURE_ID}" to have a default value of "price"`;
      console.log(`\n  💬 Sending: "${prompt}"`);

      const start = Date.now();
      await sendChatMessage(dashPage, prompt);
      await waitForChatResponse(dashPage);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);

      await dashPage.screenshot({ path: `${SCREENSHOT_DIR}/04b-ai-switches-to-price.png` });
      console.log(`  ✅ AI responded in ${elapsed}s`);
      console.log("  📸 04b — Dashboard: AI confirms price sort update");
      await dashPage.close();
    });

    // ── Step 3: API immediately reflects price sort (no reload needed) ──────
    await test.step("Step 3 — API returns products sorted by price (no restart needed)", async () => {
      const res = await request.get(`${API_BASE}/api/products`);
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.meta.sortOrder).toBe("price");

      // Verify price order: each product's price <= next product's price
      const prices = data.products.map((p: { price: number }) => p.price);
      for (let i = 0; i < prices.length - 1; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i + 1]);
      }

      await page.reload({ waitUntil: "networkidle" });
      await page.screenshot({ path: `${SCREENSHOT_DIR}/04c-after-price-sort.png` });
      console.log("\n  📸 04c — API: price sort (after AI update)");
      console.log(`     First 3: ${data.products.slice(0, 3).map((p: { name: string; price: number }) => `${p.name} ($${p.price})`).join(", ")}`);
    });

    // ── Step 4: Switch back to popularity via chat ──────────────────────────
    await test.step("Step 4 — Switch sort order back to popularity", async () => {
      const dashPage = await context.newPage();
      await dashPage.goto("http://localhost:3050/dashboard", { waitUntil: "networkidle" });
      await dashPage.waitForSelector("textarea", { state: "visible" });

      const prompt = `Update the feature flag "${FEATURE_ID}" to have a default value of "popularity"`;
      console.log(`\n  💬 Sending: "${prompt}"`);

      const start = Date.now();
      await sendChatMessage(dashPage, prompt);
      await waitForChatResponse(dashPage);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);

      console.log(`  ✅ AI responded in ${elapsed}s`);
      await dashPage.close();

      // Verify API is back to popularity
      const res = await request.get(`${API_BASE}/api/products`);
      const data = await res.json();
      expect(data.meta.sortOrder).toBe("popularity");

      console.log("\n  📸 04d — API: back to popularity sort");
    });

    console.log("\n  🏆 RESULT: AI changed sort order for every API consumer — instantly, via chat.");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  });
});
