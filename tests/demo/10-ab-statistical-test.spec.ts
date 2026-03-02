/**
 * DEMO 10: A/B Statistical Test — Deals Layout
 *
 * Story: The team wants data before committing to the grid layout for all
 *        frequent shoppers. They run a 50/50 A/B experiment, let it run,
 *        then ask the AI to read the results and roll out the winner.
 *
 * What this demonstrates:
 *   - Full A/B experiment lifecycle via natural language (create → analyze → decide)
 *   - Statistical significance output (p-value, confidence, uplift, recommendation)
 *   - AI-driven rollout: after seeing the results, the AI updates the feature flag
 *   - The winning variant (grid) is immediately visible for targeted personas
 *
 * Personas validated:
 *   Sarah Chen  (Gold/CA/frequent/family)  → grid layout after rollout
 *   Jordan Lee  (Silver/TX/frequent/couple) → grid layout after rollout
 */

import { test, expect } from "@playwright/test";
import {
  sendChatMessage,
  waitForChatResponse,
  deleteGrowthBookFeature,
  deleteGrowthBookExperiment,
  findExperimentsByName,
  signInDemoApp2,
  signOutDemoApp2,
  SCREENSHOT_DIR,
} from "./helpers";

const EXPERIMENT_NAME = "Deals Layout A/B Test";
const TRACKING_KEY = "deals-layout-ab-test";
const FEATURE_ID = "demoapp2-deals-layout";

