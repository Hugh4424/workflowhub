import { defineConfig } from "vitest/config";

// Minimal vitest config for the microkernel test suite.
// Tests live next to the modules they cover (core/*.test.mjs, scripts/*.test.mjs).
export default defineConfig({
  test: {
    include: ["core/**/*.test.mjs", "scripts/**/*.test.mjs", "tests/**/*.test.mjs"],
    // Fail the run when a filter matches no files, so a mis-typed path can never
    // produce a false-green exit 0 (see memory: vitest-run-path-false-green-exit0).
    passWithNoTests: false,
  },
});
