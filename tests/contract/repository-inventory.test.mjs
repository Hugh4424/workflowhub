import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  listDeliveryFiles,
  listUntrackedFiles,
  governanceTreeHash,
  renderInventory,
  TASK_ONLY_GOVERNANCE_PATHS,
  taskOnlyConsumerReferenceErrors,
  zeroGateErrors,
  validateDeletionProof,
  validateInventory,
  validateTrackedTestDispositions,
} from "../../tools/architecture/inventory.mjs";
import {
  buildReport,
  buildFinalReport,
  validateFinalReport,
  validateReport,
} from "../../tools/architecture/complexity-report.mjs";

describe("repository architecture inventory", () => {
  const historicalBytes = (path) => execFileSync("git", ["show", `HEAD:${path}`], { encoding: "utf8" });

  it("keeps the published inventory immutable and validates the current tree in memory", () => {
    const actual = readFileSync("docs/architecture/repository-inventory.tsv", "utf8");
    const current = renderInventory();
    expect(actual).toBe(historicalBytes("docs/architecture/repository-inventory.tsv"));
    expect(validateInventory(current)).toEqual([]);
    expect(current).toContain("docs/architecture/repository-inventory.tsv\tkeep\t");
    expect(current).toContain("\tSELF\n");
    expect(current).toContain("tools/architecture/inventory.mjs\tkeep\t");
    expect(current).toContain("specs/archive/workflowhub-complexity-governance-v2/spec.md\tarchive\t");
    expect(validateDeletionProof()).toEqual([]);
    expect(validateTrackedTestDispositions(current)).toEqual([]);
  });

  it("uses the caller alternate index for tracked delivery files and audits untracked files separately", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-inventory-"));
    const indexRoot = mkdtempSync(join(tmpdir(), "workflowhub-index-"));
    const alternateIndex = join(indexRoot, "alternate.index");
    try {
      execFileSync("git", ["init", "-q"], { cwd: root });
      execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
      execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
      writeFileSync(join(root, ".gitignore"), "node_modules/\n", "utf8");
      writeFileSync(join(root, "tracked.mjs"), "export const tracked = true;\n", "utf8");
      execFileSync("git", ["add", ".gitignore", "tracked.mjs"], { cwd: root });
      execFileSync("git", ["commit", "-qm", "baseline"], { cwd: root });
      writeFileSync(join(root, "delivery.mjs"), "export const delivery = true;\n", "utf8");
      writeFileSync(join(root, "alternate.mjs"), "export const alternate = true;\n", "utf8");
      mkdirSync(join(root, "node_modules"));
      writeFileSync(join(root, "node_modules/ignored.mjs"), "ignored\n", "utf8");
      const env = { ...process.env, GIT_INDEX_FILE: alternateIndex };
      execFileSync("git", ["read-tree", "HEAD"], { cwd: root, env });
      execFileSync("git", ["add", "alternate.mjs"], { cwd: root, env });

      expect(listDeliveryFiles({ root, env })).toEqual([
        ".gitignore",
        "alternate.mjs",
        "tracked.mjs",
      ]);
      expect(renderInventory({ root, env })).not.toContain("delivery.mjs\tkeep\t");
      expect(listUntrackedFiles({ root, env })).toEqual(["delivery.mjs"]);

      // A deletion is visible in `git ls-files` until it is staged.  Final
      // inventory must describe the live delivery tree, not a stale index row.
      unlinkSync(join(root, "tracked.mjs"));
      expect(listDeliveryFiles({ root, env })).not.toContain("tracked.mjs");
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(indexRoot, { recursive: true, force: true });
    }
  });

  it("keeps archived phase-9 evidence and derived governance reports out of the authenticated source tree", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-governance-tree-"));
    try {
      execFileSync("git", ["init", "-q"], { cwd: root });
      execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
      execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
      writeFileSync(join(root, "runtime.mjs"), "export const version = 1;\n", "utf8");
      execFileSync("git", ["add", "runtime.mjs"], { cwd: root });
      execFileSync("git", ["commit", "-qm", "baseline"], { cwd: root });
      const baseline = governanceTreeHash({ root });

      mkdirSync(join(root, "evidence", "phase-9"), { recursive: true });
      mkdirSync(join(root, "docs", "architecture"), { recursive: true });
      writeFileSync(join(root, "evidence", "phase-9", "final-gates.json"), JSON.stringify({ snapshot_tree: baseline }), "utf8");
      writeFileSync(join(root, "docs", "architecture", "final-coverage-audit.md"), "derived audit\n", "utf8");
      execFileSync("git", ["add", "."], { cwd: root });
      expect(governanceTreeHash({ root })).toBe(baseline);

      writeFileSync(join(root, "runtime.mjs"), "export const version = 2;\n", "utf8");
      execFileSync("git", ["add", "runtime.mjs"], { cwd: root });
      expect(governanceTreeHash({ root })).not.toBe(baseline);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("uses an exact task-only allowlist and checks live paths without the legacy alias", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-task-only-gate-"));
    try {
      expect(TASK_ONLY_GOVERNANCE_PATHS).toEqual([
        "tools/architecture/deletion-proof.mjs",
        "tools/architecture/test-disposition.mjs",
        "tools/architecture/verify-migration-proof.mjs",
        "tests/contract/deletion-proof.test.mjs",
        "tests/contract/test-disposition.test.mjs",
        "docs/architecture/test-disposition.tsv",
      ]);

      for (const path of TASK_ONLY_GOVERNANCE_PATHS) {
        const taskOnlyPath = join(root, path);
        mkdirSync(dirname(taskOnlyPath), { recursive: true });
        writeFileSync(taskOnlyPath, "temporary task-only artifact\n", "utf8");
      }
      // A legacy evidence file is permanent historical evidence and must not
      // accidentally satisfy or trigger this distinct task-only gate.
      mkdirSync(join(root, "docs", "architecture"), { recursive: true });
      writeFileSync(join(root, "docs", "architecture", "legacy-import-proof.json"), "{}\n", "utf8");

      expect(zeroGateErrors("task-only-governance", { root })).toEqual(
        TASK_ONLY_GOVERNANCE_PATHS.map((path) => `task-only governance path still present: ${path}`),
      );

      for (const path of TASK_ONLY_GOVERNANCE_PATHS) rmSync(join(root, path));
      expect(zeroGateErrors("task-only-governance", { root })).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps a complete T054 deletion proof for every task-only artifact", () => {
    const proof = JSON.parse(readFileSync("docs/architecture/deletions-proof.json", "utf8"));
    const taskOnlyEntries = proof.deletions.filter(({ path }) => TASK_ONLY_GOVERNANCE_PATHS.includes(path));
    expect(taskOnlyEntries.map(({ path }) => path).sort()).toEqual([...TASK_ONLY_GOVERNANCE_PATHS].sort());
    for (const entry of taskOnlyEntries) {
      expect(entry).toMatchObject({
        absent: true,
        consumer_zero_ref: "tools/architecture/inventory.mjs#task-only-governance",
        reverse_reference_count: 0,
        authorization_ref: "specs/workflowhub-complexity-governance-v2/tasks.md#T054",
      });
      expect(entry.replacement_oracle).toEqual(expect.any(String));
    }
    expect(validateDeletionProof()).toEqual([]);
  });

  it("rejects a live runtime consumer of a deleted task-only artifact", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-task-only-consumer-"));
    try {
      execFileSync("git", ["init", "-q"], { cwd: root });
      execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
      execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
      const consumer = join(root, "core", "consumer.mjs");
      mkdirSync(dirname(consumer), { recursive: true });
      writeFileSync(consumer, `export const retired = "${TASK_ONLY_GOVERNANCE_PATHS[0]}";\n`, "utf8");
      execFileSync("git", ["add", "core/consumer.mjs"], { cwd: root });
      expect(taskOnlyConsumerReferenceErrors({ root })).toEqual([
        "task-only governance consumer remains: core/consumer.mjs -> tools/architecture/deletion-proof.mjs",
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps the published complexity baseline immutable and diagnoses the current tree in memory", () => {
    const actual = JSON.parse(readFileSync("docs/architecture/complexity-baseline.json", "utf8"));
    const current = buildReport();
    expect(`${JSON.stringify(actual, null, 2)}\n`).toBe(historicalBytes("docs/architecture/complexity-baseline.json"));
    expect(validateReport(current)).toEqual([]);
    expect(current.measurements.test_support_lines.actual).toBeGreaterThan(0);
    expect(current.measurements.formal_test_files.actual).toBeGreaterThan(0);
    expect(current.budgets.formal_test_lines.actual).toBeGreaterThan(0);
    expect(current.measurements.persistent_object_families.names).toEqual(
      [...current.measurements.persistent_object_families.names].sort(),
    );
    expect(current.budgets.persistent_object_families.actual)
      .toBe(current.measurements.persistent_object_families.names.length);
    expect(current.hard_gates.bundle_forbidden_content.actual)
      .toBe(current.measurements.bundle_content_audit.violations.length);
    for (const gate of Object.values(current.hard_gates)) {
      expect(gate.actual).toBe(gate.required_final);
    }
    expect(current.measurements.bundle_content_audit.manifests).toBeGreaterThan(0);
    expect(current.runtime_boundary).toMatchObject({
      node: {
        actual: process.version,
        requirement: ">=24.14.0 <25",
        compatible: true,
        source: "process.version",
      },
      npm: {
        requirement: ">=11.9.0 <12",
        compatible: true,
        source: "npm --version",
      },
    });
    expect(Object.keys(current.hard_gates).sort()).toEqual([
      "bundle_forbidden_content",
      "dedicated_recovery_state",
      "dual_write_markers",
    ]);
    expect(current.distribution_boundary).toMatchObject({
      node_modules_tracked_files: 0,
      node_modules_gitignored: true,
      clean_install_source: "package.json + package-lock.json",
    });
  });

  it("rejects a reproducible report when any declared hard-zero gate is nonzero", () => {
    const report = buildReport();
    report.hard_gates.dedicated_recovery_state.actual = 1;
    expect(validateReport(report)).toContain("hard gate dedicated_recovery_state is incomplete");
  });

  it("keeps the final report immutable and can build a current diagnostic report in memory", () => {
    const actual = JSON.parse(readFileSync("docs/architecture/final-complexity-report.json", "utf8"));
    const current = buildFinalReport();
    expect(`${JSON.stringify(actual, null, 2)}\n`).toBe(historicalBytes("docs/architecture/final-complexity-report.json"));
    expect(validateFinalReport(current)).toEqual([]);
    expect(current.build_report.hard_gates.dedicated_recovery_state).toMatchObject({ actual: 0, required_final: 0 });
    expect(current.snapshot_tracked_tree_sha256).toMatch(/^[a-f0-9]{64}$/);
  });
});
