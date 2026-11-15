import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Two projects: the server tests need real Node globals (the in-memory Postgres fails under jsdom), the UI tests need a DOM.
export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    // jsdom renders of whole tabs take ~1–2s alone and several times that with files running in parallel on a small machine.
    testTimeout: 15_000,
    projects: [
      {
        extends: true,
        test: { name: "server", environment: "node", include: ["tests/server/**/*.test.ts"] },
      },
      {
        extends: true,
        test: { name: "ui", environment: "jsdom", include: ["tests/**/*.test.{ts,tsx}"], exclude: ["tests/server/**"] },
      },
    ],
  },
});
