import { defineConfig, devices } from "@playwright/test";

const snapshotPathTemplate =
  process.env.GITHUB_ACTIONS === "true"
    ? "{testDir}/snapshots/github-windows/{arg}{ext}"
    : "{testDir}/snapshots/{arg}{ext}";

export default defineConfig({
  testDir: "./visual",
  snapshotPathTemplate,
  use: {
    baseURL: "http://127.0.0.1:4173",
    colorScheme: "light",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "npm.cmd run demo:build && npm.cmd exec -- vite preview demo --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
