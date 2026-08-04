import { describe, expect, it } from "vitest";

import { assertFresh, evaluateFactFreshness, sha256 } from "../../runtime/evidence/freshness.mjs";

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
});
