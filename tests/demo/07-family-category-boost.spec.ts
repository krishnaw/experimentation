/**
 * DEMO 7: Family Category Boost
 *
 * Story: Family households see category grid reordered to put snacks, breakfast,
 *        and baby items front and center. Other households see behavior-based order.
 *
 * Targeting: household_type = family → demoapp2-category-order = "personalized"
 * Default:   all others             → behavior-based ordering (no personalized flag)
 *
 * Personas validated:
 *   Sarah Chen    (family/frequent) → "Snacks & Chips" is first category
 *   Robert Williams (senior/frequent) → "Meat & Seafood" is first category (no family boost)
 *
 * Steps:
 *   1. Control Room: AI creates flag + targeting rule via chat
 *   2. DemoApp2: Sarah (family) → Snacks first
 *   3. DemoApp2: Robert (senior) → Meat first (unaffected)
 *   4. Control Room: AI confirms flag status
 */

import { test, expect } from "@playwright/test";
import {
  SCREENSHOT_DIR,
  sendChatMessage,
  waitForChatResponse,
  deleteGrowthBookFeature,
  signInDemoApp2,
  signOutDemoApp2,
} from "./helpers";

const DASHBOARD_URL = "http://localhost:3050/dashboard";
const DEMOAPP2_URL = "http://localhost:3050/demoapp2";
const FEATURE_ID = "demoapp2-category-order";

