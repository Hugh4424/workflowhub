import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createTask, createTaskKernel } from "../core/task-handle.mjs";
import { createCanonicalSource, createSourceManifest } from "../core/canonical-source.mjs";
import { ArtifactDir } from "../core/artifact-dir.mjs";
import { readCurrentTaskMaterialRevision } from "../core/stage-content-evidence.mjs";
import { validateReplayRecordSet } from "../scripts/validate-stage-replay.mjs";

const temporary = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function fixture() {
  const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-legacy-read-")));
  temporary.push(storageRoot);
  const repo = join(storageRoot, "repo");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  writeFileSync(join(repo, "README.md"), "fixture\n");
  const materialRoot = join(repo, "specs", "legacy-task");
  mkdirSync(materialRoot, { recursive: true });
  for (const file of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) {
    writeFileSync(join(materialRoot, file), `initial ${file}\n`);
  }
  execFileSync("git", ["add", "."], { cwd: repo });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: repo });
  const task = createTask({
    storageRoot,
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: "legacy-task",
      created_at: "2026-07-26T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
    },
  });
  const artifacts = ArtifactDir.open(repo, task);
  return { repo, task, artifacts, kernel: createTaskKernel(task, { artifacts }) };
}

function installHistoricalAccepted({ repo, task }) {
  const baseline = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim();
  const attempt = {
    schema_version: "task-attempt.v2",
    task_id: "legacy-task",
    stage: "make-decision",
    attempt_id: "make-decision:attempt-0001",
    created_at: "2026-07-26T00:01:00.000Z",
    facts: { worktree_root: repo, baseline_commit: baseline },
    evidence_refs: [],
    missing_items: [],
    upstream_refs: [],
  };
  const attemptRaw = `${JSON.stringify(attempt, null, 2)}\n`;
  const accepted = {
    schema_version: "task-accepted.v2",
    task_id: "legacy-task",
    stage: "make-decision",
    attempt_ref: "attempt-0001.json",
    integrity_hash: sha256(attemptRaw),
    acceptance_mode: "human",
    human_confirmation_ref: "confirmations/make-decision/attempt-0001.json",
    accepted_at: "2026-07-26T00:02:00.000Z",
    upstream_refs: [],
  };
  const resultDir = join(task.taskPath, "results", "make-decision");
  mkdirSync(resultDir, { recursive: true });
  writeFileSync(join(resultDir, "attempt-0001.json"), attemptRaw);
  writeFileSync(join(resultDir, "accepted.json"), `${JSON.stringify(accepted, null, 2)}\n`);
  return {
    attemptPath: join(resultDir, "attempt-0001.json"),
    acceptedPath: join(resultDir, "accepted.json"),
  };
}

afterEach(() => {
  while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true });
});

describe("legacy accepted content compatibility", () => {
  it("reads an old accepted result as legacy/unknown without changing its bytes", () => {
    const state = fixture();
    const paths = installHistoricalAccepted(state);
    const before = {
      attempt: readFileSync(paths.attemptPath),
      accepted: readFileSync(paths.acceptedPath),
    };

    const view = state.kernel.readAccepted("make-decision");

    expect(view).toMatchObject({
      legacy: true,
      audit_status: "unknown",
      continuation_condition: "publish_new_attempt_with_v1_audit_carrier",
    });
    expect(readFileSync(paths.attemptPath)).toEqual(before.attempt);
    expect(readFileSync(paths.acceptedPath)).toEqual(before.accepted);
  });

  it("still rejects every new publication that omits the audit carrier and content refs", () => {
    const { repo, kernel } = fixture();
    const baseline = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim();
    expect(() => kernel.publishAttempt("make-decision", {
      facts: { worktree_root: repo, baseline_commit: baseline },
    })).toThrow(/audit carrier|content evidence/i);
  });
});

