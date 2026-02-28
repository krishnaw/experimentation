import { type Page, type APIRequestContext } from "@playwright/test";
import { execFileSync } from "child_process";
import { mkdirSync } from "fs";

export const SCREENSHOT_DIR = "scripts/screenshots/demo";
mkdirSync(SCREENSHOT_DIR, { recursive: true });

/**
 * Send a message in the chat (works for both ShopDemo sidebar and Dashboard).
 */
export async function sendChatMessage(page: Page, text: string) {
  const textarea = page.locator("textarea");
  await textarea.fill(text);
  await textarea.press("Enter");
}

/**
 * Wait for an in-progress chat response to complete.
 * Detects completion by watching the textarea: it's disabled while the AI is
 * thinking and re-enabled when streaming ends.
 */
export async function waitForChatResponse(
  page: Page,
  timeoutMs = 55000
): Promise<void> {
  // Wait for loading to start (textarea becomes disabled)
  await page.waitForFunction(
    () => (document.querySelector("textarea") as HTMLTextAreaElement)?.disabled === true,
    { timeout: 10000 }
  );
  // Wait for loading to complete (textarea re-enabled)
  await page.waitForFunction(
    () => (document.querySelector("textarea") as HTMLTextAreaElement)?.disabled === false,
    { timeout: timeoutMs }
  );
  // Brief settle time for DOM to finish rendering streamed content
  await page.waitForTimeout(300);
}

/**
 * Reload the page with fresh GrowthBook features, bypassing every caching layer:
 *
 *   1. Polls the GrowthBook SDK endpoint (Playwright request context) until the
 *      feature appears — confirms the server has the new data before we reload.
 *   2. Intercepts the browser's fetch to /api/features/* and appends a
 *      ?_cb=<epoch> cache-bust query param. GrowthBook ignores unknown query
 *      params (only the clientKey path segment matters), so this is safe.
 *      The busted URL bypasses Chrome's in-memory HTTP cache (which persists
 *      across reloads even with --disable-cache) and GrowthBook's server-side
 *      response cache simultaneously.
 *   3. Strips Cache-Control / ETag / Last-Modified from the intercepted response
 *      so the browser won't cache this fresh payload either.
 *   4. Clears localStorage gbFeaturesCache so the SDK doesn't use a stale snapshot.
 *   5. Reloads and waits for networkidle — ensures the GrowthBook SDK fetch
 *      completes before the caller checks the UI.
 *
 * Falls back to a 2s wait if request/clientKey/featureId are not provided.
 */
export async function reloadWithFreshFeatures(
  page: Page,
  options?: {
    request?: APIRequestContext;
    clientKey?: string;
    featureId?: string;
    pollTimeoutMs?: number;
  }
): Promise<void> {
  if (options?.request && options?.clientKey && options?.featureId) {
    await waitForFeatureInSDK(
      options.request,
      options.clientKey,
      options.featureId,
      options.pollTimeoutMs ?? 20000
    );
  } else {
    await page.waitForTimeout(2000);
  }

  // Intercept the browser's GrowthBook features fetch and force a truly fresh
  // response by appending an epoch cache-bust query param to the request URL.
  const cacheBust = Date.now();
  await page.route("**/api/features/**", async (route) => {
    const original = route.request().url();
    const busted = original.includes("?")
      ? `${original}&_cb=${cacheBust}`
      : `${original}?_cb=${cacheBust}`;
    const response = await route.fetch({ url: busted });
    const headers = { ...response.headers() };
    headers["cache-control"] = "no-store";
    delete headers["etag"];
    delete headers["last-modified"];
    await route.fulfill({ response, headers });
  });

  await page.evaluate(() => localStorage.removeItem("gbFeaturesCache"));
  // networkidle ensures the GrowthBook SDK fetch completes before we assert UI
  await page.reload({ waitUntil: "networkidle" });
  await page.unroute("**/api/features/**");
}

/**
 * Poll the GrowthBook SDK endpoint directly until the feature appears, or timeout.
 * Returns true if the feature became visible within the timeout.
 */
export async function waitForFeatureInSDK(
  request: APIRequestContext,
  clientKey: string,
  featureId: string,
  timeoutMs = 10000
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await request.get(`http://localhost:3100/api/features/${clientKey}`);
    if (res.ok()) {
      const data = await res.json();
      if (Object.keys(data.features || {}).includes(featureId)) return true;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

/**
 * Delete a GrowthBook feature flag via the admin API.
 * Silently ignores 404 (feature didn't exist).
 */
export async function deleteGrowthBookFeature(
  request: APIRequestContext,
  featureId: string
): Promise<void> {
  const apiKey = process.env.GROWTHBOOK_SECRET_API_KEY;
  if (!apiKey) {
    console.warn(`  ⚠ GROWTHBOOK_SECRET_API_KEY not set — skipping cleanup for "${featureId}"`);
    return;
  }
  const res = await request.delete(
    `http://localhost:3100/api/v1/features/${featureId}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  if (res.ok()) {
    console.log(`  🗑  Deleted existing feature: ${featureId}`);
  }
}

/**
 * Delete a GrowthBook experiment directly via MongoDB.
 * GrowthBook REST API v1 (v4.3.0) does not support DELETE /experiments/{id}.
 * We go to MongoDB via docker exec. execFileSync (not execSync) avoids shell
 * injection — the eval script is passed as a separate argument, not shell-expanded.
 */
export async function deleteGrowthBookExperiment(
  _request: APIRequestContext,
  experimentId: string
): Promise<void> {
  try {
    execFileSync(
      "docker",
      [
        "exec", "growthbook-mongo",
        "mongosh", "growthbook", "--quiet",
        "--eval", `db.experiments.deleteOne({ id: '${experimentId}' })`,
      ],
      { stdio: "pipe" }
    );
    console.log(`  🗑  Deleted experiment: ${experimentId}`);
  } catch {
    // Docker not running or other error — silently skip
  }
}

/**
 * Find experiments by name via the GrowthBook admin API.
 */
export async function findExperimentsByName(
  request: APIRequestContext,
  name: string
): Promise<string[]> {
  const apiKey = process.env.GROWTHBOOK_SECRET_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await request.get("http://localhost:3100/api/v1/experiments", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok()) return [];
    const data = await res.json();
    return (data.experiments || [])
      .filter((e: { name: string; id: string }) =>
        e.name.toLowerCase().includes(name.toLowerCase())
      )
      .map((e: { id: string }) => e.id);
  } catch {
    return [];
  }
}
