import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { MATERIAL_FILES, createMaterialRevision } from "../../core/material-revision.mjs";
import { evaluateFactFreshness, sha256 } from "../../core/freshness.mjs";
import { createTask, createTaskKernel } from "../../core/task-handle.mjs";

const materials = Object.fromEntries(MATERIAL_FILES.map((name) => [name, `# ${name}\n`]));
const requirements = {
  ledger: { ref: "requirements/ledger.json", hash: "1".repeat(64) },
  coverage: { ref: "requirements/coverage.json", hash: "2".repeat(64) },
};
const temporary = [];
afterEach(() => {
  while (temporary.length > 0) rmSync(temporary.pop(), { recursive: true, force: true });
});

function productionFixture() {
  const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-phase2-material-")));
  temporary.push(storageRoot);
  const repo = join(storageRoot, "repo");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  const root = join(repo, "specs", "phase2");
  mkdirSync(root, { recursive: true });
  for (const file of MATERIAL_FILES) writeFileSync(join(root, file), materials[file]);
  execFileSync("git", ["add", "."], { cwd: repo });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: repo });
  const task = createTask({
    storageRoot,
    manifest: {
      schema_version: "1.0.0", task_id: "phase2", project_name: "WorkflowHub",
      created_at: "2026-07-31T00:00:00Z", target_repo_root: repo, issue_ids: [], inputs: {},
    },
  });
  return { task, artifacts: ArtifactDir.open(repo, task) };
}

function installRequirements(task, generation, suffix) {
  const ledgerRef = `requirements/ledger-${suffix}.json`;
  const coverageRef = `requirements/coverage-${suffix}.json`;
  const ledgerRaw = `ledger-${suffix}`;
  const coverageRaw = `coverage-${suffix}`;
  task.createRecordAtomic(ledgerRef, ledgerRaw);
  task.createRecordAtomic(coverageRef, coverageRaw);
  const pointer = `${JSON.stringify({
    schema_version: "requirements-current.v1", task_id: "phase2", generation,
    ledger_ref: ledgerRef, ledger_hash: sha256(ledgerRaw), content_hash: sha256(ledgerRaw),
    coverage_ref: coverageRef, coverage_hash: sha256(coverageRaw), parent_ref: null,
  }, null, 2)}\n`;
  if (generation === 1) task.createRecordAtomic("requirements/current.json", pointer);
  else {
    const prior = task.readRecord("requirements/current.json");
    task.writeRecordAtomic("requirements/current.json", pointer, { expectedPriorRaw: prior, validator: () => {} });
  }
}