describe("append-only stage continuation", () => {
  it("publishes one task-global current material chain from authenticated artifact bytes", () => {
    const { repo, task, artifacts, kernel } = fixture();
    const ledgerRaw = "fixture requirements ledger\n";
    const coverageRaw = "fixture requirements coverage\n";
    task.createRecordAtomic("requirements/ledger.json", ledgerRaw);
    task.createRecordAtomic("requirements/coverage.json", coverageRaw);
    task.createRecordAtomic("requirements/current.json", `${JSON.stringify({
      schema_version: "requirements-current.v1",
      task_id: "legacy-task",
      generation: 1,
      ledger_ref: "requirements/ledger.json",
      ledger_hash: sha256(ledgerRaw),
      content_hash: sha256(ledgerRaw),
      coverage_ref: "requirements/coverage.json",
      coverage_hash: sha256(coverageRaw),
      parent_ref: null,
    }, null, 2)}\n`);
    const first = kernel.publishMaterialRevision({
      change_summary: "capture initial current materials",
      source_refs: ["task.json"],
    });
    const firstRaw = task.readRecord(first.revision_ref);
    artifacts.writeAtomic("spec.md", "updated spec\n");
    const secondKernel = createTaskKernel(task, { artifacts: ArtifactDir.open(repo, task) });
    const second = secondKernel.publishMaterialRevision({
      change_summary: "update spec",
      source_refs: ["task.json"],
      expected_current_ref: first.revision_ref,
    });
    const current = readCurrentTaskMaterialRevision({ task });
    expect(current.value).toMatchObject({
      task_id: "legacy-task",
      parent_revision: first.revision_id,
      previous_ref: first.revision_ref,
      changed_files: ["spec.md"],
      change_summary: "update spec",
    });
    expect(current.value.hashes["spec.md"]).toBe(sha256("updated spec\n"));
    expect(task.readRecord(first.revision_ref)).toBe(firstRaw);
    expect(() => secondKernel.publishMaterialRevision({
      change_summary: "forged hash",
      source_refs: ["task.json"],
      hashes: { "spec.md": "f".repeat(64) },
    })).toThrow(/caller fields are forbidden|unknown/i);
    expect(() => secondKernel.publishMaterialRevision({
      change_summary: "stale writer",
      source_refs: ["task.json"],
      expected_current_ref: first.revision_ref,
    })).toThrow(/MATERIAL_REVISION_CONFLICT/);
    expect(second.current).toBe(true);
  });

  it("appends and supersedes the requirements ledger for the same task without replacing old bytes", () => {
    const { task, kernel } = fixture();
    kernel.startStageRun("build-spec", { reason: "requirements revision fixture" });
    const input = (revision, text, supersedes = []) => {
      const canonicalSource = createCanonicalSource({
        source_type: "offline_fixture",
        source_id: "same-task-requirements",
        revision,
        requirements: ["R1"],
      });
      const sourceManifest = createSourceManifest({
        canonical_source: canonicalSource,
        atoms: [{
          requirement_id: "R1",
          text,
          owner: "product",
          authority: "test",
          derived_from: [],
          supersedes,
          status: "accepted",
          stale: false,
        }],
      }).manifest;
      return {
        source_manifest: sourceManifest,
        mappings: {
          R1: {
            decision_ref: { kind: "decision", uri_or_path: "decision://R1", content_hash: "b".repeat(64) },
            artifact_refs: [{ kind: "artifact", uri_or_path: "artifact://R1", content_hash: "c".repeat(64) }],
            acceptance_criteria_refs: [{ kind: "ac", uri_or_path: "ac://R1", content_hash: "d".repeat(64) }],
          },
        },
      };
    };
    const first = kernel.publishRequirementsLedger("build-spec", input("r1", "Initial requirement."));
    const firstRaw = task.readRecord(first.ledger_ref);
    const second = kernel.publishRequirementsLedger("build-spec", input("r2", "Updated requirement."));
    const secondRaw = task.readRecord(second.ledger_ref);
    const third = kernel.publishRequirementsLedger("build-spec", input("r3", "Third requirement."));

    expect(second, "ORACLE-MAT: same-task requirements changes append a superseding ledger revision").toMatchObject({
      parent_ref: first.ledger_ref,
      current: true,
    });
    expect(second.ledger_ref).not.toBe(first.ledger_ref);
    expect(task.readRecord(first.ledger_ref)).toBe(firstRaw);
    expect(JSON.parse(secondRaw)).toMatchObject({
      schema_version: "requirements-ledger-revision.v1",
      parent_ref: first.ledger_ref,
      supersedes: [first.ledger_ref],
    });
    expect(third).toMatchObject({
      parent_ref: second.ledger_ref,
      supersedes: [second.ledger_ref],
      current: true,
    });
    expect(task.readRecord(second.ledger_ref)).toBe(secondRaw);
    expect(JSON.parse(task.readRecord(third.ledger_ref))).toMatchObject({
      parent_ref: second.ledger_ref,
      supersedes: [second.ledger_ref],
    });
    expect(JSON.parse(task.readRecord("requirements/current.json")).ledger_ref).toBe(third.ledger_ref);
  });

  it("binds an unaccepted historical attempt and reviews without changing their bytes", () => {
    const { repo, task, kernel } = fixture();
    const attemptRef = "results/make-decision/attempt-0001.json";
    const attempt = {
      schema_version: "task-attempt.v2",
      task_id: "legacy-task",
      stage: "make-decision",
      attempt_id: "make-decision:attempt-0001",
      created_at: "2026-07-26T00:01:00.000Z",
      facts: {
        worktree_root: repo,
        baseline_commit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim(),
      },
      evidence_refs: [],
      missing_items: [],
      upstream_refs: [],
    };
    // Historical records are installed as raw fixtures; continuation may only read them.
    const attemptRaw = `${JSON.stringify(attempt, null, 2)}\n`;
    const resultDir = join(task.taskPath, "results", "make-decision");
    mkdirSync(resultDir, { recursive: true });
    writeFileSync(join(resultDir, "attempt-0001.json"), attemptRaw);
    const reviewRef = "reviews/results/historical.json";
    const reviewRaw = "{\"legacy\":true}\n";
    mkdirSync(join(task.taskPath, "reviews", "results"), { recursive: true });
    writeFileSync(join(task.taskPath, reviewRef), reviewRaw);

    const result = kernel.createStageContinuation("make-decision", {
      reason: "replay with the current content contract",
      previous_attempt_ref: attemptRef,
      previous_review_refs: [reviewRef],
    });
    const run = kernel.startStageRun("make-decision", {
      reason: "continued replay",
      continuation_ref: result.continuation_ref,
    });

    expect(result).toMatchObject({
      continuation_ref: "results/make-decision/revisions/continuation-0001.json",
    });
    expect(run.run).toMatchObject({
      continuation_ref: result.continuation_ref,
      continuation_hash: result.continuation_hash,
    });
    expect(readFileSync(join(task.taskPath, attemptRef), "utf8")).toBe(attemptRaw);
    expect(readFileSync(join(task.taskPath, reviewRef), "utf8")).toBe(reviewRaw);
  });

  it("rejects cross-stage, path injection, and an omitted existing acceptance", () => {
    const state = fixture();
    const paths = installHistoricalAccepted(state);
    const input = {
      reason: "continued replay",
      previous_attempt_ref: "results/make-decision/attempt-0001.json",
      previous_review_refs: [],
    };
    expect(() => state.kernel.createStageContinuation("make-decision", input)).toThrow(/bind the existing accepted/i);
    expect(() => state.kernel.createStageContinuation("build-spec", input)).toThrow(/same task and stage/i);
    expect(() => state.kernel.createStageContinuation("make-decision", {
      ...input,
      previous_attempt_ref: "../attempt-0001.json",
    })).toThrow(/same task and stage/i);
    expect(readFileSync(paths.attemptPath)).toBeTruthy();
  });
});

