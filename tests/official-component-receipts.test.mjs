import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { writeOfficialComponentReceipt } from "../core/canonical-receipt-writer.mjs";
import { createTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
import { validatePhaseCompletion } from "../core/task-kernel-implementation.mjs";
import { openAcceptedWorkspace } from "../core/workspace.mjs";

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
  it.each([true, false])("accepts boolean phase completion: %s", (value) => {
    expect(validatePhaseCompletion(value)).toBe(value);
  });

  it("accepts structured phase completion with a task-relative evidence ref", () => {
    const value = { status: "completed", evidence_ref: "evidence/phase-result.json" };
    expect(validatePhaseCompletion(value)).toBe(value);
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
    expect(spec.ref).toBe("receipts/spec.json");
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

  it("publishes hash-addressed component revisions without replacing the original receipt", () => {
    const { task } = fixture();
    const first = writeOfficialComponentReceipt({ task, stage: "build-plan", component: "plan", payload: { content: "# Plan v1\n" } });
    const revised = writeOfficialComponentReceipt({ task, stage: "build-plan", component: "plan", payload: { content: "# Plan v2\n" }, revisionOf: first.ref });
    const repeated = writeOfficialComponentReceipt({ task, stage: "build-plan", component: "plan", payload: { content: "# Plan v2\n" }, revisionOf: first.ref });
    expect(first.ref).toBe("receipts/plan.json");
    expect(task.readRecord(first.ref)).toContain("# Plan v1");
    expect(revised).toMatchObject({ revision: true, previous_ref: first.ref, previous_hash: first.sha256 });
    expect(revised.ref).toMatch(/^receipts\/revisions\/plan\/[a-f0-9]{64}\.json$/);
    expect(revised.value.revision).toMatchObject({ previous_ref: first.ref, previous_hash: first.sha256, content_hash: revised.content_hash });
    expect(repeated).toMatchObject({ ref: revised.ref, sha256: revised.sha256, content_hash: revised.content_hash });
  });

  it("rejects a revision whose deterministic content ref is bound to another source", () => {
    const { task } = fixture();
    const first = writeOfficialComponentReceipt({ task, stage: "build-plan", component: "tasks", payload: { content: "# Tasks v1\n" } });
    const middle = writeOfficialComponentReceipt({ task, stage: "build-plan", component: "tasks", payload: { content: "# Tasks v2\n" }, revisionOf: first.ref });
    expect(() => writeOfficialComponentReceipt({ task, stage: "build-plan", component: "tasks", payload: { content: "# Tasks v2\n" }, revisionOf: middle.ref })).toThrow(/revision source mismatch/i);
  });

  it("records pass and fail acceptance facts with unique identities and closed refs", () => {
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
    const ac2 = publishAcceptance("evidence/ac-2.json", "AC-2", "fail");
    expect(writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [ac1, ac2] } }).value.refs).toEqual([ac1, ac2]);
  });

  it.each([
    ["missing identity", { schema_version: "acceptance-evidence.v1", result: "pass", refs: [] }, /acceptance_criterion_id|refs/],
    ["wrong schema", { schema_version: "other.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [] }, /schema_version/],
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
