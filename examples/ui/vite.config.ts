import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: dirname,
  resolve: {
    // Ensure the UI tests the current, in-repo SDK source (not a published package).
    alias: {
      "prmission-sdk": path.resolve(dirname, "../../src/index.ts"),
    },
  },
  build: {
    outDir: path.resolve(dirname, "dist"),
    emptyOutDir: true,
  },
});

