import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";

const SCREENSHOTS = "scripts/screenshots";
mkdirSync(SCREENSHOTS, { recursive: true });

async function shot(page, name) {
  const p = `${SCREENSHOTS}/${name}.png`;
  await page.screenshot({ path: p, fullPage: false });
  console.log(`  📸 ${p}`);
}

async function sendMessage(page, text) {
  console.log(`\n▶ Sending: "${text}"`);
  const input = page.locator('textarea, input[type="text"]').last();
  await input.click();
  await input.fill(text);
  await input.press("Enter");
}

async function waitForResponse(page, timeoutMs = 30000) {
  // Wait for the "thinking" indicator to appear then disappear, or for new message content
  await page.waitForTimeout(2000);
  // Wait until no loading/spinner indicators are visible
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const isLoading = await page
      .locator('[class*="loading"], [class*="spinner"], [class*="thinking"]')
      .isVisible()
      .catch(() => false);
    if (!isLoading) break;
    await page.waitForTimeout(500);
  }
  // Extra wait for content to render
  await page.waitForTimeout(2000);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  console.log("🌐 Opening http://localhost:3050...");
  await page.goto("http://localhost:3050", { waitUntil: "networkidle" });
  await shot(page, "01-homepage");
  console.log("  ✅ Page loaded");

  // Find and click the CopilotKit sidebar open button
  console.log("\n🔍 Looking for chat toggle button...");
  // CopilotKit renders a floating button to open the sidebar
  const chatBtn = page
    .locator('button[aria-label*="open" i], button[aria-label*="chat" i], button[aria-label*="copilot" i], [class*="open-button"], [class*="trigger"]')
    .first();

  const btnVisible = await chatBtn.isVisible().catch(() => false);
  if (btnVisible) {
    await chatBtn.click();
    console.log("  ✅ Clicked chat button");
  } else {
    // Try finding any floating action button
    const fab = page.locator('button').filter({ hasText: /chat|ai|ask/i }).first();
    const fabVisible = await fab.isVisible().catch(() => false);
    if (fabVisible) {
      await fab.click();
      console.log("  ✅ Clicked FAB button");
    } else {
      console.log("  ⚠️  Could not find chat toggle — sidebar may already be open");
    }
  }

  await page.waitForTimeout(1500);
  await shot(page, "02-chat-opened");

  // --- Message 1: List experiments ---
  await sendMessage(page, "List all my experiments");
  await waitForResponse(page, 30000);
  await shot(page, "03-list-experiments-response");

  // Grab response text
  const msgs1 = await page.locator('[class*="message"], [class*="response"], [class*="assistant"]').allInnerTexts();
  console.log("  💬 Response preview:", msgs1.slice(-1)[0]?.slice(0, 200) || "(no text captured)");

  // --- Message 2: Feature flag query ---
  await sendMessage(page, "What's the current feature flag for product layout?");
  await waitForResponse(page, 30000);
  await shot(page, "04-feature-flag-response");

  const msgs2 = await page.locator('[class*="message"], [class*="response"], [class*="assistant"]').allInnerTexts();
  console.log("  💬 Response preview:", msgs2.slice(-1)[0]?.slice(0, 200) || "(no text captured)");

  // --- Message 3: Create an experiment ---
  await sendMessage(page, "Create an experiment called 'Hero Banner Test' with Control and Variant A");
  await waitForResponse(page, 45000);
  await shot(page, "05-create-experiment-response");

  const msgs3 = await page.locator('[class*="message"], [class*="response"], [class*="assistant"]').allInnerTexts();
  console.log("  💬 Response preview:", msgs3.slice(-1)[0]?.slice(0, 200) || "(no text captured)");

  await shot(page, "06-final-state");

  await browser.close();
  console.log("\n✅ Done — screenshots saved to scripts/screenshots/");
})().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
