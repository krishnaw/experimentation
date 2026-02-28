# AI-Native Experimentation — State of the Art

> Last updated: 2026-02-27

## 1. The Big Picture

**No open-source platform exists today that combines AI agents with A/B testing infrastructure.** This is a clear white-space opportunity.

The landscape breaks into three buckets:
1. **Traditional experimentation platforms** adding AI features (Statsig, Optimizely, Kameleoon)
2. **LLM evaluation tools** for testing AI applications (Langfuse, DeepEval, promptfoo)
3. **Academic research** on autonomous experimentation agents (AgentA/B, EXP-Bench)

None of these are what we want to build: **an AI agent that manages the full lifecycle of product experimentation via conversation**.

---

## 2. What Commercial Platforms Are Doing with AI

### Statsig (acquired by OpenAI, Sep 2025)
- AI-powered experiment summaries — auto-generates human-readable analysis with ship/no-ship recommendations
- AI-powered search — natural language queries like "find experiments that impacted retention most"
- Contextual AI descriptions — auto-generates descriptions for gates, experiments, metrics using GitHub code context
- **Signal**: OpenAI acquiring Statsig validates that experimentation + AI is a strategic area

### Kameleoon (closest to our vision)
- Generate, build, and run experiments by prompting AI
- AI agent reviews pages and suggests impactful experiments based on real user behavior
- Generates test-ready variants without code
- **Still commercial, not open source**

### Optimizely
- AI-powered hypothesis generation
- Auto-generated variant copy and layouts
- Has an **MCP server** for managing feature flags and experiments from IDE

### Adobe
- Experimentation Agent that creates experiments from AI Assistant chat
- Delivers performance analysis and next-action guidance

### Contentsquare
- Agent-to-Agent testing: user prompt -> AI agent -> coordinates with testing platform -> launches experiment
- Single-prompt experiment creation

---

## 3. MCP Servers Already Available

Several platforms have MCP servers, proving the pattern works:

