import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../core/artifact-dir.mjs", () => ({
  assertArtifactDir: (value) => value,
  artifactReference: (taskId, name) => `specs/${taskId}/${name}`,
  ArtifactDir: {},
}));

const { buildIntegrationReviewSubject } = await import("../../runtime/review/integration-review-subject.mjs");

const sha256 = (raw) => createHash("sha256").update(raw).digest("hex");
const git = (root, args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();

function fixture({ tasks = "# tasks\n\nNo completion rows yet.\n", executionRecordOnlyDelta = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-integration-subject-"));
  mkdirSync(join(root, "specs", "task"), { recursive: true });
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.email", "workflowhub@test"], { cwd: root });
  execFileSync("git", ["config", "user.name", "WorkflowHub Test"], { cwd: root });
  const materials = {
    "decision-log.md": "# decision\n",
    "spec.md": "# spec\n\nAC-01\n",
    "plan.md": "# plan\n",
    "tasks.md": tasks,
  };
  for (const [name, content] of Object.entries(materials)) writeFileSync(join(root, "specs", "task", name), content);
  execFileSync("git", ["add", "specs"], { cwd: root });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });
  const receiptTree = git(root, ["rev-parse", "HEAD^{tree}"]);
  if (executionRecordOnlyDelta) {
    const currentTasks = `${tasks}\n### 执行状态填写区\n- 记录：本次只写回执行事实。\n`;
    writeFileSync(join(root, "specs", "task", "tasks.md"), currentTasks);
    materials["tasks.md"] = currentTasks;
    execFileSync("git", ["add", "specs/task/tasks.md"], { cwd: root });
  }
  const tree = execFileSync("git", ["write-tree"], { cwd: root, encoding: "utf8" }).trim();
  const records = new Map();
  const head = git(root, ["rev-parse", "HEAD"]);
  const implementationDiff = `${JSON.stringify({
    schema_version: "workflowhub-diff-evidence.v1",
    baseline_commit: head,
    snapshot_head: head,
    snapshot_tree: receiptTree,
    patch: "",
    untracked: [],
  }, null, 2)}\n`;
  const implementationDiffHash = sha256(implementationDiff);
  const implementationDiffRef = `quality/evidence/implementation/${implementationDiffHash}.diff`;
  records.set(implementationDiffRef, implementationDiff);
  const revision = JSON.stringify({
    task_id: "task",
    hashes: Object.fromEntries(Object.entries(materials).map(([name, content]) => [name, sha256(content)])),
  });
  records.set("materials/current.json", JSON.stringify({
    task_id: "task",
    revision_ref: "materials/revisions/rev.json",
    revision_hash: sha256(revision),
  }));
  records.set("materials/revisions/rev.json", revision);
  records.set("receipts/implementation.json", JSON.stringify({
    schema_version: "workflowhub-receipt.v1", task_id: "task", stage: "build-code",
    producer: { stage: "build-code", component: "implementation", version: "fixture" }, changed: [],
    snapshot_head: head, snapshot_tree: receiptTree, snapshot_commit: head,
    diff_ref: implementationDiffRef, diff_hash: implementationDiffHash,
  }));
  const greenOutputRef = "quality/tests/output/green.output";
  const greenOutput = "fixture GREEN output\n";
  const greenReceipt = {
    schema_version: "workflowhub-receipt.v1", task_id: "task", stage: "build-code",
    producer: { stage: "build-code", component: "build-code-test-capture", version: "1.0.0" },
    command: "npm test", command_hash: sha256("npm test"), exit_code: 0, snapshot_tree: receiptTree,
    output_ref: greenOutputRef, output_hash: sha256(greenOutput),
  };
  records.set("receipts/green.json", JSON.stringify(greenReceipt));
  records.set("quality/tests/T002.json", JSON.stringify(greenReceipt));
  records.set(greenOutputRef, greenOutput);
  records.set("quality/evidence/task-fact.json", JSON.stringify({ snapshot_tree: receiptTree, kind: "task-fact" }));
  const task = {
    identity: { taskId: "task" },
    readRecord(ref) {
      if (!records.has(ref)) { const error = new Error(`missing ${ref}`); error.code = "ENOENT"; throw error; }
      return records.get(ref);
    },
    listCanonicalPhaseTraceRefs: () => [],
  };
  const artifacts = {
    read(name) { return materials[name]; },
    reference(name) { return `specs/task/${name}`; },
  };
  return { root, tree, task, artifacts };
}

