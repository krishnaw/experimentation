/**
 * demo-loop.mjs
 *
 * Autonomous PDF quality loop:
 *   1. Generate PDF
 *   2. Run leader audit (writes scripts/audit-results.json)
 *   3. If failures → send failures + screenshots + source files to Claude
 *   4. Claude returns specific search-replace patches
 *   5. Apply patches to generator / test files
 *   6. If screenshots changed → re-run demo tests
 *   7. Repeat until all chapters pass or MAX_ITERATIONS reached
 *   8. On success → git commit + push
 *
 * Usage:
 *   source ~/.load-secrets.sh
 *   node scripts/demo-loop.mjs              # use existing screenshots
 *   node scripts/demo-loop.mjs --run-tests  # re-run demo tests first
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname  = dirname(fileURLToPath(import.meta.url));
const ROOT       = join(__dirname, "..");
const AUDIT_JSON = join(ROOT, "scripts", "audit-results.json");
const AUDIT_DIR  = join(ROOT, "scripts", "screenshots", "audit");
const API_KEY    = process.env.ANTHROPIC_API_KEY;
const MAX_ITERS  = 5;
const RUN_TESTS  = process.argv.includes("--run-tests");

// Maps PDF chapter number → test file(s) whose screenshots appear in it
const CHAPTER_TO_TESTS = {
  2: ["tests/demo/00-app-overview.spec.ts"],
  3: ["tests/demo/05-gold-hero-experience.spec.ts"],
  4: ["tests/demo/05-gold-hero-experience.spec.ts"],
  6: ["tests/demo/06-frequent-shopper-grid.spec.ts", "tests/demo/07-family-category-boost.spec.ts"],
  7: ["tests/demo/08-regional-price-sort.spec.ts", "tests/demo/09-senior-fresh-section.spec.ts"],
  8: ["tests/demo/10-ab-statistical-test.spec.ts"],
};

const PDF_GENERATOR    = "scripts/generate-pre-demo-pdf.mjs";
const PLAYWRIGHT_CFG   = "playwright.demo.config.ts";

if (!API_KEY) { console.error("❌  ANTHROPIC_API_KEY not set."); process.exit(1); }

// ── Helpers ────────────────────────────────────────────────────────────────

/** Run a shell command string. All inputs are hardcoded — no user data is interpolated. */
function sh(cmd) {
  const result = spawnSync(cmd, { cwd: ROOT, encoding: "utf8", shell: true });
  return (result.stdout || "") + (result.stderr || "");
}

function readFile(relPath) {
  const full = join(ROOT, relPath);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
}

function applyFix(relPath, search, replace) {
  const full = join(ROOT, relPath);
  const content = readFile(relPath);
  if (!content.includes(search)) {
    console.log(`    ⚠ Skipped — search string not found in ${relPath}`);
    return false;
  }
  writeFileSync(full, content.replace(search, replace), "utf8");
  return true;
}

// ── Ask Claude for fix patches ─────────────────────────────────────────────

