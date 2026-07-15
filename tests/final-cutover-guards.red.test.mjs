import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { officialStageHandler } from "../core/stage-handlers.mjs";

describe("final cutover guard contracts", () => {
  const sha = "a".repeat(64), tree = "b".repeat(40);
  const canonical = (stage, overrides = {}) => ({ schema_version: "workflowhub-receipt.v1", producer: { stage, component: "tests", version: "1" }, task_id: "task", stage, ...overrides });
  const testsReceipt = (stage, snapshotTree = tree) => canonical(stage, { command: "true", exit_code: 0, command_hash: sha, snapshot_head: tree, snapshot_tree: snapshotTree, snapshot_commit: tree, started_at: "now", completed_at: "now", output_ref: "evidence/test.txt", output_hash: sha });
  const reviewReceipt = (stage, verdict = "pass", snapshotTree = tree) => ({ version: "wh-review-result.v1", source: { provider: "fixture" }, material_id: sha, task_id: "task", stage, verdict, snapshot_tree: snapshotTree });
  const workerFor = (stage, values, currentTree = tree) => ({ stage, identity: { taskId: "task" }, readReceipt: (ref) => ({ value: values[ref], sha256: sha }), readEvidence: (ref) => ({ value: values[ref], sha256: values[`${ref}:sha256`] ?? sha }), snapshotWorkspace: () => ({ tree: currentTree }) });

  it.each([
    ["tests", "notes/tests.json"],
    ["review", "evidence/review.json"],
    ["evidence", "reviews/results/evidence.json"],
  ])("rejects a %s receipt outside its canonical namespace", async (kind, badRef) => {
    const values = {
      "notes/tests.json": { command: "true", exit_code: 0, command_hash: "a".repeat(64), snapshot_tree: "b".repeat(40), output_ref: "evidence/out", output_hash: "c".repeat(64) },
      "evidence/review.json": { version: "wh-review-result.v1", verdict: "pass", snapshot_tree: "b".repeat(40) },
      "reviews/results/evidence.json": { refs: [] },
    };
    const worker = { stage: "verify-code", identity: { taskId: "task" }, readReceipt: (ref) => ({ value: values[ref], sha256: "d".repeat(64) }) };
    const receipts = { tests: "notes/tests.json", review: "evidence/review.json", evidence: "reviews/results/evidence.json" };
    const valid = { tests: "receipts/tests.json", review: "reviews/results/review.json", evidence: "evidence/manifest.json" };
    for (const [name, ref] of Object.entries(valid)) if (name !== kind) { receipts[name] = ref; values[ref] = name === "tests" ? values["notes/tests.json"] : name === "review" ? values["evidence/review.json"] : values["reviews/results/evidence.json"]; }
    await expect(officialStageHandler("verify-code")(worker, { receipts })).rejects.toThrow(/namespace|canonical|receipt.*ref/i);
  });

  it("requires receipt schema and producer provenance instead of accepting shape-only JSON", async () => {
    const worker = { stage: "build-spec", identity: { taskId: "task" }, writeArtifact() {}, createCheckpoint() { return {}; }, readReceipt: () => ({ value: { content: "fake" }, sha256: "a".repeat(64) }) };
    await expect(officialStageHandler("build-spec")(worker, { receipts: { spec: "receipts/spec.json" } }))
      .rejects.toThrow(/schema|producer|provenance/i);
  });

  it("cannot turn a real failing test command into a passing stage", async () => {
    const values = {
      "receipts/tests.json": { task_id: "task", stage: "verify-code", command: "false", exit_code: 1, command_hash: "a".repeat(64), snapshot_tree: "b".repeat(40), output_ref: "evidence/out", output_hash: "c".repeat(64) },
      "reviews/results/review.json": { version: "wh-review-result.v1", task_id: "task", stage: "verify-code", verdict: "pass", snapshot_tree: "b".repeat(40) },
      "evidence/manifest.json": { task_id: "task", stage: "verify-code", refs: [] },
    };
    const worker = { stage: "verify-code", identity: { taskId: "task" }, readReceipt: (ref) => ({ value: values[ref], sha256: "d".repeat(64) }) };
    await expect(officialStageHandler("verify-code")(worker, { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", evidence: "evidence/manifest.json" } }))
      .rejects.toThrow(/test|exit|fail|verdict/i);
  });

  it("rejects revise_required instead of publishing a reviewed stage", async () => {
    const stage = "verify-code", values = {
      "receipts/tests.json": testsReceipt(stage),
      "reviews/results/review.json": reviewReceipt(stage, "revise_required"),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    await expect(officialStageHandler(stage)(workerFor(stage, values), { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", evidence: "evidence/manifest.json" } })).rejects.toThrow(/verdict.*pass/i);
  });

  it("rejects build-code receipts bound to different snapshot trees", async () => {
    const stage = "build-code", values = {
      "receipts/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: tree, diff_ref: "evidence/diff.patch", diff_hash: sha, phase_completion: true }),
      "receipts/tests.json": testsReceipt(stage, "c".repeat(40)),
      "reviews/results/review.json": reviewReceipt(stage),
    };
    await expect(officialStageHandler(stage)(workerFor(stage, values), { receipts: { implementation: "receipts/implementation.json", tests: "receipts/tests.json", review: "reviews/results/review.json" } })).rejects.toThrow(/same.*snapshot|snapshot.*tree/i);
  });

  it("rejects verify-code when tests/review no longer match the current tree", async () => {
    const stage = "verify-code", values = {
      "receipts/tests.json": testsReceipt(stage),
      "reviews/results/review.json": reviewReceipt(stage),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    await expect(officialStageHandler(stage)(workerFor(stage, values, "c".repeat(40)), { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", evidence: "evidence/manifest.json" } })).rejects.toThrow(/current.*snapshot|must match/i);
  });

  it("rejects acceptance evidence without stable criterion identity and schema", async () => {
    const stage = "verify-code", values = {
      "receipts/tests.json": testsReceipt(stage),
      "reviews/results/review.json": reviewReceipt(stage),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [{ ref: "evidence/ac.txt", sha256: sha }] }),
      "evidence/ac.txt": { result: "pass", refs: [] },
    };
    await expect(officialStageHandler(stage)(workerFor(stage, values), { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", evidence: "evidence/manifest.json" } })).rejects.toThrow(/acceptance_criterion_id|acceptance.*schema|criterion identity/i);
  });

  it.each([
    ["failed criterion", [{ ref: "evidence/ac-1.json", sha256: sha }], { "evidence/ac-1.json": { schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "fail", refs: [{ ref: "evidence/proof.txt", sha256: sha }] }, "evidence/proof.txt": "proof" }, /did not pass|result/i],
    ["duplicate criterion id", [{ ref: "evidence/ac-1.json", sha256: sha }, { ref: "evidence/ac-2.json", sha256: sha }], { "evidence/ac-1.json": { schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: "evidence/proof.txt", sha256: sha }] }, "evidence/ac-2.json": { schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: "evidence/proof.txt", sha256: sha }] }, "evidence/proof.txt": "proof" }, /duplicate acceptance_criterion_id/i],
    ["nested evidence hash mismatch", [{ ref: "evidence/ac-1.json", sha256: sha }], { "evidence/ac-1.json": { schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: "evidence/proof.txt", sha256: sha }] }, "evidence/proof.txt": "proof", "evidence/proof.txt:sha256": "0".repeat(64) }, /hash mismatch/i],
  ])("rejects invalid acceptance-evidence.v1: %s", async (_label, refs, entities, error) => {
    const stage = "verify-code", values = {
      "receipts/tests.json": testsReceipt(stage), "reviews/results/review.json": reviewReceipt(stage),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs }), ...entities,
    };
    await expect(officialStageHandler(stage)(workerFor(stage, values), { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", evidence: "evidence/manifest.json" } })).rejects.toThrow(error);
  });

  it("verifies every referenced file exists and matches its declared hash", () => {
    const runner = readFileSync(resolve("core/stage-runner.mjs"), "utf8");
    expect(runner).toMatch(/(?:verify|assert).*Evidence|evidence.*(?:exists|hash)/i);
    expect(runner).toMatch(/output_ref[\s\S]*(?:readRecord|sha256)/i);
  });

  it("uses an epoch-bound quiescing protocol before switching storage roots", () => {
    const source = readFileSync(resolve("scripts/migrate-task-v2.mjs"), "utf8");
    expect(source).toMatch(/assertMigrationAuthority[\s\S]*expectedEpoch:\s*options\.epoch/);
    const authority = readFileSync(resolve("core/runtime-mode.mjs"), "utf8");
    expect(authority).toMatch(/assertMigrationAuthority[\s\S]*quiescing[\s\S]*epoch/i);
  });

  it("keeps checkpoint refs unpublished until a plan-hash-bound confirmation is accepted", () => {
    const checkpoint = readFileSync(resolve("core/git-checkpoint.mjs"), "utf8");
    const kernel = readFileSync(resolve("core/task-kernel-implementation.mjs"), "utf8");
    expect(checkpoint).not.toMatch(/update-ref/);
    expect(kernel).toMatch(/confirmation[^\n]*plan_hash|plan_hash[^\n]*confirmation/i);
    expect(kernel).toMatch(/acceptAttempt[\s\S]*update-ref/);
    expect(kernel).toMatch(/reject[\s\S]*(?:delete-ref|no ref|unpublished)/i);
  });

  it("verifies checkpoint ancestry at acceptance", () => {
    const kernel = readFileSync(resolve("core/task-kernel-implementation.mjs"), "utf8");
    expect(kernel).toMatch(/acceptAttempt[\s\S]*(?:merge-base|isAncestor|ancestry)/i);
  });

  it("does not exempt test directories wholesale and keeps fixture exceptions file-scoped", () => {
    const source = readFileSync(resolve("scripts/check-task-record-paths.mjs"), "utf8");
    expect(source).not.toMatch(/rel\.includes\("\/__tests__\/"\)|\(\?:\^\|\\\/\)tests\?\\\//);
    expect(source).toMatch(/FIXTURE_ALLOWLIST/);
  });

  it("allows specs task-path construction only inside ArtifactDir", () => {
    const source = readFileSync(resolve("scripts/check-task-record-paths.mjs"), "utf8");
    expect(source).toMatch(/specs[\s\S]+ArtifactDir product authority/);
    expect(source).toMatch(/literal specs path derivation is only legal in core\/artifact-dir\.mjs/);
  });
});
