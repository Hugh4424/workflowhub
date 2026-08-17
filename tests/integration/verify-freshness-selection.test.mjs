import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { assertFresh, evaluateFactFreshness, sha256 } from "../../runtime/evidence/freshness.mjs";

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
      kind: "review", subject: "independent_review", status: "recorded",
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
});
