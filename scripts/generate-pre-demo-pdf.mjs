/**
 * generate-pre-demo-pdf.mjs
 *
 * Generates PRE-DEMO.pdf — portrait A4, one screenshot per line, no cropping.
 *
 * Run `pnpm test:demo` first to populate screenshots, then:
 *   node scripts/generate-pre-demo-pdf.mjs
 */

import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT       = resolve(__dirname, "..");
const SHOTS_DIR  = join(ROOT, "scripts", "screenshots", "demo");
const OUT_PDF    = join(ROOT, "PRE-DEMO.pdf");

function imgSrc(filename) {
  const p = join(SHOTS_DIR, filename);
  if (!existsSync(p)) return null;
  return `data:image/png;base64,${readFileSync(p).toString("base64")}`;
}

/** One full-width screenshot, natural aspect ratio — no cropping ever. */
function shot(filename, caption) {
  const src = imgSrc(filename);
  if (src) {
    return `
      <figure class="shot">
        <img src="${src}" alt="${caption}">
        <figcaption>${caption}</figcaption>
      </figure>`;
  }
  return `
    <figure class="shot placeholder">
      <div class="ph-inner">
        <span class="ph-icon">📸</span>
        <span class="ph-label">${caption}</span>
        <span class="ph-file">${filename}</span>
      </div>
    </figure>`;
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
/* ── Reset ─────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 10.5pt;
  line-height: 1.65;
  color: #1a202c;
  background: #fff;
}

/* ── Cover ─────────────────────────────────────────────── */
.cover {
  width: 100%; min-height: 100vh;
  display: flex; flex-direction: column;
  justify-content: center; align-items: flex-start;
  padding: 72px 72px;
  background: linear-gradient(145deg, #0f172a 0%, #1e3a5f 60%, #0d4a8a 100%);
  color: #fff;
  page-break-after: always;
}
.cover-eyebrow {
  font-size: 9pt; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: #93c5fd; margin-bottom: 28px;
}
.cover-title {
  font-size: 38pt; font-weight: 700;
  line-height: 1.1; letter-spacing: -0.02em;
  margin-bottom: 24px;
}
.cover-sub {
  font-size: 14pt; font-weight: 300; color: #bfdbfe;
  max-width: 480px; line-height: 1.55; margin-bottom: 56px;
}
.cover-divider {
  width: 44px; height: 3px;
  background: #3b82f6; border-radius: 2px; margin-bottom: 40px;
}
.cover-note { font-size: 10pt; color: #94a3b8; }
.cover-note strong { color: #cbd5e1; }

/* ── Page wrapper ───────────────────────────────────────── */
.page { padding: 52px 64px 56px; }

/* ── Chapter break ──────────────────────────────────────── */
.chapter { page-break-before: always; }

/* ── Typography ─────────────────────────────────────────── */
.eyebrow {
  font-size: 8pt; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: #3b82f6; margin-bottom: 8px;
}
h1 {
  font-size: 22pt; font-weight: 700;
  letter-spacing: -0.02em; color: #0f172a;
  margin-bottom: 16px;
}
h2 {
  font-size: 13pt; font-weight: 600; color: #0f172a;
  margin: 40px 0 10px;
  padding-bottom: 6px; border-bottom: 2px solid #e2e8f0;
}
h3 { font-size: 11pt; font-weight: 600; color: #1e3a5f; margin: 24px 0 6px; }
p  { margin-bottom: 12px; color: #374151; }
strong { color: #111827; }
.lead {
  font-size: 12pt; line-height: 1.65; font-weight: 300;
  color: #374151; margin-bottom: 16px;
}

/* ── Callouts ───────────────────────────────────────────── */
.callout {
  background: #eff6ff; border-left: 4px solid #3b82f6;
  border-radius: 0 8px 8px 0; padding: 14px 18px; margin: 20px 0;
}
.callout p { margin: 0; color: #1e40af; font-size: 10pt; }
.callout strong { color: #1e3a5f; }
.green { background: #f0fdf4; border-left-color: #22c55e; }
.green p { color: #15803d; }
.green strong { color: #14532d; }

/* ── Tables ─────────────────────────────────────────────── */
table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 9.5pt; }
thead th {
  background: #1e3a5f; color: #fff; font-weight: 600;
  padding: 8px 12px; text-align: left;
}
tbody tr:nth-child(even) { background: #f8fafc; }
tbody td {
  padding: 7px 12px; border-bottom: 1px solid #e2e8f0;
  vertical-align: top; color: #374151;
}
.time-col td:first-child { font-weight: 700; color: #3b82f6; white-space: nowrap; width: 60px; }

/* ── Experiment cards ───────────────────────────────────── */
.card {
  border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 14px 18px; margin: 14px 0;
  page-break-inside: avoid;
}
.card-hd { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
.num {
  width: 30px; height: 30px; background: #1e3a5f; color: #fff;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 11pt; font-weight: 700; flex-shrink: 0;
}
.card-title { font-size: 11pt; font-weight: 600; color: #0f172a; margin-bottom: 2px; }
.card-quote { font-size: 9pt; color: #6b7280; font-style: italic; }
.card-body { font-size: 9.5pt; color: #374151; margin-left: 42px; }
.card-body p { margin-bottom: 4px; }
.tag {
  display: inline-block; background: #eff6ff; color: #1d4ed8;
  border-radius: 4px; padding: 2px 7px; font-size: 8.5pt; font-weight: 600;
  margin: 0 4px 4px 0;
}

/* ── Questions ──────────────────────────────────────────── */
.qs { list-style: none; margin: 12px 0; }
.qs li {
  padding: 10px 12px 10px 40px; position: relative;
  border-bottom: 1px solid #f1f5f9;
}
.qs li::before {
  content: "?"; position: absolute; left: 10px; top: 10px;
  width: 20px; height: 20px; background: #dbeafe; color: #2563eb;
  border-radius: 50%; font-size: 10pt; font-weight: 700;
  text-align: center; line-height: 20px;
}
.qs li strong { display: block; font-size: 10pt; color: #0f172a; margin-bottom: 2px; }
.qs li span { font-size: 9pt; color: #4b5563; }

/* ── Screenshots ────────────────────────────────────────── */
/* One per line, full width, natural aspect ratio — never cropped */
.shot {
  margin: 20px 0;
  page-break-inside: avoid;
}
.shot img {
  width: 100%;
  height: auto;         /* natural ratio — NO cropping */
  display: block;
  border-radius: 7px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
}
figcaption {
  font-size: 8pt; color: #6b7280;
  margin-top: 5px; font-style: italic; text-align: center;
}
.placeholder {
  background: #f8fafc; border: 2px dashed #cbd5e1;
  border-radius: 8px; min-height: 120px;
  display: flex; align-items: center; justify-content: center;
}
.ph-inner { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.ph-icon  { font-size: 20pt; }
.ph-label { font-size: 10pt; font-weight: 600; color: #475569; }
.ph-file  { font-size: 8pt; color: #94a3b8; font-family: monospace; }

/* ── Footer ─────────────────────────────────────────────── */
.footer {
  background: #0f172a; color: #94a3b8;
  font-size: 9pt; text-align: center; padding: 12px; margin-top: 48px;
}
</style>
</head>
<body>

<!-- ═══════════════════════════════════════
     COVER
═══════════════════════════════════════ -->
<div class="cover">
  <div class="cover-eyebrow">Confidential — Pre-Read</div>
  <div class="cover-title">AI-Native<br>Experimentation<br>Platform</div>
  <div class="cover-sub">
    From idea to live customer experiment in under 60 seconds —
    using nothing but a chat window.
  </div>
  <div class="cover-divider"></div>
  <div class="cover-note">
    <strong>Please read before the demo session.</strong><br>
    This document sets context so you can watch for the right moments during the live walkthrough.
  </div>
</div>

<!-- ═══════════════════════════════════════
     PAGE 1: MEET THE APPS
═══════════════════════════════════════ -->
<div class="page">
  <div class="eyebrow">The Two Apps You'll See</div>
  <h1>Meet the Platform</h1>

  <p class="lead">
    The demo runs across two apps that work together. Understanding each one up front will help
    you follow the live walkthrough without losing the thread.
  </p>

  <h2>DemoApp2 — The Safeway Grocery Experience</h2>
  <p>
    This is the customer-facing app. It looks and feels like a real grocery store —
    hero banners, weekly deals, product categories, fresh produce sections.
    What's hidden from customers is that <strong>the server assembles the entire page layout
    on every request</strong>, evaluating who the user is before returning a single pixel.
    No experiment logic runs in the browser. The page simply renders what the server sends.
  </p>

  ${shot("00-demoapp2-overview.png", "DemoApp2 — the Safeway grocery app. Every section, sort order, and banner is decided server-side based on user attributes.")}

  <h2>Control Room — The AI-Powered Interface</h2>
  <p>
    This is where the product manager works. A split-panel view: the left panel shows all
    live feature flags and experiments at a glance; the right panel is a chat window connected
    to an AI with 13 custom tools wired directly to the experimentation engine.
    The presenter never opens a dashboard, never edits a YAML file, never asks an engineer.
    <strong>Every experiment in the demo is created by typing a sentence here.</strong>
  </p>

  ${shot("00-control-room-overview.png", "Control Room — left panel shows live flags and experiments; right panel is the AI chat. Everything the presenter does happens in this window.")}

  <div class="callout">
    <p><strong>The connection:</strong> When the product manager types in the Control Room,
    the AI updates a flag in the experimentation engine. The next time a customer loads
    DemoApp2, the server reads the updated flag and sends a different page layout.
    That is the entire loop — and it completes in under 60 seconds.</p>
  </div>
</div>

<!-- ═══════════════════════════════════════
     PAGE 2: THE STORY
═══════════════════════════════════════ -->
<div class="page chapter">
  <div class="eyebrow">The Problem We Solved</div>
  <h1>Experiments Shouldn't Take Three Weeks</h1>

  <p class="lead">
    Today, running a customer experiment looks like this: a product manager writes a spec,
    an engineer deploys new code, a data scientist interprets the numbers, and three weeks later
    there's a meeting to decide if it worked.
  </p>

  <div class="callout">
    <p><strong>We built something different.</strong> A product manager types a plain-English
    instruction into a chat window. An AI creates the experiment, sets the targeting rule, and
    the live app immediately serves a different experience to the right customers.
    No code written. No deployment pipeline. No engineer in the room.</p>
  </div>

  <p>
    During this demo you will watch a product manager take a grocery app from
    <em>zero personalization</em> to <em>five live customer segments</em>, then run a full
    A/B statistical test and roll out the winner — entirely through conversation.
  </p>

  <h2>Before — Default Layout (No Flags Active)</h2>

  ${shot("01a-before-grid-layout.png", "DemoApp1 — default grid layout. Every customer sees the same page.")}

  <h2>One Chat Message Later</h2>

  ${shot("01b-ai-creates-flag.png", "Control Room chat — AI creates the feature flag and confirms the change.")}

  ${shot("01c-after-large-image-layout.png", "DemoApp1 — large-image layout. Same URL, different experience. No code deployed.")}

  <div class="callout green">
    <p><strong>The 60-second proof:</strong> Watch the timestamp from the first chat message to the
    moment the live app shows a different experience. In every demo scenario it is under 60 seconds.
    No engineer involved. No code deployed.</p>
  </div>
</div>

<!-- ═══════════════════════════════════════
     PAGE 2: PERSONAS
═══════════════════════════════════════ -->
<div class="page chapter">
  <div class="eyebrow">Who You'll See</div>
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
    <strong>The insight to watch for:</strong> These six people visit the same URL. The server reads
    their attributes and assembles a completely different page for each. The product manager
    configured all of this through natural language. The engineering team wrote the app once
    and never touched it again.
  </p>

  <h2>Experiment 1 — Gold Member Hero Banner</h2>
  <p>One targeting rule: serve "member-rewards" to users where membership_tier = gold.
  Two completely different hero experiences, live for every user in those segments.</p>

  ${shot("05b-sarah-gold-hero-banner.png", "Sarah Chen (Gold) — premium hero with gold gradient overlay and 'Gold Member Exclusive' pill.")}

  ${shot("05c-marcus-silver-carousel.png", "Marcus Johnson (Silver) — standard carousel. Not targeted by the rule.")}

  ${shot("05a-control-room-flag-created.png", "Control Room chat — the AI creates the flag and targeting rule in one message.")}
</div>

<!-- ═══════════════════════════════════════
     PAGE 3: FIVE EXPERIMENTS
═══════════════════════════════════════ -->
<div class="page chapter">
  <div class="eyebrow">Live During the Demo</div>
  <h1>Five Personalization Experiments</h1>

  <p>
    Each experiment is created live, through chat. The presenter types one message;
    the AI calls the API; the app changes immediately.
  </p>

  <div class="card">
    <div class="card-hd">
      <div class="num">1</div>
      <div>
        <div class="card-title">Gold Member Hero Banner</div>
        <div class="card-quote">"Gold members should feel recognized the moment they land."</div>
      </div>
    </div>
    <div class="card-body">
      <span class="tag">membership_tier = gold</span>
      <p>Gold members see a premium hero with gold gradient overlay and "Gold Member Exclusive" pill.
      Silver and Basic members see the standard carousel — they were never targeted.</p>
    </div>
  </div>

  <div class="card">
    <div class="card-hd">
      <div class="num">2</div>
      <div>
        <div class="card-title">Frequent Shopper Deals Grid</div>
        <div class="card-quote">"Frequent shoppers scan fast. Give them density."</div>
      </div>
    </div>
    <div class="card-body">
      <span class="tag">shopping_behavior = frequent</span>
      <p>Frequent shoppers see weekly deals as a dense 2-column grid.
      Occasional and new shoppers see a horizontal scroll strip.
      Same URL, same codebase — the server decides the layout.</p>
    </div>
  </div>

  <div class="card">
    <div class="card-hd">
      <div class="num">3</div>
      <div>
        <div class="card-title">Family Category Boost</div>
        <div class="card-quote">"Families buy snacks. Surface snacks first."</div>
      </div>
    </div>
    <div class="card-body">
      <span class="tag">household_type = family</span>
      <p>Family households see "Snacks & Chips" first. Seniors see "Meat & Seafood" first.
      The server reorders 16 categories in real time — one rule, two completely different
      navigation experiences.</p>
    </div>
  </div>

  <div class="card">
    <div class="card-hd">
      <div class="num">4</div>
      <div>
        <div class="card-title">Regional Price Sort</div>
        <div class="card-quote">"California shoppers are price-sensitive."</div>
      </div>
    </div>
    <div class="card-body">
      <span class="tag">location = CA</span>
      <p>Weekly deals for California users are sorted lowest-price-first.
      All other states see popularity-sorted deals. One flag, one rule, regional behavior —
      no new code.</p>
    </div>
  </div>

  <div class="card">
    <div class="card-hd">
      <div class="num">5</div>
      <div>
        <div class="card-title">Senior Fresh Section</div>
        <div class="card-quote">"Control what every senior sees — instantly."</div>
      </div>
    </div>
    <div class="card-body">
      <span class="tag">household_type = senior</span>
      <p>The fresh produce section is shown or hidden for seniors via a single chat message.
      The flag change takes effect server-side on the next request — no page reload needed.</p>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════
     PAGE 4: EXPERIMENT SCREENSHOTS
═══════════════════════════════════════ -->
<div class="page chapter">
  <div class="eyebrow">Experiment 2 in Action</div>
  <h1>Frequent vs. Occasional Shopper</h1>
  <p>Same page, same URL. The server decides the layout based on shopping_behavior.</p>

  ${shot("06b-sarah-frequent-grid.png", "Sarah Chen (frequent) — dense 2-column deals grid. More products visible at a glance.")}

  ${shot("06c-marcus-occasional-scroll.png", "Marcus Johnson (occasional) — horizontal scroll strip. Easier to browse without overwhelm.")}

  <h2>Experiment 3 — Family vs. Senior Category Order</h2>
  <p>The server reorders 16 category tiles in real time based on household_type.</p>

  ${shot("07b-sarah-snacks-first.png", "Sarah Chen (family household) — Snacks & Chips boosted to first position.")}

  ${shot("07c-robert-meat-first.png", "Robert Williams (senior household) — Meat & Seafood surfaced first.")}
</div>

<!-- ═══════════════════════════════════════
     PAGE 5: EXPERIMENTS 4 & 5
═══════════════════════════════════════ -->
<div class="page chapter">
  <div class="eyebrow">More Experiments</div>
  <h1>Regional Targeting &amp; Section Control</h1>

  <h2>Experiment 4 — California Price Sort</h2>
  <p>Sarah Chen (California) sees weekly deals sorted cheapest first.
  Marcus Johnson (New York) sees popularity order. One flag — regional behavior, no code.</p>

  ${shot("08b-sarah-price-sorted-deals.png", "Sarah Chen (CA) — deals sorted by price, lowest first. Gold title: 'Your Exclusive Deals'.")}

  <h2>Experiment 5 — Senior Fresh Section Control</h2>
  <p>A single boolean flag with one targeting rule produces three different outcomes
  for three different segments simultaneously.</p>

  ${shot("09b-robert-no-fresh-section.png", "Robert Williams (senior) — fresh section is hidden. The section is simply absent from his layout.")}

  ${shot("09c-emily-fresh-welcome.png", "Emily Rodriguez (new shopper) — fresh section visible with a personalised welcome message.")}

  ${shot("09d-sarah-fresh-rewards.png", "Sarah Chen (gold/family) — fresh section visible with her rewards panel. No welcome message.")}

  ${shot("09a-ai-creates-flag.png", "Control Room chat — AI creates the fresh section targeting rule in a single message.")}

  <div class="callout">
    <p><strong>What this demonstrates:</strong> One sentence from the product manager.
    Three completely different experiences for three segments. The server assembles each
    customer's page from scratch on every request.</p>
  </div>
</div>

<!-- ═══════════════════════════════════════
     PAGE 6: A/B TEST
═══════════════════════════════════════ -->
<div class="page chapter">
  <div class="eyebrow">Demo 10 — Statistical Testing</div>
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

  ${shot("10a-experiment-created.png", "Turn 1 — AI creates the A/B experiment with a 50/50 traffic split.")}

  ${shot("10b-statistical-results.png", "Turn 2 — AI returns: +72% relative uplift · 97.8% confidence · p = 0.028 · statistically significant.")}

  ${shot("10c-rollout-applied.png", "Turn 3 — AI applies a force rule to send 100% of frequent shoppers to the winning grid variant.")}

  ${shot("10d-sarah-grid-after-rollout.png", "Verification — Sarah Chen sees the deals grid after rollout. The winning variant is live for all users.")}

  <div class="callout green">
    <p><strong>What this proves:</strong> Create, measure, decide, and deploy — the full experiment
    lifecycle — in a single conversation. The product manager never left the chat window.</p>
  </div>
</div>

<!-- ═══════════════════════════════════════
     PAGE 7: ARCHITECTURE + TIMING
═══════════════════════════════════════ -->
<div class="page chapter">
  <div class="eyebrow">How It Works</div>
  <h1>The Architecture in Plain English</h1>

  <p>What happens each time the presenter types a message:</p>

  <table>
    <thead><tr><th>#</th><th>Step</th><th>Who / What</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>Product manager types a natural-language instruction</td><td>Control Room chat UI</td></tr>
      <tr><td>2</td><td>AI parses the intent and calls the flag management API</td><td>Claude (Anthropic) + 13 custom tools</td></tr>
      <tr><td>3</td><td>Flag is created or updated with the targeting rule</td><td>GrowthBook (Experimentation Engine)</td></tr>
      <tr><td>4</td><td>Customer signs in; attributes sent to the Layout API</td><td>Browser → /api/demoapp2/layout</td></tr>
      <tr><td>5</td><td>Layout API evaluates all flags server-side, returns complete page layout as JSON</td><td>Next.js + GrowthBook Node SDK</td></tr>
      <tr><td>6</td><td>Browser renders exactly what the server returned — no experiment logic runs client-side</td><td>React (pure renderer)</td></tr>
    </tbody>
  </table>

  <div class="callout">
    <p><strong>Zero experiment logic in the browser.</strong> Every decision — which banner,
    which sort order, which categories, whether a section appears — is made by the server.
    Adding a new experiment requires no React code changes and no frontend deployment.</p>
  </div>

  <h2>Questions to Hold in Mind During the Demo</h2>

  <ul class="qs">
    <li>
      <strong>How long from first message to live change on screen?</strong>
      <span>Under 60 seconds in every experiment. Time it yourself.</span>
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

  <table class="time-col">
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

  <div class="callout green">
    <p style="font-size:12pt; font-weight:500; line-height:1.55;">
      "A product manager types a plain-English instruction. In under 60 seconds, every customer
      in that segment sees a different experience — with no code deployed, no engineer involved,
      and no page reload required."
    </p>
  </div>
</div>

<div class="footer">
  Confidential &nbsp;·&nbsp; AI-Native Experimentation Platform &nbsp;·&nbsp; Please do not distribute
</div>

</body>
</html>`;

const browser = await chromium.launch();
const page    = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle" });
await page.pdf({
  path: OUT_PDF,
  format: "A4",          // portrait by default
  printBackground: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
});
await browser.close();

const needed = [
  "00-demoapp2-overview.png","00-control-room-overview.png",
  "01a-before-grid-layout.png","01b-ai-creates-flag.png","01c-after-large-image-layout.png",
  "05a-control-room-flag-created.png","05b-sarah-gold-hero-banner.png","05c-marcus-silver-carousel.png",
  "06b-sarah-frequent-grid.png","06c-marcus-occasional-scroll.png",
  "07b-sarah-snacks-first.png","07c-robert-meat-first.png",
  "08b-sarah-price-sorted-deals.png",
  "09a-ai-creates-flag.png","09b-robert-no-fresh-section.png",
  "09c-emily-fresh-welcome.png","09d-sarah-fresh-rewards.png",
  "10a-experiment-created.png","10b-statistical-results.png",
  "10c-rollout-applied.png","10d-sarah-grid-after-rollout.png",
];
const found = needed.filter(f => existsSync(join(SHOTS_DIR, f))).length;
console.log(`\n✅ PRE-DEMO.pdf generated (${found}/${needed.length} screenshots embedded)`);
for (const f of needed)
  console.log(`  ${existsSync(join(SHOTS_DIR, f)) ? "✅" : "⬜"} ${f}`);
