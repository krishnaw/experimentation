# Before the Demo: AI-Native Experimentation Platform

*Send this to your audience 24–48 hours before the session.*

---

## What You're About to See

Most software experiments work like this: a product manager has an idea, writes a spec, an engineer deploys new code, a data scientist runs the analysis, and three weeks later there's a meeting to decide if it worked.

We built something different.

**What you'll see in this demo:** A product manager — using nothing but a chat window — instructs an AI to change what a live grocery app shows to each customer segment. The change takes effect in under 60 seconds. The product manager never writes code, never talks to an engineer, and never touches a deployment pipeline.

Then the AI runs an A/B test, reads the statistical results, and rolls out the winning variant — entirely through conversation.

---

## The App You'll See

The demo runs on a simulated Safeway-style grocery app. You'll see it in three states:

**Anonymous visitor** — default experience, no personalization.

**Signed in as a Gold member** — premium hero banner with a gold gradient overlay and "Gold Member Exclusive" pill. The weekly deals section shows a dense grid (more products visible). The navigation categories are reordered to put the most relevant ones first.

**Signed in as a different tier or behavior profile** — a completely different layout. Same URL, same codebase, same page — different experience.

The product manager creates all of this from a single chat window. No new code is written. No server is restarted.

---

## The Six Personas

The demo uses six simulated customers. Each represents a real segment your platform would target:

| Name | Tier | Profile | What they see |
|------|------|---------|---------------|
| **Sarah Chen** | Gold | CA, frequent shopper, family | Premium hero banner · dense deals grid · snacks surfaced first in categories |
| **Marcus Johnson** | Silver | NY, occasional shopper, couple | Standard carousel · horizontal scroll deals · default category order |
| **Emily Rodriguez** | Basic | IL, new shopper, single | Standard carousel · horizontal scroll deals · default category order + welcome message |
| **Robert Williams** | Gold | OR, frequent shopper, senior | Premium hero banner · dense deals grid · fresh produce section hidden (senior preference) |
| **Jordan Lee** | Silver | TX, frequent shopper, couple | Standard carousel · dense deals grid (frequent behavior) · default categories |
| **Priya Patel** | Gold | WA, frequent shopper, single | Premium hero banner · dense deals grid · default categories |

**The insight to watch for:** These six people visit the same URL. The server reads their attributes — tier, location, shopping frequency, household type — and assembles a completely different page for each. The product manager configured all of this through natural language. The engineering team wrote the app once and never touched it again.

---

## The Five Personalization Experiments

Each experiment is a single feature flag with a targeting rule. The AI creates each one on the spot during the demo.

### 1. Gold Member Hero Banner
*"Gold members should feel recognized the moment they land."*

A chat message creates a flag: serve a premium banner variant to anyone with `membership_tier = gold`. Gold members immediately see a different hero section with a gold gradient, a loyalty points callout, and an exclusive CTA. Silver and Basic members see the standard carousel — they were never targeted.

### 2. Frequent Shopper Deals Grid
*"Frequent shoppers scan fast. Give them density."*

A chat message creates a flag: serve a grid layout to anyone with `shopping_behavior = frequent`. Frequent shoppers see a 2-column product grid — more deals visible without scrolling. Occasional and new shoppers see a horizontal strip — easier to browse without overwhelming them.

### 3. Family Category Boost
*"Families buy snacks. Surface snacks first."*

A chat message creates a flag: reorder the category navigation for family households. Sarah Chen (family) sees Snacks & Chips as the first tile. Robert Williams (senior) sees Meat & Seafood first. The server reorders 16 categories in real time based on a single attribute.

### 4. Regional Price Sort
*"California shoppers are price-sensitive. Sort by price for them."*

A chat message creates a flag: sort weekly deals by price (lowest first) for users in California. Sarah Chen's deals section changes order immediately. Marcus Johnson in New York still sees deals sorted by popularity.

### 5. Senior Fresh Section
*"Seniors prefer fresh produce. Show it prominently — or hide it if we know they don't engage."*

