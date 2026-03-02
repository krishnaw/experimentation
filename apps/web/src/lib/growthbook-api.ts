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
    throw new Error(`Exp Engine API error ${res.status}: ${text}`);
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

// --- Targeting Rules ---

export interface TargetingRule {
  type: "force" | "rollout" | "experiment" | "experiment-ref";
  value?: string;
  coverage?: number;
  condition?: string;
  hashAttribute?: string;
  experimentId?: string;
  variations?: { value: string }[];
}

async function getFeatureWithRules(featureId: string) {
  const data = await gbFetch(`/features/${featureId}`);
  return data.feature;
}

export async function addTargetingRule(
  featureId: string,
  envId: string,
  rule: TargetingRule
) {
  const feature = await getFeatureWithRules(featureId);
  const envSettings = feature.environmentSettings || {};
  const env = envSettings[envId] || { enabled: true, rules: [] };
  const existingRules: any[] = env.rules || [];

  const newRule: Record<string, unknown> = { type: rule.type };
  if (rule.value !== undefined) newRule.value = rule.value;
  if (rule.coverage !== undefined) newRule.coverage = rule.coverage;
  if (rule.condition) newRule.condition = rule.condition;
  if (rule.hashAttribute) newRule.hashAttribute = rule.hashAttribute;

  return gbFetch(`/features/${featureId}`, {
    method: "POST",
    body: JSON.stringify({
      environments: {
        [envId]: { rules: [...existingRules, newRule] },
      },
    }),
  });
}

export async function updateTargetingRule(
  featureId: string,
  envId: string,
  ruleIndex: number,
  rule: Partial<TargetingRule>
) {
  const feature = await getFeatureWithRules(featureId);
  const envSettings = feature.environmentSettings || {};
  const env = envSettings[envId] || { enabled: true, rules: [] };
  const existingRules: any[] = [...(env.rules || [])];

  if (ruleIndex < 0 || ruleIndex >= existingRules.length) {
    throw new Error(
      `Rule index ${ruleIndex} out of range (${existingRules.length} rules)`
    );
  }

  const updated = { ...existingRules[ruleIndex] };
  if (rule.type !== undefined) updated.type = rule.type;
  if (rule.value !== undefined) updated.value = rule.value;
  if (rule.coverage !== undefined) updated.coverage = rule.coverage;
  if (rule.condition !== undefined) updated.condition = rule.condition;
  if (rule.hashAttribute !== undefined)
    updated.hashAttribute = rule.hashAttribute;

  existingRules[ruleIndex] = updated;

  return gbFetch(`/features/${featureId}`, {
    method: "POST",
    body: JSON.stringify({
      environments: {
        [envId]: { rules: existingRules },
      },
    }),
  });
}

// --- Saved Groups ---

export async function createSavedGroup(params: {
  name: string;
  condition: string;
}) {
  return gbFetch("/saved-groups", {
    method: "POST",
    body: JSON.stringify({
      name: params.name,
      type: "condition",
      condition: params.condition,
    }),
  });
}

export async function listSavedGroups() {
  const data = await gbFetch("/saved-groups");
  return data.savedGroups;
}

// --- Experiment Rules ---

export async function addExperimentRule(
  featureId: string,
  envId: string,
  params: {
    experimentId: string;
    variations: { value: string }[];
  }
) {
  const feature = await getFeatureWithRules(featureId);
  const envSettings = feature.environmentSettings || {};
  const env = envSettings[envId] || { enabled: true, rules: [] };
  const existingRules: any[] = env.rules || [];

  const experimentRule = {
    type: "experiment-ref",
    experimentId: params.experimentId,
    variations: params.variations,
  };

  return gbFetch(`/features/${featureId}`, {
    method: "POST",
    body: JSON.stringify({
      environments: {
        [envId]: { rules: [...existingRules, experimentRule] },
      },
    }),
  });
}
