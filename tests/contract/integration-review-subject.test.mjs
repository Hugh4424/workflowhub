import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../core/artifact-dir.mjs", () => ({
  assertArtifactDir: (value) => value,
  ArtifactDir: {},
}));

const { buildIntegrationReviewSubject } = await import("../../runtime/review/integration-review-subject.mjs");

const sha256 = (raw) => createHash("sha256").update(raw).digest("hex");
const git = (root, args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();

function fixture({ tasks = "# tasks\n\nNo completion rows yet.\n" } = {}) {
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
  const tree = git(root, ["rev-parse", "HEAD^{tree}"]);
  const records = new Map();
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
    stage: "build-code", producer: { component: "implementation" }, snapshot_tree: tree,
  }));
  records.set("receipts/green.json", JSON.stringify({
    stage: "build-code", producer: { component: "build-code-test-capture" }, exit_code: 0, snapshot_tree: tree,
  }));
  records.set("quality/tests/T002.json", JSON.stringify({
    stage: "build-code", producer: { component: "fixture-task" }, exit_code: 0, snapshot_tree: tree,
  }));
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
    expect(subject.ac_trace.entries[0].change[0].task_id).toBeNull();
    expect(subject).not.toHaveProperty("phase_coverage");
    expect(subject).not.toHaveProperty("seam_index");
    expect(subject.ac_trace.implementation_anchors).toEqual([]);
  });

  it("keeps current implementation evidence fail-closed", () => {
    const f = fixture();
    expect(() => buildIntegrationReviewSubject({
      task: f.task,
      sourceRoot: f.root,
      artifacts: f.artifacts,
      finalTree: f.tree,
      current_receipts: { green_ref: "receipts/green.json" },
    })).toThrow(/current implementation receipt for final snapshot is missing/);
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
    expect(subject.ac_trace.entries[0].change[0].task_id).toBe("T002");
    expect(subject.ac_trace.entries[0].change[0].evidence_refs[0].ref).toBe("quality/tests/T002.json");
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
