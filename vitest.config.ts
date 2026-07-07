import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // $ is a virtual module from vite-plugin-monkey (not active in vitest).
      // Alias to a test mock so request.ts can import GM_xmlhttpRequest.
      $: new URL("tests/mocks/$", import.meta.url).pathname,
    },
  },
  test: {
    coverage: {
      exclude: ["src/main.ts"],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "coverage",
      thresholds: {
        branches: 30,
        functions: 40,
        lines: 40,
        statements: 40,
      },
    },
    deps: {
      optimizer: {
        ssr: {
          include: ["@vitest/coverage-v8"],
        },
      },
    },
    environment: "happy-dom",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    testTimeout: 10_000,
  },
});
