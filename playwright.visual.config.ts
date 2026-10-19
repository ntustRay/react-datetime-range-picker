import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./visual",
  snapshotPathTemplate: "{testDir}/snapshots/github-windows/{arg}{ext}",
  outputDir: "test-results/visual",
  forbidOnly: Boolean(process.env.CI),
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/visual", open: "never" }],
  ],
  metadata: { baseline: "github-windows", node: process.version },
  use: {
    baseURL: "http://127.0.0.1:4173",
    locale: "en-US",
    timezoneId: "UTC",
    colorScheme: "light",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "on",
  },
  webServer: {
    command:
      "npm run demo:build && npm exec -- vite preview demo --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