async function getFixes(failures, iterNum) {
  const filesNeeded = new Set([PDF_GENERATOR, PLAYWRIGHT_CFG]);
  for (const { num } of failures) {
    (CHAPTER_TO_TESTS[num] || []).forEach(f => filesNeeded.add(f));
  }

  const fileContext = Array.from(filesNeeded)
    .map(f => `=== ${f} ===\n${readFile(f)}`)
    .join("\n\n");

  const failureText = failures
    .map(f => `Chapter ${f.num} — ${f.label}:\n${f.issues}`)
    .join("\n\n---\n\n");

  const content = [
    {
      type: "text",
      text: `You are fixing a pre-demo PDF for a C-suite/investor presentation (iteration ${iterNum} of ${MAX_ITERS}).

CONTEXT:
- ALL app screenshots are from DemoApp2, a Safeway grocery store (hero banners, deals grid, categories, fresh produce).
- The PDF is built by ${PDF_GENERATOR} from Playwright screenshots taken by the test files below.
- Playwright viewport: 900×700 (in ${PLAYWRIGHT_CFG}).
- Screenshots at 900px width scale to ~88% in A4 PDF — 14px text becomes ~12px (borderline readable).
- Using fullPage:true on chat/dashboard pages makes the image taller, further shrinking text. Remove it.
- Chat panel is a split layout: 280px left sidebar + right chat area. Left sidebar shows experiments/flags list.

AUDIT FAILURES THIS ITERATION:
${failureText}

SOURCE FILES:
${fileContext}

RULES FOR PATCHES:
1. "text too small" / "illegible": remove \`fullPage: true,\` from that screenshot call
2. "Exp Engine offline" in screenshot: add before the screenshot:
   \`await page.waitForSelector('text=Connected to Exp Engine', {timeout:8000}).catch(async()=>{await page.reload({waitUntil:"networkidle"});await page.waitForSelector('text=Connected to Exp Engine',{timeout:5000}).catch(()=>{});});\`
3. "user prompt cut off" / "chat scroll": add before screenshot:
   \`await page.evaluate(()=>{document.querySelectorAll('[class*="overflow-y-auto"]').forEach(el=>{el.scrollTop=0;});});\nawait page.waitForTimeout(200);\`
4. "caption mismatch": fix the caption string in ${PDF_GENERATOR} (the second arg to shot())
5. "category order not visible": scroll to h2 "Shop by Category" heading, not the tiny button span
6. "Control Room shows empty/no flags state": change the overview AI query to show capabilities:
   change "What feature flags are active?" to "Describe your tools and what experiments you can run."
7. "screenshots look identical" for experiments: ensure screenshot is taken AFTER scrolling the
   differentiating element (category heading or deals heading) into view
8. "search" must appear EXACTLY ONCE in the target file — include ample surrounding context
9. Do not break test assertions, API fallbacks, or existing logic
10. Only patch what the audit specifically flagged

Return ONLY valid JSON (no markdown fences, no commentary outside the JSON):
{
  "fixes": [
    { "file": "relative/path", "search": "exact unique string", "replace": "replacement" }
  ],
  "needsTestRun": true,
  "reasoning": "one sentence summary of key changes"
}`,
    },
  ];

  // Attach audit screenshots for failing chapters so Claude can see what's wrong
  for (const { num } of failures) {
    const imgPath = join(AUDIT_DIR, `page-${String(num).padStart(2, "0")}.png`);
    if (existsSync(imgPath)) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: "image/png", data: readFileSync(imgPath).toString("base64") },
      });
      content.push({ type: "text", text: `↑ Audit screenshot for Chapter ${num} (failing)` });
    }
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 8000, messages: [{ role: "user", content }] }),
      });
      const data = await resp.json();
      const text = data.content?.[0]?.text ?? "";
      // Strip optional markdown code fences
      const stripped = text.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
      // Find the outermost JSON object — handle nested braces
      const start = stripped.indexOf("{");
      const end   = stripped.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("No JSON in response: " + text.slice(0, 400));
      const jsonStr = stripped.slice(start, end + 1);
      try {
        return JSON.parse(jsonStr);
      } catch (parseErr) {
        // If parse fails, try to extract just the fixes array with a looser approach
        const reasoningMatch = jsonStr.match(/"reasoning"\s*:\s*"([^"]+)"/);
        const needsTestMatch = jsonStr.match(/"needsTestRun"\s*:\s*(true|false)/);
        const fixesMatch = jsonStr.match(/"fixes"\s*:\s*\[([\s\S]*)\]/);
        if (fixesMatch) {
          // Try parsing the fixes array items individually
          const items = [];
          const itemRegex = /\{\s*"file"\s*:\s*"([^"]+)"\s*,\s*"search"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"replace"\s*:\s*"((?:[^"\\]|\\.)*)"[^}]*\}/g;
          let m;
          while ((m = itemRegex.exec(fixesMatch[1])) !== null) {
            items.push({ file: m[1], search: m[2].replace(/\\n/g,"\n").replace(/\\t/g,"\t").replace(/\\"/g,'"'), replace: m[3].replace(/\\n/g,"\n").replace(/\\t/g,"\t").replace(/\\"/g,'"') });
          }
          return { fixes: items, needsTestRun: needsTestMatch?.[1] === "true", reasoning: reasoningMatch?.[1] ?? "See fixes above" };
        }
        throw new Error("JSON parse failed: " + parseErr.message);
      }
    } catch (err) {
      if (attempt < 3) { await new Promise(r => setTimeout(r, 3000 * attempt)); continue; }
      throw err;
    }
  }
}

