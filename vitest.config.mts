import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    // jsdom renders of whole tabs take ~1–2s alone and several times that with files running in parallel on a small machine.
    testTimeout: 15_000,
  },
});
