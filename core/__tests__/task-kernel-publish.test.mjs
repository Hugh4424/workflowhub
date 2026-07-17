import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../artifact-dir.mjs";
import { readLegacyRecord, writeLegacyRecord } from "../legacy-record-reader.mjs";
import { createTask } from "../task-handle.mjs";
import { createTaskKernel } from "../task-kernel.mjs";
import { openAcceptedWorkspace, prepareTaskWorkspace } from "../workspace.mjs";

const temporary = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-kernel-v1-"))); temporary.push(root);
  const repo = join(root, "repo"); mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  writeFileSync(join(repo, "README.md"), "fixture\n");
  execFileSync("git", ["add", "README.md"], { cwd: repo });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: repo });
  const task = createTask({ storageRoot: root, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "task-one", created_at: "2026-07-17T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {} } });
  const candidate = prepareTaskWorkspace(task);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate, confirmationVerification: { verifyPlatformReadback: () => true } });
  return { task, candidate, kernel, repo };
}

function decisionFacts(candidate, decision = "go") {
  return { worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit, snapshot_tree: candidate.captureSnapshot().tree, decision };
}

function confirmation(task, stage, attemptRef, index = 1, decision = "accepted") {
  const attemptPath = `results/${stage}/${attemptRef}`;
  const attemptRaw = task.readRecord(attemptPath);
  return {
    schema_id: "https://workflowhub.dev/schemas/human-confirmation-envelope.v1.schema.json", schema_version: "1.0.0",
    purpose: "stage", task_id: task.identity.taskId, bound_ref: attemptPath, bound_hash: sha256(attemptRaw),
    actor: { id: "human-1", type: "human" },
    source_event: { ref: `source-events/comment-${index}.json`, sha256: String(index).repeat(64), occurred_at: "2026-07-17T00:00:00.000Z" },
    authentication: { method: "platform-readback", verified_at: "2026-07-17T00:00:01.000Z", proof_ref: `authentication/comment-${index}.json`, proof_hash: "a".repeat(64) },
    decision, confirmed_at: "2026-07-17T00:00:02.000Z",
  };
}

function acceptDecision(f, attempt, index = 1) {
  const confirmed = f.kernel.confirmAttempt("make-decision", attempt.attempt_ref, confirmation(f.task, "make-decision", attempt.attempt_ref, index));
  return f.kernel.acceptAttempt("make-decision", attempt.attempt_ref, confirmed.ref);
}

afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

