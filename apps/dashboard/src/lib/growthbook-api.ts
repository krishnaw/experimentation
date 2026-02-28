const GB_API_URL = process.env.GROWTHBOOK_API_URL || "http://localhost:3100";
const GB_SECRET_KEY = process.env.GROWTHBOOK_SECRET_API_KEY || "";

async function gbFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${GB_API_URL}/api/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${GB_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GrowthBook API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function listExperiments() {
  const data = await gbFetch("/experiments?limit=25");
  return data.experiments.map((e: any) => ({
    id: e.id,
    name: e.name,
    status: e.status,
    trackingKey: e.trackingKey,
    variations: e.variations?.map((v: any) => v.name),
    results: e.results,
  }));
}

export async function createExperiment(params: {
  name: string;
  trackingKey: string;
  hypothesis?: string;
  variations: { name: string; description?: string }[];
}) {
  // Fetch first project and first datasource in parallel.
  // Project: assign so the experiment appears in the GrowthBook UI project view.
  // Datasource: required when configured; only include both datasourceId +
  //   assignmentQueryId together — sending one without the other is a 400 error.
  // assignmentQueryId is always required by the schema; empty string = no query.
  let projectId: string | undefined;
  let datasourceId: string | undefined;
  let assignmentQueryId: string | undefined;

  await Promise.all([
    gbFetch("/projects?limit=1").then((d) => {
      projectId = d.projects?.[0]?.id;
    }).catch(() => {}),
    gbFetch("/datasources?limit=1").then((d) => {
      const ds = d.datasources?.[0];
      if (ds) {
        datasourceId = ds.id;
        const exposureQueries: any[] = ds.settings?.queries?.exposure ?? [];
        assignmentQueryId = exposureQueries[0]?.id;
      }
    }).catch(() => {}),
  ]);

  const body: Record<string, unknown> = {
    name: params.name,
    trackingKey: params.trackingKey,
    hypothesis: params.hypothesis || "",
    // assignmentQueryId is required by the GrowthBook API schema even without a datasource.
    // An empty string is accepted and means "no assignment query configured".
    assignmentQueryId: assignmentQueryId || "",
    variations: params.variations.map((v, i) => ({
      key: String(i),
      name: v.name,
      description: v.description || "",
    })),
  };
  if (projectId) body.project = projectId;
  if (datasourceId && assignmentQueryId) {
    body.datasourceId = datasourceId;
  }

  return gbFetch("/experiments", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getExperimentResults(experimentId: string) {
  try {
    return await gbFetch(`/experiments/${experimentId}/results`);
  } catch {
    return { error: "No results available yet — experiment may not have enough data." };
  }
}

export async function listFeatures() {
  const data = await gbFetch("/features?limit=25");
  return data.features.map((f: any) => ({
    id: f.id,
    valueType: f.valueType,
    defaultValue: f.defaultValue,
    description: f.description,
    environments: Object.keys(f.environmentSettings || {}),
  }));
}

export async function createFeature(params: {
  id: string;
  valueType: string;
  defaultValue: string;
  description?: string;
}) {
  // Enable in all environments so the SDK serves the feature immediately after creation.
  // Without this, newly created features are disabled by default and the SDK returns null.
  // Fall back to "production" if listEnvironments() fails or returns empty — "production"
  // is GrowthBook's default environment on every fresh install.
  const environments: Record<string, { enabled: boolean; rules: [] }> = {};
  try {
    const envList = await listEnvironments();
    for (const env of envList || []) {
      environments[env.id] = { enabled: true, rules: [] };
    }
  } catch {
    // ignore
  }
  if (Object.keys(environments).length === 0) {
    environments["production"] = { enabled: true, rules: [] };
  }

  return gbFetch("/features", {
    method: "POST",
    body: JSON.stringify({
      id: params.id,
      valueType: params.valueType,
      defaultValue: params.defaultValue,
      description: params.description || "",
      owner: "AI Agent",
      environments,
    }),
  });
}

export async function updateFeature(
  id: string,
  params: { defaultValue?: string; description?: string }
) {
  return gbFetch(`/features/${id}`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function listMetrics() {
  const data = await gbFetch("/metrics?limit=25");
  return data.metrics.map((m: any) => ({
    id: m.id,
    name: m.name,
    type: m.type,
    description: m.description,
  }));
}

export async function listEnvironments() {
  const data = await gbFetch("/environments");
  return data.environments;
}
