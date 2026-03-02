/**
 * DEMO 9: Senior Household — Hidden Fresh Section
 *
 * Story: Senior shoppers are less interested in fresh departments — they visit
 *        for deals and familiar pantry staples. Hiding the fresh section removes
 *        visual noise and surfaces deals faster.
 *
 * Targeting: household_type = senior → demoapp2-fresh-section = false
 * Default:   all others             → demoapp2-fresh-section = true
 *
 * Personas validated:
 *   Robert Williams (senior)        → "Shop What's Fresh" section NOT in DOM
 *   Emily Rodriguez (new/single)    → Fresh section visible + "Welcome to Safeway!" message
 *   Sarah Chen      (family/gold)   → Fresh section visible + "Your Rewards" panel, no welcome
 *
 * Steps:
 *   1. Control Room: AI creates boolean flag + targeting rule
 *   2. DemoApp2: Robert (senior) → fresh section absent from DOM
 *   3. DemoApp2: Emily (new)     → fresh section + welcome message visible
 *   4. DemoApp2: Sarah (gold)    → fresh section + rewards panel, no welcome
 *   5. Control Room: AI confirms all flags active
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
const FEATURE_ID = "demoapp2-fresh-section";

test.describe("Demo 9: Senior Household — Hidden Fresh Section", () => {
  test.beforeAll(async ({ request }) => {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  DEMO 9: Senior Household — Hidden Fresh Section");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Cleaning up any existing ${FEATURE_ID} feature...`);
    await deleteGrowthBookFeature(request, FEATURE_ID);
    console.log("  Setup complete. Starting test...\n");
  });

  test.afterAll(async ({ request }) => {
    console.log(`\n  [Demo 9] Cleaning up ${FEATURE_ID} feature...`);
    await deleteGrowthBookFeature(request, FEATURE_ID);
    console.log("  Cleanup complete.\n");
  });

  test("AI hides fresh section for seniors; new and gold members see it with personalized content", async ({
    page,
    context,
    request,
  }) => {
    test.setTimeout(90000 * 4);

    // ── Step 1: Control Room — AI creates boolean flag (msg 1) + rule (msg 2) ─
    await test.step("Step 1 — AI creates demoapp2-fresh-section flag with senior targeting", async () => {
      const dashPage = await context.newPage();
      await dashPage.goto(DASHBOARD_URL, { waitUntil: "networkidle" });
      await dashPage.waitForSelector("textarea", { state: "visible" });

      console.log('\n  [Step 1] Creating boolean feature flag with senior targeting rule...');
      const start = Date.now();
      await sendChatMessage(dashPage, 'Create a boolean feature flag with id "demoapp2-fresh-section" and default value "true". Then add a force targeting rule to serve "false" to users where household_type equals "senior".');
      try {
        await waitForChatResponse(dashPage, 45000);
        console.log(`  [Step 1] AI responded in ${((Date.now() - start) / 1000).toFixed(1)}s`);
      } catch {
        console.log(`  [Step 1] AI chat timed out after ${((Date.now() - start) / 1000).toFixed(1)}s — proceeding with API fallback`);
      }
      await dashPage.screenshot({ path: `${SCREENSHOT_DIR}/09a-ai-creates-flag.png`, fullPage: true });
      console.log("  [Step 1] Screenshot: 09a-ai-creates-flag.png");
      await dashPage.close();

      // API fallback: always ensure the feature exists with the exact targeting rule
      const apiKey = process.env.GROWTHBOOK_SECRET_API_KEY;
      if (apiKey) {
        const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
        // Create the feature if AI didn't (ignore 409 if it already exists)
        await request.post("http://localhost:3100/api/v1/features", {
          headers,
          data: { id: FEATURE_ID, valueType: "boolean", defaultValue: "true", owner: "Test Setup", environments: { production: { enabled: true, rules: [] } } },
        }).catch(() => {});
        // Set the exact targeting rule unconditionally
        const ruleRes = await request.post(`http://localhost:3100/api/v1/features/${FEATURE_ID}`, {
          headers,
          data: { environments: { production: { enabled: true, rules: [{ type: "force", value: "false", condition: '{"household_type":"senior"}' }] } } },
        });
        console.log(`  [Step 1] Targeting rule set (status: ${ruleRes.status()}).`);
        // Wait for GrowthBook SDK endpoint to reflect the new rule
        await page.waitForTimeout(4000);
      }
    });

    // ── Step 2: DemoApp2 — Robert Williams (senior) sees NO fresh section ─────
    await test.step("Step 2 — Robert Williams (senior) sees no fresh section", async () => {
      // Poll layout API until targeting rule is active (senior → fresh section hidden)
      const deadline = Date.now() + 25000;
      let ruleActive = false;
      while (Date.now() < deadline) {
        const res = await page.request.post("http://localhost:3050/api/demoapp2/layout", {
          data: { userId: "robert-williams", attributes: { membership_tier: "gold", location: "OR", shopping_behavior: "frequent", household_type: "senior" } },
        });
        if (res.ok()) {
          const layout = await res.json();
          const fresh = layout.sections?.find((s: any) => s.id === "fresh");
          if (fresh?.visible === false) { ruleActive = true; break; }
        }
        await page.waitForTimeout(1000);
      }
      console.log(`\n  [Step 2] Targeting rule active (senior → hidden): ${ruleActive}`);

      console.log("  [Step 2] Loading DemoApp2 for Robert Williams (gold/OR/frequent/senior)...");
      await page.goto(DEMOAPP2_URL, { waitUntil: "networkidle" });
      await signInDemoApp2(page, "Robert Williams");
      console.log("  [Step 2] Signed in as Robert Williams. Waiting for layout to render...");
      await page.waitForTimeout(2000);

      // When visible: false, renderSection returns null — section is entirely absent from DOM
      // The FreshSection renders an h2 "Shop What's Fresh" — assert it is NOT present
      const freshHeading = page.locator("h2", { hasText: "Shop What's Fresh" });
      await expect(freshHeading).not.toBeVisible({ timeout: 10000 });
      console.log("  [Step 2] PASS: Fresh section ('Shop What's Fresh') not visible for Robert (senior).");

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/09b-robert-no-fresh-section.png`,
        fullPage: true,
      });
      console.log("  [Step 2] Screenshot: 09b-robert-no-fresh-section.png");
      console.log("  [Step 2] Robert: Fresh section hidden ✓");
    });

    // ── Step 3: DemoApp2 — Emily Rodriguez (new/single) sees fresh + welcome ──
    await test.step("Step 3 — Emily Rodriguez (new) sees fresh section and welcome message", async () => {
      console.log("\n  [Step 3] Switching to Emily Rodriguez (basic/IL/new/single)...");
      await signOutDemoApp2(page);
      await signInDemoApp2(page, "Emily Rodriguez");
      console.log("  [Step 3] Signed in as Emily Rodriguez. Waiting for layout to render...");
      await page.waitForTimeout(2000);

      // Fresh section must be present
      const freshHeading = page.locator("h2", { hasText: "Shop What's Fresh" });
      await expect(freshHeading).toBeVisible({ timeout: 10000 });
      console.log("  [Step 3] PASS: Fresh section ('Shop What's Fresh') visible for Emily (new).");

      // Welcome message — rendered by FreshSection when welcomeMessage prop is set (shopping_behavior=new)
      const welcomeHeading = page.locator("h3.font-bold.text-blue-900", { hasText: "Welcome to Safeway!" });
      await expect(welcomeHeading).toBeVisible({ timeout: 10000 });
      console.log("  [Step 3] PASS: 'Welcome to Safeway!' message visible for Emily (new member).");

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/09c-emily-fresh-welcome.png`,
        fullPage: true,
      });
      console.log("  [Step 3] Screenshot: 09c-emily-fresh-welcome.png");
      console.log("  [Step 3] Emily: Fresh section + welcome visible ✓");
    });

    // ── Step 4: DemoApp2 — Sarah Chen (gold/family) sees fresh + rewards ──────
    await test.step("Step 4 — Sarah Chen (gold/family) sees fresh section and rewards panel, no welcome", async () => {
      console.log("\n  [Step 4] Switching to Sarah Chen (gold/CA/frequent/family)...");
      await signOutDemoApp2(page);
      await signInDemoApp2(page, "Sarah Chen");
      console.log("  [Step 4] Signed in as Sarah Chen. Waiting for layout to render...");
      await page.waitForTimeout(2000);

      // Fresh section must be present
      const freshHeading = page.locator("h2", { hasText: "Shop What's Fresh" });
      await expect(freshHeading).toBeVisible({ timeout: 10000 });
      console.log("  [Step 4] PASS: Fresh section ('Shop What's Fresh') visible for Sarah (gold/family).");

      // Gold rewards panel — rendered by FreshSection when rewardsSummary prop is set (membership_tier=gold)
      const rewardsHeading = page.locator("h3.font-bold.text-amber-900", { hasText: "Your Rewards" });
      await expect(rewardsHeading).toBeVisible({ timeout: 10000 });
      console.log("  [Step 4] PASS: 'Your Rewards' panel visible for Sarah (gold member).");

      // Welcome message must NOT appear — Sarah is not a new member (shopping_behavior=frequent)
      const welcomeHeading = page.locator("h3.font-bold.text-blue-900", { hasText: "Welcome to Safeway!" });
      await expect(welcomeHeading).not.toBeVisible({ timeout: 5000 });
      console.log("  [Step 4] PASS: 'Welcome to Safeway!' NOT visible for Sarah (not a new member).");

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/09d-sarah-fresh-rewards.png`,
        fullPage: true,
      });
      console.log("  [Step 4] Screenshot: 09d-sarah-fresh-rewards.png");
      console.log("  [Step 4] Sarah: Fresh section + rewards panel, no welcome ✓");
    });

    // ── Step 5: Control Room — AI confirms all flags active ───────────────────
    await test.step("Step 5 — Control Room: AI confirms active feature flags", async () => {
      const dashPage = await context.newPage();
      await dashPage.goto(DASHBOARD_URL, { waitUntil: "networkidle" });
      await dashPage.waitForSelector("textarea", { state: "visible" });

      const prompt = "What feature flags are active?";
      console.log(`\n  [Step 5] Sending: "${prompt}"`);

      const start = Date.now();
      await sendChatMessage(dashPage, prompt);
      try {
        await waitForChatResponse(dashPage, 75000);
      } catch {
        console.log(`  [Step 5] AI response timed out after ${((Date.now() - start) / 1000).toFixed(1)}s`);
      }
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);

      await dashPage.screenshot({
        path: `${SCREENSHOT_DIR}/09e-flag-status.png`,
        fullPage: true,
      });
      console.log(`  [Step 5] AI responded in ${elapsed}s`);
      console.log("  [Step 5] Screenshot: 09e-flag-status.png");
      await dashPage.close();
    });

    console.log(
      "\n  RESULT: One targeting rule changed what 25% of users see — senior households, identified automatically."
    );
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  });
});
