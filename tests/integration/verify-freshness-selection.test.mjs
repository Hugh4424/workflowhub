import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { assertFresh, evaluateFactFreshness, sha256 } from "../../runtime/evidence/freshness.mjs";
import { createQualityFact } from "../../runtime/evidence/quality-fact.mjs";

const roots = [];

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

function store(raw = "{}") {
  const records = new Map([["evidence.json", raw]]);
  return {
    read(ref) {
      if (!records.has(ref)) {
        const error = new Error("missing");
        error.code = "ENOENT";
        throw error;
      }
      return records.get(ref);
    },
    records,
  };
}

describe("verify selects facts by freshness", () => {
  it("accepts a same-tree, same-byte binding", () => {
    const io = store("evidence");
    expect(assertFresh({ ref: "evidence.json", sha256: sha256("evidence"), snapshot_tree: "tree" }, {
      read: io.read,
      snapshotTree: "tree",
    })).toBe(true);
  });

  it("marks changed, missing, or tampered evidence stale", () => {
    const io = store("evidence");
    const base = {
      ref: "fact.json",
      sha256: sha256("evidence"),
      material_revision: "revision",
      snapshot_tree: "tree",
      task_id: "task",
      stage: "verify-code",
      kind: "test",
      subject: "tests",
      status: "passed",
      fact_id: "fact",
      evidence: [],
    };
    io.records.set("fact.json", JSON.stringify({ ...base, schema_version: "quality-fact.v1" }));
    expect(evaluateFactFreshness(base, { material_revision: "revision", snapshot_tree: "other" }, { read: io.read }).status).toBe("stale");
    expect(evaluateFactFreshness(base, { material_revision: "revision", snapshot_tree: "tree" }, { read: () => { const e = new Error("missing"); e.code = "ENOENT"; throw e; } }).status).toBe("missing");
  });

  it("keeps an upstream fact current when only downstream materials are added", () => {
    const fact = {
      schema_version: "quality-fact.v1",
      fact_id: "scoped-make-decision-fact",
      task_id: "task",
      stage: "make-decision",
      material_revision: "revision-global-before",
      material_scope: ["decision-log.md"],
      material_scope_revision: "revision-decision-log",
      snapshot_tree: "tree",
      kind: "acceptance_criterion",
      subject: "scope",
      status: "passed",
      ref: "fact.json",
      sha256: "",
      evidence: [],
    };
    const raw = JSON.stringify(fact);
    const io = store();
    io.records.set(fact.ref, raw);
    expect(evaluateFactFreshness({ ...fact, sha256: sha256(raw) }, {
      material_revision: "revision-global-after-spec-plan",
      material_scope_revisions: { "make-decision": "revision-decision-log" },
      snapshot_tree: "tree",
    }, { read: io.read })).toMatchObject({ status: "current", authenticated: true });
    expect(evaluateFactFreshness({ ...fact, sha256: sha256(raw) }, {
      material_revision: "revision-global-after-decision-edit",
      material_scope_revisions: { "make-decision": "revision-decision-log-changed" },
      snapshot_tree: "tree",
    }, { read: io.read }).status).toBe("stale");
  });

  it("rejects a forged or narrowed material scope", () => {
    const revision = `revision-${"a".repeat(64)}`;
    expect(() => createQualityFact({
      taskId: "task",
      stage: "make-decision",
      materialRevision: revision,
      materialScope: ["spec.md"],
      materialScopeRevision: revision,
      snapshotTree: "tree",
      kind: "test",
      status: "passed",
      subject: "scope",
      evidence: [{ ref: "quality/evidence/test.json", sha256: "b".repeat(64), evidence_type: "test_receipt" }],
    })).toThrow(/fixed stage scope/i);
    const fact = {
      schema_version: "quality-fact.v1",
      fact_id: "forged-scope-fact",
      task_id: "task",
      stage: "make-decision",
      material_revision: revision,
      material_scope: ["spec.md"],
      material_scope_revision: revision,
      snapshot_tree: "tree",
      kind: "test",
      subject: "scope",
      status: "passed",
      ref: "fact.json",
      sha256: "",
      evidence: [],
    };
    const raw = JSON.stringify(fact);
    const io = store();
    io.records.set(fact.ref, raw);
    expect(evaluateFactFreshness({ ...fact, sha256: sha256(raw) }, {
      material_revision: revision,
      material_scope_revisions: { "make-decision": revision },
      snapshot_tree: "tree",
    }, { read: io.read }).status).toBe("stale");
  });

  it("rejects a v2 confirmation bound to a different material or snapshot", () => {
    const materialRevision = `revision-${"a".repeat(64)}`;
    const snapshotTree = "b".repeat(40);
    const confirmation = JSON.stringify({
      schema_version: "human-confirmation.v2",
      task_id: "task",
      stage: "verify-code",
      decision: "accepted",
      material_revision: `revision-${"c".repeat(64)}`,
      snapshot_tree: "d".repeat(40),
      confirmed_at: "2026-08-04T00:00:00.000Z",
    });
    const fact = {
      schema_version: "quality-fact.v1",
      fact_id: "fact",
      task_id: "task",
      stage: "verify-code",
      material_revision: materialRevision,
      snapshot_tree: snapshotTree,
      kind: "confirmation",
      subject: "human_confirmation",
      status: "passed",
      ref: "fact.json",
      sha256: "",
      evidence: [{
        evidence_type: "human_confirmation",
        ref: "confirmation.json",
        sha256: sha256(confirmation),
      }],
    };
    const io = store();
    const factRaw = JSON.stringify({ ...fact, sha256: sha256(JSON.stringify(fact)) });
    io.records.set("fact.json", factRaw);
    io.records.set("confirmation.json", confirmation);
    expect(evaluateFactFreshness({ ...fact, sha256: sha256(factRaw) }, {
      material_revision: materialRevision,
      snapshot_tree: snapshotTree,
    }, { read: io.read }).status).toBe("stale");
  });

  it("keeps explicitly advisory early-stage review current after the task snapshot changes", () => {
    const fact = {
      schema_version: "quality-fact.v1",
      fact_id: "advice-fact",
      task_id: "task",
      stage: "make-decision",
      material_revision: "revision-old",
      snapshot_tree: "old-tree",
      kind: "review",
      subject: "direction_review",
      status: "recorded",
      ref: "advice-fact.json",
      sha256: "",
      evidence: [],
    };
    const raw = JSON.stringify(fact);
    const io = store();
    io.records.set(fact.ref, raw);
    expect(evaluateFactFreshness({ ...fact, sha256: sha256(raw) }, {
      material_revision: "revision-new",
      snapshot_tree: "new-tree",
    }, { read: io.read })).toMatchObject({
      status: "current",
      dependencies: { material: "current", tree: "current", fact: "current" },
    });
  });

  it("does not keep required verify-code review current after the task snapshot changes", () => {
    const fact = {
      schema_version: "quality-fact.v1",
      fact_id: "verify-review-fact",
      task_id: "task",
      stage: "verify-code",
      material_revision: "revision-old",
      snapshot_tree: "old-tree",
      kind: "review",
      subject: "independent_review",
      status: "recorded",
      ref: "verify-review-fact.json",
      sha256: "",
      evidence: [],
    };
    const raw = JSON.stringify(fact);
    const io = store();
    io.records.set(fact.ref, raw);
    expect(evaluateFactFreshness({ ...fact, sha256: sha256(raw) }, {
      material_revision: "revision-new",
      snapshot_tree: "new-tree",
    }, { read: io.read }).status).toBe("stale");
  });

  it("keeps verify-code facts current when only the task execution-status block is written back", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-freshness-record-only-"));
    roots.push(root);
    const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
    git(["init", "-q", "-b", "main"]);
    git(["config", "user.name", "WorkflowHub Tests"]);
    git(["config", "user.email", "tests@workflowhub.local"]);
    mkdirSync(join(root, "specs", "task"), { recursive: true });
    writeFileSync(join(root, "specs", "task", "tasks.md"), "# tasks\n\n### 执行状态填写区\n- old\n\n### Verify\n- current\n");
    git(["add", "."]);
    git(["commit", "-qm", "base"]);
    const before = git(["rev-parse", "HEAD^{tree}"]);
    writeFileSync(join(root, "specs", "task", "tasks.md"), "# tasks\n\n### 执行状态填写区\n- new\n\n### Verify\n- current\n");
    git(["add", "."]);
    git(["commit", "-qm", "record writeback"]);
    const after = git(["rev-parse", "HEAD^{tree}"]);
    const fact = {
      schema_version: "quality-fact.v1", fact_id: "verify-review-fact", task_id: "task",
      stage: "verify-code", material_revision: "revision-old", snapshot_tree: before,
      kind: "review", subject: "code_review", status: "recorded",
      ref: "fact.json", sha256: "", evidence: [],
    };
    const raw = JSON.stringify(fact);
    const io = store();
    io.records.set(fact.ref, raw);
    expect(evaluateFactFreshness({ ...fact, sha256: sha256(raw) }, {
      material_revision: "revision-new", snapshot_tree: after,
    }, { read: io.read, workspaceRoot: root, taskId: "task" })).toMatchObject({
      status: "current",
      dependencies: { material: "current", tree: "current", fact: "current" },
    });
  });

  it("does not reuse an unregistered quality fact after the same writeback", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-freshness-unregistered-"));
    roots.push(root);
    const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
    git(["init", "-q", "-b", "main"]);
    git(["config", "user.name", "WorkflowHub Tests"]);
    git(["config", "user.email", "tests@workflowhub.local"]);
    mkdirSync(join(root, "specs", "task"), { recursive: true });
    writeFileSync(join(root, "specs", "task", "tasks.md"), "# tasks\n\n### 执行状态填写区\n- old\n\n### Verify\n- current\n");
    git(["add", "."]);
    git(["commit", "-qm", "base"]);
    const before = git(["rev-parse", "HEAD^{tree}"]);
    writeFileSync(join(root, "specs", "task", "tasks.md"), "# tasks\n\n### 执行状态填写区\n- new\n\n### Verify\n- current\n");
    git(["add", "."]);
    git(["commit", "-qm", "record writeback"]);
    const after = git(["rev-parse", "HEAD^{tree}"]);
    const fact = {
      schema_version: "quality-fact.v1", fact_id: "unregistered-fact", task_id: "task",
      stage: "verify-code", material_revision: "revision-old", snapshot_tree: before,
      kind: "test", subject: "unregistered_quality", status: "passed",
      ref: "fact.json", sha256: "", evidence: [],
    };
    const raw = JSON.stringify(fact);
    const io = store();
    io.records.set(fact.ref, raw);
    expect(evaluateFactFreshness({ ...fact, sha256: sha256(raw) }, {
      material_revision: "revision-new", snapshot_tree: after,
    }, { read: io.read, workspaceRoot: root, taskId: "task" })).toMatchObject({
      status: "stale",
      dependencies: { material: "stale", tree: "stale", fact: "current" },
    });
  });

  it("keeps build-code review freshness strict", () => {
    const fact = {
      schema_version: "quality-fact.v1",
      fact_id: "implementation-review-fact",
      task_id: "task",
      stage: "build-code",
      material_revision: "revision-old",
      snapshot_tree: "old-tree",
      kind: "review",
      subject: "integration_review",
      status: "recorded",
      ref: "implementation-review-fact.json",
      sha256: "",
      evidence: [],
    };
    const raw = JSON.stringify(fact);
    const io = store();
    io.records.set(fact.ref, raw);
    expect(evaluateFactFreshness({ ...fact, sha256: sha256(raw) }, {
      material_revision: "revision-new",
      snapshot_tree: "new-tree",
    }, { read: io.read }).status).toBe("stale");
  });

  it("does not accept a receipt from another stage for build-code risk tests", () => {
    const snapshotTree = "b".repeat(40);
    const command = "npm test";
    const output = "pass\n";
    const receipt = {
      schema_version: "workflowhub-receipt.v1",
      task_id: "task",
      stage: "verify-code",
      producer: { stage: "verify-code", component: "verify-code-test-capture", version: "1.0.0" },
      command,
      command_hash: sha256(command),
      exit_code: 0,
      snapshot_tree: snapshotTree,
      output_ref: "quality/tests/output/verify-code.output",
      output_hash: sha256(output),
    };
    const receiptRaw = JSON.stringify(receipt);
    const fact = {
      schema_version: "quality-fact.v1",
      fact_id: "fact",
      task_id: "task",
      stage: "build-code",
      material_revision: "revision",
      snapshot_tree: snapshotTree,
      kind: "test",
      subject: "risk_tests_fresh",
      status: "passed",
      ref: "fact.json",
      sha256: "",
      evidence: [{ ref: "receipt.json", sha256: sha256(receiptRaw), evidence_type: "test_receipt" }],
    };
    const factRaw = JSON.stringify(fact);
    const io = store();
    io.records.set(fact.ref, factRaw);
    io.records.set("receipt.json", receiptRaw);
    io.records.set(receipt.output_ref, output);
    expect(evaluateFactFreshness({ ...fact, sha256: sha256(factRaw) }, {
      material_revision: fact.material_revision,
      snapshot_tree: snapshotTree,
    }, { read: io.read }).status).toBe("stale");
  });

  it("keeps a mini-task implementation review current across its trusted stage boundary", () => {
    const snapshotTree = "c".repeat(40);
    const review = {
      version: "wh-review-result.v1",
      task_id: "task",
      stage: "build-code",
      review_track: null,
      review_kind: "mini_task.implementation",
      subject_kind: "phase",
      phase_id: "mini-task-implementation",
      review_scope: "phase",
      base_tree: snapshotTree,
      candidate_tree: snapshotTree,
      source: { target_commit: "d".repeat(40), base_commit: "d".repeat(40), base_tree: snapshotTree, captured_head: "d".repeat(40) },
      snapshot_tree: snapshotTree,
      material_id: "e".repeat(64),
      attempt_ref: "quality/reviews/attempts/mini-task.json",
      provider_results: [{ provider: "fixture", output: { findings: [] } }],
      findings: [],
      adjudication: { version: "wh-review-adjudication.v1", clusters: [] },
    };
    const reviewRaw = JSON.stringify(review);
    const fact = {
      schema_version: "quality-fact.v1",
      fact_id: "mini-review-fact",
      task_id: "task",
      stage: "verify-code",
      material_revision: "revision",
      snapshot_tree: snapshotTree,
      kind: "review",
      subject: "independent_review",
      status: "recorded",
      ref: "fact.json",
      sha256: "",
      evidence: [{ ref: "review.json", sha256: sha256(reviewRaw), evidence_type: "review_result" }],
    };
    const factRaw = JSON.stringify({ ...fact, schema_version: "quality-fact.v1" });
    const io = store();
    io.records.set("fact.json", factRaw);
    io.records.set("review.json", reviewRaw);
    expect(evaluateFactFreshness({ ...fact, sha256: sha256(factRaw) }, {
      material_revision: fact.material_revision,
      snapshot_tree: snapshotTree,
    }, { read: io.read })).toMatchObject({
      status: "current",
      authenticated: true,
    });
  });
});
