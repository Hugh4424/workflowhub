import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { MATERIAL_FILES } from "../../runtime/task/material-revision.mjs";
import { createTask } from "../../core/task-handle.mjs";
import { materialRevisionBaseline } from "../../workflows/build-code/phase-evidence.mjs";

const temporary = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

function taskFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-phase-material-baseline-")));
  temporary.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q"]);
  git(repo, ["config", "user.name", "Test"]);
  git(repo, ["config", "user.email", "test@example.com"]);
  const taskId = "phase-material";
  const materialRoot = join(repo, "specs", taskId);
  mkdirSync(materialRoot, { recursive: true });
  const initial = {
    "decision-log.md": "# Decision\n",
    "spec.md": "# Spec v1\n",
    "plan.md": "# Plan v1\n\n## Phase 1: Contract\n## Phase 2: Delivery\n",
    "tasks.md": tasks(false),
  };
  for (const name of MATERIAL_FILES) writeFileSync(join(materialRoot, name), initial[name]);
  writeFileSync(join(repo, "phase-1.txt"), "phase 1\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "phase 1 implementation"]);
  const implementationCommit = git(repo, ["rev-parse", "HEAD"]);
  const task = createTask({
    storageRoot: root,
    taskPath: join(root, "Projects", "Demo", "tasks", taskId),
    manifest: {
      schema_version: "1.0.0", project_name: "Demo", task_id: taskId,
      created_at: "2026-08-01T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {},
    },
  });
  return { root, repo, task, taskId, materialRoot, implementationCommit, initial };
}

function tasks(completed) {
  return `# Tasks

## Phase 1: Contract

#### T001 — Contract

##### 执行状态填写区（唯一完成权威）

- [${completed ? "x" : " "}] **任务完成**
- **status**：\`${completed ? "completed" : "pending"}\`
- **actual_changes**：${completed ? "phase-1.txt" : "N/A — not started"}
- **executed_commands**：${completed ? "true; exit 0" : "N/A — not started"}
- **evidence_refs**：${completed ? "[]" : "N/A — not started"}
- **covered_ac**：${completed ? "AC-01" : "N/A — not started"}
- **review_fact**：${completed ? "reviews/phase-1.json" : "N/A — not reviewed"}
- **completed_at**：${completed ? "2026-08-01T00:00:00.000Z" : "N/A — not completed"}

## Phase 2: Delivery

#### T002 — Delivery

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：\`pending\`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — not reviewed
- **completed_at**：N/A — not completed
`;
}

function publishRevision(fixture, values) {
  const hashes = Object.fromEntries(MATERIAL_FILES.map((name) => [name, sha256(values[name])]));
  const digest = "a".repeat(64);
  const revision = {
    schema_version: "task-material-revision.v1",
    task_id: fixture.taskId,
    revision_id: `revision-${digest}`,
    parent_revision: null,
    previous_ref: null,
    previous_hash: null,
    changed_files: MATERIAL_FILES,
    change_summary: "phase material revision",
    source_refs: [{ ref: "source/fact.json", hash: "b".repeat(64) }],
    hashes,
  };
  const revisionRaw = `${JSON.stringify(revision, null, 2)}\n`;
  const revisionRef = `materials/revisions/${digest}.json`;
  fixture.task.createRecordAtomic(revisionRef, revisionRaw);
  fixture.task.createRecordAtomic("materials/current.json", `${JSON.stringify({
    schema_version: "task-material-current.v1", task_id: fixture.taskId, generation: 1,
    revision_id: revision.revision_id, revision_ref: revisionRef, revision_hash: sha256(revisionRaw), previous_ref: null,
  }, null, 2)}\n`);
}

function seedPhaseEvidence(fixture) {
  const taskRecords = join(fixture.root, "Projects", "Demo", "tasks", fixture.taskId);
  for (const [ref, raw] of [["receipts/phase-1-implementation.json", "phase 1 implementation\n"], ["receipts/phase-1-green.json", "phase 1 green\n"], ["reviews/phase-1.json", "phase 1 review\n"]]) {
    const path = join(taskRecords, ref);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, raw);
  }
}

function previous(implementationCommit, phaseEvidence = {}) {
  return {
    scan: { implementation_commit: implementationCommit },
    phaseResult: {
      phase_id: "phase-1",
      evidence: {
        implementation_receipt_ref: "receipts/phase-1-implementation.json",
        green_test_receipt_ref: "receipts/phase-1-green.json",
        ...phaseEvidence,
      },
      review: { result_ref: "reviews/phase-1.json" },
    },
  };
}

