/**
 * DEMO 1: Feature Flag → Instant UI Change
 *
 * Story: Leadership watches an AI chat message change what every customer sees.
 *
 * Steps:
 *   1. ShopDemo loads in default "grid" layout (4 columns)
 *   2. Dashboard chat (port 4000): "Create product-card-layout flag with value large-image"
 *   3. AI calls create_feature tool → GrowthBook stores the flag
 *   4. ShopDemo reloads → GrowthBook SDK picks up the flag
 *   5. Layout switches to "large-image" (3 columns, bigger cards)
 *
 * Visual proof: screenshots/demo/01a-grid.png → 01c-large-image.png
 */

import { test, expect } from "@playwright/test";
import {
  SCREENSHOT_DIR,
  sendChatMessage,
  waitForChatResponse,
  deleteGrowthBookFeature,
  reloadWithFreshFeatures,
} from "./helpers";

test.describe("Demo 1: Feature Flag → Live Layout Change", () => {
  test.beforeAll(async ({ request }) => {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  DEMO 1: Feature Flag → Instant UI Change");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await deleteGrowthBookFeature(request, "product-card-layout");
  });

  test.afterAll(async ({ request }) => {
    await deleteGrowthBookFeature(request, "product-card-layout");
    console.log("  🧹 Cleanup: deleted product-card-layout");
  });

  test("AI creates feature flag → product layout changes from grid to large-image", async ({
    page,
    context,
    request,
  }) => {
    test.setTimeout(90000);

    // ── Step 1: ShopDemo loads with default "grid" layout ──────────────────
    await test.step("Step 1 — ShopDemo starts in grid layout (default)", async () => {
      await page.goto("/", { waitUntil: "networkidle" });

      // The layout badge is the only <span> with uppercase class (cart buttons are <button>)
      const badge = page.locator("span.uppercase.bg-indigo-50");
      await expect(badge).toHaveText("grid");

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/01a-before-grid-layout.png`,
      });
      console.log("\n  📸 01a — ShopDemo: grid layout (before)");
      console.log(`     Layout badge: "${await badge.textContent()}"`);
    });

    // ── Step 2: Use Dashboard chat (port 4000) to create the feature flag ──
    await test.step("Step 2 — Ask AI to create product-card-layout = large-image", async () => {
      const dashPage = await context.newPage();
      await dashPage.goto("http://localhost:4000", { waitUntil: "networkidle" });
      await dashPage.waitForSelector("textarea", { state: "visible" });

      const prompt =
        'Create a string feature flag with id "product-card-layout" and default value "large-image"';
      console.log(`\n  💬 Sending: "${prompt}"`);

      const start = Date.now();
      await sendChatMessage(dashPage, prompt);
      await waitForChatResponse(dashPage);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);

      await dashPage.screenshot({
        path: `${SCREENSHOT_DIR}/01b-ai-creates-flag.png`,
      });
      console.log(`  ✅ AI responded in ${elapsed}s`);
      console.log("  📸 01b — Chat confirmation screenshot saved");
      await dashPage.close();
    });

    // ── Step 3: Reload → GrowthBook SDK picks up the new flag ──────────────
    await test.step("Step 3 — Reload page → large-image layout active", async () => {
      await reloadWithFreshFeatures(page, {
        request,
        clientKey: process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY!,
        featureId: "product-card-layout",
      });

      // GrowthBook SDK init() is async — badge re-renders when features arrive (allow up to 12s)
      const badge = page.locator("span.uppercase.bg-indigo-50");
      await expect(badge).toHaveText("large-image", { timeout: 12000 });

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/01c-after-large-image-layout.png`,
      });
      console.log('\n  📸 01c — ShopDemo: large-image layout (after)');
      console.log(`     Layout badge: "${await badge.textContent()}"`);
    });

    console.log("\n  🏆 RESULT: AI changed what every customer sees — via chat, in seconds.");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  });
});
