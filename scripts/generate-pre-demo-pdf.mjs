/**
 * generate-pre-demo-pdf.mjs
 *
 * Generates PRE-DEMO.pdf using Playwright's chromium renderer.
 * Screenshots from screenshots/demo/ are embedded if they exist;
 * otherwise clean placeholder boxes are shown.
 *
 * Usage: node scripts/generate-pre-demo-pdf.mjs
 */

import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import { resolve, join } from "path";

const ROOT = resolve(import.meta.dirname, "..");
const SCREENSHOTS_DIR = join(ROOT, "screenshots", "demo");
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

/** Render either an <img> or a styled placeholder. */
function screenshot(filename, caption, height = "220px") {
  const src = imgSrc(filename);
  if (src) {
    return `
      <figure class="screenshot-block">
        <img src="${src}" alt="${caption}" style="width:100%;height:${height};object-fit:cover;border-radius:6px;border:1px solid #e2e8f0;">
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
  /* ─── Reset & base ──────────────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif;
    font-size: 11pt;
    line-height: 1.65;
    color: #1a202c;
    background: #fff;
  }

  /* ─── Cover page ────────────────────────────────────────── */
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
    width: 48px;
    height: 3px;
    background: #3b82f6;
    border-radius: 2px;
    margin-bottom: 40px;
  }
  .cover-meta {
    font-size: 10pt;
    color: #94a3b8;
  }
  .cover-meta strong { color: #cbd5e1; }

  /* ─── Content pages ─────────────────────────────────────── */
  .page {
    padding: 56px 72px 64px;
    max-width: 800px;
    margin: 0 auto;
  }

  /* ─── Section headers ───────────────────────────────────── */
  .section-label {
    font-size: 8.5pt;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #3b82f6;
    margin-bottom: 8px;
  }
  h1 {
    font-size: 22pt;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #0f172a;
    margin-bottom: 12px;
  }
  h2 {
    font-size: 15pt;
    font-weight: 600;
    color: #0f172a;
    margin-top: 40px;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 2px solid #e2e8f0;
  }
  h3 {
    font-size: 12pt;
    font-weight: 600;
    color: #1e3a5f;
    margin-top: 28px;
    margin-bottom: 8px;
  }
  p {
    margin-bottom: 14px;
    color: #374151;
  }
  strong { color: #111827; }

  /* ─── Lead text ─────────────────────────────────────────── */
  .lead {
    font-size: 13pt;
    line-height: 1.6;
    color: #374151;
    font-weight: 300;
    margin-bottom: 20px;
  }

  /* ─── Callout box ───────────────────────────────────────── */
  .callout {
    background: #eff6ff;
    border-left: 4px solid #3b82f6;
    border-radius: 0 8px 8px 0;
    padding: 16px 20px;
    margin: 24px 0;
  }
  .callout p { margin-bottom: 0; color: #1e40af; font-size: 10.5pt; }
  .callout strong { color: #1e3a5f; }

  .callout-green {
    background: #f0fdf4;
    border-left-color: #22c55e;
  }
  .callout-green p { color: #15803d; }
  .callout-green strong { color: #14532d; }

  /* ─── Table ─────────────────────────────────────────────── */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    font-size: 9.5pt;
  }
  thead th {
    background: #1e3a5f;
    color: #fff;
    font-weight: 600;
    padding: 9px 12px;
    text-align: left;
    letter-spacing: 0.02em;
  }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody td {
    padding: 8px 12px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: top;
    color: #374151;
  }

  /* ─── Numbered experiment cards ─────────────────────────── */
  .exp-card {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 20px 24px;
    margin: 20px 0;
    page-break-inside: avoid;
  }
  .exp-card-header {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 12px;
  }
  .exp-number {
    width: 36px;
    height: 36px;
    background: #1e3a5f;
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13pt;
    font-weight: 700;
    flex-shrink: 0;
    line-height: 1;
    padding-top: 1px;
  }
  .exp-card-title { font-size: 12pt; font-weight: 600; color: #0f172a; margin-bottom: 2px; }
  .exp-card-quote { font-size: 9.5pt; color: #6b7280; font-style: italic; }
  .exp-card-body { font-size: 10pt; color: #374151; margin-left: 52px; }
  .exp-card-body p { margin-bottom: 6px; }
  .exp-tag {
    display: inline-block;
    background: #eff6ff;
    color: #1d4ed8;
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 8.5pt;
    font-weight: 600;
    margin-right: 4px;
    margin-bottom: 4px;
  }

  /* ─── Screenshot placeholders ───────────────────────────── */
  .screenshot-block {
    margin: 20px 0;
    page-break-inside: avoid;
  }
  .placeholder {
    background: #f8fafc;
    border: 2px dashed #cbd5e1;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .placeholder-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .placeholder-icon { font-size: 24pt; }
  .placeholder-label { font-size: 10pt; font-weight: 600; color: #475569; }
  .placeholder-hint { font-size: 8pt; color: #94a3b8; font-family: monospace; }
  figcaption {
    font-size: 8.5pt;
    color: #6b7280;
    margin-top: 6px;
    font-style: italic;
    text-align: center;
  }

  /* ─── Two-column screenshot grid ─────────────────────────── */
  .screenshot-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin: 20px 0;
  }

  /* ─── Timeline table ─────────────────────────────────────── */
  .timeline-row td:first-child {
    font-weight: 600;
    color: #3b82f6;
    white-space: nowrap;
    width: 56px;
  }

  /* ─── Question list ──────────────────────────────────────── */
  .question-list { list-style: none; margin: 16px 0; }
  .question-list li {
    padding: 12px 16px 12px 44px;
    position: relative;
    border-bottom: 1px solid #f1f5f9;
  }
  .question-list li::before {
    content: "?";
    position: absolute;
    left: 14px;
    top: 12px;
    width: 22px;
    height: 22px;
    background: #dbeafe;
    color: #2563eb;
    border-radius: 50%;
    font-size: 11pt;
    font-weight: 700;
    text-align: center;
    line-height: 22px;
  }
  .question-list li strong { display: block; margin-bottom: 2px; font-size: 10.5pt; color: #0f172a; }
  .question-list li span { font-size: 9.5pt; color: #4b5563; }

  /* ─── Page break utility ─────────────────────────────────── */
  .page-break { page-break-before: always; }

  /* ─── Footer strip ───────────────────────────────────────── */
  .footer-strip {
    background: #0f172a;
    color: #94a3b8;
    font-size: 9pt;
    text-align: center;
    padding: 14px;
    margin-top: 48px;
  }
</style>
</head>
<body>

<!-- ══════════════════════════════════════════════════════════
     COVER
═══════════════════════════════════════════════════════════ -->
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

<!-- ══════════════════════════════════════════════════════════
     PAGE 1: THE STORY
═══════════════════════════════════════════════════════════ -->
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
    immediately serves a different experience to the right customers. The product manager never
    writes code, never opens a deployment pipeline, and never needs an engineer in the room.</p>
  </div>

  <p>
    During this demo you will watch a product manager — played by the presenter — take a grocery app
    from <em>zero personalization</em> to <em>five live customer segments</em>, then run a full
    A/B statistical test and roll out the winner, entirely through conversation.
  </p>

  <h2>What You Will See</h2>

  <p>
    The demo runs on a simulated Safeway-style grocery app. Six simulated customers — each
    representing a real segment — visit the same URL. The server reads their attributes
    (loyalty tier, location, shopping frequency, household type) and assembles a completely
    different page for each one. No browser-side logic. No separate codebases. One app,
    infinite personalizations, all configured by chat.
  </p>

  ${screenshot("01a-before-grid.png", "DemoApp2 — anonymous visitor, default page (no flags set)", "200px")}

  <div class="callout callout-green">
    <p><strong>The 60-second proof:</strong> Watch the timestamp from the first chat message to the moment
    the live app shows a different experience for a targeted user. In every demo scenario, it is under 60 seconds.
    No engineer was involved. No code was deployed.</p>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════
     PAGE 2: THE PERSONAS
═══════════════════════════════════════════════════════════ -->
<div class="page page-break">
  <div class="section-label">Who You'll See</div>
  <h1>Six Customer Personas</h1>

  <p>
    Each persona represents a real customer segment. Their attributes drive every experiment.
    Switching personas in the app instantly shows what that segment experiences.
  </p>

  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Tier</th>
        <th>Location</th>
        <th>Shopping</th>
        <th>Household</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Sarah Chen</strong></td>
        <td>Gold</td>
        <td>California</td>
        <td>Frequent</td>
        <td>Family</td>
      </tr>
      <tr>
        <td><strong>Marcus Johnson</strong></td>
        <td>Silver</td>
        <td>New York</td>
        <td>Occasional</td>
        <td>Couple</td>
      </tr>
      <tr>
        <td><strong>Emily Rodriguez</strong></td>
        <td>Basic</td>
        <td>Illinois</td>
        <td>New</td>
        <td>Single</td>
      </tr>
      <tr>
        <td><strong>Robert Williams</strong></td>
        <td>Gold</td>
        <td>Oregon</td>
        <td>Frequent</td>
        <td>Senior</td>
      </tr>
      <tr>
        <td><strong>Jordan Lee</strong></td>
        <td>Silver</td>
        <td>Texas</td>
        <td>Frequent</td>
        <td>Couple</td>
      </tr>
      <tr>
        <td><strong>Priya Patel</strong></td>
        <td>Gold</td>
        <td>Washington</td>
        <td>Frequent</td>
        <td>Single</td>
      </tr>
    </tbody>
  </table>

  <p>
    <strong>Why this matters:</strong> These six people visit the same URL.
    The server evaluates each flag against their attributes and assembles a unique page layout — in real time —
    for each one. There is no frontend code for each segment. There is no separate deployment.
    The product manager added a targeting rule and it was live instantly.
  </p>

  <div class="screenshot-row">
    ${screenshot("05c-gold-hero.png", "Sarah Chen (Gold) — premium hero banner", "190px")}
    ${screenshot("05d-silver-hero.png", "Marcus Johnson (Silver) — standard carousel", "190px")}
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════
     PAGE 3: THE FIVE EXPERIMENTS
═══════════════════════════════════════════════════════════ -->
<div class="page page-break">
  <div class="section-label">Live During the Demo</div>
  <h1>Five Personalization Experiments</h1>

  <p>
    Each experiment below is created live, through chat, during the demo.
    The presenter types one message; the AI calls the API; the app changes immediately.
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
      <p>Gold members see a premium hero banner with a gold gradient overlay, loyalty points callout, and "Gold Member Exclusive" pill. Silver and Basic members see the standard carousel — they are never targeted.</p>
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
      <p>Frequent shoppers see weekly deals as a dense 2-column grid — more products visible at once. Occasional and new shoppers see a horizontal scroll strip — easier to browse without overwhelm.</p>
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
      <p>Family households see "Snacks &amp; Chips" as the first category tile — boosted because families with kids buy snacks frequently. Senior households see "Meat &amp; Seafood" first. The server reorders 16 categories in real time.</p>
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
      <p>Weekly deals for California users are sorted lowest-price-first. New York and other states continue to see popularity-sorted deals. One flag, one rule — regional behavior without a single line of new code.</p>
    </div>
  </div>

  <div class="exp-card">
    <div class="exp-card-header">
      <div class="exp-number">5</div>
      <div>
        <div class="exp-card-title">Senior Fresh Section</div>
        <div class="exp-card-quote">"Control what every senior sees — instantly, for everyone."</div>
      </div>
    </div>
    <div class="exp-card-body">
      <span class="exp-tag">household_type = senior</span>
      <p>The fresh produce section can be shown or hidden for senior users via a single chat message. Robert Williams (the only senior persona) toggles between seeing and not seeing the section — no page reload needed for the flag change to take effect.</p>
    </div>
  </div>

  <div class="screenshot-row">
    ${screenshot("06c-frequent-grid.png", "Sarah Chen — dense deals grid (frequent shopper)", "190px")}
    ${screenshot("06d-occasional-scroll.png", "Marcus Johnson — horizontal scroll deals (occasional)", "190px")}
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════
     PAGE 4: THE A/B TEST
═══════════════════════════════════════════════════════════ -->
<div class="page page-break">
  <div class="section-label">Demo 10 — Statistical Testing</div>
  <h1>A Full A/B Lifecycle in One Conversation</h1>

  <p>
    After the five targeting experiments, the demo shows that the same platform also handles
    rigorous A/B testing with statistical significance — all through the same chat interface.
  </p>

  <h3>The Conversation Flow</h3>

  <table>
    <thead>
      <tr><th>Turn</th><th>What the presenter types</th><th>What happens</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>"Create an A/B test for the deals layout — scroll vs. grid, 50/50 split."</td>
        <td>AI calls the API. Experiment created. Traffic split active.</td>
      </tr>
      <tr>
        <td>2</td>
        <td>"Get the results for that experiment."</td>
        <td>AI retrieves conversion rates, uplift %, p-value, and confidence interval. Grid wins at p &lt; 0.05.</td>
      </tr>
      <tr>
        <td>3</td>
        <td>"Roll out the winning variant to everyone."</td>
        <td>AI updates the targeting rule to 100% grid. All users immediately see the winner.</td>
      </tr>
      <tr>
        <td>4</td>
        <td>(Presenter signs in as three personas)</td>
        <td>All three personas see the grid — the rollout is confirmed live on screen.</td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-green">
    <p><strong>What this proves:</strong> Create, measure, decide, and deploy — the full experiment lifecycle —
    in a single conversation. No data analyst needed to read the results.
    No engineer needed to push the rollout. The AI does all of it.</p>
  </div>

  ${screenshot("10c-ab-results.png", "Control Room chat — A/B results with statistical significance", "220px")}

  <h2>What You Should Watch For</h2>

  <ul class="question-list">
    <li>
      <strong>How long from first message to live change on screen?</strong>
      <span>In every experiment, it is under 60 seconds. Time it yourself.</span>
    </li>
    <li>
      <strong>Who is involved?</strong>
      <span>Only the product manager. No engineer wrote any code during the demo. No deployment ran.</span>
    </li>
    <li>
      <strong>What is the rollback story?</strong>
      <span>The presenter can send one more chat message to revert any flag. Watch the page change again.</span>
    </li>
    <li>
      <strong>How confident can we be in A/B results?</strong>
      <span>The platform reports p-value, confidence interval, and absolute uplift — standard statistical outputs — directly in the chat response.</span>
    </li>
    <li>
      <strong>Could this work on our actual product?</strong>
      <span>The architecture is stack-agnostic. Server-side evaluation + pure-renderer components + AI-mediated flag management applies to any modern web app.</span>
    </li>
  </ul>
</div>

<!-- ══════════════════════════════════════════════════════════
     PAGE 5: ARCHITECTURE + TIMING
═══════════════════════════════════════════════════════════ -->
<div class="page page-break">
  <div class="section-label">How It Works</div>
  <h1>The Architecture in Plain English</h1>

  <p>You don't need to understand the code to understand the architecture. Here is what happens each time the presenter types a message:</p>

  <table>
    <thead>
      <tr><th>#</th><th>Step</th><th>Who/What does it</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>Product manager types a natural-language instruction</td>
        <td>Control Room chat UI</td>
      </tr>
      <tr>
        <td>2</td>
        <td>AI parses the intent and calls the flag management API</td>
        <td>Claude (Anthropic) + 13 custom tools</td>
      </tr>
      <tr>
        <td>3</td>
        <td>Flag is created or updated with the targeting rule</td>
        <td>GrowthBook (our Experimentation Engine)</td>
      </tr>
      <tr>
        <td>4</td>
        <td>Customer signs in; attributes sent to Layout API</td>
        <td>DemoApp2 browser → /api/demoapp2/layout</td>
      </tr>
      <tr>
        <td>5</td>
        <td>Layout API evaluates all flags server-side and returns a complete page layout as JSON</td>
        <td>Node.js server (Next.js API route)</td>
      </tr>
      <tr>
        <td>6</td>
        <td>Browser renders exactly what the server returned — no experiment logic runs client-side</td>
        <td>React (pure renderer)</td>
      </tr>
    </tbody>
  </table>

  <div class="callout">
    <p>
      <strong>Zero experiment logic in the browser.</strong> Every decision about what a customer sees —
      which banner, which sort order, which categories, whether a section is visible — is made by the server.
      The browser is a pure renderer. This is why adding a new experiment requires no React code changes
      and no frontend deployment.
    </p>
  </div>

  <h2>Demo Timing</h2>

  <table class="timeline-row">
    <thead>
      <tr><th>Time</th><th>Segment</th></tr>
    </thead>
    <tbody>
      <tr><td>0:00</td><td>Open DemoApp2 — show anonymous default page</td></tr>
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

// ── Generate PDF ────────────────────────────────────────────────────────────
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
console.log(`✅ PDF generated: ${OUT_PDF}`);