| Platform | MCP Server | Capabilities |
|----------|------------|-------------|
| **[Optimizely](https://world.optimizely.com/blogs/patrick-lam/dates/2025/8/revolutionize-your-experimentation-introducing-the-optimizely-experimentation-mcp-server/)** | Yes | Manage flags, debug experiments, automate flag lifecycle via natural language |
| **[LaunchDarkly](https://www.pulsemcp.com/servers/launchdarkly)** | Yes | Manage rollouts, A/B configs, environment-specific flag states |
| **[Harness](https://www.harness.io/blog/ai-powered-feature-management-with-harness-mcp-server-and-claude-code)** | Yes | Feature flags from AI-powered IDEs (Claude Code, Windsurf) |
| **[PostHog](https://posthog.com/docs/model-context-protocol)** | Yes | AI agents interact with experimentation and analytics |

**Key insight**: MCP is the emerging standard for AI-to-experimentation-platform integration. We should build an MCP server for our platform.

---

## 4. Academic Research

### AgentA/B (arXiv, Apr 2025)
- LLM-based agents simulate user interaction with real webpages
- Agents have diverse personas, navigate dynamic pages, execute multi-step interactions
- First major effort to use AI agents to *conduct* A/B tests (not just analyze them)
- [Paper](https://arxiv.org/abs/2504.09723)

### EXP-Bench (arXiv, May 2025)
- Evaluated LLM agents on designing complete experiments
- Individual aspects (design, implementation) reach 20-35% accuracy
- Complete executable experiments: only **0.5% success rate**
- **Takeaway**: Current LLMs struggle with rigorous experiment design — human-in-the-loop is essential
- [Paper](https://arxiv.org/abs/2505.24785)

### 12 Principles of Autonomous Experimentation
From [Intelligence Strategy Institute](https://www.intelligencestrategy.org/blog-posts/agentic-ai-autonomous-experimentation):
1. Continuous hypothesis generation (24/7)
2. Adaptive design
3. Parallelized experimentation (dozens/hundreds of variants)
4. Failure-driven exploration
5. Self-benchmarking against historical data
6. Real-time data integration
7. Automated analysis
8. Natural language hypothesis formatting
9. Anomaly detection and trend recognition
10. Hypothesis backlog management
11. Dynamic prioritization
12. Human oversight integration

---

## 5. Key Gaps We Can Fill

| Gap | What's Missing | Our Opportunity |
|-----|---------------|-----------------|
| **No open-source conversational experimentation** | Kameleoon does this commercially, nobody open-source | Build it on GrowthBook |
| **Fragmented agent capabilities** | No platform implements the full autonomous loop | Build end-to-end: design -> create -> monitor -> analyze -> decide |
| **No experimentation MCP for open-source platforms** | MCP servers exist for Optimizely, LaunchDarkly — not for GrowthBook/PostHog | Build GrowthBook MCP server |
| **Statistical rigor not exposed via conversation** | CUPED, sequential analysis, power analysis exist but require UI clicks | Make stats accessible via natural language |
| **Human-in-the-loop patterns undefined** | Most research assumes full automation | Design explicit approval gates for experiment decisions |
| **Experimentation best practices not encoded** | Knowledge from "Trustworthy Online Controlled Experiments" (Kohavi) not in any agent | Train/prompt agent with experimentation domain expertise |

---

## 6. Thought Leadership Signals

- **Fast Company**: "The End of Experimentation with AI Agents" — experimentation becoming continuous, autonomous, integrated
- **KPMG**: 33% of orgs have deployed AI agents (3x increase), moving beyond experimentation into core ops
- **OpenAI acquiring Statsig**: Validates experimentation as strategic for AI companies
- **Leading AI companies** (OpenAI, Figma, Notion, Grammarly, Atlassian, Brex) all rely heavily on A/B testing
- **Zappi**: Brands using AI-powered testing see **4-6x higher success rates**, iterations in **4 hours** vs weeks

---

## Sources

- [Agent-to-Agent Testing — Contentsquare](https://contentsquare.com/blog/agent-to-agent-ab-testing/)
- [Adobe Experimentation Agent](https://experienceleague.adobe.com/en/docs/experience-cloud-ai/experience-cloud-ai/agents/agent-experiment)
- [Optimizely AI Experimentation](https://www.optimizely.com/insights/blog/AI-experimentation/)
- [Statsig AI Features](https://www.statsig.com/blog/statsig-ai-features)
- [Optimizely MCP Server](https://world.optimizely.com/blogs/patrick-lam/dates/2025/8/revolutionize-your-experimentation-introducing-the-optimizely-experimentation-mcp-server/)
- [Harness MCP](https://www.harness.io/blog/ai-powered-feature-management-with-harness-mcp-server-and-claude-code)
- [PostHog MCP](https://posthog.com/docs/model-context-protocol)
- [LaunchDarkly MCP](https://www.pulsemcp.com/servers/launchdarkly)
- [AgentA/B Paper](https://arxiv.org/abs/2504.09723)
- [EXP-Bench Paper](https://arxiv.org/abs/2505.24785)
- [Fast Company: End of Experimentation](https://www.fastcompany.com/91496898/the-end-of-experimentation-with-ai-agents)
- [KPMG: AI Agents Beyond Experimentation](https://kpmg.com/us/en/media/news/q2-ai-pulse-2025-agents-move-beyond-experimentation.html)
- [Statsig: Experimentation and AI Trend](https://www.statsig.com/blog/experimentation-and-ai-trend)
- [Intelligence Strategy: Autonomous Experimentation](https://www.intelligencestrategy.org/blog-posts/agentic-ai-autonomous-experimentation)
- [Agentic AI for Modern DL Experimentation](https://towardsdatascience.com/agentic-ai-for-modern-deep-learning-experimentation/)
