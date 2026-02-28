# Experimentation Platform Landscape Research

> Last updated: 2026-02-27

## 1. Open Source Experimentation Platforms — Ranked

### Tier 1: Strong Contenders (active, full-featured, large community)

| Platform | Stars | License | A/B Testing | Feature Flags | Mobile | OpenFeature | Stack |
|----------|-------|---------|-------------|---------------|--------|-------------|-------|
| **[PostHog](https://github.com/PostHog/posthog)** | 31.8k | MIT | Built-in | Yes | iOS, Android, RN, Flutter | No | Python/Django, TS, ClickHouse |
| **[Unleash](https://github.com/Unleash/unleash)** | 12.7k | Apache 2.0 | No (needs 3rd party) | Yes (best) | iOS, Android, RN, Flutter | Yes | TS, Node.js, PostgreSQL |
| **[GrowthBook](https://github.com/growthbook/growthbook)** | 7.4k | MIT | Built-in (best) | Yes | iOS, Android, RN, Flutter | Yes | React, Node.js, TS, MongoDB |
| **[Flagsmith](https://github.com/Flagsmith/flagsmith)** | 6.2k | BSD-3 | No (needs 3rd party) | Yes | iOS, Android, RN | Yes | Python/Django, React |

### Tier 2: Specialized / Lighter-weight

| Platform | Stars | License | A/B Testing | Feature Flags | OpenFeature | Stack |
|----------|-------|---------|-------------|---------------|-------------|-------|
| **[Flipt](https://github.com/flipt-io/flipt)** | 4.7k | GPL-3.0 | No | Yes (Git-native) | Yes | Go (single binary) |
| **[GO Feature Flag](https://github.com/thomaspoignant/go-feature-flag)** | 1.9k | MIT | Basic | Yes | Yes (native) | Go |
| **[FeatBit](https://github.com/featbit/featbit)** | 1.8k | MIT | Yes | Yes | Yes | .NET, React, TS |
| **[FeatureProbe](https://github.com/FeatureProbe/FeatureProbe)** | 1.6k | Apache 2.0 | Yes | Yes | No | TS, Java, Rust |
| **[Bucketeer](https://github.com/bucketeer-io/bucketeer)** | 464 | Apache 2.0 | Yes (Bayesian) | Yes | Yes | Go, TS |

### Archived / Not Recommended
- **Wasabi** (Intuit) — archived, no longer maintained

---

## 2. Top 3 Candidates for Our Project

### Option A: GrowthBook (Recommended)
- **Why**: Best open-source experimentation engine. Built-in statistical analysis (frequentist + Bayesian + sequential). Warehouse-native. 24+ SDKs. MIT license.
- **A/B testing**: First-class. WYSIWYG visual editor, advanced targeting, multi-armed bandits.
- **Architecture**: React + Node.js + MongoDB — easy to extend with AI features.
- **Weakness**: Flag management less mature than Unleash.
- **AI opportunity**: No AI features today = blank canvas for us.

### Option B: PostHog
- **Why**: Most popular (31.8k stars). All-in-one: analytics + flags + A/B testing + session replay + surveys.
- **A/B testing**: Integrated with product analytics. Good statistical significance testing.
- **Architecture**: Python/Django + TS + ClickHouse — heavier infrastructure.
- **Weakness**: Heavier deployment. Opinionated about analytics pipeline.
- **AI opportunity**: Has an MCP server already, but no conversational experiment management.

**Decision**: **GrowthBook** — best experimentation features, lightest local footprint (2 containers, 4GB RAM), clean architecture, MIT license, easy to wrap with an AI agent layer. PostHog rejected due to heavy infrastructure (6+ containers, 16GB RAM, ClickHouse disk growth).

---

## 3. OpenFeature — The Abstraction Layer

[OpenFeature](https://openfeature.dev/) is a **CNCF Incubating** vendor-agnostic specification for feature flags.

```
Your Application
      |
OpenFeature SDK (language-specific)
      |
OpenFeature Provider (vendor-specific)
      |
Feature Flag Platform (GrowthBook, Unleash, etc.)
```

**Why it matters**: If we build on OpenFeature, users can swap the underlying platform without changing application code. GrowthBook, Unleash, Flagsmith, Flipt, FeatBit all have OpenFeature providers.

**For our project**: We could build the AI agent layer on top of OpenFeature, making it platform-agnostic. But for the demo, we should pick one platform (GrowthBook) and go deep.

---

## 4. SDK Coverage Comparison

| Platform | Server SDKs | Client SDKs | Mobile SDKs | Total |
|----------|-------------|-------------|-------------|-------|
| Unleash | 10+ | 5+ | 4+ | 30+ |
| GrowthBook | 8+ | 2+ | 6+ | 24+ |
| PostHog | 8+ | 10+ | 4+ | 20+ |
| Flagsmith | 8+ | 2+ | 4+ | 15+ |

All top platforms cover: JavaScript, Python, Go, Java, .NET, Ruby, PHP, iOS (Swift), Android (Kotlin), React Native, Flutter.

---

## 5. Statistical Approaches

| Approach | Platform | Benefit |
|----------|----------|---------|
| Frequentist | GrowthBook, PostHog | Traditional p-value testing |
| Bayesian | GrowthBook, Bucketeer | Faster results, smaller samples |
| Sequential | GrowthBook, Eppo | Safe to peek at results early |
| CUPED | Eppo | Signal boosting (reduces noise) |

GrowthBook supports all three (frequentist, Bayesian, sequential) — most flexible.

---

## Sources

- [PostHog: Best open-source A/B testing tools](https://posthog.com/blog/best-open-source-ab-testing-tools)
- [PostHog: Best open-source feature flag tools](https://posthog.com/blog/best-open-source-feature-flag-tools)
- [FlagShark: Open source feature flag tools compared 2026](https://flagshark.com/blog/open-source-feature-flag-tools-compared-2026/)
- [Growth-onomics: 7 best open-source A/B testing tools](https://growth-onomics.com/open-source-ab-testing-tools/)
- [Unleash: 11 open-source feature flag tools](https://www.getunleash.io/blog/11-open-source-feature-flag-tools)
- [Statsig: Best open source feature flags](https://www.statsig.com/comparison/best-open-source-feature-flags)
- [OpenFeature: Introduction](https://openfeature.dev/docs/reference/intro/)
