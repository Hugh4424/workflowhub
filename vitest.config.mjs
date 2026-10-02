import { defineConfig } from "vitest/config";

// Collection shared by explicit directory and file test entries.
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
      "skills/**/*.test.mjs",
      // CARD-04 (workflowhub-thin-core-card-04-20260919): runtime 模块的就近共置
      // 单测（CLARIFY-BP-001 甲裁定，规则见 docs/architecture/test-asset-governance-rules.md）。
      "runtime/**/*.test.mjs",
    ],
    exclude: [
      "node_modules/**",
      "specs/archive/**",
      // These contract files use the Node test runner deliberately. They are
      // invoked by their evidence commands and must not be collected by
      // Vitest as empty suites.
      "tests/contract/ui-skill-contract.test.mjs",
      "tests/contract/frontend-component-quality-static.test.mjs",
    ],
    // Fail the run when a filter matches no files, so a mis-typed path can never
    // produce a false-green exit 0 (see memory: vitest-run-path-false-green-exit0).
    passWithNoTests: false,
  },
});