describe("TaskKernel v1 append-only publication", () => {
  it("publishes closed v1 attempts with facts behind exact ref/hash", () => {
    const f = fixture();
    const first = f.kernel.publishAttempt("make-decision", { facts: decisionFacts(f.candidate, "go") });
    const second = f.kernel.publishAttempt("make-decision", { facts: decisionFacts(f.candidate, "revise") });
    expect([first.attempt_ref, second.attempt_ref]).toEqual(["attempt-0001.json", "attempt-0002.json"]);
    expect(first.attempt).toMatchObject({ schema_version: "1.0.0", attempt_id: "attempt-0001", facts: { result_ref: "evidence/stage-results/make-decision/attempt-0001.json" } });
    const resultRaw = f.task.readRecord(first.attempt.facts.result_ref);
    expect(sha256(resultRaw)).toBe(first.attempt.facts.result_hash);
    expect(JSON.parse(resultRaw).decision).toBe("go");
  });

  it("accepts only an authenticated exact attempt and binds a pure snapshot", () => {
    const f = fixture();
    const attempt = f.kernel.publishAttempt("make-decision", { facts: decisionFacts(f.candidate) });
    const accepted = acceptDecision(f, attempt);
    expect(accepted).toMatchObject({ schema_id: "https://workflowhub.dev/schemas/task-accepted.v1.schema.json", schema_version: "1.0.0", attempt_ref: `results/make-decision/${attempt.attempt_ref}`, attempt_hash: attempt.integrity_hash, acceptance_mode: "human", snapshot_ref: expect.stringMatching(/^snapshots\/[a-f0-9]{64}\.json$/) });
    expect(sha256(f.task.readRecord(accepted.snapshot_ref))).toBe(accepted.snapshot_hash);
    expect(() => f.kernel.publishAttempt("make-decision", { facts: decisionFacts(f.candidate) })).toThrow(/accepted|closed/i);
  });

  it("records rejected confirmation without accepted and consumes its source event once", () => {
    const f = fixture();
    const attempt = f.kernel.publishAttempt("make-decision", { facts: decisionFacts(f.candidate) });
    const rejected = confirmation(f.task, "make-decision", attempt.attempt_ref, 2, "rejected");
    expect(f.kernel.confirmAttempt("make-decision", attempt.attempt_ref, rejected)).toMatchObject({ accepted: false, decision: "rejected" });
    expect(() => f.kernel.acceptAttempt("make-decision", attempt.attempt_ref, `confirmations/make-decision/${attempt.attempt_ref}`)).toThrow(/authenticated|decision/i);
    expect(() => f.kernel.confirmAttempt("make-decision", attempt.attempt_ref, rejected)).toThrow(/replay|consum/i);
  });

  it("rejects a task-local proof hash when no launcher verifier capability exists", () => {
    const f = fixture(), kernel = createTaskKernel(f.task, { candidateWorkspace: f.candidate });
    const attempt = kernel.publishAttempt("make-decision", { facts: decisionFacts(f.candidate) });
    const proofRef = "evidence/authentication/attacker-proof.json", proofRaw = "attacker-controlled\n";
    kernel.publishCanonicalRecord(proofRef, proofRaw);
    const forged = confirmation(f.task, "make-decision", attempt.attempt_ref, 9);
    forged.authentication = { method: "signature", verified_at: forged.authentication.verified_at, proof_ref: proofRef, proof_hash: sha256(proofRaw), signature: sha256(proofRaw) };
    expect(() => kernel.confirmAttempt("make-decision", attempt.attempt_ref, forged)).toThrow(/trusted signature proof is invalid/i);
    expect(() => f.task.readRecord("results/make-decision/accepted.json")).toThrow();
  });

  it("requires exact same-task upstream ref/hash and never moves Git refs", () => {
    const f = fixture();
    const decision = f.kernel.publishAttempt("make-decision", { facts: decisionFacts(f.candidate) });
    acceptDecision(f, decision);
    const acceptedRaw = f.task.readRecord("results/make-decision/accepted.json");
    const upstream = [{ ref: "results/make-decision/accepted.json", sha256: sha256(acceptedRaw) }];
    const workspace = openAcceptedWorkspace(f.task, f.kernel.readAccepted("make-decision"));
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, f.task); artifacts.writeAtomic("spec.md", "# Spec\n");
    const kernel = createTaskKernel(f.task, { workspace, artifacts });
    const snapshot = kernel.createCheckpoint("build-spec");
    const refsBefore = execFileSync("git", ["for-each-ref"], { cwd: workspace.worktreeRoot, encoding: "utf8" });
    expect(() => kernel.publishAttempt("build-spec", { facts: { spec_ref: "specs/task-one/spec.md", checkpoint: snapshot }, upstream_refs: [{ ...upstream[0], sha256: "f".repeat(64) }] })).toThrow(/hash/i);
    const attempt = kernel.publishAttempt("build-spec", { facts: { spec_ref: "specs/task-one/spec.md", checkpoint: snapshot }, upstream_refs: upstream });
    const accepted = kernel.acceptAttempt("build-spec", attempt.attempt_ref);
    expect(accepted).toMatchObject({ acceptance_mode: "automatic", upstream_refs: upstream, snapshot_ref: expect.any(String) });
    expect(accepted).not.toHaveProperty("confirmation_ref");
    expect(execFileSync("git", ["for-each-ref"], { cwd: workspace.worktreeRoot, encoding: "utf8" })).toBe(refsBefore);
  });

  it("keeps v2 records read-only through the legacy reader", () => {
    const raw = JSON.stringify({ schema_version: "task-attempt.v2", task_id: "legacy", stage: "make-decision" });
    expect(readLegacyRecord(raw, { expectedSchema: "task-attempt.v2" })).toMatchObject({ task_id: "legacy" });
    expect(() => writeLegacyRecord()).toThrow(/disabled|read-only/i);
  });
});
