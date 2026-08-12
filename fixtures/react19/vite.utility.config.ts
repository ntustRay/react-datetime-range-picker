import { resolve } from "node:path";

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: resolve(import.meta.dirname, "src/utility.ts"),
      formats: ["es"],
      fileName: "utility-consumer",
    },
    minify: false,
    outDir: "utility-dist",
  },
});
