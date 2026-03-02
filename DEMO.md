# Experimentation Platform — Leadership Demo Guide

## The Story in One Sentence

This platform lets any team member — no engineering required — walk into a chat interface, describe an experiment in plain English, and watch a live grocery app instantly serve a completely different page layout to targeted users. Every decision about what each customer sees happens on the server, driven by a single flag, with zero code deploys.

---

## Before You Start

### Prerequisites

| Requirement | Value | How to verify |
|-------------|-------|---------------|
| Exp Engine (GrowthBook) Docker | Running on ports 3000 and 3100 | Open http://localhost:3000 — you should see the GrowthBook UI |
| Web app (Next.js) | Running on port 3050 | Open http://localhost:3050 — DemoApp1 product grid loads |
| DemoApp2 | Same app, /demoapp2 route | Open http://localhost:3050/demoapp2 — Safeway grocery store loads |
| Control Room | Same app, /dashboard route | Open http://localhost:3050/dashboard — split-panel chat UI loads |
| LLM API keys | Set in apps/web/.env.local | Control Room chat responds when you type a message |

### Quick Start Commands

```bash
# Terminal 1 — start Docker (Exp Engine + MongoDB)
scripts/start.sh docker

# Terminal 2 — start the web app
scripts/start.sh web

# Verify everything is up
open http://localhost:3050/demoapp2
open http://localhost:3050/dashboard
```

Allow 30 seconds after starting for the app to compile on first load.

---

## Demo Flow Overview

The demo tells a single story: a product manager uses a chat interface to run five personalization experiments on a live grocery app. Each experiment takes under two minutes to set up. No engineers are paged. No code is deployed.

```
Total time: ~25 minutes (core) or ~30 minutes (with statistical test)

 0:00  Intro — show DemoApp2 (anonymous, default page)
 1:00  Experiment 1: Gold Member Hero Banner         [3 min]
 4:00  Experiment 2: Frequent Shopper Deals Grid     [3 min]
 7:00  Experiment 3: Family Category Boost           [3 min]
10:00  Experiment 4: Regional Price Sort             [3 min]
13:00  Experiment 5: Senior Fresh Section            [4 min, 3 personas]
17:00  Demo 10: A/B Statistical Test (optional)      [5 min]
22:00  Architecture callout (1 slide)
23:00  Run automated validation (pnpm test:demo)
25:00  Q&A
```

---

## The 5 Persona Targeting Experiments

### Experiment 1: Gold Member Hero Banner

**What it proves:** Premium tier members get a visually distinct hero experience without any frontend code change.

**The setup — type this in the Control Room chat:**
```
Create a string feature flag with id "demoapp2-hero-layout" and default value "carousel".
Then add a force targeting rule to serve "member-rewards" to users where membership_tier equals gold.
```

