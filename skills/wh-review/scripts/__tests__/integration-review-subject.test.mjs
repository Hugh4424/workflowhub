import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildIntegrationReviewSubject, inspectIntegrationReviewSubject } from "../integration-review-subject.mjs";

const OID = "a".repeat(40);
const sha = (raw) => createHash("sha256").update(raw).digest("hex");

function fixture({ corrupt = null } = {}) {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-integration-current-"));
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.name", "fixture"], { cwd: root });
  execFileSync("git", ["config", "user.email", "fixture@example.test"], { cwd: root });
  const taskId = "current-only";
  const dir = join(root, "specs", taskId);
  mkdirSync(dir, { recursive: true });
  const files = {
    "decision-log.md": "# decision\n",
    "spec.md": "# spec\n",
    "plan.md": "# plan\n",
    "tasks.md": "# tasks\n",
  };
  for (const [name, raw] of Object.entries(files)) writeFileSync(join(dir, name), raw);
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });
  const revision = { task_id: taskId, hashes: Object.fromEntries(Object.entries(files).map(([name, raw]) => [name, sha(raw)])) };
  const revisionRaw = JSON.stringify(revision);
  const pointer = { task_id: taskId, revision_ref: "materials/revisions/current.json", revision_hash: sha(revisionRaw) };
  const records = new Map([
    ["materials/current.json", JSON.stringify(corrupt === "pointer" ? { ...pointer, revision_hash: "f".repeat(64) } : pointer)],
    ["materials/revisions/current.json", corrupt === "revision" ? "{}" : revisionRaw],
  ]);
  const reads = [];
  return {
    root,
    task: { identity: { taskId }, readRecord(ref) { reads.push(ref); if (!records.has(ref)) throw new Error(`unexpected historic read: ${ref}`); return records.get(ref); } },
    reads,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

describe("integration review subject current-state boundary", () => {
  it("reads only the current material pointer/revision and never historical phase records", () => {
    const f = fixture();
    try {
      const subject = buildIntegrationReviewSubject({ task: f.task, sourceRoot: f.root, finalTree: OID });
      expect(subject.schema_version).toBe("integration-review-subject.v1");
      expect(subject.ac_trace.schema_version).toBe("ac-change-test-trace.v1");
      expect(subject.formal_record_status.status).toBe("unavailable");
      expect(f.reads).toEqual(["materials/current.json", "materials/revisions/current.json"]);
    } finally { f.cleanup(); }
  });

  it("does not turn unavailable audit data into a semantic review subject", () => {
    const f = fixture();
    try {
      const subject = buildIntegrationReviewSubject({ task: f.task, sourceRoot: f.root, finalTree: OID });
      expect(subject.phase_coverage.phases).toEqual([]);
      expect(subject.ac_trace.entries).toEqual([]);
      expect(subject.formal_record_status.reason).toMatch(/same-snapshot semantic review facts/);
    } finally { f.cleanup(); }
  });

  it("reports invalid current materials as unavailable audit information", () => {
    const f = fixture({ corrupt: "pointer" });
    try {
      const subject = inspectIntegrationReviewSubject({ task: f.task, sourceRoot: f.root, finalTree: OID });
      expect(subject.formal_record_status).toEqual({ status: "unavailable", reason: "current material revision hash mismatch" });
    } finally { f.cleanup(); }
  });

  it("fails closed for a malformed current material revision", () => {
    const f = fixture({ corrupt: "revision" });
    try {
      expect(() => buildIntegrationReviewSubject({ task: f.task, sourceRoot: f.root, finalTree: OID }))
        .toThrow("MATERIAL_INCOMPLETE: current material revision hash mismatch");
    } finally { f.cleanup(); }
  });
});
