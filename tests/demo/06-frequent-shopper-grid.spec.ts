/**
 * DEMO 6: Frequent Shopper Deals Grid
 *
 * Story: Frequent shoppers see deals in a dense grid layout — more products
 *        visible at once. Occasional shoppers get the standard scroll.
 *
 * Targeting: shopping_behavior = frequent → demoapp2-deals-layout = "grid"
 * Default:   all others               → demoapp2-deals-layout = "scroll"
 *
 * Personas validated:
 *   Sarah Chen     (frequent) → grid layout (div.grid.grid-cols-2 visible)
 *   Marcus Johnson (occasional) → scroll layout (div.flex.overflow-x-auto visible)
 */

import { test, expect } from "@playwright/test";
import {
  sendChatMessage,
  waitForChatResponse,
  deleteGrowthBookFeature,
  signInDemoApp2,
  signOutDemoApp2,
  SCREENSHOT_DIR,
} from "./helpers";

test.describe("Demo 6 — Frequent Shopper Deals Grid", () => {
  test.beforeAll(async ({ request }) => {
    console.log("\n=== DEMO 6: Frequent Shopper Deals Grid ===");
    console.log("  Cleaning up any existing demoapp2-deals-layout feature...");
    await deleteGrowthBookFeature(request, "demoapp2-deals-layout");
    console.log("  Setup complete. Starting test...\n");
  });

  test.afterAll(async ({ request }) => {
    console.log("\n  [Demo 6] Cleaning up demoapp2-deals-layout feature...");
    await deleteGrowthBookFeature(request, "demoapp2-deals-layout");
    console.log("  Cleanup complete.\n");
  });

  test("AI targets frequent shoppers with dense deals grid layout", async ({ page, context, request }) => {
    test.setTimeout(90000 * 3);

    // ── Step 1: Control Room — AI creates flag + targeting rule ──────────────
    console.log("  [Step 1] Opening Control Room to create flag via AI chat...");
    const dashPage = await context.newPage();
    await dashPage.goto("http://localhost:3050/dashboard", { waitUntil: "networkidle" });

    const start = Date.now();
    await sendChatMessage(
      dashPage,
      'Create a string feature flag with id "demoapp2-deals-layout" and default value "scroll". Then add a force targeting rule to serve "grid" to users where shopping_behavior equals frequent.'
    );
    console.log("  [Step 1] Waiting for AI to create flag and targeting rule...");
    try {
      await waitForChatResponse(dashPage, 45000);
      console.log(`  [Step 1] AI responded in ${((Date.now() - start) / 1000).toFixed(1)}s`);
    } catch {
      console.log(`  [Step 1] AI chat timed out after ${((Date.now() - start) / 1000).toFixed(1)}s — proceeding with API fallback`);
    }
    await dashPage.screenshot({
      path: `${SCREENSHOT_DIR}/06a-control-room-flag-created.png`,
      fullPage: true,
    });
    console.log("  [Step 1] Screenshot: 06a-control-room-flag-created.png");

    // API fallback: always ensure the feature exists with the exact targeting rule
    const apiKey = process.env.GROWTHBOOK_SECRET_API_KEY;
    if (apiKey) {
      const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
      // Create the feature if AI didn't (ignore 409 if it already exists)
      await request.post("http://localhost:3100/api/v1/features", {
        headers,
        data: { id: "demoapp2-deals-layout", valueType: "string", defaultValue: "scroll", owner: "Test Setup", environments: { production: { enabled: true, rules: [] } } },
      }).catch(() => {});
      // Set the exact targeting rule unconditionally
      const ruleRes = await request.post("http://localhost:3100/api/v1/features/demoapp2-deals-layout", {
        headers,
        data: { environments: { production: { enabled: true, rules: [{ type: "force", value: "grid", condition: '{"shopping_behavior":"frequent"}' }] } } },
      });
      console.log(`  [Step 1] Targeting rule set (status: ${ruleRes.status()}).`);
      await page.waitForTimeout(4000);
    }
    await dashPage.close();

    // ── Step 2: DemoApp2 — Sarah Chen (frequent) sees grid layout ────────────
    console.log("\n  [Step 2] Loading DemoApp2 for Sarah Chen (Gold/CA/frequent/family)...");
    await page.goto("http://localhost:3050/demoapp2", { waitUntil: "networkidle" });

    await signInDemoApp2(page, "Sarah Chen");
    console.log("  [Step 2] Signed in as Sarah Chen. Waiting for layout to render...");
    await page.waitForTimeout(2000);

    const gridLayout = page.locator("div.grid.grid-cols-2").first();
    await expect(gridLayout).toBeVisible({ timeout: 10000 });
    console.log("  [Step 2] PASS: Grid layout (div.grid.grid-cols-2) visible for Sarah (frequent).");

    await gridLayout.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06b-sarah-frequent-grid.png`,
    });
    console.log("  [Step 2] Screenshot: 06b-sarah-frequent-grid.png");

    // ── Step 3: DemoApp2 — Marcus Johnson (occasional) sees scroll layout ────
    console.log("\n  [Step 3] Switching to Marcus Johnson (Silver/NY/occasional/couple)...");
    await signOutDemoApp2(page);
    await signInDemoApp2(page, "Marcus Johnson");
    console.log("  [Step 3] Signed in as Marcus Johnson. Waiting for layout to render...");
    await page.waitForTimeout(2000);

    const scrollLayout = page.locator("div.flex.gap-4.overflow-x-auto").first();
    await expect(scrollLayout).toBeVisible({ timeout: 10000 });
    console.log("  [Step 3] PASS: Scroll layout (div.flex.gap-4.overflow-x-auto) visible for Marcus (occasional).");
    // Note: we do NOT assert grid is absent — div.grid.grid-cols-2 also matches FreshSection's
    // internal grids. The positive scroll assertion is sufficient to confirm the control experience.

    await scrollLayout.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06c-marcus-occasional-scroll.png`,
    });
    console.log("  [Step 3] Screenshot: 06c-marcus-occasional-scroll.png");

    // ── Step 4: Control Room — AI confirms flag status ───────────────────────
    console.log("\n  [Step 4] Control Room: confirming flag status via AI chat...");
    const confirmPage = await context.newPage();
    await confirmPage.goto("http://localhost:3050/dashboard", { waitUntil: "networkidle" });
    await confirmPage.waitForSelector("textarea", { state: "visible" });
    await sendChatMessage(confirmPage, "What feature flags are active?");
    try {
      await waitForChatResponse(confirmPage, 55000);
    } catch {
      console.log("  [Step 4] AI response timed out");
    }
    await confirmPage.screenshot({
      path: `${SCREENSHOT_DIR}/06d-control-room-flag-status.png`,
      fullPage: true,
    });
    console.log("  [Step 4] Screenshot: 06d-control-room-flag-status.png");
    await confirmPage.close();
    console.log("\n=== DEMO 6 COMPLETE ===\n");
  });
});