**What to show:**
1. The AI responds confirming the flag and rule were created.
2. Switch to DemoApp2 (http://localhost:3050/demoapp2).
3. Sign in as **Sarah Chen** (Gold). The hero banner shows a gold gradient overlay with the pill "Gold Member Exclusive".
4. Sign out, sign in as **Marcus Johnson** (Silver). The hero shows the standard carousel with "Member Picks" pill.

**The wow moment:** Say this to leadership —
> "One flag, one rule — gold members get a premium experience the moment they sign in. No code deploy. The product manager typed that in plain English and it was live in under 60 seconds."

**The control:** Marcus Johnson (Silver) and Emily Rodriguez (Basic) both see the default carousel. Neither was targeted.

---

### Experiment 2: Frequent Shopper Deals Grid

**What it proves:** Behavioral signals drive layout decisions — the same page renders fundamentally differently based on how often someone shops.

**The setup — type this in the Control Room chat:**
```
Create a string feature flag with id "demoapp2-deals-layout" and default value "scroll".
Then add a force targeting rule to serve "grid" to users where shopping_behavior equals frequent.
```

**What to show:**
1. Sign in as **Sarah Chen** (frequent shopper). The Weekly Deals section renders as a dense 2-column grid — more products visible without scrolling.
2. Sign out, sign in as **Marcus Johnson** (occasional shopper). The deals render as a horizontal scroll strip — lower information density, easier to browse.

**The wow moment:** Say this to leadership —
> "We know frequent shoppers want density — they scan deals fast. The platform serves them a fundamentally different layout based on their behavior. Same URL, same codebase, different page."

**The control:** Marcus Johnson (occasional) and Emily Rodriguez (new) both see the horizontal scroll layout.

---

### Experiment 3: Family Category Boost

**What it proves:** The server can re-sort an entire navigation grid in real time based on household composition, surfacing the most relevant categories without storing user preferences.

**The setup — type this in the Control Room chat:**
```
Create a string feature flag with id "demoapp2-category-order" and default value "".
Add a force targeting rule to serve "personalized" to users where household_type equals family.
```

**What to show:**
1. Sign in as **Sarah Chen** (family household). The category grid shows "Snacks & Chips" as the first tile — boosted because families with kids buy snacks frequently.
2. Sign out, sign in as **Robert Williams** (senior household). The category grid shows "Meat & Seafood" first — no family boost applies; behavior-based ordering takes over.

**The wow moment:** Say this to leadership —
> "The server reorders 16 categories in real time based on who's shopping. Family households see snacks first. Seniors see meat and seafood first. One flag, two completely different navigation experiences."

**The control:** Robert Williams (senior) and Marcus Johnson (couple) both see the non-personalized, behavior-based ordering.

---

### Experiment 4: Regional Price Sort

**What it proves:** Geographic targeting lets you serve price-sensitive markets a different experience than markets that prioritize popularity or novelty.

**The setup — type this in the Control Room chat:**
```
Create a string feature flag with id "demoapp2-deals-sort" and default value "popularity".
Add a force targeting rule to serve "price" to users where location equals CA.
```

**What to show:**
1. Sign in as **Sarah Chen** (California, CA). The Weekly Deals section sorts from cheapest to most expensive — Chocolate Truffles at $0.50 appears first.
2. Sign out, sign in as **Marcus Johnson** (New York, NY). The deals sort by popularity — best-selling items appear first, regardless of price.

**The wow moment:** Say this to leadership —
> "California shoppers are price-sensitive. New York shoppers want what's popular. The platform knows where you are and what matters to you — without a single line of frontend code changing."

**The control:** Marcus Johnson (NY), Emily Rodriguez (IL), and Robert Williams (OR) all see the popularity-sorted default.

---

### Experiment 5: Senior Fresh Section

**What it proves:** A whole page section can be turned on or off for a specific household segment, reducing noise and improving the signal-to-deal ratio for that audience.

**The setup — type this in the Control Room chat:**
```
Create a boolean feature flag with id "demoapp2-fresh-section" and default value "true".
Add a force targeting rule to serve "false" to users where household_type equals senior.
```

**What to show (3 personas):**

1. Sign in as **Robert Williams** (senior). The "Shop What's Fresh" section is completely gone — not hidden, not greyed out, not in the DOM at all. The page goes straight from the hero banner to category navigation and deals.
2. Sign out, sign in as **Emily Rodriguez** (new member). The fresh section is visible. Inside it, a blue panel says "Welcome to Safeway!" with onboarding copy — because the layout API detects she is a new shopper.
3. Sign out, sign in as **Sarah Chen** (Gold, family). The fresh section is visible. Inside it, a gold panel shows "Your Rewards" with her points balance, savings, and clipped deals count — because she is a Gold member.

**The wow moment:** Say this to leadership —
> "Different households, different pages — all from one flag with one targeting rule. And notice that the same section serves three completely different roles: it's absent for seniors, a welcome mat for new members, and a rewards dashboard for Gold members. All server-side, all zero code changes."

**The control:** Emily Rodriguez (new/single) and Sarah Chen (Gold/family) both see the fresh section. Marcus Johnson (Silver/couple) also sees it with no personalization panels.

---

### Demo 10: A/B Statistical Test — Deals Layout

**What it proves:** The platform can run a real A/B experiment with statistical significance reporting, then let the AI analyze the results and roll out the winner — all via natural language.

**The setup — type this in the Control Room chat:**
```
Create an A/B experiment called "Deals Layout A/B Test" on feature flag "demoapp2-deals-layout".
Use tracking key "deals-layout-ab-test".
Variation 0 (Control) serves "scroll", Variation 1 (Variant A) serves "grid".
Target only frequent shoppers.
```

**Then ask for results (imagine 14 days have passed):**
```
Get results for the Deals Layout A/B Test experiment and summarize the statistical significance.
```

**What to show:**
1. The AI returns a breakdown: Control (scroll) vs Variant A (grid) — user counts, conversion rates, revenue per user.
2. The AI reports: uplift %, confidence %, p-value < 0.05, and a clear recommendation: "Variant A is statistically significant. Recommend full rollout."
3. Ask the AI to act: "The results are significant — roll out the grid layout to all frequent shoppers." The AI adds a force rule and confirms.
4. Sign in as **Jordan Lee** (Silver/TX/frequent shopper). They see the grid layout — the winning variant is live.

**The wow moment:** Say this to leadership —
> "The AI didn't just run the experiment. It read the statistics, called the winner, and applied the rollout — all in one conversation. No data scientist needed to interpret the p-value. No engineer needed to flip the flag."

**The new personas — Jordan Lee and Priya Patel:**
These were added to give the demo a richer frequent-shopper audience. Jordan Lee (Silver/TX) shows that the rollout reaches mid-tier members across markets, not just Gold members on the west coast. Priya Patel (Gold/WA) demonstrates west-coast Gold coverage beyond Sarah Chen's California footprint.

---

## Running the Automated Validation

The entire demo is covered by 9 automated tests that run against the live servers:

```bash
pnpm test:demo
```

Expected output: all 9 tests pass in approximately 5 minutes. Each test:
1. Deletes any existing version of the feature flag (clean slate)
2. Instructs the AI via the Control Room chat to create the flag and targeting rule
3. Signs in as each relevant persona and asserts the correct UI variant appears
4. Cleans up the flag after the test

Show this terminal output to leadership. The green checkmarks confirm that the entire persona-targeting stack — chat interface, AI tooling, GrowthBook API, server-side evaluation, and frontend rendering — all work end-to-end.

---

## Architecture Callout (1 slide worth)

This is what to explain on the whiteboard or in one slide:

**How one chat message changes what a customer sees:**

```
1. Product manager types a natural-language instruction
   into the Control Room chat.

2. The AI (Claude via Anthropic API) parses the intent
   and calls the GrowthBook REST API to create a feature
   flag with the specified targeting rule.

3. A customer signs in to DemoApp2. Their user attributes
   (tier, location, behavior, household) are sent to the
   Layout API at /api/demoapp2/layout.

4. The Layout API evaluates all active feature flags
   server-side using the GrowthBook Node SDK. It
   assembles a complete page layout — which sections are
   visible, which banners appear, how products are sorted,
   what copy is shown — and returns it as structured JSON.

5. The browser renders exactly what the server returned.
   Zero experiment logic lives in the browser. Zero feature
   flag checks run client-side. The browser is a pure
   renderer.

6. Adding a new experiment that reuses an existing prop
   (e.g. a new targeting rule for hero layout, deals sort,
   category order) requires one chat message — zero code
   changes, zero deploys.

   Adding a brand-new type of experiment (a UI behavior the
   app has never done before) requires one server-side code
   change to the Layout API, a redeploy of apps/web, then
   one chat message to configure the flag. React components
   never change.
```

---

## Persona Cheat Sheet

Use this table to quickly recall which persona triggers which experiment variant.

| Persona | Tier | Location | Behavior | Household | Exp 1: Hero | Exp 2: Deals Layout | Exp 3: Categories | Exp 4: Price Sort | Exp 5: Fresh Section | Demo 10: A/B Rollout |
|---------|------|----------|----------|-----------|-------------|---------------------|-------------------|-------------------|----------------------|----------------------|
| Sarah Chen | Gold | CA | Frequent | Family | Variant (gold overlay) | Variant (grid) | Variant (snacks first) | Variant (price sort) | Default (visible + rewards panel) | Winner (grid) |
| Marcus Johnson | Silver | NY | Occasional | Couple | Default (carousel) | Default (scroll) | Default (behavior order) | Default (popularity) | Default (visible, no panels) | Default (scroll) |
| Emily Rodriguez | Basic | IL | New | Single | Default (carousel) | Default (scroll) | Default (behavior order) | Default (popularity) | Default (visible + welcome panel) | Default (scroll) |
| Robert Williams | Gold | OR | Frequent | Senior | Variant (gold overlay) | Variant (grid) | Default (behavior order) | Default (popularity) | Variant (section hidden) | Winner (grid) |
| Jordan Lee | Silver | TX | Frequent | Couple | Default (carousel) | Variant (grid) | Default (behavior order) | Default (popularity) | Default (visible, no panels) | Winner (grid) |
| Priya Patel | Gold | WA | Frequent | Single | Variant (gold overlay) | Variant (grid) | Default (behavior order) | Default (popularity) | Default (visible, no panels) | Winner (grid) |

**Reading the table:** "Variant" means the persona is targeted by the experiment and sees the non-default experience. "Default" means the targeting rule does not apply and the persona sees the standard experience. "Winner (grid)" means they see the winning variant after the Demo 10 A/B rollout.

**Note on Robert Williams:** Robert is Gold tier and a frequent shopper, so he triggers Experiments 1 and 2. But he is not in California and not a family household, so he sees default behavior for Experiments 3 and 4. He is the only senior household, making him the sole target for Experiment 5.

**Note on Jordan Lee and Priya Patel:** Both are frequent shoppers, so they are targeted by Experiment 2 (deals grid) and the Demo 10 A/B rollout. Priya is Gold tier so she also gets the gold hero overlay in Experiment 1. Neither is in a family household or California, so Experiments 3 and 4 do not apply to them.

---

## Frequently Asked Questions from Leadership

**Q: Could a product manager accidentally target the wrong users?**
The AI confirms what it is about to do before calling the API, and the Control Room shows all active flags and rules in the left panel at all times. You can also roll back any flag by sending a follow-up chat message.

**Q: What happens if the flag evaluation service is down?**
The Layout API catches all GrowthBook SDK errors and falls back gracefully — the page renders with safe defaults. No user sees a broken experience.

**Q: How is this different from a feature flag tool we already use?**
Most feature flag tools require an engineer to write the SDK call, deploy the code, then a product manager to flip the flag. This platform skips all of that — the AI writes no code but does everything else: creates the flag, sets the targeting rule, and the page responds immediately because the evaluation is server-side.

**Q: Can we run actual A/B experiments with statistical significance, not just targeting rules?**
Yes. The Control Room AI can also create proper A/B experiments with traffic splits, assign them to feature flags, and retrieve results with conversion rates, uplift percentages, and confidence intervals. Experiments 1-5 in this demo use force targeting rules (100% of a segment gets the variant) because they are showcasing personalization, not statistical testing.

**Q: How long does it take to add a sixth experiment?**
It depends on whether the new experiment reuses a UI behavior the app already supports:

- **Reusing an existing prop** (e.g. a new targeting rule that changes the hero layout, the deals sort order, or the category ordering): approximately 60 seconds — one chat message, no engineering involvement. The page updates for targeted users immediately.
- **A brand-new UI behavior** (e.g. a section that has never existed before, a new card style, a new CTA pattern): requires a server-side code change to the Layout API (`/api/demoapp2/layout`), a redeploy of the web app, then one chat message to configure the flag. The React components themselves never change — only the server logic that decides what props to pass them.

In practice, the five experiments in this demo all reuse props the components already accept, so any targeting variation of them is genuinely zero-code.

**Q: Do the React components ever need to change?**
No — for DemoApp2. The components are pure renderers: they accept typed props and render whatever the server sends. All experiment logic (which banner to show, how to sort products, whether to show a section, what copy to display) lives in the Layout API server, not in the browser. Adding a new targeting rule or a new variation of an existing experiment never touches a React component.

The only time a React component needs updating is when a genuinely new UI capability is being introduced that the component has never supported before — for example, adding a loyalty badge widget that doesn't exist yet. Even then, only the new component is written; all existing components stay unchanged.

---

## For Engineers: How to Add a New Flag

### If the new experiment reuses an existing prop (zero-code path)

1. Create the flag in Exp Engine via chat or UI — no code needed.
2. Add a targeting rule pointing to an existing prop value (e.g. `member-rewards`, `grid`, `price`, `personalized`).
3. Done. No deployment needed.

### If the new experiment introduces a new UI behavior

| Step | File to change | What to do |
|------|---------------|------------|
| 1 | `apps/web/src/app/api/demoapp2/layout/route.ts` | Evaluate the new flag with `gb.getFeatureValue(...)` and translate the result into props |
| 2 | `apps/web/src/lib/layout-types.ts` | Add the new prop field to the relevant section type (only if the component needs a new prop) |
| 3 | `apps/web/src/components/demoapp2/<Component>.tsx` | Add rendering logic for the new prop (only if a new prop was added) |
| 4 | Deploy `apps/web` | Restart the Next.js server |
| 5 | Create the flag + targeting rule via chat | Done |

**React components never change for steps 1–2 alone.** The layout API is the single source of truth for all experiment decisions. Components are written once and reused across every variation.

### What never needs to change

- `apps/web/src/app/demoapp2/page.tsx` — the DemoApp2 page router
- `apps/web/src/contexts/UserContext.tsx` — the user/persona context
- Any component that already accepts the prop you need
- Any existing test (unless you are adding a new demo scenario)
