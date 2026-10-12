import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Unit tests for the pure layers: stats, scoring, aggregation. Nothing here
 * renders a component or reaches the network; the numbers these files compute
 * are quoted in UI copy, so they are pinned where they are made.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
  },
});
