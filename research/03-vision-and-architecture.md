# Vision: AI-Native Experimentation Platform

> Last updated: 2026-02-27
> Status: Decisions locked. Ready for implementation planning.

## 1. The Pitch (for leadership/investors)

**"What if you could run your entire experimentation program by talking to an AI agent?"**

Today, setting up an A/B test requires:
1. Writing a hypothesis (manual, often skipped)
2. Defining variants in a UI (click-heavy)
3. Setting targeting rules (error-prone)
4. Configuring metrics (requires analytics knowledge)
5. Waiting for significance (nobody checks at the right time)
6. Analyzing results (requires statistics knowledge)
7. Making a ship decision (delayed by meetings)

**Our vision**: An AI agent that handles the full lifecycle — across web, server, and mobile — from a single chat interface.

```
You:    "I want to test whether showing savings percentage on product cards
        increases add-to-cart rate"
Agent:  [Renders experiment card inline in chat]
        Creates experiment with 2 variants: control (show price only) vs
        treatment (show price + "Save 20%").
        Targets: 50/50 split across web, mobile, and API.
        Primary metric: add_to_cart_rate.
        Guardrails: page_load_time, bounce_rate.
        Estimated sample size: 5,000 users (3-5 days).
        [Button: Launch Experiment]

You:    [clicks Launch]

Agent:  [3 days later, proactive alert with results dashboard inline]
        "Experiment reached significance. Showing savings % increased
        add-to-cart by 18.7% (95% CI: [12.1%, 25.3%]).
        Results consistent across all surfaces:
        - Web: +19.2%
        - Mobile: +17.8%
        - API: +18.1%
        I recommend shipping. Should I roll out to 100%?"

You:    "Yes, ship it"

Agent:  Rolls out to 100% across web, mobile, and server.
        [Shows rollout confirmation card]
```

---

## 2. Architecture

```
                    ┌─────────────────────────────────────┐
                    │     CopilotKit Chat Interface        │
                    │  (Next.js + Generative UI)           │
                    │  - Experiment cards inline            │
                    │  - Result dashboards inline           │
                    │  - Action buttons (launch, ship)      │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │     AI Agent (LLM + MCP Tools)       │
                    │  - Experiment design                 │
                    │  - Statistical reasoning              │
                    │  - Cross-platform monitoring          │
                    │  - Ship/rollback recommendations      │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │  @growthbook/mcp (OFFICIAL - EXISTS!) │
                    │  (14 built-in tools, MIT license)     │
                    │  - create_feature / list_features     │
                    │  - create_experiment / list_experiments│
                    │  - get_experiment_results             │
                    │  - add_force_rule (targeting)         │
                    │  - list_metrics / list_environments   │
                    │  + custom tools if gaps found         │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │     GrowthBook (Docker)               │
                    │  - Feature flags                      │
                    │  - A/B test assignment                │
                    │  - Statistical analysis               │
                    │  - REST API (port 3100)               │
                    │  - UI (port 3000)                     │
                    └──────────────┬──────────────────────┘
                                   │
            ┌──────────────────────┼──────────────────────┐
            │                      │                      │
      ┌─────▼──────┐       ┌──────▼──────┐       ┌───────▼──────┐
      │  Web App    │       │ Server API  │       │  Mobile App   │
      │  (Next.js)  │       │ (Node.js)   │       │ (Expo + RN)   │
      │  Port 3050  │       │ Port 3200   │       │ Expo Go (iOS) │
      │  GrowthBook │       │ GrowthBook  │       │  GrowthBook   │
      │  React SDK  │       │ Node SDK    │       │   RN SDK      │
      └────────────┘       └─────────────┘       └──────────────┘
```

### Demo Product: E-Commerce Store

One unified e-commerce store ("ShopDemo") with three surfaces:
- **Web** (Next.js): Product listing, product detail, cart
- **Mobile** (React Native / Expo Go): Same store on iPhone
- **Server API** (Node.js): Product recommendations, pricing logic, search ranking

All three share the same GrowthBook instance and experiments.

---

## 3. Demo Scenarios

### Demo 1: Client-Side Web Experiment
```
You:    "Test a new product card layout on the web store. Compare the current
        grid with small images vs larger images with a quick-add button."
Agent:  [Renders experiment config card with variant previews]
        [Creates experiment in GrowthBook]
        [Shows: "Refresh the web store to see variants in action"]
Presenter: Refreshes browser → shows variant B with larger product cards
```

