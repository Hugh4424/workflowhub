import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { migrateLegacyBuildCodeResult } from "../scripts/migrate-legacy-build-code-result.mjs";
import { isBuildCodeMergeAuthorizing, validateStageResult } from "../scripts/validate-stage-result.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");

function legacy() {
  return {
    status: "success", error_code: "", retryable: false,
    facts: {
      changed: ["a.mjs"], tests: { command: "npm test", passed: 1, total: 1 },
      review: { status: "executed", source: "third_party", verdict: "pass", artifact_path: "/private/raw.json" },
      worktree_root: "/repo/task", task_tracking_root: "/records/task",
      phase_completion: { commit_records: [
        { phase_id: "phase-1", commit_sha: "1".repeat(40) },
        { phase_id: "phase-2", commit_sha: "2".repeat(40) },
      ], no_change_records: [] },
    },
    missing_items: [], user_decision: false, reason: "legacy pass",
  };
}

describe("legacy build-code migration", () => {
  it("preserves the byte-identical original and emits a fail-closed pending result", () => {
    const root = mkdtempSync(join(tmpdir(), "legacy-build-code-"));
    const input = join(root, "legacy.json"); const output = join(root, "current.json");
    const reports = join(root, "reports"); mkdirSync(reports);
    writeFileSync(join(reports, "phase-result-phase-2.json"), "{}\n");
    const original = `${JSON.stringify(legacy(), null, 2)}\n`; writeFileSync(input, original);
    const result = migrateLegacyBuildCodeResult({ inputPath: input, outputPath: output, historyRoot: join(root, "history"), phaseReportRoot: reports });
    expect(readFileSync(result.archivePath, "utf8")).toBe(original);
    expect(result.originalSha256).toBe(sha(original));
    expect(result.artifact.status).toBe("unknown");
    expect(result.artifact.user_decision).toBe(true);
    expect(result.artifact.facts.review).toMatchObject({ status: "pending_legacy_review", needs_human: true });
    expect(result.artifact.facts.phase_completion.phase_records).toEqual([
      expect.objectContaining({ phase_id: "phase-1", changed: true, evidence_status: "canonical_report_missing" }),
      expect.objectContaining({ phase_id: "phase-2", changed: true, evidence_status: "legacy_commit_only" }),
    ]);
    expect(validateStageResult("build-code", result.artifact).ok).toBe(true);
    expect(isBuildCodeMergeAuthorizing(result.artifact)).toBe(false);
  });

  it("rejects a fake pending migration that claims stage success", () => {
    const artifact = legacy();
    artifact.facts.review = { status: "pending_legacy_review", needs_human: true, legacy_original_sha256: "a".repeat(64), legacy_original_ref: "/archive/original.json", diagnostic: "pending" };
    artifact.facts.phase_completion = { phase_records: [{ phase_id: "phase-1", changed: true }] };
    expect(validateStageResult("build-code", artifact).ok).toBe(false);
    expect(isBuildCodeMergeAuthorizing(artifact)).toBe(false);
  });

  it("authorizes only the exact current published pass tuple", () => {
    const artifact = legacy();
    artifact.facts.review = { core_receipt_hash: "a".repeat(64), semantic_verdict: "pass", needs_human: false };
    artifact.facts.phase_completion = { phase_records: [{ phase_id: "phase-1", changed: true }] };
    expect(validateStageResult("build-code", artifact).ok).toBe(true);
    expect(isBuildCodeMergeAuthorizing(artifact)).toBe(true);
    artifact.facts.review.needs_human = true;
    expect(isBuildCodeMergeAuthorizing(artifact)).toBe(false);
  });
});
