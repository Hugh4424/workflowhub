import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { captureWorkspaceSnapshot, writeOfficialComponentReceipt } from "../core/canonical-receipt-writer.mjs";
import { createTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
import { openWorkspace } from "../core/workspace.mjs";

const temporary = [];
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-official-receipt-"))); temporary.push(root);
  const repo = join(root, "repo"), worktree = join(root, "worktree"); mkdirSync(repo);
  const git = (args, cwd = repo) => String(execFileSync("git", args, { cwd, encoding: "utf8" })).trim();
  git(["init", "-q"]); git(["config", "user.email", "test@example.com"]); git(["config", "user.name", "Test"]); writeFileSync(join(repo, "tracked.txt"), "base\n"); git(["add", "tracked.txt"]); git(["commit", "-qm", "base"]);
  const baseline = git(["rev-parse", "HEAD"]); git(["worktree", "add", "-q", worktree, baseline]);
  const task = createTask({ storageRoot: root, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "receipt-task", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
  return { task, worktree, workspace: openWorkspace({ facts: { worktree_root: worktree, baseline_commit: baseline } }, task.manifest) };
}
afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

describe("official component receipt authority", () => {
  it("preserves build-plan revision 1 when publishing an authenticated revision 2", () => {
    const { task } = fixture();
    const plan1 = writeOfficialComponentReceipt({ task, stage: "build-plan", component: "plan", revision: 1, payload: { content: "plan v1\n" } });
    const tasks1 = writeOfficialComponentReceipt({ task, stage: "build-plan", component: "tasks", revision: 1, payload: { content: "tasks v1\n" } });
    const plan2 = writeOfficialComponentReceipt({ task, stage: "build-plan", component: "plan", revision: 2, supersedes: { ref: plan1.ref, sha256: plan1.sha256 }, payload: { content: "plan v2\n" } });
    const tasks2 = writeOfficialComponentReceipt({ task, stage: "build-plan", component: "tasks", revision: 2, supersedes: { ref: tasks1.ref, sha256: tasks1.sha256 }, payload: { content: "tasks v2\n" } });
    expect([plan1.ref, plan2.ref, tasks1.ref, tasks2.ref]).toEqual(["receipts/plan/rev-0001.json", "receipts/plan/rev-0002.json", "receipts/tasks/rev-0001.json", "receipts/tasks/rev-0002.json"]);
    expect(JSON.parse(task.readRecord(plan1.ref)).content).toBe("plan v1\n");
    expect(plan2.value.supersedes).toEqual({ ref: plan1.ref, sha256: plan1.sha256 });
  });

  it.each([
    ["missing predecessor", 2, undefined, /supersedes/],
    ["revision gap", 3, { ref: "receipts/plan/rev-0001.json", sha256: "a".repeat(64) }, /immediately preceding/],
    ["wrong predecessor hash", 2, { ref: "receipts/plan/rev-0001.json", sha256: "a".repeat(64) }, /hash mismatch/],
  ])("rejects non-continuous build-plan history: %s", (_label, revision, supersedes, error) => {
    const { task } = fixture();
    writeOfficialComponentReceipt({ task, stage: "build-plan", component: "plan", revision: 1, payload: { content: "v1\n" } });
    expect(() => writeOfficialComponentReceipt({ task, stage: "build-plan", component: "plan", revision, supersedes, payload: { content: "next\n" } })).toThrow(error);
  });

  it("publishes allowlisted content and physical implementation receipts create-only", () => {
    const { task, worktree, workspace } = fixture();
    const spec = writeOfficialComponentReceipt({ task, stage: "build-spec", component: "spec", payload: { content: "# Spec\n" } });
    expect(spec.ref).toBe("receipts/spec.json");
    expect(() => task.writeRecordAtomic("receipts/forged.json", "{}" )).toThrow(/canonical-receipt-owned/);
    writeFileSync(join(worktree, "tracked.txt"), "dirty\n");
    writeFileSync(join(worktree, "new.txt"), "new\n");
    const implementation = writeOfficialComponentReceipt({ task, workspace, stage: "build-code", component: "implementation", payload: { phase_completion: true } });
    expect(implementation.value.changed).toEqual(expect.arrayContaining(["tracked.txt", "new.txt"]));
    expect(implementation.value.snapshot_tree).toBe(captureWorkspaceSnapshot(workspace).tree);
    const diff = readFileSync(task.recordPath(implementation.value.diff_ref), "utf8");
    expect(diff).toContain("tracked.txt");
    expect(diff).toContain("new.txt");
    expect(() => writeOfficialComponentReceipt({ task, stage: "build-spec", component: "spec", payload: { content: "changed" } })).toThrow(/exist/i);
  });

  it("accepts only passing, uniquely identified acceptance evidence with closed refs", () => {
    const { task } = fixture();
    const kernel = createTaskKernel(task), output = "proof\n";
    kernel.publishCanonicalRecord("evidence/proof.txt", output);
    const outputHash = createHash("sha256").update(output).digest("hex");
    const publishAcceptance = (path, id, result = "pass") => {
      const raw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: id, result, refs: [{ ref: "evidence/proof.txt", sha256: outputHash }] }, null, 2)}\n`;
      kernel.publishCanonicalRecord(path, raw);
      return { ref: path, sha256: createHash("sha256").update(raw).digest("hex") };
    };
    const ac1 = publishAcceptance("evidence/ac-1.json", "AC-1");
    expect(writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [ac1] } }).value.refs).toEqual([ac1]);
  });

  it.each([
    ["missing identity", { schema_version: "acceptance-evidence.v1", result: "pass", refs: [] }, /acceptance_criterion_id|refs/],
    ["wrong schema", { schema_version: "other.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [] }, /schema_version/],
    ["failed criterion", { schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "fail", refs: [{ ref: "evidence/proof.txt", sha256: "0".repeat(64) }] }, /did not pass/],
  ])("rejects invalid acceptance evidence: %s", (_label, entity, pattern) => {
    const { task } = fixture(); const kernel = createTaskKernel(task);
    const raw = `${JSON.stringify(entity)}\n`, ref = "evidence/ac.json";
    kernel.publishCanonicalRecord(ref, raw);
    expect(() => writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [{ ref, sha256: createHash("sha256").update(raw).digest("hex") }] } })).toThrow(pattern);
  });

  it("rejects duplicate acceptance criterion identities", () => {
    const { task } = fixture(); const kernel = createTaskKernel(task);
    kernel.publishCanonicalRecord("evidence/proof.txt", "proof\n");
    const proofHash = createHash("sha256").update("proof\n").digest("hex"), refs = [];
    for (const name of ["one", "two"]) {
      const raw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: "evidence/proof.txt", sha256: proofHash }] })}\n`;
      const ref = `evidence/${name}.json`; kernel.publishCanonicalRecord(ref, raw); refs.push({ ref, sha256: createHash("sha256").update(raw).digest("hex") });
    }
    expect(() => writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs } })).toThrow(/duplicate acceptance_criterion_id/i);
  });
});
