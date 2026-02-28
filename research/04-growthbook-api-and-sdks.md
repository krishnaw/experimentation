# GrowthBook API, SDKs, and MCP Server Research

> Last updated: 2026-02-27

## 1. MAJOR FINDING: Official MCP Server Already Exists

**`@growthbook/mcp`** — MIT license, 19 stars, 131 commits, actively maintained.

```bash
claude mcp add growthbook --transport stdio \
  --env GB_API_KEY=YOUR_API_KEY \
  --env GB_API_URL=http://localhost:3100 \
  --env GB_APP_ORIGIN=http://localhost:3000 \
  --env GB_EMAIL=YOUR_EMAIL \
  -- npx -y @growthbook/mcp@latest
```

### 14 Built-in Tools

| Tool | What it does |
|------|-------------|
| `get_attributes` | List user attributes tracked in GrowthBook |
| `create_feature` | Create feature flag |
| `list_features` | List existing feature flags |
| `generate_types` | Generate TypeScript type definitions for flags |
| `add_force_rule` | Add targeting rule (e.g., restrict to beta testers) |
| `detect_stale_rollouts` | Identify stale safe rollouts for cleanup |
| `create_experiment` | Create A/B test |
| `list_experiments` | List experiments |
| `get_experiment_results` | Retrieve results (metadata, full, or summary) |
| `list_environments` | List environments |
| `list_projects` | List projects |
| `list_sdk_connections` | Manage SDK connections |
| `list_metrics` | Get metrics |
| `search_docs` | Search GrowthBook documentation |

### What this means for our project

**We don't need to build an MCP server from scratch.** Instead:
- Use `@growthbook/mcp` as the foundation
- CopilotKit connects to it via MCP apps middleware (proven pattern from GenerativeUI project)
- If we need custom tools (e.g., cross-platform rollout, result analysis), we fork/extend

**Repo**: https://github.com/growthbook/growthbook-mcp

---

## 2. REST API Overview

### Basics
- **Self-hosted base URL**: `http://localhost:3100/api/v1/`
- **Auth**: Bearer token or HTTP Basic (`secret_abc123`)
- **Rate limit**: 60 requests/minute
- **Pagination**: `limit` + `offset` params

### Key API Endpoints

#### Features (Feature Flags)
| Method | Path | Action |
|--------|------|--------|
| GET | `/features` | List all features |
| POST | `/features` | Create feature (required: `id`, `valueType`, `defaultValue`) |
| GET | `/features/{id}` | Get single feature |
| POST | `/features/{id}` | Update feature |
| DELETE | `/features/{id}` | Delete feature |
| POST | `/features/{id}/toggle` | Toggle feature per environment |

**Feature `valueType` options**: `boolean`, `string`, `number`, `json`

#### Experiments
| Method | Path | Action |
|--------|------|--------|
| GET | `/experiments` | List experiments |
| POST | `/experiments` | Create experiment (required: `name`, `variations`, `trackingKey`) |
| GET | `/experiments/{id}` | Get single experiment |
| POST | `/experiments/{id}` | Update experiment |
| POST | `/experiments/{id}/snapshot` | Create analysis snapshot |
| GET | `/experiments/{id}/results` | Get results with statistical analysis |

#### Metrics
| Method | Path | Action |
|--------|------|--------|
| GET | `/metrics` | List metrics |
| POST | `/metrics` | Create metric (types: `binomial`, `count`, `duration`, `revenue`) |
| GET | `/metrics/{id}` | Get single metric |
| DELETE | `/metrics/{id}` | Delete metric |

#### Other Endpoints
- **Environments**: GET/POST/PUT/DELETE `/environments`
- **Projects**: GET/POST/PUT/DELETE `/projects`
- **SDK Connections**: GET/POST/PUT/DELETE `/sdk-connections`
- **Segments**: GET/POST/DELETE `/segments`
- **Dimensions**: GET/POST/DELETE `/dimensions`

### API Limitations
1. **No DELETE for experiments** — can archive but not fully delete
2. **No metric groups via API** — only through UI
3. **Feature keys are immutable** — plan naming carefully
4. **60 req/min rate limit** — use webhooks instead of polling

