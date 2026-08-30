import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { evaluateFactFreshness, sha256 } from "../../runtime/evidence/freshness.mjs";

describe("freshness consistency (T6)", () => {
  it("shared evaluateFactFreshness is exported from runtime/evidence/freshness.mjs", () => {
    expect(typeof evaluateFactFreshness).toBe("function");
  });

  it("task-close imports evaluateFactFreshness from the same module", () => {
    const taskClose = readFileSync(new URL("../../core/task-close.mjs", import.meta.url), "utf8");
    expect(taskClose).toContain('import { evaluateFactFreshness } from "../runtime/evidence/freshness.mjs";');
  });

  it("completion-predicates accepts evaluateFactFreshness via evaluate_freshness injection", () => {
    const predicates = readFileSync(new URL("../../runtime/stage/completion-predicates.mjs", import.meta.url), "utf8");
    expect(predicates).toContain("evaluate_freshness: evaluateFreshness = null");
    expect(predicates).toContain("evaluateFreshness({");
  });

  it("stage-runtime CLI passes evaluateFactFreshness to completion predicates", () => {
    const stageRuntime = readFileSync(new URL("../../tools/cli/stage-runtime.mjs", import.meta.url), "utf8");
    expect(stageRuntime).toMatch(/evaluate_freshness:\s*evaluateFactFreshness/);
  });

  it("evaluates a simple fact as current when snapshot_tree and material_revision match", () => {
    const raw = JSON.stringify({
      schema_version: "quality-fact.v1",
      fact_id: "test-fact",
      task_id: "task-123",
      stage: "build-code",
      subject: "integration_review",
      kind: "review",
      status: "recorded",
      snapshot_tree: "abc123",
      material_revision: "mat-1",
      evidence: [],
    });
    const binding = { ref: "quality/facts/test-fact.json", sha256: sha256(raw), ...JSON.parse(raw) };
    const current = { snapshot_tree: "abc123", material_revision: "mat-1", material_scope_revisions: {} };
    const result = evaluateFactFreshness(binding, current, { read: () => raw });
    expect(result.status).toBe("current");
    expect(result.authenticated).toBe(true);
    expect(result.dependencies).toEqual({ material: "current", tree: "current", fact: "current" });
  });

  it("reports stale tree when snapshot_tree differs and no advisory/record-only exception applies", () => {
    const raw = JSON.stringify({
      schema_version: "quality-fact.v1",
      fact_id: "test-fact",
      task_id: "task-123",
      stage: "build-code",
      subject: "integration_review",
      kind: "review",
      status: "recorded",
      snapshot_tree: "abc123",
      material_revision: "mat-1",
      evidence: [],
    });
    const binding = { ref: "quality/facts/test-fact.json", sha256: sha256(raw), ...JSON.parse(raw) };
    const current = { snapshot_tree: "def456", material_revision: "mat-1", material_scope_revisions: {} };
    const result = evaluateFactFreshness(binding, current, { read: () => raw });
    expect(result.status).toBe("stale");
    expect(result.dependencies.tree).toBe("stale");
  });
});
