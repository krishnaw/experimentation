import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  globalSetup: "./tests/demo/global-setup.ts",
  testDir: "./tests/demo",
  timeout: 90 * 1000,
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "playwright-report/demo", open: "never" }]],
  outputDir: "scripts/screenshots/demo/videos",
  use: {
    headless: true,
    viewport: { width: 900, height: 700 },
    screenshot: "on",
    // Record a video for every test. Saved to scripts/screenshots/demo/videos/{test-name}/
    video: { mode: "on", size: { width: 900, height: 700 } },
    baseURL: "http://localhost:3050",
    // Disable browser HTTP cache so the GrowthBook SDK always fetches fresh features.
    // GrowthBook's features endpoint sets max-age=30, stale-while-revalidate=3600 which
    // would cause page.reload() to serve stale feature data after a feature is created.
    launchOptions: {
      args: ["--disable-cache"],
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