---

## 3. Webhooks (15 Event Types)

GrowthBook supports webhooks for real-time notifications:

| Event | When it fires |
|-------|--------------|
| `feature.created` | New feature flag created |
| `feature.updated` | Feature flag modified |
| `feature.deleted` | Feature flag deleted |
| `experiment.created` | New experiment created |
| `experiment.updated` | Experiment modified |
| `experiment.info.significance` | Metric reached 95%+ confidence |
| `experiment.decision.ship` | Ready to ship a variation |
| `experiment.decision.rollback` | Should rollback to control |
| `experiment.decision.review` | Results ambiguous, needs human review |
| `experiment.warning` | SRM detected, multiple exposures, etc. |

**Useful for**: AI agent monitoring — subscribe to webhook events to proactively alert users.

---

## 4. SDK Architecture

### How SDKs Connect

```
SDK (React/Node/RN)
    |
    | HTTP GET
    v
http://localhost:3100/api/features/{clientKey}
    |
    | Returns JSON payload
    v
{
  "features": {
    "feature-key": {
      "defaultValue": true,
      "rules": [{ "weights": [0.5, 0.5], "variations": [true, false], ... }]
    }
  }
}
```

- **Client Key**: Public, safe for client-side code. Scoped to one environment.
- **Secret API Key**: For admin REST API operations. Never expose to clients.
- **SDK endpoint is read-only** — no auth required, CDN-cacheable.

### Client Key vs Secret Key

| | Client Key (SDK) | Secret API Key |
|---|---|---|
| Purpose | Fetch feature flags | Admin REST API |
| Security | Public (safe in browser/mobile) | Secret (backend only) |
| Access | Read-only features for one env | Full CRUD on all resources |
| Created in | Features → SDKs | Settings → API Keys |

---

## 5. SDK Setup Per Surface

### React Web (Next.js)

```bash
npm install @growthbook/growthbook-react
```

```tsx
import { GrowthBook, GrowthBookProvider, useFeatureIsOn, useFeatureValue } from '@growthbook/growthbook-react';

const gb = new GrowthBook({
  apiHost: "http://localhost:3100",
  clientKey: "sdk-abc123",
  trackingCallback: (experiment, result) => {
    console.log("Experiment Viewed", { experimentId: experiment.key, variationId: result.key });
  },
});

// In App root
<GrowthBookProvider growthbook={gb}>
  <App />
</GrowthBookProvider>

// In components
function ProductCard() {
  const showSavings = useFeatureIsOn("show-savings-percent");
  const cardLayout = useFeatureValue("product-card-layout", "grid");
  // ...
}
```

### Node.js Server (Express)

```bash
npm install @growthbook/growthbook
```

```typescript
import { GrowthBookClient } from '@growthbook/growthbook';

const gbClient = new GrowthBookClient({
  apiHost: "http://localhost:3100",
  clientKey: "sdk-abc123",
  trackingCallback: (experiment, result, userContext) => {
    console.log("Server Experiment", { userId: userContext.attributes.id, experimentId: experiment.key });
  }
});

await gbClient.init({ timeout: 3000 });

// Per-request: create scoped instance
app.get('/api/products', (req, res) => {
  const gb = gbClient.createScopedInstance({
    attributes: { id: req.user?.id, url: req.url }
  });

  const sortOrder = gb.getFeatureValue("product-sort", "price-asc");
  // Return products sorted by sortOrder
});
```

**Key**: `GrowthBookClient` (v1.3.0+) is a singleton — create once, reuse via `createScopedInstance()` per request.

### React Native (Expo)

**Same package as React web:**
```bash
npx expo install @growthbook/growthbook-react @growthbook/growthbook
```

```tsx
import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react';
import { setPolyfills } from '@growthbook/growthbook';
import EventSource from 'react-native-sse'; // For streaming

setPolyfills({ EventSource }); // Must be before GrowthBook creation

const gb = new GrowthBook({
  apiHost: "http://LOCAL_IP:3100", // Use machine IP, not localhost (for phone)
  clientKey: "sdk-abc123",
  trackingCallback: (experiment, result) => { /* ... */ }
});
```

