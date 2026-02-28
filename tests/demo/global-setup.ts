import { readFileSync } from "fs";
import { join } from "path";

/**
 * Load env vars from apps/web/.env.local into the worker process environment.
 * Runs in the main Playwright process before workers are spawned, so workers
 * inherit the env via Node.js process fork semantics.
 */
export default async function globalSetup() {
  const envPath = join(process.cwd(), "apps/web/.env.local");
  try {
    const content = readFileSync(envPath, "utf-8");
    let loaded = 0;
    for (const raw of content.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      const val = line
        .slice(eq + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");
      if (key && !process.env[key]) {
        process.env[key] = val;
        loaded++;
      }
    }
    console.log(`\n  ✓ Loaded ${loaded} env vars from apps/web/.env.local`);
  } catch {
    console.warn(`  ⚠ Could not read ${envPath} — cleanup steps will be skipped`);
  }
}