describe("complete stage replay validation", () => {
  function completeRecords() {
    const runId = "make-decision:0002:fixture";
    const tree = "a".repeat(40);
    const continuationRef = "results/make-decision/revisions/continuation-0001.json";
    const continuationRaw = "{}\n";
    const decisionReceiptRef = `receipts/revisions/decision/${"b".repeat(64)}.json`;
    const markdown = "# Decision\n";
    const evidence = (kind, payload = {}) => ({
      kind, task_id: "legacy-task", stage: "make-decision", workflow_run_id: runId,
      snapshot_tree: tree, payload,
    });
    return {
      taskId: "legacy-task", continuationRef, continuationHash: sha256(continuationRaw),
      continuation: { schema_version: "stage-continuation.v1", task_id: "legacy-task", stage: "make-decision" },
      run: { schema_version: "stage-run.v1", task_id: "legacy-task", stage: "make-decision", workflow_run_id: runId, continuation_ref: continuationRef, continuation_hash: sha256(continuationRaw) },
      talks: [1, 2, 3].map((round) => evidence("interaction-completion.v1", { rounds: [{ round }] })),
      grill: evidence("interaction-completion.v1", { rounds: [{ question_number: 1 }] }),
      aggregate: evidence("interaction-completion.v1", { workspace_tree: tree, decision_ref: decisionReceiptRef, decision_hash: "c".repeat(64) }),
      aggregateRef: "evidence/stage-content/root/interaction-completion.aggregate.json",
      coverage: evidence("decision-coverage-audit.v1", { decision_log_ref: "receipts/decision-log/final.md", summary: { missing: 0 } }),
      coverageRef: "evidence/stage-content/root/decision-coverage-audit.v1.json",
      decisionReceiptRef, decisionReceiptHash: "c".repeat(64),
      decisionReceipt: { decision_ref: "receipts/decision-log/final.md", decision_hash: sha256(markdown) },
      decisionMarkdownRef: "receipts/decision-log/final.md", decisionMarkdownHash: sha256(markdown), decisionMarkdown: markdown,
      reviews: {
        direction: { task_id: "legacy-task", stage: "make-decision", review_track: "direction", snapshot_tree: tree },
        detail: { task_id: "legacy-task", stage: "make-decision", review_track: "detail", snapshot_tree: tree },
      },
      reviewRuns: { direction: runId, detail: runId },
      attemptRef: "results/make-decision/attempt-0002.json",
      attempt: {
        task_id: "legacy-task", stage: "make-decision",
        facts: {
          snapshot_tree: tree, decision_ref: "receipts/decision-log/final.md", decision_hash: sha256(markdown),
          audit_summary_ref: "evidence/audits/make-decision/a.json",
          content_evidence_refs: [
            { ref: "evidence/stage-content/root/interaction-completion.aggregate.json" },
            { ref: "evidence/stage-content/root/decision-coverage-audit.v1.json" },
          ],
        },
      },
      auditRef: "evidence/audits/make-decision/a.json",
      audit: { workflow_run_id: runId, snapshot_tree: tree, verdict: "pass" },
      confirmation: { task_id: "legacy-task", stage: "make-decision", attempt_ref: "attempt-0002.json", decision: "accepted" },
    };
  }

  it("accepts only one complete same-run and same-snapshot replay", () => {
    expect(validateReplayRecordSet(completeRecords())).toMatchObject({ status: "pass" });
  });

  it.each([
    ["missing talk", (value) => value.talks.pop(), /exactly three talk/],
    ["cross-run detail review", (value) => { value.reviewRuns.detail = "other-run"; }, /detail review run binding mismatch/],
    ["cross-tree coverage", (value) => { value.coverage.snapshot_tree = "d".repeat(40); }, /coverage tree binding mismatch/],
    ["missing coverage", (value) => { value.coverage.payload.summary.missing = 1; }, /coverage still has missing/],
  ])("fails loud on %s", (_name, mutate, expected) => {
    const records = completeRecords();
    mutate(records);
    expect(() => validateReplayRecordSet(records)).toThrow(expected);
  });
});
