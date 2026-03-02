/**
 * DEMO 2: Boolean Flag → Section Appears / Disappears
 *
 * Story: A single AI message can show or hide entire page sections for all users.
 *
 * Steps:
 *   1. DemoApp1 loads — "Best Sellers" section is HIDDEN (flag doesn't exist → false)
 *   2. Dashboard chat (port 4000): "Enable the featured-section-enabled flag"
 *   3. AI calls create_feature → flag created with value true
 *   4. DemoApp1 reloads → Best Sellers section appears
 *
 * Visual proof: 02a-no-best-sellers.png → 02c-best-sellers-visible.png
 */

import { test, expect } from "@playwright/test";
import {
  SCREENSHOT_DIR,
  sendChatMessage,
  waitForChatResponse,
  deleteGrowthBookFeature,
  reloadWithFreshFeatures,
} from "./helpers";

// SKIPPED: Boolean flag demo is covered conceptually by Demo 1 (string flag →
// layout change). Less visual impact for a leadership audience. Re-enable for
// engineering-focused demos by changing .skip back to test.describe.
test.describe.skip("Demo 2: Boolean Flag → Section Visibility", () => {
  test.beforeAll(async ({ request }) => {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  DEMO 2: Boolean Flag → Show / Hide Page Section");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await deleteGrowthBookFeature(request, "featured-section-enabled");
  });

  test.afterAll(async ({ request }) => {
    await deleteGrowthBookFeature(request, "featured-section-enabled");
    console.log("  🧹 Cleanup: deleted featured-section-enabled");
  });

  test("AI creates boolean flag → Best Sellers section appears on page", async ({
    page,
    context,
    request,
  }) => {
    test.setTimeout(90000);

    // ── Step 1: Best Sellers hidden (flag doesn't exist) ───────────────────
    await test.step("Step 1 — Best Sellers section is hidden by default", async () => {
      await page.goto("/", { waitUntil: "networkidle" });

      // useFeatureIsOn returns false when flag doesn't exist → section hidden
      const bestSellers = page.locator('h2:has-text("Best Sellers")');
      await expect(bestSellers).not.toBeVisible();

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/02a-before-no-best-sellers.png`,
      });
      console.log("\n  📸 02a — DemoApp1: Best Sellers hidden (before)");
    });

    // ── Step 2: Use Dashboard chat (port 4000) to create the feature flag ──
    await test.step("Step 2 — Ask AI to create featured-section-enabled = true", async () => {
      const dashPage = await context.newPage();
      await dashPage.goto("http://localhost:3050/dashboard", { waitUntil: "networkidle" });
      await dashPage.waitForSelector("textarea", { state: "visible" });

      const prompt =
        'Create a boolean feature flag with id "featured-section-enabled" and default value "true"';
      console.log(`\n  💬 Sending: "${prompt}"`);

      const start = Date.now();
      await sendChatMessage(dashPage, prompt);
      await waitForChatResponse(dashPage);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);

      await dashPage.screenshot({
        path: `${SCREENSHOT_DIR}/02b-ai-enables-flag.png`,
      });
      console.log(`  ✅ AI responded in ${elapsed}s`);
      console.log("  📸 02b — Chat confirmation screenshot saved");
      await dashPage.close();
    });

    // ── Step 3: Reload → Best Sellers section now visible ──────────────────
    await test.step("Step 3 — Reload page → Best Sellers section appears", async () => {
      // Poll Exp Engine SDK endpoint until the feature is served, then reload
      // with cleared localStorage. More reliable than a fixed timeout.
      await reloadWithFreshFeatures(page, {
        request,
        clientKey: process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY!,
        featureId: "featured-section-enabled",
      });

      // Exp Engine SDK init() is async — section appears when features arrive (allow up to 12s)
      const bestSellers = page.locator('h2:has-text("Best Sellers")');
      await expect(bestSellers).toBeVisible({ timeout: 12000 });

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/02c-after-best-sellers-visible.png`,
      });
      console.log("\n  📸 02c — DemoApp1: Best Sellers now visible (after)");
      console.log("     Section appeared after AI created the boolean flag");
    });

    console.log("\n  🏆 RESULT: AI toggled an entire page section — for every user — in one message.");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  });
});
