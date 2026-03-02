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
      fullPage: false,
    });
    console.log("  [00] Screenshot: 00-demoapp2-overview.png");

    // ── Control Room — dashboard with context panel ──────────────────────────
    console.log("  [00] Capturing Control Room overview...");
    await page.goto("http://localhost:3050/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/00-control-room-overview.png`,
      fullPage: false,
    });
    console.log("  [00] Screenshot: 00-control-room-overview.png\n");
  });
});