describe("integration review subject current-material boundary", () => {
  it("builds a current subject without Phase history or seam records", () => {
    const f = fixture();
    const subject = buildIntegrationReviewSubject({
      task: f.task,
      sourceRoot: f.root,
      artifacts: f.artifacts,
      finalTree: f.tree,
      current_receipts: { implementation_ref: "receipts/implementation.json", green_ref: "receipts/green.json" },
    });

    expect(subject.formal_record_status.status).toBe("unavailable");
    expect(subject.audit_gaps.map(({ kind }) => kind)).toEqual(["task_completion_history"]);
    expect(subject.ac_trace.entries).toHaveLength(1);
    expect(subject.ac_trace.entries[0].acceptance_criterion_id).toBe("AC-01");
    expect(subject.ac_trace.entries[0].coverage_status).toBe("unknown");
    expect(subject.ac_trace.entries[0].change[0].task_id).toBeNull();
    expect(subject).not.toHaveProperty("phase_coverage");
    expect(subject).not.toHaveProperty("seam_index");
    expect(subject.ac_trace.implementation_anchors).toEqual([]);
  });

  it("keeps missing implementation evidence as an unavailable host fact", () => {
    const f = fixture();
    const subject = buildIntegrationReviewSubject({
      task: f.task,
      sourceRoot: f.root,
      artifacts: f.artifacts,
      finalTree: f.tree,
      current_receipts: { green_ref: "receipts/green.json" },
    });
    expect(subject.formal_record_status).toMatchObject({ status: "unavailable", reason: expect.stringMatching(/current implementation receipt/) });
    expect(subject.ac_trace.entries[0]).toMatchObject({ evidence_status: "unavailable" });
  });

  it("reads the current task execution fields for AC traceability", () => {
    const f = fixture({
      tasks: "# tasks\n\n### T002 — GREEN\n- **status**：`completed`\n- **covered_ac**：AC-01\n- **evidence_refs**：`quality/tests/T002.json`\n- **执行事实**：GREEN receipt recorded.\n",
    });
    const subject = buildIntegrationReviewSubject({
      task: f.task,
      sourceRoot: f.root,
      artifacts: f.artifacts,
      finalTree: f.tree,
      current_receipts: { implementation_ref: "receipts/implementation.json", green_ref: "receipts/green.json" },
    });

    expect(subject.formal_record_status.status).toBe("available");
    expect(subject.ac_trace.entries[0].coverage_status).toBe("covered");
    expect(subject.ac_trace.entries[0].change[0].task_id).toBe("T002");
    expect(subject.ac_trace.entries[0].test[0].receipt_ref).toBe("quality/tests/T002.json");
    expect(subject.ac_trace.entries[0].evidence[0].ref).toBe("receipts/implementation.json");
  });

  it("reuses implementation, GREEN, and AC facts after execution-only task writeback", () => {
    const f = fixture({
      executionRecordOnlyDelta: true,
      tasks: "# tasks\n\n### T002 — GREEN\n- **status**：`completed`\n- **covered_ac**：AC-01\n- **evidence_refs**：`quality/tests/T002.json`\n- **执行事实**：GREEN receipt recorded.\n",
    });
    const subject = buildIntegrationReviewSubject({
      task: f.task,
      sourceRoot: f.root,
      artifacts: f.artifacts,
      finalTree: f.tree,
      current_receipts: { implementation_ref: "receipts/implementation.json", green_ref: "receipts/green.json" },
    });

    expect(subject.formal_record_status.status).toBe("available");
    expect(subject.ac_trace.entries[0].coverage_status).toBe("covered");
    expect(subject.ac_trace.entries[0].test).toEqual([{ receipt_ref: "quality/tests/T002.json", receipt_hash: expect.any(String) }]);
  });

  it("does not bind the one global GREEN receipt to every acceptance criterion", () => {
    const f = fixture({
      tasks: "# tasks\n\n### T002 — GREEN\n- **status**：`completed`\n- **covered_ac**：AC-01\n- **evidence_refs**：`quality/evidence/task-fact.json`\n- **执行事实**：GREEN receipt recorded.\n",
    });
    const subject = buildIntegrationReviewSubject({
      task: f.task, sourceRoot: f.root, artifacts: f.artifacts, finalTree: f.tree,
      current_receipts: { implementation_ref: "receipts/implementation.json", green_ref: "receipts/green.json" },
    });
    expect(subject.ac_trace.entries[0].coverage_status).toBe("unknown");
    expect(subject.ac_trace.entries[0].test).toEqual([]);
    expect(subject.ac_trace.entries[0].coverage_reason).toMatch(/explicit|test/i);
  });

  it("includes named and typed acceptance IDs, including AC-E2E-001", () => {
    const f = fixture();
    f.artifacts.read = (name) => name === "spec.md" ? "# spec\n\nAC-001 AC-SOURCE-001 AC-E2E-001\n" : ({
      "decision-log.md": "# decision\n", "plan.md": "# plan\n", "tasks.md": "# tasks\n",
    }[name]);
    const subject = buildIntegrationReviewSubject({ task: f.task, sourceRoot: f.root, artifacts: f.artifacts, finalTree: f.tree, current_receipts: { implementation_ref: "receipts/implementation.json", green_ref: "receipts/green.json" } });
    expect(subject.ac_trace.acceptance_ids).toEqual(expect.arrayContaining(["AC-001", "AC-SOURCE-001", "AC-E2E-001"]));
  });
});
