import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import { ArtifactDir } from "../../../../core/artifact-dir.mjs";
import { createTask, openTask } from "../../../../runtime/task/task-handle.mjs";
import { buildIntegrationReviewSubject, inspectIntegrationReviewSubject } from "../integration-review-subject.mjs";

const sha = (raw) => createHash("sha256").update(raw).digest("hex");

function fixture({ stale = false, missingAc = false, multiTask = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-integration-current-"));
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.name", "fixture"], { cwd: root });
  execFileSync("git", ["config", "user.email", "fixture@example.test"], { cwd: root });
  const storage = mkdtempSync(join(realpathSync(process.cwd()), ".workflowhub-integration-storage-"));
  const taskId = "current-only"; const dir = join(root, "specs", taskId); mkdirSync(dir, { recursive: true });
  const taskBody = `#### T001 — current proof\n\n##### 执行状态填写区（唯一完成权威）\n\n- [x] **任务完成**\n- **status**：\`completed\`\n- **actual_changes**：current implementation\n- **covered_ac**：${missingAc ? "AC-01" : "AC-01、AC-02"}\n- **evidence_refs**：PLACEHOLDER\n${multiTask ? "\n#### T002 — second current proof\n\n##### 执行状态填写区（唯一完成权威）\n\n- [x] **任务完成**\n- **status**：\`completed\`\n- **actual_changes**：second current implementation\n- **covered_ac**：AC-01\n- **evidence_refs**：PLACEHOLDER\n" : ""}`;
  const files = { "decision-log.md": "# decision\n", "spec.md": "# spec\nAC-01\nAC-02\n", "plan.md": "# plan\n", "tasks.md": taskBody, "runtime/fixture.mjs": "export const fixture = 'base';\n" };
  mkdirSync(join(root, "runtime"), { recursive: true });
  for (const [name, raw] of Object.entries(files)) writeFileSync(join(name.startsWith("runtime/") ? root : dir, name), raw);
  execFileSync("git", ["add", "."], { cwd: root }); execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });
  writeFileSync(join(root, "runtime/fixture.mjs"), "export const fixture = 'changed';\n");
  writeFileSync(join(dir, "tasks.md"), files["tasks.md"]);
  execFileSync("git", ["add", "specs/current-only/tasks.md", "runtime/fixture.mjs"], { cwd: root });
  const tree = execFileSync("git", ["write-tree"], { cwd: root, encoding: "utf8" }).trim();
  const finalTree = stale ? "f".repeat(40) : tree;
  const implementation = { snapshot_tree: tree };
  const green = { snapshot_tree: tree, exit_code: 0 };
  const implementationRaw = JSON.stringify(implementation); const greenRaw = JSON.stringify(green);
  const refs = [
    { ref: "quality/evidence/implementation.json", sha256: sha(implementationRaw) },
    { ref: "quality/tests/build-code.json", sha256: sha(greenRaw) },
  ];
  files["tasks.md"] = taskBody.replaceAll("PLACEHOLDER", `\`${JSON.stringify(refs)}\``);
  writeFileSync(join(dir, "tasks.md"), files["tasks.md"]);
  const revision = { task_id: taskId, hashes: Object.fromEntries(Object.entries(files).map(([name, raw]) => [name, sha(raw)])) };
  const revisionRaw = JSON.stringify(revision); const pointer = { task_id: taskId, revision_ref: "materials/revisions/current.json", revision_hash: sha(revisionRaw) };
  const task = createTask({
    storageRoot: storage,
    manifest: {
      schema_version: "1.0.0", project_name: "fixture", task_id: taskId,
      created_at: "2026-08-02T00:00:00.000Z", target_repo_root: root, issue_ids: [], inputs: {},
    },
  });
  for (const [ref, raw] of [["materials/current.json", JSON.stringify(pointer)], ["materials/revisions/current.json", revisionRaw]]) {
    task.writeRecordAtomic(ref, raw);
  }
  for (const [ref, raw] of [[refs[0].ref, implementationRaw], [refs[1].ref, greenRaw]]) {
    const destination = join(task.taskPath, ref);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, raw);
  }
  const currentTask = openTask(task.taskPath, task.identity);
  return {
    root, finalTree, task: currentTask, artifacts: ArtifactDir.open(root, currentTask),
    cleanup: () => { rmSync(root, { recursive: true, force: true }); rmSync(storage, { recursive: true, force: true }); },
  };
}

