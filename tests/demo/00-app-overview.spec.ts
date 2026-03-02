/**
 * DEMO 00: App Overview Screenshots
 *
 * Captures clean overview screenshots of DemoApp2 and Control Room
 * for use in the pre-demo PDF intro section.
 *
 * Runs first (alphabetical order) so these screenshots are always fresh.
 */

import { test } from "@playwright/test";
import { SCREENSHOT_DIR } from "./helpers";

test.describe("Demo 00 — App Overview Screenshots", () => {
  test("capture DemoApp2 and Control Room overview", async ({ page }) => {
    test.setTimeout(30000);

    // ── DemoApp2 — anonymous default view ───────────────────────────────────
    console.log("\n  [00] Capturing DemoApp2 overview (anonymous)...");
    await page.goto("http://localhost:3050/demoapp2", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/00-demoapp2-overview.png`,
      fullPage: true,
    });
    console.log("  [00] Screenshot: 00-demoapp2-overview.png");

    // ── Control Room — show a live AI conversation, not the empty welcome state ─
    console.log("  [00] Capturing Control Room with active conversation...");
    await page.goto("http://localhost:3050/dashboard", { waitUntil: "networkidle" });
    await page.waitForSelector("textarea", { state: "visible" });
    // Send a quick question so the AI responds — proves the chat works
    const textarea = page.locator("textarea");
    await textarea.fill("Describe your tools and what experiments you can run.");
    await textarea.press("Enter");
    // Wait for AI to respond (textarea disabled → re-enabled)
    try {
      await page.waitForFunction(
        () => (document.querySelector("textarea") as HTMLTextAreaElement)?.disabled === true,
        undefined, { timeout: 8000 }
      );
      await page.waitForFunction(
        () => (document.querySelector("textarea") as HTMLTextAreaElement)?.disabled === false,
        undefined, { timeout: 30000 }
      );
    } catch { /* proceed anyway */ }
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/00-control-room-overview.png`,
      fullPage: false,
    });
    console.log("  [00] Screenshot: 00-control-room-overview.png\n");
  });
});
