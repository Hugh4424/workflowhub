import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  listDeliveryFiles,
  renderInventory,
  validateInventory,
} from "../../tools/architecture/inventory.mjs";
import {
  buildReport,
  validateReport,
} from "../../tools/architecture/complexity-report.mjs";

describe("repository architecture inventory", () => {
  it("classifies the complete delivery tree and is reproducible without self-hashing", () => {
    const actual = readFileSync("docs/architecture/repository-inventory.tsv", "utf8");
    expect(validateInventory(actual)).toEqual([]);
    expect(actual).toBe(renderInventory());
    expect(actual).toContain("docs/architecture/repository-inventory.tsv\tkeep\t");
    expect(actual).toContain("\tSELF\n");
    expect(actual).toContain("tools/architecture/inventory.mjs\tkeep\t");
    expect(actual).toContain("specs/workflowhub-complexity-governance-v2/spec.md\tkeep\t");
  });

  it("uses the caller alternate index and still includes untracked delivery files", () => {
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
        "delivery.mjs",
        "tracked.mjs",
      ]);
      expect(renderInventory({ root, env })).toContain("delivery.mjs\tkeep\t");
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(indexRoot, { recursive: true, force: true });
    }
  });

  it("publishes every required complexity budget and hard-zero target", () => {
    const actual = JSON.parse(readFileSync("docs/architecture/complexity-baseline.json", "utf8"));
    expect(validateReport(actual)).toEqual([]);
    expect(actual).toEqual(buildReport());
    expect(actual.measurements.test_support_lines.actual).toBeGreaterThan(0);
    expect(actual.measurements.formal_test_files.actual).toBeGreaterThan(0);
    expect(actual.budgets.formal_test_lines.actual).toBeGreaterThan(0);
    expect(actual.measurements.persistent_object_families.names).toEqual(
      [...actual.measurements.persistent_object_families.names].sort(),
    );
    expect(actual.budgets.persistent_object_families.actual)
      .toBe(actual.measurements.persistent_object_families.names.length);
    expect(actual.hard_gates.bundle_forbidden_content.actual)
      .toBe(actual.measurements.bundle_content_audit.violations.length);
    expect(actual.measurements.bundle_content_audit.manifests).toBeGreaterThan(0);
    expect(actual.runtime_boundary).toMatchObject({
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
    expect(Object.keys(actual.hard_gates).sort()).toEqual([
      "bundle_forbidden_content",
      "dedicated_recovery_state",
      "dual_write_markers",
    ]);
    expect(actual.distribution_boundary).toMatchObject({
      node_modules_tracked_files: 0,
      node_modules_gitignored: true,
      clean_install_source: "package.json + package-lock.json",
    });
  });
});
