import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../../core/task-handle.mjs";
import { createCanonicalReceiptWriter, createCanonicalReviewWriter, writeOfficialComponentReceipt } from "../../core/canonical-receipt-writer.mjs";
import { createTaskKernel } from "../../core/task-kernel.mjs";
import { openWorkspace } from "../../core/workspace.mjs";

const temporary = [];
const runtime = new URL("../stage-runtime.mjs", import.meta.url).pathname;

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-official-cli-")));
  temporary.push(root);
  const repo = join(root, "repo"), worktree = join(root, "worktree");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
  const baseline = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim();
  const tree = execFileSync("git", ["rev-parse", "HEAD^{tree}"], { cwd: repo, encoding: "utf8" }).trim();
  execFileSync("git", ["worktree", "add", "-q", worktree, baseline], { cwd: repo });
  const task = createTask({
    storageRoot: root,
    manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "official-chain", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} },
  });
  return { root, task, worktree, baseline, tree };
}

function run(root, args) {
  return JSON.parse(execFileSync(process.execPath, [runtime, ...args], { env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" }));
}

afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

describe("official five-stage CLI", () => {
  it("runs repository-owned handlers and accepts the complete chain", () => {
    const { root, task, worktree, baseline } = fixture();
    const invoke = (stage, receipts, extra = []) => {
      const input = join(root, `${stage}-input.json`);
      writeFileSync(input, `${JSON.stringify({ receipts })}\n`);
      const attempt = run(root, ["run", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--input=${input}`, ...extra]);
      if (["build-spec", "build-plan"].includes(stage)) expect(attempt.attempt.checkpoint).not.toHaveProperty("ref");
      const confirmation = run(root, ["confirm", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--attempt=${attempt.attempt_ref}`, "--decision=accepted", ...extra]);
      expect(() => run(root, ["accept", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--attempt=${attempt.attempt_ref}`, "--human-confirmation-ref=plain-string", ...extra])).toThrow();
      const accepted = run(root, ["accept", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--attempt=${attempt.attempt_ref}`, `--human-confirmation-ref=${confirmation.ref}`, ...extra]);
      if (["build-spec", "build-plan"].includes(stage)) expect(accepted.checkpoint.ref).toMatch(/^refs\/workflowhub\/checkpoints\//);
      return attempt;
    };

    writeOfficialComponentReceipt({ task, stage: "make-decision", component: "decision", payload: { content: "go" } });
    invoke("make-decision", { decision: "receipts/decision.json" }, [`--worktree-root=${worktree}`, `--baseline-commit=${baseline}`]);
    const workspace = openWorkspace(createTaskKernel(task).readAccepted("make-decision"), task.manifest);

    writeOfficialComponentReceipt({ task, stage: "build-spec", component: "spec", payload: { content: "# Spec\n" } });
    invoke("build-spec", { spec: "receipts/spec.json" });

    writeOfficialComponentReceipt({ task, stage: "build-plan", component: "plan", payload: { content: "# Plan\n" } });
    writeOfficialComponentReceipt({ task, stage: "build-plan", component: "tasks", payload: { content: "# Tasks\n" } });
    invoke("build-plan", { plan: "receipts/plan.json", tasks: "receipts/tasks.json" });

    const implementation = writeOfficialComponentReceipt({ task, workspace, stage: "build-code", component: "implementation", payload: { phase_completion: true } });
    createCanonicalReceiptWriter({ task, workspace, stage: "build-code", component: "tests" }).captureTests({ command: "printf fixture-output", receiptRef: "receipts/build-tests.json", outputRef: "evidence/build-output.txt" });
    createCanonicalReviewWriter({ task, taskId: "official-chain", stage: "build-code" }).writeResult("reviews/results/build-code.json", { version: "wh-review-result.v1", task_id: "official-chain", stage: "build-code", verdict: "pass", source: { target_commit: baseline, captured_head: baseline }, snapshot_tree: implementation.value.snapshot_tree, material_id: "fixture-build-code" });
    invoke("build-code", { implementation: "receipts/implementation.json", tests: "receipts/build-tests.json", review: "reviews/results/build-code.json" });

    const verifyTests = createCanonicalReceiptWriter({ task, workspace, stage: "verify-code", component: "tests" }).captureTests({ command: "printf fixture-output", receiptRef: "receipts/verify-tests.json", outputRef: "evidence/verify-output.txt" });
    createCanonicalReviewWriter({ task, taskId: "official-chain", stage: "verify-code" }).writeResult("reviews/results/verify-code.json", { version: "wh-review-result.v1", task_id: "official-chain", stage: "verify-code", verdict: "pass", source: { target_commit: baseline, captured_head: baseline }, snapshot_tree: verifyTests.snapshot_tree, material_id: "fixture-verify-code" });
    const acceptanceRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: verifyTests.output_ref, sha256: verifyTests.output_hash }] }, null, 2)}\n`;
    createTaskKernel(task).publishCanonicalRecord("evidence/acceptance-AC-1.json", acceptanceRaw);
    writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [{ ref: "evidence/acceptance-AC-1.json", sha256: createHash("sha256").update(acceptanceRaw).digest("hex") }] } });
    invoke("verify-code", { tests: "receipts/verify-tests.json", review: "reviews/results/verify-code.json", evidence: "evidence/verify-evidence.json" });

    for (const stage of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) {
      expect(JSON.parse(task.readRecord(`results/${stage}/accepted.json`))).toMatchObject({ schema_version: "task-accepted.v2", task_id: "official-chain", stage });
    }
  });
});
