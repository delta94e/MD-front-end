/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Vitest configuration for Code Modernization test suite.
 *
 * Run tests:
 *   npm test              → watch mode
 *   npm run test:run      → single run (CI)
 *   npm run test:coverage → with coverage report
 *   npm run test:ui       → browser UI (vitest --ui)
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,         // describe/it/expect without imports
    setupFiles: [],
    include: ["src/__tests__/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "src/__tests__/legacy-order.js"],

    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/__tests__/**",
        "src/index.ts",
        "src/bootstrap.tsx",
        "src/remotes.d.ts",
      ],
      // Coverage thresholds — enforce minimum after modernization
      thresholds: {
        lines: 80,
        functions: 90,
        branches: 80,
        statements: 80,
      },
    },

    reporter: ["verbose"],
  },
});