A chat message controls whether the fresh produce section appears at all for senior users. Robert Williams is the only senior persona — switching this flag on or off changes his page in real time.

---

## The A/B Statistical Test (Demo 10)

After the five targeting experiments, the demo shows a full A/B lifecycle:

1. **The AI creates an experiment** — two variants of the deals layout (scroll vs. grid) with a 50/50 traffic split.
2. **The AI retrieves the results** — conversion rate, uplift percentage, p-value, confidence interval.
3. **The results are significant** — the grid variant outperforms scroll at p < 0.05.
4. **The AI rolls out the winner** — it modifies the targeting rule to send 100% of users to the grid variant.
5. **The product manager verifies** — signs in as three different personas and confirms all of them now see the grid.

The entire lifecycle — create, measure, decide, deploy — happens through conversation. No data analyst needed to read the results. No engineer needed to push the rollout.

---

## What Makes This Different

**Most experimentation platforms** require engineers to write SDK calls in application code, product managers to configure flags in a separate UI, and data scientists to pull results from a dashboard and translate them into a deployment decision. Each step is owned by a different person.

**This platform** collapses all of that into a conversation. The AI understands what the product manager wants, calls the right APIs, and confirms what it did. The server-side evaluation means the experiment is live the moment the flag is created — no redeploy, no code push, no waiting.

**The architecture that makes it possible:**
- All experiment decisions happen on the server — the browser renders whatever the server returns, no questions asked.
- Feature flags are evaluated against user attributes at request time — each user gets their personalized layout fresh on every page load.
- The AI has direct access to the experimentation API — it can create, update, and read flags and experiments through the same conversation where the product manager describes what they want.

---

## Questions to Have in Mind During the Demo

Come with these questions — the demo is designed to answer them:

- **What does it cost to add a new experiment?** Watch how long it takes from the first chat message to seeing the live change on screen.
- **Who owns this workflow?** Notice that no engineer is involved after the initial platform build.
- **How confident can we be in the results?** The A/B test segment shows statistical significance reporting built into the same conversation.
- **What's the rollback story?** The demo will show a flag being changed back to a previous value — again, through chat, in under 10 seconds.
- **Could this work on our actual product?** The architecture (server-side evaluation, pure-renderer components, AI-mediated flag management) is stack-agnostic. Any Next.js app can adopt it; the principles apply beyond Next.js.

---

## Timing

The demo runs approximately 20 minutes, followed by Q&A.

| Time | Segment |
|------|---------|
| 0:00 | Open DemoApp2, show anonymous default page |
| 1:00 | Demo 1: Global flag → instant layout change (DemoApp1) |
| 3:00 | Demo 5: Gold member hero banner |
| 6:00 | Demo 6: Frequent shopper deals grid |
| 9:00 | Demo 7: Family category boost |
| 11:00 | Demo 8: Regional price sort (California) |
| 13:00 | Demo 9: Senior fresh section |
| 16:00 | Demo 10: A/B test → statistical results → rollout |
| 19:00 | Architecture overview + live automated test run |
| 20:00 | Q&A |

---

## Screenshots Preview

*The following images will be captured from the live app during the automated test run. Replace the placeholders below with actual screenshots before sending.*

**Before any flags are set — anonymous visitor, default page:**
`[screenshot: demoapp2-anonymous-default.png]`

**After gold member flag — Sarah Chen (Gold) signed in:**
`[screenshot: demoapp2-sarah-gold-hero.png]`

**Same page — Marcus Johnson (Silver) signed in:**
`[screenshot: demoapp2-marcus-silver-default.png]`

**Deals section — Sarah Chen sees grid, Marcus sees scroll:**
`[screenshot: demoapp2-deals-grid-vs-scroll.png]`

**Control Room chat — the AI creating the targeting rule:**
`[screenshot: dashboard-chat-create-flag.png]`

**A/B results — statistical significance confirmed:**
`[screenshot: dashboard-chat-ab-results.png]`

---

*Questions before the demo? Reply to this email.*