describe("single material revision", () => {
  it("binds all four materials and creates one parent-linked revision", () => {
    expect(() => createMaterialRevision({ taskId: "task", materials, requirements, changeSummary: "initial", sourceRefs: [] })).toThrow(/sourceRefs/);
    const validFirst = createMaterialRevision({ taskId: "task", materials, requirements, changeSummary: "initial", sourceRefs: [{ ref: "source", hash: "a".repeat(64) }] });
    const next = createMaterialRevision({
      taskId: "task",
      materials: { ...materials, "spec.md": "# revised\n" },
      requirements,
      previous: { ...validFirst.revision, revision_ref: validFirst.revision_ref, revision_hash: validFirst.revision_hash },
      changeSummary: "revise spec",
      sourceRefs: [{ ref: "reply", hash: "b".repeat(64) }],
    });
    expect(validFirst.revision.changed_files).toEqual([...MATERIAL_FILES, "requirements"]);
    expect(next.revision.changed_files).toEqual(["spec.md"]);
    expect(next.revision.parent_revision).toBe(validFirst.revision.revision_id);
  });

  it("marks an unchanged revision idempotent", () => {
    const first = createMaterialRevision({ taskId: "task", materials, requirements, changeSummary: "initial", sourceRefs: [{ ref: "source", hash: "a".repeat(64) }] });
    expect(createMaterialRevision({
      taskId: "task", materials, requirements,
      previous: first.revision,
      changeSummary: "retry",
      sourceRefs: [{ ref: "source", hash: "a".repeat(64) }],
    })).toMatchObject({ idempotent: true });
  });

  it("requirements ledger or coverage change creates a new revision", () => {
    const first = createMaterialRevision({ taskId: "task", materials, requirements, changeSummary: "initial", sourceRefs: [{ ref: "source", hash: "a".repeat(64) }] });
    const next = createMaterialRevision({
      taskId: "task", materials,
      requirements: { ...requirements, coverage: { ...requirements.coverage, hash: "3".repeat(64) } },
      previous: { ...first.revision, revision_ref: first.revision_ref, revision_hash: first.revision_hash },
      changeSummary: "coverage changed", sourceRefs: [{ ref: "coverage", hash: "3".repeat(64) }],
    });
    expect(next.revision.changed_files).toEqual(["requirements"]);
  });

  it("production publishMaterialRevision uses the one core model and observes requirements current changes", () => {
    const { task, artifacts } = productionFixture();
    installRequirements(task, 1, "a");
    const first = createTaskKernel(task, { artifacts }).publishMaterialRevision({
      change_summary: "initial", source_refs: ["task.json"],
    });
    installRequirements(task, 2, "b");
    const second = createTaskKernel(task, { artifacts }).publishMaterialRevision({
      change_summary: "requirements changed", source_refs: ["task.json"],
      expected_current_ref: first.revision_ref,
    });
    expect(second.changed_files).toEqual(["requirements"]);
    expect(JSON.parse(task.readRecord(second.revision_ref)).requirements.coverage.ref).toBe("requirements/coverage-b.json");
  });

  for (const kind of ["test", "review", "acceptance_criterion", "confirmation"]) {
    it(`reports current/stale/missing for ${kind} facts`, () => {
      const tree = "b".repeat(40);
      const subject = kind === "confirmation" ? "human_confirmation" : "subject";
      const nested = kind === "review" ? {
        version: "wh-review-result.v1", task_id: "task", stage: "build-code", review_track: null,
        source: { target_commit: "a".repeat(40), base_commit: "a".repeat(40), base_tree: "a".repeat(40), captured_head: "a".repeat(40) },
        snapshot_tree: tree, material_id: "a".repeat(64), attempt_ref: "reviews/attempts/a/attempt.json",
        subject_kind: "worktree", phase_id: null, review_scope: "integration",
        provider_results: [{ provider: "fixture", output: { verdict: "pass", summary: "pass", findings: [] } }],
        verdict: "pass", findings: [],
      } : kind === "test" ? {
        schema_version: "workflowhub-receipt.v1", task_id: "task", stage: "build-code",
        producer: { stage: "build-code", component: subject, version: "1" }, exit_code: 0,
        snapshot_tree: tree, output_ref: "output.txt", output_hash: sha256("output"),
      } : kind === "acceptance_criterion" ? {
        schema_version: "acceptance-evidence.v1", acceptance_criterion_id: subject,
        result: "pass", snapshot_tree: tree, refs: [{ ref: "evidence/leaf.json", sha256: sha256("leaf") }],
      } : {
        schema_version: "human-confirmation.v1", task_id: "task", stage: "build-code",
        attempt_ref: "attempt-0001.json", decision: "accepted", confirmed_at: "2026-07-31T00:00:00Z",
      };
      const nestedRaw = JSON.stringify(nested);
      const value = {
        schema_version: "quality-fact.v1", fact_id: `quality-${"c".repeat(64)}`,
        task_id: "task", stage: "build-code", material_revision: "revision-a", snapshot_tree: tree,
        kind, subject, status: "passed",
        evidence: [{ ref: "nested.json", sha256: sha256(nestedRaw), evidence_type: {
          test: "test_receipt", review: "review_result", acceptance_criterion: "acceptance_evidence",
          confirmation: "human_confirmation",
        }[kind] }],
      };
      const raw = JSON.stringify(value);
      const records = new Map([["fact.json", raw], ["nested.json", nestedRaw], ["output.txt", "output"], ["evidence/leaf.json", "leaf"]]);
      const fact = { ...value, ref: "fact.json", sha256: sha256(raw) };
      expect(evaluateFactFreshness(fact, { material_revision: "revision-a", snapshot_tree: tree }, { read: (ref) => records.has(ref) ? records.get(ref) : (() => { const e = new Error(); e.code = "ENOENT"; throw e; })() }).status).toBe("current");
      records.set("nested.json", `${kind}-mutated`);
      expect(evaluateFactFreshness(fact, { material_revision: "revision-a", snapshot_tree: tree }, { read: (ref) => records.get(ref) }).status).toBe("stale");
      records.delete("nested.json");
      expect(evaluateFactFreshness(fact, { material_revision: "revision-a", snapshot_tree: tree }, { read: () => { const e = new Error(); e.code = "ENOENT"; throw e; } }).status).toBe("missing");
    });
  }

  it("separately reports material and tree mutation as stale", () => {
    const value = { task_id: "task", stage: "build-code", material_revision: "revision-a", snapshot_tree: "tree-a", kind: "test", subject: "subject", status: "passed", evidence: [] };
    const raw = JSON.stringify(value);
    const fact = { ...value, ref: "fact.json", sha256: sha256(raw) };
    const read = () => raw;
    expect(evaluateFactFreshness(fact, { material_revision: "revision-b", snapshot_tree: "tree-a" }, { read }).dependencies.material).toBe("stale");
    expect(evaluateFactFreshness(fact, { material_revision: "revision-a", snapshot_tree: "tree-b" }, { read }).dependencies.tree).toBe("stale");
  });

  it("rejects fake schemas, wrong evidence types, failed-verdict tampering, and deleted/tampered nested evidence", () => {
    const tree = "b".repeat(40);
    const review = {
      version: "wh-review-result.v1", task_id: "task", stage: "build-code", review_track: null,
      source: { target_commit: "a".repeat(40), base_commit: "a".repeat(40), base_tree: "a".repeat(40), captured_head: "a".repeat(40) },
      snapshot_tree: tree, material_id: "a".repeat(64), attempt_ref: "reviews/attempts/a/attempt.json",
      subject_kind: "worktree", phase_id: null, review_scope: "integration",
      provider_results: [{ provider: "fixture", output: { verdict: "pass", summary: "pass", findings: [] } }],
      verdict: "pass", findings: [],
    };
    const reviewRaw = JSON.stringify(review);
    const factValue = {
      schema_version: "quality-fact.v1", fact_id: `quality-${"d".repeat(64)}`,
      task_id: "task", stage: "build-code", material_revision: "revision-a", snapshot_tree: tree,
      kind: "review", subject: "integration_review", status: "passed",
      evidence: [{ ref: "review.json", sha256: sha256(reviewRaw), evidence_type: "review_result" }],
    };
    const factRaw = JSON.stringify(factValue);
    const fact = { ...factValue, ref: "fact.json", sha256: sha256(factRaw) };
    const current = { material_revision: "revision-a", snapshot_tree: tree };
    const records = new Map([["fact.json", factRaw], ["review.json", reviewRaw]]);
    const assess = (candidate = fact) => evaluateFactFreshness(candidate, current, { read(ref) {
      if (!records.has(ref)) { const error = new Error("missing"); error.code = "ENOENT"; throw error; }
      return records.get(ref);
    } });
    expect(assess().status).toBe("current");
    records.set("review.json", JSON.stringify({ ...review, version: "workflowhub-result.v2" }));
    expect(assess().status).toBe("stale");
    records.set("review.json", reviewRaw);
    expect(assess({ ...fact, evidence: [{ ...fact.evidence[0], evidence_type: "test_receipt" }] }).status).toBe("stale");
    const failed = JSON.stringify({ ...review, verdict: "revise_required", findings: [{
      provider: "fixture", severity: "major", path: "x", issue: "x", recommendation: "x",
    }] });
    records.set("review.json", failed);
    expect(assess({ ...fact, evidence: [{ ...fact.evidence[0], sha256: sha256(failed) }] }).status).toBe("stale");
    records.set("review.json", `${reviewRaw}tampered`);
    expect(assess().status).toBe("stale");
    records.delete("review.json");
    expect(assess().status).toBe("missing");
  });
});