describe("integration review subject current-state boundary", () => {
  it("keeps missing historical Phase coverage as an audit gap", () => {
    const f = fixture();
    try {
      const subject = buildIntegrationReviewSubject({ task: f.task, sourceRoot: f.root, artifacts: f.artifacts, finalTree: f.finalTree });
      expect(subject.formal_record_status).toMatchObject({ status: "unavailable" });
      expect(subject.audit_gaps).toEqual(expect.arrayContaining([
        expect.objectContaining({ kind: "historical_phase_coverage" }),
      ]));
    }
    finally { f.cleanup(); }
  });

  it("keeps missing current Task rows as an AC audit gap", () => {
    const f = fixture({ missingAc: true });
    try {
      const subject = buildIntegrationReviewSubject({ task: f.task, sourceRoot: f.root, artifacts: f.artifacts, finalTree: f.finalTree });
      expect(subject.ac_trace.entries).toHaveLength(2);
      expect(subject.audit_gaps).toEqual(expect.arrayContaining([
        expect.objectContaining({ kind: "task_completion_history" }),
      ]));
    }
    finally { f.cleanup(); }
  });

  it("preserves every completed Task as an AC change and anchor mapping", () => {
    const f = fixture({ multiTask: true });
    try {
      const subject = buildIntegrationReviewSubject({ task: f.task, sourceRoot: f.root, artifacts: f.artifacts, finalTree: f.finalTree });
      const ac = subject.ac_trace.entries.find((entry) => entry.acceptance_criterion_id === "AC-01");
      expect(ac.change.map((entry) => entry.task_id)).toEqual(["T001", "T002"]);
      expect(ac.anchors.map((entry) => entry.id)).toEqual(["T001:AC-01", "T002:AC-01"]);
    } finally { f.cleanup(); }
  });

  it("selects bounded current implementation excerpts for integration review", () => {
    const f = fixture();
    try {
      const subject = buildIntegrationReviewSubject({ task: f.task, sourceRoot: f.root, artifacts: f.artifacts, finalTree: f.finalTree });
      expect(subject.phase_coverage.implementation_anchors).toEqual([
        expect.objectContaining({ id: "implementation-runtime__fixture.mjs-1", path: "runtime/fixture.mjs", role: "implementation" }),
      ]);
      expect(subject.phase_coverage.implementation_anchors[0].start_line).toBe(1);
    } finally { f.cleanup(); }
  });

  it("reports missing same-snapshot evidence as unavailable audit data", () => {
    const f = fixture({ stale: true });
    try {
      const subject = inspectIntegrationReviewSubject({ task: f.task, sourceRoot: f.root, artifacts: f.artifacts, finalTree: f.finalTree });
      expect(subject.formal_record_status).toMatchObject({ status: "unavailable", reason: expect.stringMatching(/current implementation receipt/) });
    } finally { f.cleanup(); }
  });

  it("does not downgrade non-ENOENT material failures to unavailable", () => {
    const f = fixture();
    const failingTask = {
      ...f.task,
      readRecord(ref) {
        if (ref === "receipts/implementation.json") {
          const error = new Error("permission denied");
          error.code = "EACCES";
          throw error;
        }
        return f.task.readRecord(ref);
      },
    };
    try {
      expect(() => buildIntegrationReviewSubject({
        task: failingTask,
        sourceRoot: f.root,
        artifacts: f.artifacts,
        finalTree: f.finalTree,
        current_receipts: { implementation_ref: "receipts/implementation.json", green_ref: "receipts/green.json" },
      })).toThrow(/permission denied/);
    } finally { f.cleanup(); }
  });
});
