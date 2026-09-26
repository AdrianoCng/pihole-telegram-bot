import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    clearMocks: true,
    restoreMocks: true,
    isolate: true,
    setupFiles: ["./src/__tests__/helpers/setup.js"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.js"],
      exclude: [
        "src/**/__tests__/**",
        "src/bot.js",
        "src/middlewares/typing.js",
        "src/helpers/index.js",
      ],
      reportsDirectory: "coverage",
      reporter: ["text", "json", "lcov", "clover"],
      // Coverage is informational; behavior tests are the pass/fail gate.
    },
  },
});
