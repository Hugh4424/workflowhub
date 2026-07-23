import { defineConfig } from "vitest/config";

// Minimal vitest config for the microkernel test suite.
// Tests live next to the modules they cover (core/*.test.mjs, scripts/*.test.mjs).
export default defineConfig({
  test: {
    // Keep the default suite safe on developer machines. Phase-specific
    // commands may still narrow the file selection, but they use one fork and
    // never create a CPU-sized worker pool.
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    fileParallelism: false,
    include: [
      "core/**/*.test.mjs",
      "scripts/**/*.test.mjs",
      "tests/**/*.test.mjs",
      "specs/**/*.test.mjs",
      "skills/**/*.test.mjs",
      "workflows/build-code/__tests__/**/*.test.mjs",
    ],
    exclude: [
      "node_modules/**",
      "specs/archive/**",
    ],
    // Fail the run when a filter matches no files, so a mis-typed path can never
    // produce a false-green exit 0 (see memory: vitest-run-path-false-green-exit0).
    passWithNoTests: false,
  },
});
