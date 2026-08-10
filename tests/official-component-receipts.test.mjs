import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { captureWorkspaceSnapshot, createCanonicalReceiptWriter, writeOfficialComponentReceipt } from "../runtime/evidence/canonical-receipt-writer.mjs";
import { captureExecutionSnapshot } from "../runtime/task/git-worktree-snapshot.mjs";
import { createTask } from "../runtime/task/task-handle.mjs";
import { createTaskKernel } from "../runtime/task/task-kernel.mjs";
import { validatePhaseCompletion } from "../runtime/task/task-kernel-implementation.mjs";
import { openAcceptedWorkspace } from "../runtime/task/workspace.mjs";
import { validateBuildCodePhaseEvidence } from "../runtime/stage/stage-content-contracts.mjs";

const temporary = [];
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-official-receipt-"))); temporary.push(root);
  const repo = join(root, "repo"), worktree = join(root, "repo-receipt-task"); mkdirSync(repo);
  const git = (args, cwd = repo) => String(execFileSync("git", args, { cwd, encoding: "utf8" })).trim();
  git(["init", "-q"]); git(["config", "user.email", "test@example.com"]); git(["config", "user.name", "Test"]); writeFileSync(join(repo, "tracked.txt"), "base\n"); git(["add", "tracked.txt"]); git(["commit", "-qm", "base"]);
  const baseline = git(["rev-parse", "HEAD"]); git(["worktree", "add", "-q", "-b", "task/Demo/receipt-task", worktree, baseline]);
  const task = createTask({ storageRoot: root, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "receipt-task", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
  return { task, worktree, workspace: openAcceptedWorkspace(task, { facts: { worktree_root: worktree, baseline_commit: baseline } }) };
}
afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

describe("official component receipt authority", () => {
  it.each([true, false])("keeps boolean phase completion readable as legacy data: %s", (value) => {
    expect(validatePhaseCompletion(value)).toBe(value);
  });

  it("accepts structured phase completion with authenticated task evidence", () => {
    const value = {
      status: "completed",
      evidence_ref: "evidence/phase-result.json",
      evidence_hash: "a".repeat(64),
      integration_review: { ref: "reviews/results/build-code.json", sha256: "b".repeat(64) },
      formal_record_status: { status: "unavailable", reason: "fixture has no Phase history" },
    };
    expect(validatePhaseCompletion(value)).toBe(value);
  });

  it("rejects caller boolean phase completion for current publication", () => {
    expect(() => validatePhaseCompletion(true, "build-code facts.phase_completion", {
      allowLegacyBoolean: false,
      requireAuthenticatedEvidence: true,
    })).toThrow(/legacy read-only|derived completion evidence/i);
  });

  it.each([
    null,
    [],
    "complete",
    { evidence_ref: "evidence/phase-result.json" },
    { status: "completed" },
    { status: "completed", evidence_ref: "/tmp/phase-result.json" },
    { status: "completed", evidence_ref: "evidence/../phase-result.json" },
  ])("rejects invalid phase completion before publication: %j", (value) => {
    expect(() => validatePhaseCompletion(value)).toThrow(/phase_completion|status|evidence_ref/i);
  });

  it.each([
    ["build-spec", "spec"],
    ["build-plan", "plan"],
    ["build-plan", "tasks"],
  ])("reproduces the %s/%s EEXIST accident when a draft is frozen before review", (stage, component) => {
    const { task } = fixture();
    const first = writeOfficialComponentReceipt({ task, stage, component, payload: { content: "draft\n" } });
    expect(() => writeOfficialComponentReceipt({ task, stage, component, payload: { content: "revised after review\n" } })).toThrow(/exist/i);
    expect(JSON.parse(task.readRecord(first.ref))).toMatchObject({ content: "draft\n" });
  });

  it("publishes allowlisted content and derives implementation completion outside the caller payload", () => {
    const { task, worktree, workspace } = fixture();
    const spec = writeOfficialComponentReceipt({ task, stage: "build-spec", component: "spec", payload: { content: "# Spec\n" } });
    expect(spec.ref).toBe("quality/evidence/spec.json");
    expect(writeOfficialComponentReceipt({ task, stage: "build-spec", component: "spec", payload: { content: "# Spec\n" } })).toMatchObject({ ref: spec.ref, sha256: spec.sha256, revision: false });
    expect(() => task.writeRecordAtomic("receipts/forged.json", "{}" )).toThrow(/canonical-receipt-owned/);
    writeFileSync(join(worktree, "tracked.txt"), "dirty\n");
    writeFileSync(join(worktree, "new.txt"), "new\n");
    expect(() => writeOfficialComponentReceipt({
      task, workspace, stage: "build-code", component: "implementation",
      payload: { phase_completion: true },
    })).toThrow(/payload must be empty|phase_completion is derived/i);
    const implementation = writeOfficialComponentReceipt({
      task, workspace, stage: "build-code", component: "implementation", payload: {},
    });
    expect(implementation.value.changed).toEqual(["new.txt", "tracked.txt"]);
    expect(implementation.value).not.toHaveProperty("phase_completion");
    expect(() => writeOfficialComponentReceipt({ task, stage: "build-spec", component: "spec", payload: { content: "changed" } })).toThrow(/exist/i);
  });

  it("reuses a same-snapshot build-code full test receipt during verify capture", () => {
    const { task, worktree, workspace } = fixture();
    writeFileSync(join(worktree, "package.json"), JSON.stringify({ scripts: { test: "echo ok" } }));
    const build = createCanonicalReceiptWriter({ task, workspace, stage: "build-code", component: "build-code-test-capture" })
      .captureTests({ command: "npm test", receiptRef: "quality/tests/build-code-full.json", outputRef: "quality/tests/output/build-code-full" });
    const verify = createCanonicalReceiptWriter({ task, workspace, stage: "verify-code", component: "verify-code-test-capture" })
      .captureTests({ command: "npm test", receiptRef: "quality/tests/verify-code-full.json", outputRef: "quality/tests/output/verify-code-full" });
    expect(verify.receipt_ref).toBe(build.receipt_ref);
    expect(() => task.readRecord("quality/tests/verify-code-full.json")).toThrow(/ENOENT|record/i);
  });

  it("reuses a full receipt after current-material-only edits without rerunning npm test", () => {
    const { task, worktree, workspace } = fixture();
    writeFileSync(join(worktree, "package.json"), JSON.stringify({ scripts: { test: "echo ok" } }));
    mkdirSync(join(worktree, "specs", "receipt-task"), { recursive: true });
    writeFileSync(join(worktree, "specs", "receipt-task", "tasks.md"), "# tasks v1\n");
    const build = createCanonicalReceiptWriter({ task, workspace, stage: "build-code", component: "build-code-test-capture" })
      .captureTests({ command: "npm test", receiptRef: "quality/tests/build-code-material.json", outputRef: "quality/tests/output/build-code-material" });
    writeFileSync(join(worktree, "specs", "receipt-task", "tasks.md"), "# tasks v2\n");
    const current = captureExecutionSnapshot(worktree);
    const verify = createCanonicalReceiptWriter({ task, workspace, stage: "verify-code", component: "verify-code-test-capture" })
      .captureTests({ command: "npm test", receiptRef: "quality/tests/verify-code-material.json", outputRef: "quality/tests/output/verify-code-material" });
    expect(verify.receipt_ref).toBe(build.receipt_ref);
    expect(current.tree).not.toBe(build.snapshot_tree);
    expect(verify.snapshot_tree).toBe(build.snapshot_tree);
    expect(verify.source_digest).toBe(build.source_digest);
    expect(() => task.readRecord("quality/tests/verify-code-material.json")).toThrow(/ENOENT|record/i);
  });

  it("publishes evidence and verification facts through the single official writer", () => {
    const { task } = fixture();
    const kernel = createTaskKernel(task), proof = "proof\n", proofRef = "quality/evidence/proof.txt";
    kernel.publishCanonicalRecord(proofRef, proof);
    const proofHash = createHash("sha256").update(proof).digest("hex");
    const leafRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: proofRef, sha256: proofHash }] }, null, 2)}\n`;
    const leafRef = "quality/evidence/ac-1.json";
    kernel.publishCanonicalRecord(leafRef, leafRaw);
    const leaf = { ref: leafRef, sha256: createHash("sha256").update(leafRaw).digest("hex") };
    const evidence = writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [leaf] } });
    expect(evidence.ref).toBe("quality/evidence/verify-evidence.json");
    expect(JSON.parse(task.readRecord(evidence.ref))).toMatchObject({ producer: { component: "evidence" }, refs: [leaf] });
    const proofBinding = { ref: proofRef, sha256: proofHash };
    const verification = writeOfficialComponentReceipt({
      task, stage: "verify-code", component: "verification",
      payload: {
        items: [
          "current_materials", "diff_scope", "risk_tests", "acceptance_criteria", "tasks_completion",
          "browser_qa", "independent_review_resolution", "core_gaps", "human_handoff",
        ].map((id) => ({ id, status: id === "browser_qa" ? "not_applicable" : "pass", evidence_refs: id === "browser_qa" ? [] : [proofBinding], reason: "fixture fact" })),
      },
    });
    expect(verification.ref).toBe("quality/evidence/verification.json");
    expect(JSON.parse(task.readRecord(verification.ref))).toMatchObject({ producer: { component: "verification" }, items: expect.any(Array) });
  });

  it("retires component replacement and requires a new current material", () => {
    const { task } = fixture();
    const first = writeOfficialComponentReceipt({ task, stage: "build-plan", component: "plan", payload: { content: "# Plan v1\n" } });
    expect(first.ref).toBe("quality/evidence/plan.json");
    expect(task.readRecord(first.ref)).toContain("# Plan v1");
    expect(() => writeOfficialComponentReceipt({ task, stage: "build-plan", component: "plan", payload: { content: "# Plan v2\n" }, revisionOf: first.ref })).toThrow(/REPLACEMENT_RETIRED/);
  });

  it("rejects a revision whose deterministic content ref is bound to another source", () => {
    const { task } = fixture();
    const first = writeOfficialComponentReceipt({ task, stage: "build-plan", component: "tasks", payload: { content: "# Tasks v1\n" } });
    expect(() => writeOfficialComponentReceipt({ task, stage: "build-plan", component: "tasks", payload: { content: "# Tasks v2\n" }, revisionOf: first.ref })).toThrow(/REPLACEMENT_RETIRED/);
  });

  it("records pass and fail acceptance facts with unique identities and closed refs", () => {
    const { task } = fixture();
    const kernel = createTaskKernel(task), output = "proof\n";
    kernel.publishCanonicalRecord("quality/evidence/proof.txt", output);
    const outputHash = createHash("sha256").update(output).digest("hex");
    const publishAcceptance = (path, id, result = "pass") => {
      const raw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: id, result, refs: [{ ref: "quality/evidence/proof.txt", sha256: outputHash }] }, null, 2)}\n`;
      kernel.publishCanonicalRecord(path, raw);
      return { ref: path, sha256: createHash("sha256").update(raw).digest("hex") };
    };
    const ac1 = publishAcceptance("quality/evidence/ac-1.json", "AC-1");
    const ac2 = publishAcceptance("quality/evidence/ac-2.json", "AC-2", "fail");
    expect(writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [ac1, ac2] } }).value.refs).toEqual([ac1, ac2]);
  });

  it.each([
    ["missing identity", { schema_version: "acceptance-evidence.v1", result: "pass", refs: [] }, /acceptance_criterion_id|refs/],
    ["wrong schema", { schema_version: "other.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [] }, /schema_version/],
  ])("rejects invalid acceptance evidence: %s", (_label, entity, pattern) => {
    const { task } = fixture(); const kernel = createTaskKernel(task);
    const raw = `${JSON.stringify(entity)}\n`, ref = "quality/evidence/ac.json";
    kernel.publishCanonicalRecord(ref, raw);
    expect(() => writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [{ ref, sha256: createHash("sha256").update(raw).digest("hex") }] } })).toThrow(pattern);
  });

  it("rejects duplicate acceptance criterion identities", () => {
    const { task } = fixture(); const kernel = createTaskKernel(task);
    kernel.publishCanonicalRecord("quality/evidence/proof.txt", "proof\n");
    const proofHash = createHash("sha256").update("proof\n").digest("hex"), refs = [];
    for (const name of ["one", "two"]) {
      const raw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: "quality/evidence/proof.txt", sha256: proofHash }] })}\n`;
      const ref = `quality/evidence/${name}.json`; kernel.publishCanonicalRecord(ref, raw); refs.push({ ref, sha256: createHash("sha256").update(raw).digest("hex") });
    }
    expect(() => writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs } })).toThrow(/duplicate acceptance_criterion_id/i);
  });

  it("publishes one canonical verify checklist receipt instead of trusting a completion claim", () => {
    const { task } = fixture();
    createTaskKernel(task).publishCanonicalRecord("quality/evidence/verification-proof.json", "{\"verified\":true}\n");
    const proof = { ref: "quality/evidence/verification-proof.json", sha256: createHash("sha256").update("{\"verified\":true}\n").digest("hex") };
    const receipt = writeOfficialComponentReceipt({
      task,
      stage: "verify-code",
      component: "verification",
      payload: {
        items: [
          { id: "current_materials", status: "pass", evidence_refs: [proof], reason: "current material revision verified" },
          { id: "diff_scope", status: "pass", evidence_refs: [proof], reason: "diff and delivery scope verified" },
          { id: "risk_tests", status: "pass", evidence_refs: [proof], reason: "risk tests verified" },
          { id: "acceptance_criteria", status: "pass", evidence_refs: [proof], reason: "each AC verified" },
          { id: "tasks_completion", status: "pass", evidence_refs: [proof], reason: "tasks completion verified" },
          { id: "browser_qa", status: "not_applicable", evidence_refs: [], reason: "no UI AC applies" },
          { id: "independent_review_resolution", status: "unknown", evidence_refs: [], reason: "review unavailable and disclosed" },
          { id: "core_gaps", status: "pass", evidence_refs: [proof], reason: "no core delivery gap" },
          { id: "human_handoff", status: "pass", evidence_refs: [proof], reason: "handoff recorded" },
        ],
      },
    });
    expect(receipt).toMatchObject({
      ref: "quality/evidence/verification.json",
      value: { items: expect.arrayContaining([expect.objectContaining({ id: "human_handoff" })]) },
    });
  });

  it("preserves semantic requirement-replay evidence for the current verification receipt", () => {
    const { task } = fixture();
    const kernel = createTaskKernel(task), proof = "semantic proof\n", proofRef = "quality/evidence/semantic-proof.txt";
    kernel.publishCanonicalRecord(proofRef, proof);
    const proofBinding = { ref: proofRef, sha256: createHash("sha256").update(proof).digest("hex") };
    const replay = {
      source_id: "R-SEMANTIC-001",
      status: "pass",
      snapshot_tree: "a".repeat(40),
      linked_ids: ["AC-001"],
      evidence_refs: [proofBinding],
      reason: "current semantic proof is bound to the task evidence",
      scenario: "用户提交当前任务的材料并触发验证回放",
      oracle: "场景结果、判定规则和实际结果必须分别可读",
      actual_outcome: "当前收据保留了场景、判定、结果和证据锚点",
      coverage_limits: ["fixture does not exercise provider transport"],
      implementation_anchor: { id: "impl-1", path: "runtime/evidence/canonical-receipt-writer.mjs", start_line: 1, end_line: 2, role: "implementation" },
      verification_anchor: { id: "test-1", path: "tests/official-component-receipts.test.mjs", start_line: 1, end_line: 2, role: "verification" },
    };
    const verification = writeOfficialComponentReceipt({
      task, stage: "verify-code", component: "verification",
      payload: {
        items: [
          "current_materials", "diff_scope", "risk_tests", "acceptance_criteria", "tasks_completion",
          "browser_qa", "independent_review_resolution", "core_gaps", "human_handoff",
        ].map((id) => ({ id, status: id === "browser_qa" ? "not_applicable" : "pass", evidence_refs: id === "browser_qa" ? [] : [proofBinding], reason: "fixture fact" })),
        requirement_replay: [replay],
      },
    });
    expect(JSON.parse(task.readRecord(verification.ref)).requirement_replay[0]).toMatchObject(replay);
  });

  it("bounds test-capture lease waits and preserves the owner timeout fact", () => {
    const { task, worktree, workspace } = fixture();
    let observed;
    const writerModule = resolve(process.cwd(), "runtime/evidence/canonical-receipt-writer.mjs");
    const taskModule = resolve(process.cwd(), "runtime/task/task-handle.mjs");
    const workspaceModule = resolve(process.cwd(), "runtime/task/workspace.mjs");
    const child = `
      import { openTask } from ${JSON.stringify(`file://${taskModule}`)};
      import { createCanonicalReceiptWriter } from ${JSON.stringify(`file://${writerModule}`)};
      import { openAcceptedWorkspace } from ${JSON.stringify(`file://${workspaceModule}`)};
      const task = openTask(${JSON.stringify(task.taskPath)}, { projectName: "Demo", taskId: "receipt-task" });
      const workspace = openAcceptedWorkspace(task, { facts: { worktree_root: ${JSON.stringify(worktree)}, baseline_commit: ${JSON.stringify(workspace.baselineCommit)} } });
      try {
        createCanonicalReceiptWriter({ task, workspace, stage: "build-code", component: "lease-timeout" })
          .captureTests({ command: "true", receiptRef: "quality/tests/t007-child.json", outputRef: "quality/tests/output/t007-child", lockWaitMs: 25 });
      } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
      }
    `;
    task.withRecordLock("locks/test-capture.execution.lock", () => {
      try {
        execFileSync(process.execPath, ["--input-type=module", "-e", child], { cwd: process.cwd(), encoding: "utf8", timeout: 500, stdio: ["ignore", "pipe", "pipe"] });
        observed = { timedOut: false, stderr: "" };
      } catch (error) {
        observed = { timedOut: error.code === "ETIMEDOUT", stderr: String(error.stderr ?? "") };
      }
    });
    expect(observed.timedOut).toBe(false);
    expect(observed.stderr).toMatch(/timed out waiting for record lock|lease/i);
  });

  it("binds G6 phase evidence to distinct baselines and the current snapshot", () => {
    const snapshotTree = "a".repeat(40);
    expect(validateBuildCodePhaseEvidence({
      schema_version: "build-code-phase-evidence.v1",
      phase_id: "P4",
      phase_order: ["T007", "T008"],
      snapshot_tree: snapshotTree,
      baseline: {
        implementation: { kind: "implementation", commit: "b".repeat(40) },
        integration: { kind: "integration", commit: "c".repeat(40) },
      },
      evidence: [{ ref: "quality/tests/output/p4/t007-red", sha256: "d".repeat(64), snapshot_tree: snapshotTree }],
      failure_attribution: { status: "failed", category: "test_command", code: "EXIT_NONZERO", reason: "command failed" },
    }, { snapshotTree })).toMatchObject({ phase_id: "P4", snapshot_tree: snapshotTree });
  });

  it("records command failure, baseline roles, and phase evidence in the receipt", () => {
    const { task, workspace } = fixture();
    const snapshotTree = captureWorkspaceSnapshot(workspace).tree;
    const receipt = createCanonicalReceiptWriter({ task, workspace, stage: "build-code", component: "g6-phase" })
      .captureTests({
        command: "false",
        receiptRef: "quality/tests/t007-phase.json",
        outputRef: "quality/tests/output/t007-phase",
        phaseEvidence: {
          phase_id: "P4",
          phase_order: ["T007"],
          baseline: { integration: { kind: "integration", commit: snapshotTree } },
          evidence: [{ ref: "quality/tests/output/p4/t007-red", sha256: "d".repeat(64) }],
          failure_attribution: { status: "failed", category: "test_command", code: "EXIT_NONZERO", reason: "command failed" },
        },
      });
    expect(receipt).toMatchObject({
      exit_code: 1,
      lease: { status: "released" },
      phase_evidence: {
        phase_id: "P4",
        baseline: {
          implementation: { kind: "implementation", commit: workspace.baselineCommit },
          integration: { kind: "integration", commit: snapshotTree },
        },
        failure_attribution: { status: "failed", code: "EXIT_NONZERO" },
      },
    });
  });
});