// ── Main loop ──────────────────────────────────────────────────────────────

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  DEMO LOOP — Autonomous PDF generation · audit · fix");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

if (RUN_TESTS) {
  console.log("  [PRE] Running demo tests for fresh screenshots...");
  const out = sh("pnpm test:demo");
  const summary = out.split("\n").filter(l => /passed|failed|skipped/.test(l)).slice(-3).join("\n");
  console.log("  " + summary.trim());
  console.log();
}

let overallPassed = false;

for (let iter = 1; iter <= MAX_ITERS; iter++) {
  console.log(`\n  ══ Iteration ${iter} / ${MAX_ITERS} ════════════════════════════════\n`);

  // 1. Generate PDF
  console.log("  [1/3] Generating PDF...");
  const pdfOut = sh("node scripts/generate-pre-demo-pdf.mjs");
  const pdfLine = pdfOut.split("\n").find(l => l.includes("generated")) ?? pdfOut.split("\n")[0];
  console.log("  " + pdfLine.trim());

  // 2. Audit
  console.log("\n  [2/3] Running leader audit...");
  sh("node scripts/audit-pdf-screenshots.mjs");

  if (!existsSync(AUDIT_JSON)) {
    console.log("  ⚠ audit-results.json missing — cannot continue."); break;
  }
  const { passed, failed, failures } = JSON.parse(readFileSync(AUDIT_JSON, "utf8"));
  console.log(`  Result: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log("\n  ✅ All chapters passed!");
    overallPassed = true;
    break;
  }
  if (iter === MAX_ITERS) {
    console.log(`\n  ⚠ Max iterations reached — committing best effort.`);
    break;
  }

  // 3. Get fixes from Claude
  console.log(`\n  [3/3] Getting fix patches from Claude (${failures.length} failing chapters)...`);
  let fixResult;
  try {
    fixResult = await getFixes(failures, iter);
  } catch (err) {
    console.log(`  ⚠ Fix request failed: ${err.message}`); break;
  }

  console.log(`  Reasoning: ${fixResult.reasoning}`);
  console.log(`  Applying ${fixResult.fixes?.length ?? 0} patches...`);

  let applied = 0;
  let testFilesChanged = false;
  for (const fix of fixResult.fixes ?? []) {
    if (applyFix(fix.file, fix.search, fix.replace)) {
      if (fix.file.startsWith("tests/")) testFilesChanged = true;
      console.log(`    ✅ ${fix.file}`);
      applied++;
    }
  }
  console.log(`  Applied ${applied}/${fixResult.fixes?.length ?? 0} patches.`);

  if ((fixResult.needsTestRun || testFilesChanged) && applied > 0) {
    console.log("\n  📸 Re-running demo tests for updated screenshots...");
    const testOut = sh("pnpm test:demo");
    const summary = testOut.split("\n").filter(l => /passed|failed|skipped/.test(l)).slice(-3).join("\n");
    console.log("  " + summary.trim());
  }
}

// ── Commit and push ────────────────────────────────────────────────────────

console.log("\n  Committing and pushing to git...");
const status = sh("git status --short");
if (status.trim()) {
  sh("git add -A");
  const label = overallPassed ? "all chapters pass" : `best effort after ${MAX_ITERS} iterations`;
  sh(`git commit -m "Auto-fix: PDF audit loop — ${label}" -m "Generated by demo-loop.mjs: failures analyzed, patches applied, PDF regenerated." -m "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"`);
  const pushOut = sh("git push origin main");
  console.log("  Push:", pushOut.includes("main") || pushOut.includes("Everything") ? "✅" : pushOut.trim().slice(0, 80));
} else {
  console.log("  Nothing to commit.");
}

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(overallPassed
  ? "  ✅ PDF passes all leader checks. Ready to send."
  : "  ⚠  PDF did not fully pass — review scripts/screenshots/audit/");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
process.exit(overallPassed ? 0 : 1);
