import { chromium } from "playwright";
import { mkdirSync } from "fs";

mkdirSync("scripts/screenshots", { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Capture console errors
  page.on("console", msg => {
    if (msg.type() === "error") console.log("BROWSER ERROR:", msg.text());
  });

  await page.goto("http://localhost:3050", { waitUntil: "networkidle" });

  // Open sidebar
  const btn = page.locator('button').filter({ hasText: /chat|ai|ask/i }).first();
  const btnVisible = await btn.isVisible().catch(() => false);
  if (btnVisible) await btn.click();
  else {
    // Try aria-based
    const anyBtn = page.locator('[aria-label*="open" i], [aria-label*="copilot" i], [class*="open-button"]').first();
    await anyBtn.click().catch(() => {});
  }
  await page.waitForTimeout(2000);

  // Send a simple hello (no tools needed)
  const input = page.locator('textarea').last();
  await input.click();
  await input.fill("Hello, just say hi back");
  await input.press("Enter");

  console.log("Sent: Hello");

  // Wait up to 30s for a response
  let response = "";
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    const allMsgs = await page.locator('[class*="message"], [class*="assistant"], [class*="response"]').allInnerTexts();
    const assistantMsgs = allMsgs.filter(t => t && !t.includes("Hi! I can help") && !t.includes("Hello, just say hi"));
    if (assistantMsgs.length > 0) {
      response = assistantMsgs[0];
      console.log("Got response after", i+1, "seconds:", response.slice(0, 200));
      break;
    }
    process.stdout.write(".");
  }
  console.log();

  if (!response) {
    console.log("No response after 30s - checking for errors...");
    const errors = await page.locator('[class*="error"], [class*="Error"]').allInnerTexts();
    console.log("Visible errors:", errors);
  }

  await page.screenshot({ path: "scripts/screenshots/simple-test.png", fullPage: false });
  await browser.close();
})().catch(e => { console.error("Error:", e.message); process.exit(1); });
