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
  it("keeps unaccepted build-plan attempt-0001, then accepts corrected attempt-0002 in the complete chain", () => {
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

    const cliReceipt = (component, payload, extra = []) => { const input = join(root, `${component}-cli-input.json`); writeFileSync(input, `${JSON.stringify(payload)}\n`); return run(root, ["receipt", "--stage=build-plan", "--project=Demo", "--task=official-chain", `--component=${component}`, `--input=${input}`, ...extra]); };
    const plan1 = cliReceipt("plan", { content: "# Plan v1\n" }, ["--revision=1"]), tasks1 = cliReceipt("tasks", { content: "# Tasks v1\n" }, ["--revision=1"]);
    const fact1 = Object.fromEntries(["research", "analysis", "simplicity"].map((component) => [component, cliReceipt(component, { status: "pass", facts: { source: "fixture-v1" } }, ["--revision=1"])]));
    const reviewWriter = createCanonicalReviewWriter({ task, taskId: "official-chain", stage: "build-plan" }), reviewValue = (material_id) => ({ version: "wh-review-result.v1", task_id: "official-chain", stage: "build-plan", verdict: "pass", source: { target_commit: baseline, captured_head: baseline }, snapshot_tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], { cwd: worktree, encoding: "utf8" }).trim(), material_id });
    reviewWriter.writeResult("reviews/results/build-plan-rev-0001.json", reviewValue("fixture-build-plan-rev-1"));
    const buildPlanReceipts = (plan, tasks, facts, review) => ({ plan, tasks, research: facts.research.receipt_ref, analysis: facts.analysis.receipt_ref, simplicity: facts.simplicity.receipt_ref, review });
    const firstInput = join(root, "build-plan-rev1-run.json"); writeFileSync(firstInput, `${JSON.stringify({ receipts: buildPlanReceipts(plan1.receipt_ref, tasks1.receipt_ref, fact1, "reviews/results/build-plan-rev-0001.json") })}\n`);
    expect(run(root, ["run", "--stage=build-plan", "--project=Demo", "--task=official-chain", `--input=${firstInput}`]).attempt_ref).toBe("attempt-0001.json");
    const plan2 = cliReceipt("plan", { content: "# Plan v2\n" }, ["--revision=2", `--supersedes-ref=${plan1.receipt_ref}`, `--supersedes-hash=${plan1.receipt_hash}`]);
    const tasks2 = cliReceipt("tasks", { content: "# Tasks v2\n" }, ["--revision=2", `--supersedes-ref=${tasks1.receipt_ref}`, `--supersedes-hash=${tasks1.receipt_hash}`]);
    const fact2 = Object.fromEntries(["research", "analysis", "simplicity"].map((component) => [component, cliReceipt(component, { status: "pass", facts: { source: "fixture-v2" } }, ["--revision=2", `--supersedes-ref=${fact1[component].receipt_ref}`, `--supersedes-hash=${fact1[component].receipt_hash}`])]));
    reviewWriter.writeResult("reviews/results/build-plan-rev-0002.json", reviewValue("fixture-build-plan-rev-2"));
    const second = invoke("build-plan", buildPlanReceipts(plan2.receipt_ref, tasks2.receipt_ref, fact2, "reviews/results/build-plan-rev-0002.json"));
    expect(second.attempt_ref).toBe("attempt-0002.json");
    expect(JSON.parse(task.readRecord(plan1.receipt_ref)).content).toBe("# Plan v1\n");
    expect(JSON.parse(task.readRecord(fact1.research.receipt_ref)).facts.source).toBe("fixture-v1");
    expect(JSON.parse(task.readRecord("results/build-plan/attempt-0001.json"))).toMatchObject({ attempt_id: "build-plan:attempt-0001", facts: { revision: 1 } });
    expect(JSON.parse(task.readRecord("results/build-plan/attempt-0002.json"))).toMatchObject({ attempt_id: "build-plan:attempt-0002", facts: { revision: 2 } });

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
