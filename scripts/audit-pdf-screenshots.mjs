/**
 * audit-pdf-screenshots.mjs
 *
 * Leader-grade audit of the generated PDF.
 * Renders PRE-DEMO.html in a browser, screenshots each logical chapter
 * (.cover and .page elements — one per PDF page), then sends every chapter
 * to Claude vision acting as a skeptical C-suite leader.
 *
 * Run AFTER generate-pre-demo-pdf.mjs (which also writes PRE-DEMO.html):
 *   node scripts/generate-pre-demo-pdf.mjs
 *   node scripts/audit-pdf-screenshots.mjs
 *
 * Exit 0 = all pages pass. Exit 1 = failures found (with details printed).
 */

import { chromium } from "playwright";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, "..");
const HTML_PATH = join(ROOT, "PRE-DEMO.html");
const AUDIT_DIR = join(ROOT, "scripts", "screenshots", "audit");
const API_KEY   = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error("❌  ANTHROPIC_API_KEY not set. Run: source ~/.load-secrets.sh");
  process.exit(1);
}
if (!existsSync(HTML_PATH)) {
  console.error("❌  PRE-DEMO.html not found. Run: node scripts/generate-pre-demo-pdf.mjs");
  process.exit(1);
}

mkdirSync(AUDIT_DIR, { recursive: true });

// Chapter titles for context in the judge prompt
const CHAPTER_LABELS = [
  "Cover Page",
  "Meet the Platform (DemoApp2 + Control Room overviews)",
  "The Story — Before/After with chat screenshots (Demo 1)",
  "Personas — Six customers + Gold Member Hero Banner (Demo 5)",
  "Five Experiments overview cards",
  "Experiment 2 (Frequent Shopper Grid) + Experiment 3 (Family Category Boost)",
  "Experiments 4 (Regional Price Sort) + 5 (Senior Fresh Section) with chat screenshot",
  "Demo 10 — Full A/B Lifecycle (experiment created, results, rollout, verification)",
  "Architecture + Timing table",
];

// ── Render each .cover and .page element as its own screenshot ─────────────
async function captureChapters() {
  const browser = await chromium.launch();
  // A4 portrait: 794px wide; height large enough for tall elements
  const ctx  = await browser.newContext({ viewport: { width: 794, height: 1200 } });
  const page = await ctx.newPage();

  const html = readFileSync(HTML_PATH, "utf8");
  await page.setContent(html, { waitUntil: "networkidle" });

  // Each .cover and .page is one logical PDF page
  const chapters = page.locator(".cover, .page");
  const count    = await chapters.count();

  const pages = [];
  for (let i = 0; i < count; i++) {
    const el   = chapters.nth(i);
    const shot = join(AUDIT_DIR, `page-${String(i + 1).padStart(2, "0")}.png`);
    await el.screenshot({ path: shot });
    pages.push({
      num:   i + 1,
      path:  shot,
      label: CHAPTER_LABELS[i] ?? `Chapter ${i + 1}`,
    });
  }

  await browser.close();
  return pages;
}

// ── Send one chapter to Claude vision for judgment (with retry) ────────────
async function judgePage(pageNum, imagePath, totalPages, label) {
  const imageData = readFileSync(imagePath).toString("base64");

  const body = JSON.stringify({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/png", data: imageData },
          },
          {
            type: "text",
            text: `You are a demanding C-suite leader reviewing page ${pageNum} of ${totalPages} in a pre-demo PDF for an important investor/leadership presentation.

This page is: "${label}"

Judge this page ruthlessly. Specific things that MUST pass:
- Screenshots must show what captions say (e.g. if caption says "deals grid", the screenshot must show a deals grid — not a hero banner or unrelated section)
- Chat screenshots must show BOTH the user's question AND the AI's response with actual content (not empty boxes, not "Attempt again...", not just a header with no response)
- App screenshots must show the right persona/section described in the caption
- No "Exp Engine offline" errors visible in the UI of any screenshot
- Text must be readable and professionally formatted
- Nothing should look broken, cut off awkwardly, or misaligned
- Overview screenshots of the app should make a strong first impression

For cover pages and text-only pages (no screenshots expected), simply verify the text is readable and the design looks professional.

Answer in exactly this format:
VERDICT: PASS or FAIL
ISSUES: bullet list of specific problems (write "none" if PASS)`,
          },
        ],
      },
    ],
  });

  // Retry up to 3 times with backoff on network errors
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body,
      });
      const data = await response.json();
      const text = data.content?.[0]?.text ?? "";
      const pass = text.includes("VERDICT: PASS");
      const issuesMatch = text.match(/ISSUES:\s*([\s\S]+)/);
      const issues = issuesMatch?.[1]?.trim() ?? text;
      return { pass, issues };
    } catch (err) {
      if (attempt < 3) {
        process.stdout.write(` (retry ${attempt})... `);
        await new Promise(r => setTimeout(r, 2000 * attempt));
      } else {
        return { pass: false, issues: `Network error after ${attempt} attempts: ${err.message}` };
      }
    }
  }
}

// ── Main loop ──────────────────────────────────────────────────────────────
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  PDF AUDIT — Leader-Grade Review (chapter by chapter)");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

console.log("  Rendering PDF chapters in browser...");
const pages = await captureChapters();
console.log(`  Captured ${pages.length} chapters. Sending to judge...\n`);

let passed = 0;
let failed = 0;
const failures = [];

for (const { num, path: imagePath, label } of pages) {
  process.stdout.write(`  Chapter ${String(num).padStart(2)} / ${pages.length}  [${label}] ... `);
  const { pass, issues } = await judgePage(num, imagePath, pages.length, label);
  if (pass) {
    console.log("✅ PASS");
    passed++;
  } else {
    console.log("❌ FAIL");
    const lines = issues.split("\n").filter(Boolean);
    for (const line of lines) {
      if (line.trim() && line.trim() !== "none") console.log(`     ${line.trim()}`);
    }
    failed++;
    failures.push({ num, label, issues });
  }
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`  Result: ${passed} passed, ${failed} failed out of ${pages.length} chapters`);

if (failures.length > 0) {
  console.log("\n  ❌ CHAPTERS THAT FAILED:");
  for (const { num, label, issues } of failures) {
    console.log(`\n  Chapter ${num} — ${label}:`);
    issues.split("\n").filter(Boolean).forEach(l => console.log(`    ${l.trim()}`));
  }
  console.log(`\n  Audit screenshots saved to: scripts/screenshots/audit/`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  process.exit(1);
} else {
  console.log("\n  ✅ All chapters pass. PDF is ready to send.");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}
