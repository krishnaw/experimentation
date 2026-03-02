/**
 * DEMO 3: Full Experiment Lifecycle in One Conversation
 *
 * Story: A product manager, with no experimentation platform knowledge, runs the full
 * experiment lifecycle — from "what do I have?" to "experiment launched"
 * — entirely through natural language.
 *
 * Conversation flow (Control Room dashboard, port 3050):
 *   Turn 1: "What experiments are running?" → AI lists (likely empty)
 *   Turn 2: "Create a Hero Banner Test…"    → AI calls create_experiment
 *   Turn 3: "What feature flags are active?" → AI calls list_features
 *
 * Each turn is timed. Screenshots capture the full conversation.
 */

import { test, expect } from "@playwright/test";
import {
  SCREENSHOT_DIR,
  sendChatMessage,
  waitForChatResponse,
  findExperimentsByName,
  deleteGrowthBookExperiment,
} from "./helpers";

const DASHBOARD_URL = "http://localhost:3050/dashboard";

test.describe("Demo 3: Experiment Lifecycle via Dashboard", () => {
  test.beforeAll(async ({ request }) => {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  DEMO 3: Full Experiment Lifecycle via Chat");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    // Clean up any leftover Hero Banner Test experiments
    const ids = await findExperimentsByName(request, "Hero Banner Test");
    for (const id of ids) {
      await deleteGrowthBookExperiment(request, id);
      console.log(`  🗑  Deleted existing experiment: ${id}`);
    }
  });

  test.afterAll(async ({ request }) => {
    const ids = await findExperimentsByName(request, "Hero Banner Test");
    for (const id of ids) {
      await deleteGrowthBookExperiment(request, id);
    }
    console.log("  🧹 Cleanup: deleted Hero Banner Test experiment(s)");
  });

  test("full conversation: list → create experiment → list feature flags", async ({
    page,
    request,
  }) => {
    test.setTimeout(3 * 90000); // 3 turns, each up to 90s

    // ── Step 1: Open Dashboard, verify Exp Engine is connected ──────────────
    await test.step("Step 1 — Open Control Room dashboard", async () => {
      await page.goto(DASHBOARD_URL, { waitUntil: "networkidle" });

      // Wait for Exp Engine connectivity indicator in the context panel (2nd aside)
      await page.waitForFunction(
        () => {
          const asides = document.querySelectorAll("aside");
          const contextPanel = asides[1]; // 0=Sidebar nav, 1=context panel
          return (
            contextPanel?.textContent?.includes("Connected to Exp Engine") ||
            contextPanel?.textContent?.includes("Exp Engine offline")
          );
        },
        { timeout: 10000 }
      );

      const contextText = await page.locator("aside").nth(1).textContent();
      console.log(`\n  🟢 Dashboard status: ${contextText?.includes("Connected to Exp Engine") ? "Exp Engine connected" : "⚠ Exp Engine unreachable"}`);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/03a-dashboard-open.png`,
      });
      console.log("  📸 03a — Dashboard open");
    });

    // ── Step 2: "What experiments do I have?" ──────────────────────────────
    await test.step("Step 2 — Ask: what experiments are running?", async () => {
      const prompt = "What experiments are currently running?";
      console.log(`\n  💬 Turn 1: "${prompt}"`);

      const start = Date.now();
      await sendChatMessage(page, prompt);
      await waitForChatResponse(page);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/03b-list-experiments.png`,
      });
      console.log(`  ✅ Response in ${elapsed}s`);
      console.log("  📸 03b — AI lists experiments (or says none)");
    });

    // ── Step 3: Create an experiment ───────────────────────────────────────
    await test.step("Step 3 — Ask: create Hero Banner Test experiment", async () => {
      const prompt =
        'Create an experiment called "Hero Banner Test" with two variations: ' +
        '"Control" (Shop Now button) and "Variant A" (Discover Now button). ' +
        "Hypothesis: changing the CTA text will increase click-through rate.";

      console.log(`\n  💬 Turn 2: "${prompt.slice(0, 80)}..."`);

      const start = Date.now();
      await sendChatMessage(page, prompt);
      await waitForChatResponse(page, 75000);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/03c-experiment-created.png`,
      });
      console.log(`  ✅ Response in ${elapsed}s`);
      console.log("  📸 03c — AI confirms experiment creation");

      // Verify the experiment actually exists in Exp Engine (not just that AI said something)
      const ids = await findExperimentsByName(request, "Hero Banner Test");
      expect(ids.length).toBeGreaterThan(0);
    });

    // ── Step 4: Check feature flags ────────────────────────────────────────
    await test.step("Step 4 — Ask: what feature flags are active?", async () => {
      const prompt = "What feature flags are currently active?";
      console.log(`\n  💬 Turn 3: "${prompt}"`);

      const start = Date.now();
      await sendChatMessage(page, prompt);
      await waitForChatResponse(page);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/03d-full-conversation.png`,
      });
      console.log(`  ✅ Response in ${elapsed}s`);
      console.log("  📸 03d — Full conversation captured");
    });

    console.log("\n  🏆 RESULT: Full experiment lifecycle — in plain English, no Exp Engine UI needed.");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  });
});
