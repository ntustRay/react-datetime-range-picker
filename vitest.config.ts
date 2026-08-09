import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    exclude: [
      "**/e2e/**",
      "**/visual/**",
      "**/node_modules/**",
      "**/dist/**",
    ],
  },
});