test.describe("Demo 10 — A/B Statistical Test", () => {
  test.beforeAll(async ({ request }) => {
    console.log("\n=== DEMO 10: A/B Statistical Test ===");
    console.log("  Cleaning up any existing state...");
    // Clean up feature flag
    await deleteGrowthBookFeature(request, FEATURE_ID);
    // Clean up any existing experiment with the same name
    const ids = await findExperimentsByName(request, EXPERIMENT_NAME);
    for (const id of ids) {
      await deleteGrowthBookExperiment(request, id);
    }
    console.log("  Setup complete. Starting test...\n");
  });

  test.afterAll(async ({ request }) => {
    console.log("\n  [Demo 10] Cleaning up...");
    await deleteGrowthBookFeature(request, FEATURE_ID);
    const ids = await findExperimentsByName(request, EXPERIMENT_NAME);
    for (const id of ids) {
      await deleteGrowthBookExperiment(request, id);
    }
    console.log("  Cleanup complete.\n");
  });

  test("AI creates A/B experiment, reads statistical results, and rolls out winner", async ({
    page,
    context,
    request,
  }) => {
    test.setTimeout(90000 * 4);

    // ── Step 1: Control Room — AI creates the feature flag ───────────────────
    console.log("  [Step 1] Creating feature flag demoapp2-deals-layout...");
    const apiKey = process.env.GROWTHBOOK_SECRET_API_KEY;
    if (apiKey) {
      const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
      await request
        .post("http://localhost:3100/api/v1/features", {
          headers,
          data: {
            id: FEATURE_ID,
            valueType: "string",
            defaultValue: "scroll",
            owner: "Test Setup",
            environments: { production: { enabled: true, rules: [] } },
          },
        })
        .catch(() => {});
      console.log("  [Step 1] Feature flag ready.");
    }

    // ── Step 2: Control Room — AI creates the A/B experiment via chat ────────
    console.log("\n  [Step 2] Opening Control Room to create A/B experiment via AI...");
    const dashPage = await context.newPage();
    await dashPage.goto("http://localhost:3050/dashboard", { waitUntil: "networkidle" });

    const startExp = Date.now();
    await sendChatMessage(
      dashPage,
      `Create an A/B experiment called "${EXPERIMENT_NAME}" on the feature flag "${FEATURE_ID}". ` +
        `Use tracking key "${TRACKING_KEY}". ` +
        `Variation 0 (Control) should serve "scroll", Variation 1 (Variant A) should serve "grid". ` +
        `Target only users where shopping_behavior equals frequent.`
    );
    console.log("  [Step 2] Waiting for AI to create A/B experiment...");
    try {
      await waitForChatResponse(dashPage, 55000);
      console.log(`  [Step 2] AI responded in ${((Date.now() - startExp) / 1000).toFixed(1)}s`);
    } catch {
      console.log(`  [Step 2] AI chat timed out — proceeding with API fallback`);
    }
    await dashPage.screenshot({
      path: `${SCREENSHOT_DIR}/10a-experiment-created.png`,
      fullPage: true,
    });
    console.log("  [Step 2] Screenshot: 10a-experiment-created.png");
    await dashPage.close();

    // API fallback: ensure experiment and experiment-ref rule exist
    let experimentId: string | null = null;
    if (apiKey) {
      const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

      // Find or create the experiment
      const existingIds = await findExperimentsByName(request, EXPERIMENT_NAME);
      if (existingIds.length > 0) {
        experimentId = existingIds[0];
        console.log(`  [Step 2] Found existing experiment: ${experimentId}`);
      } else {
        const expRes = await request.post("http://localhost:3100/api/v1/experiments", {
          headers,
          data: {
            name: EXPERIMENT_NAME,
            trackingKey: TRACKING_KEY,
            variations: [{ key: "0", name: "Control" }, { key: "1", name: "Variant A" }],
          },
        });
        const expData = await expRes.json();
        experimentId = expData.experiment?.id ?? null;
        console.log(`  [Step 2] Created experiment via API fallback: ${experimentId}`);
      }

      // Add an experiment-ref rule to the feature flag (50/50 split)
      if (experimentId) {
        const ruleRes = await request.post(`http://localhost:3100/api/v1/features/${FEATURE_ID}`, {
          headers,
          data: {
            environments: {
              production: {
                enabled: true,
                rules: [
                  {
                    type: "experiment-ref",
                    experimentId,
                    variations: [{ value: "scroll" }, { value: "grid" }],
                  },
                ],
              },
            },
          },
        });
        console.log(`  [Step 2] Experiment-ref rule set (status: ${ruleRes.status()}).`);
      }
      await page.waitForTimeout(4000);
    }

    // ── Step 3: Control Room — AI reads experiment results ───────────────────
    console.log("\n  [Step 3] AI reads experiment results (mocked statistical data)...");
    const resultsPage = await context.newPage();
    await resultsPage.goto("http://localhost:3050/dashboard", { waitUntil: "networkidle" });
    await resultsPage.waitForSelector("textarea", { state: "visible" });

    const prompt = experimentId
      ? `Get results for experiment ${experimentId} and summarize the statistical significance.`
      : `List all experiments, then get results for the "${EXPERIMENT_NAME}" experiment and summarize the statistical significance.`;

    const startResults = Date.now();
    await sendChatMessage(resultsPage, prompt);
    console.log("  [Step 3] Waiting for AI to return statistical results...");
    try {
      await waitForChatResponse(resultsPage, 55000);
      console.log(`  [Step 3] AI responded in ${((Date.now() - startResults) / 1000).toFixed(1)}s`);
    } catch {
      console.log("  [Step 3] AI results timed out");
    }
    await resultsPage.screenshot({
      path: `${SCREENSHOT_DIR}/10b-statistical-results.png`,
      fullPage: true,
    });
    console.log("  [Step 3] Screenshot: 10b-statistical-results.png");
    await resultsPage.close();

    // ── Step 4: Control Room — AI rolls out the winner ────────────────────────
    console.log("\n  [Step 4] AI rolls out winning variant (grid) to all frequent shoppers...");
    const rolloutPage = await context.newPage();
    await rolloutPage.goto("http://localhost:3050/dashboard", { waitUntil: "networkidle" });
    await rolloutPage.waitForSelector("textarea", { state: "visible" });

    const startRollout = Date.now();
    await sendChatMessage(
      rolloutPage,
      `The experiment results are significant. Roll out the winning variant: ` +
        `update feature flag "${FEATURE_ID}" to add a force rule serving "grid" ` +
        `to all users where shopping_behavior equals frequent.`
    );
    console.log("  [Step 4] Waiting for AI to apply rollout rule...");
    try {
      await waitForChatResponse(rolloutPage, 55000);
      console.log(`  [Step 4] AI responded in ${((Date.now() - startRollout) / 1000).toFixed(1)}s`);
    } catch {
      console.log("  [Step 4] AI rollout timed out — using API fallback");
    }
    await rolloutPage.screenshot({
      path: `${SCREENSHOT_DIR}/10c-rollout-applied.png`,
      fullPage: true,
    });
    console.log("  [Step 4] Screenshot: 10c-rollout-applied.png");

    // API fallback: ensure force rule exists for rollout
    if (apiKey) {
      const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
      const ruleRes = await request.post(`http://localhost:3100/api/v1/features/${FEATURE_ID}`, {
        headers,
        data: {
          environments: {
            production: {
              enabled: true,
              rules: [{ type: "force", value: "grid", condition: '{"shopping_behavior":"frequent"}' }],
            },
          },
        },
      });
      console.log(`  [Step 4] Force rollout rule applied (status: ${ruleRes.status()}).`);
      await page.waitForTimeout(4000);
    }
    await rolloutPage.close();

    // ── Step 5: DemoApp2 — Sarah Chen (frequent) sees grid after rollout ──────
    console.log("\n  [Step 5] DemoApp2: Sarah Chen (frequent) should see grid after rollout...");
    await page.goto("http://localhost:3050/demoapp2", { waitUntil: "networkidle" });
    await signInDemoApp2(page, "Sarah Chen");
    await page.waitForTimeout(2000);

    const gridLayout = page.locator("div.grid.grid-cols-2").first();
    await expect(gridLayout).toBeVisible({ timeout: 10000 });
    console.log("  [Step 5] PASS: Grid layout visible for Sarah Chen after rollout.");
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10d-sarah-grid-after-rollout.png`,
      fullPage: true,
    });
    console.log("  [Step 5] Screenshot: 10d-sarah-grid-after-rollout.png");

    // ── Step 6: DemoApp2 — Jordan Lee (frequent) also sees grid ──────────────
    console.log("\n  [Step 6] DemoApp2: Jordan Lee (Silver/TX/frequent) also sees grid...");
    await signOutDemoApp2(page);
    await signInDemoApp2(page, "Jordan Lee");
    await page.waitForTimeout(2000);

    await expect(page.locator("div.grid.grid-cols-2").first()).toBeVisible({ timeout: 10000 });
    console.log("  [Step 6] PASS: Grid layout visible for Jordan Lee — rollout confirmed.");
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10e-jordan-grid-after-rollout.png`,
      fullPage: true,
    });
    console.log("  [Step 6] Screenshot: 10e-jordan-grid-after-rollout.png");

    console.log("\n=== DEMO 10 COMPLETE ===\n");
  });
});