afterEach(() => {
  while (temporary.length > 0) rmSync(temporary.pop(), { recursive: true, force: true });
});

describe("next Phase material revision baseline", () => {
  it("overlays a recorded revision on the completed Phase implementation tree", () => {
    const fixture = taskFixture();
    seedPhaseEvidence(fixture);
    const implRaw = "phase 1 implementation\n";
    const greenRaw = "phase 1 green\n";
    const reviewRaw = "phase 1 review\n";
    const evidence = [
      { ref: "receipts/phase-1-implementation.json", sha256: sha256(implRaw) },
      { ref: "receipts/phase-1-green.json", sha256: sha256(greenRaw) },
      { ref: "reviews/phase-1.json", sha256: sha256(reviewRaw) },
    ];
    const revisedTasks = tasks(true).replace("- **evidence_refs**：[]", `- **evidence_refs**：\`${JSON.stringify(evidence)}\``);
    const revised = { ...fixture.initial, "spec.md": "# Spec v2\n", "plan.md": "# Plan v2\n\n## Phase 1: Contract\n## Phase 2: Delivery\n", "tasks.md": revisedTasks };
    for (const name of ["spec.md", "plan.md"]) writeFileSync(join(fixture.materialRoot, name), revised[name]);
    writeFileSync(join(fixture.materialRoot, "tasks.md"), revised["tasks.md"]);
    publishRevision(fixture, revised);

    const baseline = materialRevisionBaseline(fixture.task, { worktreeRoot: fixture.repo }, previous(fixture.implementationCommit));
    expect(git(fixture.repo, ["rev-parse", `${baseline}^`])).toBe(fixture.implementationCommit);
    expect(git(fixture.repo, ["show", `${baseline}:specs/${fixture.taskId}/spec.md`])).toBe("# Spec v2");
    expect(git(fixture.repo, ["show", `${baseline}:specs/${fixture.taskId}/plan.md`])).toContain("# Plan v2");
    expect(git(fixture.repo, ["diff", "--name-only", fixture.implementationCommit, baseline])).toEqual(expect.stringContaining(`specs/${fixture.taskId}/spec.md`));
  });

  it("accepts completion recorded after a revision that left tasks unchanged", () => {
    const fixture = taskFixture();
    const revised = { ...fixture.initial, "spec.md": "# Spec v2\n" };
    writeFileSync(join(fixture.materialRoot, "spec.md"), revised["spec.md"]);
    publishRevision(fixture, revised);
    const implRaw = "phase 1 implementation\n";
    const greenRaw = "phase 1 green\n";
    const reviewRaw = "phase 1 review\n";
    const taskRecords = join(fixture.root, "Projects", "Demo", "tasks", fixture.taskId);
    for (const [ref, raw] of [["receipts/phase-1-implementation.json", implRaw], ["receipts/phase-1-green.json", greenRaw], ["reviews/phase-1.json", reviewRaw]]) {
      const path = join(taskRecords, ref);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, raw);
    }
    const evidence = [
      { ref: "receipts/phase-1-implementation.json", sha256: sha256(implRaw) },
      { ref: "receipts/phase-1-green.json", sha256: sha256(greenRaw) },
      { ref: "reviews/phase-1.json", sha256: sha256(reviewRaw) },
    ];
    const completedTasks = tasks(true).replace("- **evidence_refs**：[]", `- **evidence_refs**：\`${JSON.stringify(evidence)}\``);
    writeFileSync(join(fixture.materialRoot, "tasks.md"), completedTasks);
    const baseline = materialRevisionBaseline(fixture.task, { worktreeRoot: fixture.repo }, previous(fixture.implementationCommit));
    expect(git(fixture.repo, ["show", `${baseline}:specs/${fixture.taskId}/tasks.md`])).toContain("[x] **任务完成**");
  });

  it("accepts a revision that carries a valid prior Phase completion seam", () => {
    const fixture = taskFixture();
    seedPhaseEvidence(fixture);
    const implRaw = "phase 1 implementation\n";
    const greenRaw = "phase 1 green\n";
    const reviewRaw = "phase 1 review\n";
    const evidence = [
      { ref: "receipts/phase-1-implementation.json", sha256: sha256(implRaw) },
      { ref: "receipts/phase-1-green.json", sha256: sha256(greenRaw) },
      { ref: "reviews/phase-1.json", sha256: sha256(reviewRaw) },
    ];
    const completed = tasks(true).replace("- **evidence_refs**：[]", `- **evidence_refs**：\`${JSON.stringify(evidence)}\``);
    const revised = { ...fixture.initial, "tasks.md": completed, "spec.md": "# Spec v2\n" };
    writeFileSync(join(fixture.materialRoot, "tasks.md"), revised["tasks.md"]);
    writeFileSync(join(fixture.materialRoot, "spec.md"), revised["spec.md"]);
    publishRevision(fixture, revised);
    const baseline = materialRevisionBaseline(fixture.task, { worktreeRoot: fixture.repo }, previous(fixture.implementationCommit));
    expect(git(fixture.repo, ["show", `${baseline}:specs/${fixture.taskId}/tasks.md`])).toContain("[x] **任务完成**");
  });

  it("allows future-task edits while preserving the prior Phase completion seam", () => {
    const fixture = taskFixture();
    seedPhaseEvidence(fixture);
    const implRaw = "phase 1 implementation\n";
    const greenRaw = "phase 1 green\n";
    const reviewRaw = "phase 1 review\n";
    const evidence = [
      { ref: "receipts/phase-1-implementation.json", sha256: sha256(implRaw) },
      { ref: "receipts/phase-1-green.json", sha256: sha256(greenRaw) },
      { ref: "reviews/phase-1.json", sha256: sha256(reviewRaw) },
    ];
    const completed = tasks(true)
      .replace("- **evidence_refs**：[]", `- **evidence_refs**：\`${JSON.stringify(evidence)}\``)
      .replace("#### T002 — Delivery", "#### T002 — Delivery revised");
    const revised = { ...fixture.initial, "tasks.md": completed };
    writeFileSync(join(fixture.materialRoot, "tasks.md"), revised["tasks.md"]);
    publishRevision(fixture, revised);
    expect(() => materialRevisionBaseline(fixture.task, { worktreeRoot: fixture.repo }, previous(fixture.implementationCommit))).not.toThrow();
  });

  it("rejects completion after a revision that also changed task semantics", () => {
    const fixture = taskFixture();
    const revised = { ...fixture.initial, "tasks.md": `${tasks(false)}\n<!-- revised task semantics -->\n` };
    writeFileSync(join(fixture.materialRoot, "tasks.md"), revised["tasks.md"]);
    publishRevision(fixture, revised);
    seedPhaseEvidence(fixture);
    writeFileSync(join(fixture.materialRoot, "tasks.md"), tasks(true));
    expect(() => materialRevisionBaseline(fixture.task, { worktreeRoot: fixture.repo }, previous(fixture.implementationCommit)))
      .toThrow(/invalid material revision completion seam|stale after tasks completion|publish a new revision/i);
  });

  it("rejects a material revision that forges prior Phase completion facts", () => {
    const fixture = taskFixture();
    const forged = { ...fixture.initial, "tasks.md": tasks(true) };
    writeFileSync(join(fixture.materialRoot, "tasks.md"), forged["tasks.md"]);
    publishRevision(fixture, forged);
    seedPhaseEvidence(fixture);
    expect(() => materialRevisionBaseline(fixture.task, { worktreeRoot: fixture.repo }, previous(fixture.implementationCommit)))
      .toThrow(/invalid material revision completion seam/i);
  });

  it("rejects missing, tampered, or unbound material revisions", () => {
    const fixture = taskFixture();
    expect(() => materialRevisionBaseline(fixture.task, { worktreeRoot: fixture.repo }, previous(fixture.implementationCommit)))
      .toThrow(/current material revision is required/i);

    const revised = { ...fixture.initial, "spec.md": "# Spec v2\n" };
    writeFileSync(join(fixture.materialRoot, "spec.md"), revised["spec.md"]);
    publishRevision(fixture, revised);
    writeFileSync(join(fixture.materialRoot, "spec.md"), "# tampered\n");
    expect(() => materialRevisionBaseline(fixture.task, { worktreeRoot: fixture.repo }, previous(fixture.implementationCommit)))
      .toThrow(/does not bind live spec\.md/i);
  });
});
