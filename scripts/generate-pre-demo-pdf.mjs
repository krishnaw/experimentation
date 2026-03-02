/**
 * generate-pre-demo-pdf.mjs
 *
 * Generates PRE-DEMO.pdf using Playwright's chromium renderer.
 * Screenshots from scripts/screenshots/demo/ are embedded if they exist;
 * otherwise clean placeholder boxes are shown.
 *
 * Run `pnpm test:demo` first to populate screenshots, then:
 *   node scripts/generate-pre-demo-pdf.mjs
 */

import { chromium } from "playwright";
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SCREENSHOTS_DIR = join(ROOT, "scripts", "screenshots", "demo");
const OUT_PDF = join(ROOT, "PRE-DEMO.pdf");

/** Embed a PNG as a base64 data URL if it exists, else return null. */
function imgSrc(filename) {
  const p = join(SCREENSHOTS_DIR, filename);
  if (existsSync(p)) {
    const b64 = readFileSync(p).toString("base64");
    return `data:image/png;base64,${b64}`;
  }
  return null;
}

/** Render an <img> or a styled placeholder box. */
function screenshot(filename, caption, height = "220px") {
  const src = imgSrc(filename);
  if (src) {
    return `
      <figure class="screenshot-block">
        <img src="${src}" alt="${caption}"
          style="width:100%;max-height:${height};object-fit:cover;object-position:top;
                 border-radius:6px;border:1px solid #e2e8f0;display:block;">
        <figcaption>${caption}</figcaption>
      </figure>`;
  }
  return `
    <figure class="screenshot-block placeholder" style="height:${height};">
      <div class="placeholder-inner">
        <span class="placeholder-icon">📸</span>
        <span class="placeholder-label">${caption}</span>
        <span class="placeholder-hint">${filename}</span>
      </div>
    </figure>`;
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 11pt;
    line-height: 1.65;
    color: #1a202c;
    background: #fff;
  }

  /* ── Cover ──────────────────────────────────────────── */
  .cover {
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 72px 80px;
    background: linear-gradient(145deg, #0f172a 0%, #1e3a5f 60%, #0d4a8a 100%);
    color: #fff;
    page-break-after: always;
  }
  .cover-eyebrow {
    font-size: 9.5pt;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #93c5fd;
    margin-bottom: 24px;
  }
  .cover-title {
    font-size: 36pt;
    font-weight: 700;
    line-height: 1.15;
    margin-bottom: 20px;
    letter-spacing: -0.02em;
  }
  .cover-subtitle {
    font-size: 15pt;
    font-weight: 300;
    color: #bfdbfe;
    max-width: 520px;
    margin-bottom: 56px;
    line-height: 1.5;
  }
  .cover-divider {
    width: 48px; height: 3px;
    background: #3b82f6; border-radius: 2px;
    margin-bottom: 40px;
  }
  .cover-meta { font-size: 10pt; color: #94a3b8; }
  .cover-meta strong { color: #cbd5e1; }

  /* ── Content pages ──────────────────────────────────── */
  .page { padding: 52px 72px 60px; max-width: 800px; margin: 0 auto; }

  /* ── Typography ─────────────────────────────────────── */
  .section-label {
    font-size: 8.5pt; font-weight: 700;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: #3b82f6; margin-bottom: 8px;
  }
  h1 { font-size: 22pt; font-weight: 700; letter-spacing: -0.02em; color: #0f172a; margin-bottom: 14px; }
  h2 {
    font-size: 14pt; font-weight: 600; color: #0f172a;
    margin-top: 36px; margin-bottom: 10px;
    padding-bottom: 6px; border-bottom: 2px solid #e2e8f0;
  }
  h3 { font-size: 11.5pt; font-weight: 600; color: #1e3a5f; margin-top: 26px; margin-bottom: 8px; }
  p { margin-bottom: 13px; color: #374151; }
  strong { color: #111827; }
  .lead { font-size: 12.5pt; line-height: 1.6; color: #374151; font-weight: 300; margin-bottom: 18px; }

  /* ── Callouts ───────────────────────────────────────── */
  .callout {
    background: #eff6ff; border-left: 4px solid #3b82f6;
    border-radius: 0 8px 8px 0; padding: 14px 18px; margin: 22px 0;
  }
  .callout p { margin-bottom: 0; color: #1e40af; font-size: 10.5pt; }
  .callout strong { color: #1e3a5f; }
  .callout-green { background: #f0fdf4; border-left-color: #22c55e; }
  .callout-green p { color: #15803d; }
  .callout-green strong { color: #14532d; }

  /* ── Tables ─────────────────────────────────────────── */
  table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 9.5pt; }
  thead th { background: #1e3a5f; color: #fff; font-weight: 600; padding: 8px 12px; text-align: left; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody td { padding: 7px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; color: #374151; }
  .timeline-row td:first-child { font-weight: 600; color: #3b82f6; white-space: nowrap; width: 56px; }

  /* ── Experiment cards ───────────────────────────────── */
  .exp-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; margin: 14px 0; page-break-inside: avoid; }
  .exp-card-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
  .exp-number {
    width: 32px; height: 32px; background: #1e3a5f; color: #fff;
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 12pt; font-weight: 700; flex-shrink: 0;
  }
  .exp-card-title { font-size: 11pt; font-weight: 600; color: #0f172a; margin-bottom: 2px; }
  .exp-card-quote { font-size: 9pt; color: #6b7280; font-style: italic; }
  .exp-card-body { font-size: 9.5pt; color: #374151; margin-left: 44px; }
  .exp-card-body p { margin-bottom: 4px; }
  .exp-tag {
    display: inline-block; background: #eff6ff; color: #1d4ed8;
    border-radius: 4px; padding: 2px 7px; font-size: 8.5pt; font-weight: 600;
    margin-right: 4px; margin-bottom: 4px;
  }

  /* ── Screenshots ────────────────────────────────────── */
  .screenshot-block { margin: 16px 0; page-break-inside: avoid; }
  .placeholder {
    background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
  }
  .placeholder-inner { display: flex; flex-direction: column; align-items: center; gap: 5px; }
  .placeholder-icon { font-size: 22pt; }
  .placeholder-label { font-size: 10pt; font-weight: 600; color: #475569; }
  .placeholder-hint { font-size: 8pt; color: #94a3b8; font-family: monospace; }
  figcaption { font-size: 8pt; color: #6b7280; margin-top: 5px; font-style: italic; text-align: center; }

  .screenshot-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
  .screenshot-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 16px 0; }

  /* ── Questions ──────────────────────────────────────── */
  .question-list { list-style: none; margin: 14px 0; }
  .question-list li { padding: 10px 14px 10px 42px; position: relative; border-bottom: 1px solid #f1f5f9; }
  .question-list li::before {
    content: "?"; position: absolute; left: 12px; top: 10px;
    width: 20px; height: 20px; background: #dbeafe; color: #2563eb;
    border-radius: 50%; font-size: 10pt; font-weight: 700; text-align: center; line-height: 20px;
  }
  .question-list li strong { display: block; margin-bottom: 2px; font-size: 10pt; color: #0f172a; }
  .question-list li span { font-size: 9pt; color: #4b5563; }

  .page-break { page-break-before: always; }

  .footer-strip {
    background: #0f172a; color: #94a3b8;
    font-size: 9pt; text-align: center; padding: 12px; margin-top: 44px;
  }
</style>
</head>
<body>

<!-- ══ COVER ══════════════════════════════════════════════════ -->
<div class="cover">
  <div class="cover-eyebrow">Confidential — Pre-Read</div>
  <div class="cover-title">AI-Native<br>Experimentation<br>Platform</div>
  <div class="cover-subtitle">
    From idea to live customer experiment in under 60 seconds —
    using nothing but a chat window.
  </div>
  <div class="cover-divider"></div>
  <div class="cover-meta">
    <strong>Please read before the demo session.</strong><br>
    This document sets context so you can watch for the right moments during the live walkthrough.
  </div>
</div>

<!-- ══ PAGE 1: THE STORY ══════════════════════════════════════ -->
<div class="page">
  <div class="section-label">The Problem We Solved</div>
  <h1>Experiments Shouldn't Take Three Weeks</h1>

  <p class="lead">
    Today, running a customer experiment looks like this: a product manager writes a spec,
    an engineer deploys new code, a data scientist interprets the numbers, and three weeks later
    there's a meeting to decide if it worked.
  </p>

  <div class="callout">
    <p><strong>We built something different.</strong> A product manager types a plain-English instruction
    into a chat window. An AI creates the experiment, sets the targeting rule, and the live app
    immediately serves a different experience to the right customers. No code written.
    No deployment pipeline. No engineer in the room.</p>
  </div>

  <p>
    During this demo you will watch a product manager take a grocery app from
    <em>zero personalization</em> to <em>five live customer segments</em>, then run a full
    A/B statistical test and roll out the winner — entirely through conversation.
  </p>

  <h2>Before and After — One Chat Message</h2>

  <div class="screenshot-row">
    ${screenshot("01a-before-grid-layout.png", "Before — default grid layout. No flags active.", "200px")}
    ${screenshot("01c-after-large-image-layout.png", "After — large-image layout. One chat message. No code.", "200px")}
  </div>

  ${screenshot("01b-ai-creates-flag.png", "Control Room chat — AI confirms the feature flag was created and the layout changed instantly", "150px")}

  <div class="callout callout-green">
    <p><strong>The 60-second proof:</strong> Watch the timestamp from the first chat message to the moment
    the live app shows a different experience. In every demo scenario it is under 60 seconds.
    No engineer involved. No code deployed.</p>
  </div>
</div>

<!-- ══ PAGE 2: THE PERSONAS ═══════════════════════════════════ -->
<div class="page page-break">
  <div class="section-label">Who You'll See</div>
  <h1>Six Customer Personas</h1>

  <p>
    Each persona represents a real customer segment. Their attributes — loyalty tier, location,
    shopping frequency, household type — drive every experiment decision on the server.
  </p>

  <table>
    <thead>
      <tr><th>Name</th><th>Tier</th><th>Location</th><th>Shopping</th><th>Household</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>Sarah Chen</strong></td><td>Gold</td><td>California</td><td>Frequent</td><td>Family</td></tr>
      <tr><td><strong>Marcus Johnson</strong></td><td>Silver</td><td>New York</td><td>Occasional</td><td>Couple</td></tr>
      <tr><td><strong>Emily Rodriguez</strong></td><td>Basic</td><td>Illinois</td><td>New</td><td>Single</td></tr>
      <tr><td><strong>Robert Williams</strong></td><td>Gold</td><td>Oregon</td><td>Frequent</td><td>Senior</td></tr>
      <tr><td><strong>Jordan Lee</strong></td><td>Silver</td><td>Texas</td><td>Frequent</td><td>Couple</td></tr>
      <tr><td><strong>Priya Patel</strong></td><td>Gold</td><td>Washington</td><td>Frequent</td><td>Single</td></tr>
    </tbody>
  </table>

  <p>
    <strong>The insight to watch for:</strong> These six people visit the same URL. The server reads their
    attributes and assembles a completely different page for each. The product manager configured all of
    this through natural language. The engineering team wrote the app once and never touched it again.
  </p>

  <h2>Gold vs. Silver — Same Page, Different Hero</h2>
  <p>One targeting rule in the chat. Two completely different hero experiences — live, for every user in those segments.</p>

  <div class="screenshot-row">
    ${screenshot("05b-sarah-gold-hero-banner.png", "Sarah Chen (Gold) — premium hero with gold overlay + exclusive pill", "210px")}
    ${screenshot("05c-marcus-silver-carousel.png", "Marcus Johnson (Silver) — standard carousel, not targeted", "210px")}
  </div>

  ${screenshot("05a-control-room-flag-created.png", "Control Room chat — AI creates the flag and targeting rule in one message", "155px")}
</div>

<!-- ══ PAGE 3: THE FIVE EXPERIMENTS ═══════════════════════════ -->
<div class="page page-break">
  <div class="section-label">Live During the Demo</div>
  <h1>Five Personalization Experiments</h1>

  <p>
    Each experiment is created live, through chat. The presenter types one message;
    the AI calls the API; the app changes immediately.
  </p>

  <div class="exp-card">
    <div class="exp-card-header">
      <div class="exp-number">1</div>
      <div>
        <div class="exp-card-title">Gold Member Hero Banner</div>
        <div class="exp-card-quote">"Gold members should feel recognized the moment they land."</div>
      </div>
    </div>
    <div class="exp-card-body">
      <span class="exp-tag">membership_tier = gold</span>
      <p>Gold members see a premium hero banner with gold gradient overlay and "Gold Member Exclusive" pill. Silver and Basic members see the standard carousel — they were never targeted.</p>
    </div>
  </div>

  <div class="exp-card">
    <div class="exp-card-header">
      <div class="exp-number">2</div>
      <div>
        <div class="exp-card-title">Frequent Shopper Deals Grid</div>
        <div class="exp-card-quote">"Frequent shoppers scan fast. Give them density."</div>
      </div>
    </div>
    <div class="exp-card-body">
      <span class="exp-tag">shopping_behavior = frequent</span>
      <p>Frequent shoppers see weekly deals as a dense 2-column grid. Occasional and new shoppers see a horizontal scroll strip. Same URL, same codebase — the server decides the layout.</p>
    </div>
  </div>

  <div class="exp-card">
    <div class="exp-card-header">
      <div class="exp-number">3</div>
      <div>
        <div class="exp-card-title">Family Category Boost</div>
        <div class="exp-card-quote">"Families buy snacks. Surface snacks first."</div>
      </div>
    </div>
    <div class="exp-card-body">
      <span class="exp-tag">household_type = family</span>
      <p>Family households see "Snacks &amp; Chips" first. Seniors see "Meat &amp; Seafood" first. The server reorders 16 categories in real time — one rule, two completely different navigation experiences.</p>
    </div>
  </div>

  <div class="exp-card">
    <div class="exp-card-header">
      <div class="exp-number">4</div>
      <div>
        <div class="exp-card-title">Regional Price Sort</div>
        <div class="exp-card-quote">"California shoppers are price-sensitive."</div>
      </div>
    </div>
    <div class="exp-card-body">
      <span class="exp-tag">location = CA</span>
      <p>Weekly deals for California users are sorted lowest-price-first. All other states see popularity-sorted deals. One flag, one rule, regional behavior — no new code.</p>
    </div>
  </div>

  <div class="exp-card">
    <div class="exp-card-header">
      <div class="exp-number">5</div>
      <div>
        <div class="exp-card-title">Senior Fresh Section</div>
        <div class="exp-card-quote">"Control what every senior sees — instantly."</div>
      </div>
    </div>
    <div class="exp-card-body">
      <span class="exp-tag">household_type = senior</span>
      <p>The fresh produce section is shown or hidden for seniors via a single chat message. The flag change takes effect server-side on the next request — no page reload needed.</p>
    </div>
  </div>

  <h2>Experiment 2 — Frequent vs. Occasional Shopper</h2>
  <div class="screenshot-row">
    ${screenshot("06b-sarah-frequent-grid.png", "Sarah Chen (frequent) — dense 2-column deals grid", "200px")}
    ${screenshot("06c-marcus-occasional-scroll.png", "Marcus Johnson (occasional) — horizontal scroll strip", "200px")}
  </div>

  <h2>Experiment 3 — Family vs. Senior Category Order</h2>
  <div class="screenshot-row">
    ${screenshot("07b-sarah-snacks-first.png", "Sarah Chen (family) — Snacks & Chips boosted to first position", "200px")}
    ${screenshot("07c-robert-meat-first.png", "Robert Williams (senior) — Meat & Seafood surfaced first", "200px")}
  </div>
</div>

<!-- ══ PAGE 4: SENIOR + REGIONAL ══════════════════════════════ -->
<div class="page page-break">
  <div class="section-label">More Experiments</div>
  <h1>Regional Targeting &amp; Section Control</h1>

  <h2>Experiment 4 — California Price Sort</h2>
  <p>Sarah Chen (California) sees weekly deals sorted cheapest first. Marcus Johnson (New York) sees popularity order. One flag — regional behavior, no code.</p>

  ${screenshot("08b-sarah-price-sorted-deals.png", "Sarah Chen (CA) — deals sorted by price, lowest first. Gold title: 'Your Exclusive Deals'", "200px")}

  <h2>Experiment 5 — Senior Fresh Section Control</h2>
  <p>Three personas, three different experiences — controlled by a single targeting rule that checks household_type.</p>

  <div class="screenshot-row-3">
    ${screenshot("09b-robert-no-fresh-section.png", "Robert Williams (senior) — fresh section hidden", "190px")}
    ${screenshot("09c-emily-fresh-welcome.png", "Emily Rodriguez (new) — fresh section + welcome message", "190px")}
    ${screenshot("09d-sarah-fresh-rewards.png", "Sarah Chen (gold/family) — fresh section + rewards panel", "190px")}
  </div>

  <div class="callout">
    <p>
      <strong>What this demonstrates:</strong> A single boolean flag with one targeting rule
      produces three different outcomes for three different segments simultaneously.
      The server knows who each person is and assembles their page accordingly.
      The product manager typed one sentence.
    </p>
  </div>

  ${screenshot("09a-ai-creates-flag.png", "Control Room chat — AI creates the fresh section targeting rule in a single message", "160px")}
</div>

<!-- ══ PAGE 5: A/B TEST ════════════════════════════════════════ -->
<div class="page page-break">
  <div class="section-label">Demo 10 — Statistical Testing</div>
  <h1>A Full A/B Lifecycle in One Conversation</h1>

  <p>
    The same chat interface handles rigorous A/B tests with statistical significance reporting —
    and rolls out the winner. No data analyst. No engineer. Just conversation.
  </p>

  <table>
    <thead><tr><th>Turn</th><th>What the presenter types</th><th>What happens</th></tr></thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>"Create an A/B test for the deals layout — scroll vs. grid, 50/50 split."</td>
        <td>AI creates the experiment. Traffic split active immediately.</td>
      </tr>
      <tr>
        <td>2</td>
        <td>"Get the results for that experiment."</td>
        <td>AI retrieves conversion rates, uplift %, p-value, confidence interval. Grid wins at p &lt; 0.05.</td>
      </tr>
      <tr>
        <td>3</td>
        <td>"Roll out the winning variant to everyone."</td>
        <td>AI updates the rule to 100% grid. All users see the winner immediately.</td>
      </tr>
    </tbody>
  </table>

  <div class="screenshot-row">
    ${screenshot("10a-experiment-created.png", "Turn 1 — AI creates the A/B experiment with a 50/50 traffic split", "200px")}
    ${screenshot("10b-statistical-results.png", "Turn 2 — AI returns uplift, p-value, confidence interval, and rollout recommendation", "200px")}
  </div>

  <div class="screenshot-row">
    ${screenshot("10c-rollout-applied.png", "Turn 3 — AI rolls out the winning variant (grid) to all users", "200px")}
    ${screenshot("10d-sarah-grid-after-rollout.png", "Verification — Sarah Chen sees the grid after rollout is confirmed", "200px")}
  </div>

  <div class="callout callout-green">
    <p><strong>What this proves:</strong> Create, measure, decide, and deploy — the full experiment lifecycle —
    in a single conversation. The product manager never left the chat window.</p>
  </div>
</div>

<!-- ══ PAGE 6: ARCHITECTURE + TIMING ══════════════════════════ -->
<div class="page page-break">
  <div class="section-label">How It Works</div>
  <h1>The Architecture in Plain English</h1>

  <p>What happens each time the presenter types a message:</p>

  <table>
    <thead><tr><th>#</th><th>Step</th><th>Who / What</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>Product manager types a natural-language instruction</td><td>Control Room chat UI</td></tr>
      <tr><td>2</td><td>AI parses the intent and calls the flag management API</td><td>Claude (Anthropic) + 13 custom tools</td></tr>
      <tr><td>3</td><td>Flag is created or updated with the targeting rule</td><td>GrowthBook (Experimentation Engine)</td></tr>
      <tr><td>4</td><td>Customer signs in; their attributes sent to the Layout API</td><td>Browser → /api/demoapp2/layout</td></tr>
      <tr><td>5</td><td>Layout API evaluates all flags server-side, returns complete page layout as JSON</td><td>Next.js API route + GrowthBook Node SDK</td></tr>
      <tr><td>6</td><td>Browser renders exactly what the server returned — no experiment logic runs client-side</td><td>React (pure renderer)</td></tr>
    </tbody>
  </table>

  <div class="callout">
    <p>
      <strong>Zero experiment logic in the browser.</strong> Every decision — which banner, which sort order,
      which categories, whether a section appears — is made by the server. Adding a new experiment
      requires no React code changes and no frontend deployment.
    </p>
  </div>

  <h2>Questions to Hold in Mind</h2>

  <ul class="question-list">
    <li>
      <strong>How long from first message to live change on screen?</strong>
      <span>In every experiment it is under 60 seconds. Time it yourself.</span>
    </li>
    <li>
      <strong>Who is involved?</strong>
      <span>Only the product manager. No engineer wrote any code during the demo.</span>
    </li>
    <li>
      <strong>What is the rollback story?</strong>
      <span>One chat message to revert any flag. The page changes again in seconds.</span>
    </li>
    <li>
      <strong>Could this work on our actual product?</strong>
      <span>The architecture is stack-agnostic. Any modern app with server-side rendering can adopt it.</span>
    </li>
  </ul>

  <h2>Demo Timing — 20 Minutes</h2>

  <table class="timeline-row">
    <thead><tr><th>Time</th><th>Segment</th></tr></thead>
    <tbody>
      <tr><td>0:00</td><td>Open DemoApp2 — anonymous default page</td></tr>
      <tr><td>1:00</td><td>Demo 1: Global flag → instant layout change</td></tr>
      <tr><td>3:00</td><td>Demo 5: Gold member hero banner</td></tr>
      <tr><td>6:00</td><td>Demo 6: Frequent shopper deals grid</td></tr>
      <tr><td>9:00</td><td>Demo 7: Family category boost</td></tr>
      <tr><td>11:00</td><td>Demo 8: Regional price sort (California)</td></tr>
      <tr><td>13:00</td><td>Demo 9: Senior fresh section</td></tr>
      <tr><td>16:00</td><td>Demo 10: A/B test → statistical results → rollout</td></tr>
      <tr><td>19:00</td><td>Architecture overview + automated validation run</td></tr>
      <tr><td>20:00</td><td>Q&amp;A</td></tr>
    </tbody>
  </table>

  <h2>The One Sentence to Remember</h2>

  <div class="callout callout-green">
    <p style="font-size:12pt; font-weight:500; line-height:1.5;">
      "A product manager types a plain-English instruction. In under 60 seconds, every customer
      in that segment sees a different experience — with no code deployed, no engineer involved,
      and no page reload required."
    </p>
  </div>
</div>

<div class="footer-strip">
  Confidential &nbsp;·&nbsp; AI-Native Experimentation Platform &nbsp;·&nbsp; Please do not distribute
</div>

</body>
</html>`;

// ── Generate PDF ──────────────────────────────────────────────────────────
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle" });
await page.pdf({
  path: OUT_PDF,
  format: "A4",
  printBackground: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
});
await browser.close();

// Report screenshot status
const needed = [
  "01a-before-grid-layout.png",
  "01b-ai-creates-flag.png",
  "01c-after-large-image-layout.png",
  "05a-control-room-flag-created.png",
  "05b-sarah-gold-hero-banner.png",
  "05c-marcus-silver-carousel.png",
  "06b-sarah-frequent-grid.png",
  "06c-marcus-occasional-scroll.png",
  "07b-sarah-snacks-first.png",
  "07c-robert-meat-first.png",
  "08b-sarah-price-sorted-deals.png",
  "09a-ai-creates-flag.png",
  "09b-robert-no-fresh-section.png",
  "09c-emily-fresh-welcome.png",
  "09d-sarah-fresh-rewards.png",
  "10a-experiment-created.png",
  "10b-statistical-results.png",
  "10c-rollout-applied.png",
  "10d-sarah-grid-after-rollout.png",
];

console.log(`\n✅ PDF generated: ${OUT_PDF}`);
console.log(`\nEmbedded ${needed.filter(f => existsSync(join(SCREENSHOTS_DIR, f))).length}/${needed.length} screenshots:`);
for (const f of needed) {
  const found = existsSync(join(SCREENSHOTS_DIR, f));
  console.log(`  ${found ? "✅" : "⬜"} ${f}${found ? "" : " (placeholder)"}`);
}