### Demo 2: Server-Side API Experiment
```
You:    "Test whether sorting products by popularity instead of price-low-to-high
        increases conversion. This should affect web and mobile."
Agent:  [Creates server-side experiment on the product ranking API]
        [Shows code diff: how the Node.js API uses GrowthBook to switch sort order]
Presenter: Shows API returning different sort orders for control vs treatment
```

### Demo 3: Cross-Platform Mobile Experiment
```
You:    "Show me the pricing experiment on mobile"
Agent:  [Renders experiment status card — same experiment running on web + mobile]
        [Shows: "Open the Expo Go app on your phone to see the mobile variant"]
Presenter: Opens iPhone → shows same experiment variant on mobile app
```

### Demo 4: AI-Powered Results Analysis
```
You:    "How is the product card experiment performing?"
Agent:  [Renders results dashboard inline — charts, confidence intervals, per-surface breakdown]
        "After 2,400 users, variant B (larger images + quick-add) shows:
        - Web: +22% add-to-cart (p=0.01)
        - Mobile: +18% add-to-cart (p=0.04)
        Statistical significance reached. I recommend shipping variant B.
        [Button: Ship to 100%] [Button: Extend test]"
```

### Demo 5: Natural Language Query
```
You:    "List all running experiments and their status"
Agent:  [Renders a table with experiment name, surface, days running, lift, significance]
        [Highlights which experiments are ready for a decision]
```

---

## 4. Implementation Plan (1-2 week timeline)

### Week 1: Foundation

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | GrowthBook Docker setup + seed sample experiments | GrowthBook running at localhost:3000 |
| 1 | Test `@growthbook/mcp` against local GrowthBook | Verify all 14 tools work, identify gaps |
| 2-3 | E-commerce web app (Next.js) with GrowthBook React SDK | Product listing page with live experiments |
| 3-4 | CopilotKit chat UI + connect `@growthbook/mcp` | Chat creates experiments, shows inline cards |
| 5 | Server API (Node.js) with GrowthBook Node SDK | Product API with server-side experiments |

### Week 2: Mobile + Polish

| Day | Task | Deliverable |
|-----|------|-------------|
| 6-7 | React Native (Expo) mobile app with GrowthBook RN SDK | Same store on iPhone via Expo Go |
| 8 | Generative UI components — experiment cards, result dashboards | Polished inline renders in chat |
| 9 | Seed realistic demo data, script demo flow | Pre-configured experiments with mock results |
| 10 | Polish, edge cases, demo rehearsal | Demo-ready |

---

## 5. Technology Stack (Final)

| Component | Technology | Port | Why |
|-----------|-----------|------|-----|
| Experimentation engine | GrowthBook (Docker) | 3000 (UI), 3100 (API) | Best OSS, MIT, API-first, lightweight |
| Database | MongoDB (Docker) | 27017 | GrowthBook dependency |
| MCP server | `@growthbook/mcp` (official) | stdio | 14 built-in tools, extend if needed |
| Chat UI | Next.js + CopilotKit v2.x | 3050 | Generative UI for inline experiment cards |
| Web store | Next.js (same app as chat) | 3050 | GrowthBook React SDK, product listing |
| Server API | Node.js / Express | 3200 | GrowthBook Node SDK, product recommendations |
| Mobile app | React Native + Expo | Expo Go on iPhone | GrowthBook RN SDK, same experiments |
| LLM | OpenRouter (or OpenAI) | — | Flexible model selection |

---

## 6. Decisions Log

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | GrowthBook vs PostHog? | **GrowthBook** | Lightest footprint (2 containers, 4GB RAM), best experimentation engine, MIT, API-first |
| 2 | CopilotKit vs custom chat? | **CopilotKit** | Rich generative UI for experiment cards/dashboards inline in chat. Prior experience. |
| 3 | OpenFeature abstraction? | **Skip for demo** | Adds indirection without demo value. Mention in "future roadmap" only. |
| 4 | Demo depth vs breadth? | **Deep + 3 surfaces** | One e-commerce store across web, server API, and mobile. Product discovery & pricing experiments. |
| 5 | Real data vs mock data? | **Real app + seeded data** | Live demo app with GrowthBook SDK. Seeded experiments with mock results for analysis demo. |
| 6 | Mobile framework? | **React Native (Expo)** | Runs on iPhone via Expo Go, no Mac needed, GrowthBook has RN SDK. |
| 7 | Demo product? | **E-commerce store** | Universally understood. Rich experimentation surface for product cards, pricing, sorting. |
| 8 | Polish level? | **Polished demo** | Investor audience needs it to look real. Budget 2-3 days for styling. |
| 9 | Server-side demo? | **API response diffs via chat** | Agent creates experiment, we show different API responses for control vs treatment. |
