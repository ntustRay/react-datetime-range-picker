import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/styles.css"],
  format: "esm",
  dts: true,
  sourcemap: true,
  clean: true,
  deps: {
    neverBundle: ["react", "react-dom"],
  },
});
