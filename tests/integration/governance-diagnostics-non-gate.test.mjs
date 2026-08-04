import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { validateDeletionDisposition } from "../../tools/architecture/phase0-deletion-disposition.mjs";

describe("governance diagnostics are non-gating", () => {
  it("keeps deletion proof as a diagnostic and never creates a business-stage permit", () => {
    const errors = validateDeletionDisposition({ root: process.cwd() });
    expect(errors).toEqual([]);
    expect(validateDeletionDisposition.toString()).not.toMatch(/accept|authorize|stage.*block|gate.*business/i);
  });

  it("does not convert an unproven deletion into a pass", () => {
    const errors = validateDeletionDisposition({ root: "/tmp" });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("reports manifest drift separately from consumer-reference residuals", () => {
    const root = mkdtempSync(resolve(tmpdir(), "workflowhub-governance-diagnostic-"));
    try {
      for (const relative of [
        "docs/architecture/deletion-plan.json",
        "docs/architecture/history-inventory.json",
        "docs/architecture/move-map.json",
        "docs/architecture/repository-inventory.tsv",
        "docs/architecture/retention-manifest.json",
      ]) {
        const source = resolve(process.cwd(), relative);
        const target = resolve(root, relative);
        mkdirSync(resolve(target, ".."), { recursive: true });
        cpSync(source, target, { recursive: false });
      }
      const retentionPath = resolve(root, "docs/architecture/retention-manifest.json");
      const retention = JSON.parse(readFileSync(retentionPath, "utf8"));
      retention.frozen_sources.deletion_plan.content_hash = "0".repeat(64);
      writeFileSync(retentionPath, `${JSON.stringify(retention, null, 2)}\n`);

      expect(validateDeletionDisposition({ root })).toContain("retention deletion_plan content hash drift");
      expect(validateDeletionDisposition({ root })).not.toContain("reference consumer residual");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("requires every KEEP mechanism to declare its owner and repair proof", () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "docs/architecture/retention-manifest.json"), "utf8"));
    expect(manifest.keep_until_migration.every((entry) => [
      "target", "slice", "owner", "publication_unit", "disposition", "planned_task", "proof", "close_condition",
    ].every((field) => typeof entry[field] === "string" && entry[field].length > 0))).toBe(true);
    expect(manifest.keep_until_migration.every((entry) => entry.disposition === "KEEP_UNTIL_MIGRATION")).toBe(true);
  });
});
