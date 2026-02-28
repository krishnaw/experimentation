import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/integration",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3050",
    headless: true,
    launchOptions: { args: ["--disable-cache"] },
  },
  workers: 4,
  fullyParallel: true,
  reporter: [["html", { open: "never", outputFolder: "playwright-report/integration" }], ["list"]],
});