**Expo Go gotchas:**
- Use machine's LAN IP (e.g., `192.168.1.x`), not `localhost` — the phone can't reach your PC's localhost
- Visual Editor experiments NOT supported in RN
- SSE needs `react-native-sse` polyfill
- Otherwise identical to React web

---

## 6. Tracking (Conversion Measurement)

### How It Works
1. SDK calls `trackingCallback` when user sees an experiment variant (exposure)
2. Your analytics tracks conversion events separately (add-to-cart, purchase, etc.)
3. GrowthBook analyzes correlation between exposures and conversions in your data warehouse

### For Our Demo: Simple Custom Tracker
Since we don't have a data warehouse, we can:
- Log exposures to console + file
- Seed mock result data into GrowthBook for the analysis demo
- The "results analysis" demo will use pre-seeded data, not live tracking

```typescript
// Simple demo tracker
trackingCallback: (experiment, result) => {
  console.log(`📊 ${experiment.key}: variant ${result.key}`);
  fetch('/api/track', {
    method: 'POST',
    body: JSON.stringify({ experimentId: experiment.key, variationId: result.key, timestamp: Date.now() })
  });
}
```

---

## 7. Docker Setup (Self-Hosted)

```yaml
services:
  mongo:
    image: "mongo:latest"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=root
      - MONGO_INITDB_ROOT_PASSWORD=password
    volumes:
      - mongodata:/data/db

  growthbook:
    image: "growthbook/growthbook:latest"
    ports:
      - "3000:3000"   # Web UI
      - "3100:3100"   # API
    depends_on:
      - mongo
    environment:
      - MONGODB_URI=mongodb://root:password@mongo:27017/growthbook?authSource=admin
    volumes:
      - uploads:/usr/local/src/app/packages/back-end/uploads

volumes:
  uploads:
  mongodata:
```

```bash
docker compose up -d
# UI at http://localhost:3000
# API at http://localhost:3100
```

---

## 8. Impact on Our Architecture

### Before (what we planned)
Build custom MCP server from scratch → connect to CopilotKit

### After (what we should do)
```
CopilotKit Chat UI
    |
    | MCP apps middleware
    v
@growthbook/mcp (official, 14 tools)
    |
    | REST API
    v
GrowthBook (Docker, localhost:3100)
    |
    | SDK endpoints
    v
Web App / Server API / Mobile App
```

### What we still need to build
1. **CopilotKit integration with @growthbook/mcp** — wire up the MCP server as a tool provider
2. **Generative UI components** — experiment cards, result dashboards rendered inline in chat
3. **Demo e-commerce app** — web (Next.js), server API (Express), mobile (Expo)
4. **Seed data script** — pre-populate GrowthBook with experiments and mock results
5. **Custom MCP tools (if gaps)** — e.g., "cross-platform rollout to 100%" might not exist in official server

### What we DON'T need to build
- MCP server (exists)
- GrowthBook API integration (MCP server handles it)
- Statistical analysis (GrowthBook handles it)

---

## Sources

- [GrowthBook REST API Docs](https://docs.growthbook.io/api/)
- [GrowthBook MCP Server Docs](https://docs.growthbook.io/integrations/mcp)
- [GrowthBook MCP GitHub](https://github.com/growthbook/growthbook-mcp)
- [MCP Server Blog Post](https://blog.growthbook.io/introducing-the-first-mcp-server-for-experimentation-and-feature-management/)
- [React SDK Docs](https://docs.growthbook.io/lib/react)
- [Node.js SDK Docs](https://docs.growthbook.io/lib/node)
- [React Native SDK Docs](https://docs.growthbook.io/lib/react-native)
- [Self-Hosting Docs](https://docs.growthbook.io/self-host)
- [Webhooks](https://docs.growthbook.io/app/webhooks)
- [Event Types](https://docs.growthbook.io/app/webhooks/event-webhooks/events)
