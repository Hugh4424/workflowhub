import { defineConfig } from "vitest/config";

// Minimal vitest config for the microkernel test suite.
// Tests live next to the modules they cover (core/*.test.mjs, scripts/*.test.mjs).
export default defineConfig({
  test: {
    // Safe tests use at most two forks. Tests that write into this repository
    // are run by npm's exclusive batch instead; re-audit that list before
    // adding another source-mutating test.
    pool: "forks",
    poolOptions: {
      forks: {
        minForks: 1,
        maxForks: 2,
      },
    },
    fileParallelism: true,
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
