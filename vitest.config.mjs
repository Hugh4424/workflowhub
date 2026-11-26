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
      "tests/contract/c09-owned-ego-page-audit.test.mjs",
      // P3–P9 的 node:test 契约文件（证据命令用 node --test 直接调用），
      // 一并排除，避免整树 vitest 把它们当空套件收集而报 No test suite found。
      "tests/contract/unit-kernel-wiring.test.mjs",
      "tests/contract/unit-card-field-consumption.test.mjs",
      "tests/contract/skill-usage-negative.test.mjs",
      "tests/contract/phase-author-first-card.test.mjs",
      // 2026-11-25：四技能接线的 node:test 契约（由 scripts.check 直接调用），
      // 同样排除，避免整树 vitest 当空套件收集。
      "tests/contract/four-skill-wiring.test.mjs",
      "tests/contract/phase-index-write-authority.test.mjs",
      "tests/contract/prd-task-section-consumption.test.mjs",
      "tests/contract/prd-sectional-review.test.mjs",
      "tests/contract/phase-public-demo.test.mjs",
      "tests/contract/phase-independent-convergence.test.mjs",
      // P10 的 node:test 契约文件（证据命令用 node --test 直接调用），同样排除，
      // 避免整树 vitest 把它当空套件收集而报 No test suite found。
      "tests/contract/direction-handoff-source.test.mjs",
      // P11 的 node:test 契约文件（证据命令用 node --test 直接调用），同样排除，
      // 避免整树 vitest 把它当空套件收集而报 No test suite found。
      "tests/contract/direction-package-review-scope.test.mjs",
      // stylelint-fixtures 用 node:test 且要求 PAPERBUILDER_FRONTEND；Vitest 收集期
      // 会把它当空套件并 throw，故排除；其证据命令仍由 node --test 直接调用。
      "skills/frontend-component-quality/tests/stylelint-fixtures.test.mjs",
      // P3 拆包技能接线的 node:test 契约文件（证据命令用 node --test 直接调用），
      // 实跑 vitest 报 No test suite found，故排除，避免整树 vitest 当空套件收集。
      "tests/contract/task-breakdown-wiring.test.mjs",
    ],
    // Fail the run when a filter matches no files, so a mis-typed path can never
    // produce a false-green exit 0 (see memory: vitest-run-path-false-green-exit0).
    passWithNoTests: false,
  },
});
