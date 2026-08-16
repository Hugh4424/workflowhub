import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import { ArtifactDir } from "../../../../core/artifact-dir.mjs";
import { createTask, openTask } from "../../../../runtime/task/task-handle.mjs";
import { buildIntegrationReviewSubject, inspectIntegrationReviewSubject } from "../integration-review-subject.mjs";
import * as runtimeIntegrationSubject from "../../../../runtime/review/integration-review-subject.mjs";

const sha = (raw) => createHash("sha256").update(raw).digest("hex");

function fixture({ stale = false, missingAc = false, missingExecution = false, missingHistoryEvidence = false, missingTaskBindings = false, multiTask = false, criticalPaths = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-integration-current-"));
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.name", "fixture"], { cwd: root });
  execFileSync("git", ["config", "user.email", "fixture@example.test"], { cwd: root });
  const storage = mkdtempSync(join(realpathSync(process.cwd()), ".workflowhub-integration-storage-"));
  const taskId = "current-only"; const dir = join(root, "specs", taskId); mkdirSync(dir, { recursive: true });
  const executionFacts = missingExecution ? "" : "current implementation";
  const historyImplementationRef = missingHistoryEvidence ? "quality/evidence/missing-history-implementation.json" : "quality/evidence/implementation.json";
  const historyTestsRef = missingHistoryEvidence ? "quality/tests/missing-history-green.json" : "quality/tests/build-code.json";
  const taskEvidence = missingTaskBindings ? "" : `- **证据**：evidence_path=\`${historyImplementationRef}\`; evidence_path=\`${historyTestsRef}\`; record=\`PLACEHOLDER\`\n`;
  const taskTrace = missingTaskBindings ? "" : `- **Trace**：source/current → FR-01 → ${missingAc ? "AC-01" : "AC-01、AC-02"}\n`;
  const taskBody = `## T001 — current proof\n\n- **状态**：\`completed\`\n- **执行事实**：${executionFacts}\n${taskEvidence}${taskTrace}${multiTask ? `\n## T002 — second current proof\n\n- **状态**：\`completed\`\n- **执行事实**：second current implementation\n- **证据**：evidence_path=\`${historyImplementationRef}\`; evidence_path=\`${historyTestsRef}\`; record=\`PLACEHOLDER\`\n- **Trace**：source/current → FR-01 → AC-01\n` : ""}`;
  const files = { "decision-log.md": "# decision\n", "spec.md": "# spec\nAC-01\nAC-02\n", "plan.md": "# plan\n", "tasks.md": taskBody, "runtime/fixture.mjs": "export const fixture = 'base';\n" };
  const criticalFiles = criticalPaths ? [
    "core/task-close.mjs",
    "tools/architecture/public-behavior-baseline.mjs",
    "contracts/facts-subschema.json",
    "workflows/build-code/SKILL.md",
    "skills/wh-review/contracts/build-code.md",
    "skills/mini-task/scripts/mini-task-runner.mjs",
    "tests/contract/integration-review-subject.test.mjs",
    "skills/wh-review/scripts/integration-review-subject.mjs",
  ] : [];
  for (const name of criticalFiles) files[name] = "export const fixture = 'base';\n";
  mkdirSync(join(root, "runtime"), { recursive: true });
  for (const [name, raw] of Object.entries(files)) {
    const target = name.startsWith("runtime/") || criticalFiles.includes(name) ? join(root, name) : join(dir, name);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, raw);
  }
  execFileSync("git", ["add", "."], { cwd: root }); execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });
  writeFileSync(join(root, "runtime/fixture.mjs"), "export const fixture = 'changed';\n");
  for (const name of criticalFiles) writeFileSync(join(root, name), "export const fixture = 'changed';\n");
  writeFileSync(join(dir, "tasks.md"), files["tasks.md"]);
  execFileSync("git", ["add", "specs/current-only/tasks.md", "runtime/fixture.mjs", ...criticalFiles], { cwd: root });
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  const tree = execFileSync("git", ["write-tree"], { cwd: root, encoding: "utf8" }).trim();
  const finalTree = tree;
  const receiptTree = stale ? "f".repeat(40) : tree;
  const implementationDiff = {
    schema_version: "workflowhub-diff-evidence.v1",
    baseline_commit: head,
    snapshot_head: head,
    snapshot_tree: receiptTree,
    patch: "fixture patch\n",
    untracked: [],
  };
  const implementationDiffRaw = JSON.stringify(implementationDiff);
  const implementationDiffHash = sha(implementationDiffRaw);
  const implementationDiffRef = `quality/evidence/implementation/${implementationDiffHash}.diff`;
  const implementation = {
    schema_version: "workflowhub-receipt.v1", task_id: taskId, stage: "build-code",
    producer: { stage: "build-code", component: "implementation", version: "1.0.0" },
    changed: ["runtime/fixture.mjs"], snapshot_head: head, snapshot_tree: receiptTree, snapshot_commit: head,
    diff_ref: implementationDiffRef, diff_hash: implementationDiffHash,
  };
  const greenOutputRef = "quality/tests/output/build-code.output";
  const greenOutput = "fixture GREEN output\n";
  const green = {
    schema_version: "workflowhub-receipt.v1", task_id: taskId, stage: "build-code",
    producer: { stage: "build-code", component: "build-code-test-capture", version: "1.0.0" },
    command: "npm test", command_hash: sha("npm test"), exit_code: 0,
    snapshot_head: head, snapshot_tree: receiptTree, snapshot_commit: head,
    output_ref: greenOutputRef, output_hash: sha(greenOutput),
  };
  const implementationRaw = JSON.stringify(implementation); const greenRaw = JSON.stringify(green);
  const refs = [
    { ref: "quality/evidence/implementation.json", sha256: sha(implementationRaw) },
    { ref: "quality/tests/build-code.json", sha256: sha(greenRaw) },
  ];
  files["tasks.md"] = taskBody.replaceAll("PLACEHOLDER", "current implementation and GREEN evidence");
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
  for (const [ref, raw] of [[refs[0].ref, implementationRaw], [refs[1].ref, greenRaw], [implementationDiffRef, implementationDiffRaw]]) {
    const destination = join(task.taskPath, ref);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, raw);
  }
  mkdirSync(dirname(join(task.taskPath, greenOutputRef)), { recursive: true });
  writeFileSync(join(task.taskPath, greenOutputRef), greenOutput);
  const currentTask = openTask(task.taskPath, task.identity);
  return {
    root, finalTree, task: currentTask, artifacts: ArtifactDir.open(root, currentTask),
    cleanup: () => { rmSync(root, { recursive: true, force: true }); rmSync(storage, { recursive: true, force: true }); },
  };
}