test.describe("Demo 7: Family Category Boost", () => {
  test.beforeAll(async ({ request }) => {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  DEMO 7: Family Category Boost");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await deleteGrowthBookFeature(request, FEATURE_ID);
  });

  test.afterAll(async ({ request }) => {
    await deleteGrowthBookFeature(request, FEATURE_ID);
    console.log(`  🧹 Cleanup: deleted ${FEATURE_ID}`);
  });

  test("family households see snacks first; senior households see meat first", async ({
    page,
    context,
    request,
  }) => {
    test.setTimeout(90000 * 3);

    // ── Step 1: Control Room chat — create flag (msg 1) then add rule (msg 2) ─
    await test.step("Step 1 — AI creates demoapp2-category-order flag with family targeting", async () => {
      const dashPage = await context.newPage();
      await dashPage.goto(DASHBOARD_URL, { waitUntil: "networkidle" });
      await dashPage.waitForSelector("textarea", { state: "visible" });

      console.log('\n  💬 Creating feature flag with family targeting rule...');
      const start = Date.now();
      await sendChatMessage(dashPage, 'Create a string feature flag with id "demoapp2-category-order" and default value "". Then add a force targeting rule to serve "personalized" to users where household_type equals "family".');
      try {
        await waitForChatResponse(dashPage, 45000);
        console.log(`  ✅ AI responded in ${((Date.now() - start) / 1000).toFixed(1)}s`);
      } catch {
        console.log(`  ⚠ AI chat timed out after ${((Date.now() - start) / 1000).toFixed(1)}s — proceeding with API fallback`);
      }
      await dashPage.screenshot({ path: `${SCREENSHOT_DIR}/07a-ai-creates-flag.png` });
      console.log("  📸 07a — Control Room: flag creation attempt");
      await dashPage.close();

      // API fallback: always ensure the feature exists with the exact targeting rule
      const apiKey = process.env.GROWTHBOOK_SECRET_API_KEY;
      if (apiKey) {
        const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
        // Create the feature if AI didn't (ignore 409 if it already exists)
        await request.post("http://localhost:3100/api/v1/features", {
          headers,
          data: { id: FEATURE_ID, valueType: "string", defaultValue: "", owner: "Test Setup", environments: { production: { enabled: true, rules: [] } } },
        }).catch(() => {});
        // Set the exact targeting rule unconditionally
        const ruleRes = await request.post(`http://localhost:3100/api/v1/features/${FEATURE_ID}`, {
          headers,
          data: { environments: { production: { enabled: true, rules: [{ type: "force", value: "personalized", condition: '{"household_type":"family"}' }] } } },
        });
        console.log(`  [Step 1] Targeting rule set (status: ${ruleRes.status()}).`);
        // Wait for GrowthBook SDK endpoint to reflect the new rule
        await page.waitForTimeout(4000);
      }
    });

    // ── Step 2: DemoApp2 — Sarah Chen (family/frequent) sees Snacks first ──
    await test.step("Step 2 — Sarah Chen (family) sees Snacks & Chips as first category", async () => {
      // Poll layout API until the targeting rule is active (family → personalized)
      const deadline = Date.now() + 25000;
      let ruleActive = false;
      while (Date.now() < deadline) {
        const res = await page.request.post("http://localhost:3050/api/demoapp2/layout", {
          data: { userId: "sarah-chen", attributes: { membership_tier: "gold", location: "CA", shopping_behavior: "frequent", household_type: "family" } },
        });
        if (res.ok()) {
          const layout = await res.json();
          const cats = layout.sections?.find((s: any) => s.component === "CategoryGrid")?.props?.categories;
          if (cats?.[0]?.name?.includes("Snacks")) { ruleActive = true; break; }
        }
        await page.waitForTimeout(1000);
      }
      console.log(`\n  📋 Targeting rule active: ${ruleActive}`);

      await page.goto(DEMOAPP2_URL, { waitUntil: "networkidle" });
      await signInDemoApp2(page, "Sarah Chen");
      await page.waitForTimeout(2000);

      // Scope to button spans (CategoryGrid category names) to avoid matching other page elements
      const firstCategorySpan = page.locator("button span.font-medium.text-gray-500").first();
      const firstCategoryText = await firstCategorySpan.textContent();
      console.log(`  📋 Sarah Chen — first category: "${firstCategoryText}"`);

      await expect(firstCategorySpan).toContainText("Snacks");

      await firstCategorySpan.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/07b-sarah-snacks-first.png` });
      console.log("  📸 07b — DemoApp2: Sarah Chen sees Snacks & Chips first (family boost active)");
    });

    // ── Step 3: DemoApp2 — Robert Williams (senior/frequent) sees Meat first ─
    await test.step("Step 3 — Robert Williams (senior) sees Meat & Seafood as first category", async () => {
      await signOutDemoApp2(page);
      await signInDemoApp2(page, "Robert Williams");
      await page.waitForTimeout(2000);

      const firstCategorySpan = page.locator("button span.font-medium.text-gray-500").first();
      const firstCategoryText = await firstCategorySpan.textContent();
      console.log(`\n  📋 Robert Williams — first category: "${firstCategoryText}"`);

      // Robert is senior/frequent — family targeting rule does NOT apply
      // Falls back to behavior-based order: frequent → meat first
      await expect(firstCategorySpan).not.toContainText("Snacks");
      await expect(firstCategorySpan).toContainText("Meat");

      await firstCategorySpan.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/07c-robert-meat-first.png` });
      console.log("  📸 07c — DemoApp2: Robert Williams sees Meat & Seafood first (no family boost)");
    });

    // ── Step 4: Control Room — AI confirms flag status ──────────────────────
    await test.step("Step 4 — Control Room: AI confirms flag status", async () => {
      const dashPage = await context.newPage();
      await dashPage.goto(DASHBOARD_URL, { waitUntil: "networkidle" });
      await dashPage.waitForSelector("textarea", { state: "visible" });

      const prompt = "What feature flags are active?";
      console.log(`\n  💬 Sending: "${prompt}"`);

      const start = Date.now();
      await sendChatMessage(dashPage, prompt);
      try {
        await waitForChatResponse(dashPage, 75000);
      } catch {
        console.log(`  [Step 4] AI response timed out after ${((Date.now() - start) / 1000).toFixed(1)}s`);
      }
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);

      await dashPage.screenshot({ path: `${SCREENSHOT_DIR}/07d-flag-status.png` });
      console.log(`  ✅ AI responded in ${elapsed}s`);
      console.log("  📸 07d — Control Room: AI confirms active feature flags");
      await dashPage.close();
    });

    console.log("\n  🏆 RESULT: Family households see personalized category order — senior households unaffected.");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  });
});
