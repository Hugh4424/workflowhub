import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildIntegrationReviewSubject, inspectIntegrationReviewSubject } from "../integration-review-subject.mjs";

const sha = (raw) => createHash("sha256").update(raw).digest("hex");

function fixture({ stale = false, missingAc = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-integration-current-"));
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.name", "fixture"], { cwd: root });
  execFileSync("git", ["config", "user.email", "fixture@example.test"], { cwd: root });
  const taskId = "current-only"; const dir = join(root, "specs", taskId); mkdirSync(dir, { recursive: true });
  const taskBody = `#### T001 — current proof\n\n##### 执行状态填写区（唯一完成权威）\n\n- [x] **任务完成**\n- **status**：\`completed\`\n- **actual_changes**：current implementation\n- **covered_ac**：${missingAc ? "AC-01" : "AC-01、AC-02"}\n- **evidence_refs**：PLACEHOLDER\n`;
  const files = { "decision-log.md": "# decision\n", "spec.md": "# spec\nAC-01\nAC-02\n", "plan.md": "# plan\n", "tasks.md": taskBody };
  for (const [name, raw] of Object.entries(files)) writeFileSync(join(dir, name), raw);
  execFileSync("git", ["add", "."], { cwd: root }); execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });
  const tree = execFileSync("git", ["rev-parse", "HEAD^{tree}"], { cwd: root, encoding: "utf8" }).trim();
  const finalTree = stale ? "f".repeat(40) : tree;
  const implementation = { snapshot_tree: tree };
  const green = { snapshot_tree: tree, exit_code: 0 };
  const implementationRaw = JSON.stringify(implementation); const greenRaw = JSON.stringify(green);
  const refs = [
    { ref: "receipts/revisions/implementation/current.json", sha256: sha(implementationRaw) },
    { ref: "receipts/build-tests-current.json", sha256: sha(greenRaw) },
  ];
  files["tasks.md"] = taskBody.replace("PLACEHOLDER", `\`${JSON.stringify(refs)}\``);
  writeFileSync(join(dir, "tasks.md"), files["tasks.md"]);
  const revision = { task_id: taskId, hashes: Object.fromEntries(Object.entries(files).map(([name, raw]) => [name, sha(raw)])) };
  const revisionRaw = JSON.stringify(revision); const pointer = { task_id: taskId, revision_ref: "materials/revisions/current.json", revision_hash: sha(revisionRaw) };
  const records = new Map([
    ["materials/current.json", JSON.stringify(pointer)], ["materials/revisions/current.json", revisionRaw],
    [refs[0].ref, implementationRaw], [refs[1].ref, greenRaw],
  ]);
  const reads = [];
  return { root, finalTree, reads, task: { identity: { taskId }, readRecord(ref) { reads.push(ref); if (!records.has(ref)) throw new Error(`unexpected historic read: ${ref}`); return records.get(ref); } }, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

describe("integration review subject current-state boundary", () => {
  it("builds a semantic-reviewable current-snapshot subject without phase history", () => {
    const f = fixture();
    try {
      const subject = buildIntegrationReviewSubject({ task: f.task, sourceRoot: f.root, finalTree: f.finalTree });
      expect(subject).toMatchObject({ schema_version: "integration-review-subject.v1", formal_record_status: { status: "available" }, phase_coverage: { schema_version: "current-worktree-coverage.v1", snapshot_tree: f.finalTree }, ac_trace: { schema_version: "ac-change-test-trace.v1", acceptance_ids: ["AC-01", "AC-02"] } });
      expect(subject.ac_trace.entries).toHaveLength(2);
      expect(f.reads).not.toContain("phase-result.json");
      expect(f.reads).not.toContain("results/build-plan/accepted.json");
    } finally { f.cleanup(); }
  });

  it("fails closed when an accepted AC has no current completed-task evidence", () => {
    const f = fixture({ missingAc: true });
    try { expect(() => buildIntegrationReviewSubject({ task: f.task, sourceRoot: f.root, finalTree: f.finalTree })).toThrow(/no completed evidence for AC-02/); }
    finally { f.cleanup(); }
  });

  it("reports missing same-snapshot evidence as unavailable audit data", () => {
    const f = fixture({ stale: true });
    try {
      const subject = inspectIntegrationReviewSubject({ task: f.task, sourceRoot: f.root, finalTree: f.finalTree });
      expect(subject.formal_record_status).toMatchObject({ status: "unavailable", reason: expect.stringMatching(/current implementation receipt/) });
    } finally { f.cleanup(); }
  });
});