describe("integration review subject current-state boundary", () => {
  it("keeps the skill entry point bound to the runtime implementation", () => {
    expect(buildIntegrationReviewSubject).not.toBe(runtimeIntegrationSubject.buildIntegrationReviewSubject);
    expect(inspectIntegrationReviewSubject).not.toBe(runtimeIntegrationSubject.inspectIntegrationReviewSubject);
  });

  it("does not create a historical Phase coverage audit gate", () => {
    const f = fixture();
    try {
      const subject = buildIntegrationReviewSubject({
        task: f.task,
        sourceRoot: f.root,
        artifacts: f.artifacts,
        finalTree: f.finalTree,
        current_receipts: { implementation_ref: "quality/evidence/implementation.json", green_ref: "quality/tests/build-code.json" },
      });
      expect(subject.formal_record_status).toMatchObject({ status: "available" });
      expect(subject).not.toHaveProperty("phase_coverage");
      expect(subject).not.toHaveProperty("seam_index");
    }
    finally { f.cleanup(); }
  });

  it("parses the current H2 task-card format into completion history", () => {
    const f = fixture({ multiTask: true });
    try {
      const subject = buildIntegrationReviewSubject({ task: f.task, sourceRoot: f.root, artifacts: f.artifacts, finalTree: f.finalTree });
      expect(subject.formal_record_status).toMatchObject({ status: "available" });
      expect(subject.ac_trace.entries.find((entry) => entry.acceptance_criterion_id === "AC-01").change.map((entry) => entry.task_id))
        .toEqual(["T001", "T002"]);
    } finally { f.cleanup(); }
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

  it("keeps the current review usable when historical task bindings are missing", () => {
    const f = fixture({ missingTaskBindings: true });
    try {
      const subject = buildIntegrationReviewSubject({
        task: f.task,
        sourceRoot: f.root,
        artifacts: f.artifacts,
        finalTree: f.finalTree,
        current_receipts: { implementation_ref: "quality/evidence/implementation.json", green_ref: "quality/tests/build-code.json" },
      });
      expect(subject.formal_record_status).toMatchObject({ status: "unavailable" });
      expect(subject.audit_gaps).toEqual(expect.arrayContaining([
        expect.objectContaining({ kind: "task_completion_history", reason: expect.stringMatching(/Trace AC ids are missing|evidence refs are missing/) }),
      ]));
      expect(subject.ac_trace.entries[0].change[0].task_id).toBeNull();
    } finally { f.cleanup(); }
  });

  it("does not treat a completed card without execution facts as usable history", () => {
    const f = fixture({ missingExecution: true });
    try {
      const subject = buildIntegrationReviewSubject({ task: f.task, sourceRoot: f.root, artifacts: f.artifacts, finalTree: f.finalTree });
      expect(subject.formal_record_status).toMatchObject({ status: "unavailable" });
      expect(subject.audit_gaps).toEqual(expect.arrayContaining([
        expect.objectContaining({ kind: "task_completion_history", reason: expect.stringMatching(/execution facts are missing/) }),
      ]));
      expect(subject.ac_trace.entries[0].change[0].task_id).toBeNull();
    } finally { f.cleanup(); }
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
      expect(subject.ac_trace.implementation_anchors).toEqual([
        expect.objectContaining({ id: "implementation-runtime__fixture.mjs-1", path: "runtime/fixture.mjs", role: "implementation" }),
      ]);
      expect(subject.ac_trace.implementation_anchors[0].start_line).toBe(1);
    } finally { f.cleanup(); }
  });

  it("includes critical production, contract, workflow, skill, and contract-test paths", () => {
    const f = fixture({ criticalPaths: true });
    try {
      const subject = buildIntegrationReviewSubject({ task: f.task, sourceRoot: f.root, artifacts: f.artifacts, finalTree: f.finalTree });
      expect(subject.ac_trace.implementation_anchors.map((anchor) => anchor.path)).toEqual(expect.arrayContaining([
        "core/task-close.mjs",
        "tools/architecture/public-behavior-baseline.mjs",
        "contracts/facts-subschema.json",
        "workflows/build-code/SKILL.md",
        "skills/wh-review/contracts/build-code.md",
        "skills/mini-task/scripts/mini-task-runner.mjs",
        "tests/contract/integration-review-subject.test.mjs",
        "skills/wh-review/scripts/integration-review-subject.mjs",
      ]));
    } finally { f.cleanup(); }
  });

  it("reports missing same-snapshot evidence as unavailable audit data", () => {
    const f = fixture({ stale: true });
    try {
      const subject = inspectIntegrationReviewSubject({ task: f.task, sourceRoot: f.root, artifacts: f.artifacts, finalTree: f.finalTree });
      expect(subject.formal_record_status).toMatchObject({ status: "unavailable", reason: expect.stringMatching(/current implementation receipt/) });
    } finally { f.cleanup(); }
  });

  it("keeps an exit-code-only green receipt as an unavailable host fact", () => {
    const f = fixture();
    try {
      writeFileSync(join(f.task.taskPath, "quality/tests/build-code.json"), JSON.stringify({ stage: "build-code", snapshot_tree: f.finalTree, exit_code: 0 }));
      const subject = buildIntegrationReviewSubject({ task: f.task, sourceRoot: f.root, artifacts: f.artifacts, finalTree: f.finalTree });
      expect(subject.formal_record_status).toMatchObject({ status: "unavailable", reason: expect.stringMatching(/current GREEN test receipt/) });
      expect(subject.audit_gaps).toEqual(expect.arrayContaining([
        expect.objectContaining({ kind: "current_green_receipt", status: "unavailable" }),
      ]));
    } finally { f.cleanup(); }
  });

  it("keeps a missing historical RED receipt as an audit gap, not a provider-call blocker", () => {
    const f = fixture({ missingHistoryEvidence: true });
    try {
      const subject = buildIntegrationReviewSubject({
        task: f.task,
        sourceRoot: f.root,
        artifacts: f.artifacts,
        finalTree: f.finalTree,
        current_receipts: { implementation_ref: "quality/evidence/implementation.json", green_ref: "quality/tests/build-code.json" },
      });
      expect(subject.formal_record_status).toMatchObject({ status: "unavailable" });
      expect(subject.audit_gaps).toEqual(expect.arrayContaining([
        expect.objectContaining({ kind: "task_completion_history", reason: expect.stringMatching(/missing-history-implementation/) }),
      ]));
      expect(subject.ac_trace.entries[0].change[0].task_id).toBeNull();
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
