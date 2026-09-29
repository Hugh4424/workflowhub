import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Public seam: the ordinary, final CARD-04 report artifact, not a mock stage run.
// This test does not write a receipt or infer that a passing contract means business acceptance.
const root = resolve(import.meta.dirname, "../..");
const card = "workflowhub-thin-core-card-04-20260919";
// This certified task owns its external canonical facts. Never infer another task from cwd.
const taskRoot = resolve(root, "../../Knowledge/Projects/workflowhub/tasks", card);
const taskIdentity = JSON.parse(readFileSync(resolve(taskRoot, "task.json"), "utf8"));
expect(taskIdentity.project_name).toBe("workflowhub");
expect(taskIdentity.task_id).toBe(card);
const artifact = `quality/evidence/stage-quality/build-code/P13/final-aggregate.json`;
const markdown = `quality/evidence/stage-quality/build-code/P13/final-aggregate.md`;
const delivery = `quality/evidence/stage-quality/build-code/P13/T024-delivery.json`;
const ids = Array.from({ length: 12 }, (_, n) => `P${n + 1}`);
const unresolved = new Set(["failed", "not_done", "unknown", "unavailable", "incomplete"]);
const states = new Set(["passed", ...unresolved]);

function within(parent, candidate) {
  const suffix = relative(parent, candidate);
  return suffix !== "" && suffix !== ".." && !suffix.startsWith(`../`) && !isAbsolute(suffix);
}
function source(path) {
  expect(typeof path).toBe("string");
  expect(path.length).toBeGreaterThan(0);
  // Repo paths remain relative. External paths are accepted ONLY beneath this
  // task's authenticated task-store root, never another task or arbitrary home path.
  const full = isAbsolute(path) ? resolve(path) : resolve(root, path);
  const allowed = isAbsolute(path) ? taskRoot : root;
  expect(within(allowed, full), `source outside authenticated ${isAbsolute(path) ? "task-store" : "worktree"} root: ${path}`).toBe(true);
  expect(existsSync(full), `source missing: ${path}`).toBe(true);
  expect(within(realpathSync(allowed), realpathSync(full)), `source symlink escapes authenticated root: ${path}`).toBe(true);
  return readFileSync(full);
}
function sha(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
function authenticated(ref) {
  expect(ref).toEqual(expect.objectContaining({ path: expect.any(String), sha256: expect.stringMatching(/^[a-f0-9]{64}$/) }));
  expect(sha(source(ref.path)), `stale or wrongly bound source: ${ref.path}`).toBe(ref.sha256);
  expect(ref.path).not.toMatch(/(?:^|\/)(?:prewritten-red|fixtures?)(?:\/|$)/);
}
function authoritative(phase) {
  const text = source(`specs/${card}/phases/${phase}.md`).toString("utf8");
  const gate = text.match(/^- \*\*gate_cmd\*\*: `([^`]+)`/m)?.[1];
  const tasks = [...text.matchAll(/^### (T\d{3}) —/gm)].map((m) => m[1]);
  expect(gate, `${phase} missing phase gate`).toBeTruthy();
  expect(tasks.length, `${phase} missing task identity`).toBeGreaterThan(0);
  return { gate, tasks };
}
function validate(actual) {
  expect(actual.schema_version).toBe("card04-final-aggregate.v1");
  expect(actual.card_id).toBe(card);
  expect(actual.phase_order).toEqual(ids);
  expect(actual.phases).toHaveLength(ids.length);
  expect(states.has(actual.overall_status)).toBe(true);
  for (const [index, phase] of actual.phases.entries()) {
    const phaseId = ids[index];
    const { gate, tasks } = authoritative(phaseId);
    expect(phase.phase_id).toBe(phaseId);
    expect(phase.gate_cmd).toBe(gate);
    expect(states.has(phase.status)).toBe(true);
    expect(phase.tasks.map((task) => task.task_id)).toEqual(tasks);
    expect(states.has(phase.gate_status)).toBe(true);
    if (phase.gate_status === "passed") {
      expect(phase.gate_evidence.command).toBe(gate);
      expect(phase.gate_evidence.exit_code).toBe(0);
      expect(phase.gate_evidence.test_ids.length).toBeGreaterThan(0);
      authenticated(phase.gate_evidence);
    } else {
      expect(phase.gate_evidence?.exit_code).not.toBe(0);
      expect(phase.gate_status_reason).toEqual(expect.any(String));
      expect(phase.gate_status_owner).toEqual(expect.any(String));
    }
    for (const task of phase.tasks) {
      expect(states.has(task.status)).toBe(true);
      expect(Array.isArray(task.evidence_refs)).toBe(true);
      task.evidence_refs.forEach(authenticated);
      if (task.status === "passed") {
        expect(task.evidence_refs.length, `${phaseId}/${task.task_id} has no canonical source`).toBeGreaterThan(0);
        expect(phase.gate_status, `${phaseId}/${task.task_id} cannot pass a nonpassing phase gate`).toBe("passed");
      } else {
        expect(task.reason).toEqual(expect.any(String));
        expect(task.owner).toEqual(expect.any(String));
      }
    }
    if (phase.status === "passed") {
      expect(phase.gate_status).toBe("passed");
      expect(phase.tasks.every((task) => task.status === "passed")).toBe(true);
    } else {
      expect(phase.reason).toEqual(expect.any(String));
      expect(phase.owner).toEqual(expect.any(String));
    }
  }
  assertOverall(actual);
}
function assertOverall(actual) {
  expect(states.has(actual.overall_status)).toBe(true);
  if (actual.overall_status === "passed") {
    expect(actual.phases.every((phase) => phase.status === "passed" && phase.gate_status === "passed" && phase.tasks.every((task) => task.status === "passed"))).toBe(true);
  } else {
    expect(actual.overall_reason).toEqual(expect.any(String));
    expect(actual.overall_owner).toEqual(expect.any(String));
  }
}

function currentReport() {
  return JSON.parse(source(artifact).toString("utf8"));
}

describe("ORACLE-CARD04-FINAL-AGGREGATE: P13/T024 ordinary final report", () => {
  it("requires the actual final artifact after P1–P12, with canonical gate and task identities", () => {
    validate(currentReport());
  });

  it("delivers a distinct final rendering and an independently authored, unchanged plain-language narrative", () => {
    const report = currentReport();
    const md = source(markdown).toString("utf8");
    const record = JSON.parse(source(delivery).toString("utf8"));
    expect(md).toContain("没做到");
    expect(md).toContain("路线适用");
    expect(md).toContain("执行事实");
    expect(md.indexOf("没做到")).toBeLessThan(md.indexOf("路线适用"));
    expect(md.indexOf("路线适用")).toBeLessThan(md.indexOf("执行事实"));
    expect(record.author_agent_id).toEqual(expect.any(String));
    expect(record.author_agent_id.length).toBeGreaterThan(0);
    expect(record.posted_at_utc).toMatch(/^\d{4}-\d\d-\d\dT/);
    expect(record.narrative_text).toEqual(expect.any(String));
    expect(record.narrative_text.length).toBeGreaterThan(0);
    expect(record.posted_text).toBe(record.narrative_text);
    expect(record.unedited).toBe(true);
    expect(record.aggregate_ref).toEqual({ path: artifact, sha256: sha(source(artifact)) });
    expect(record.markdown_ref).toEqual({ path: markdown, sha256: sha(source(markdown)) });
    if (report.overall_status !== "passed") {
      expect(md).toContain(report.overall_status);
      expect(record.narrative_text).toContain(report.overall_status);
    }
  });

  // Negative controls mutate only the final artifact in memory; never create fake runtime facts.
  // They become meaningful only after the actual artifact exists. The first test is always RED meanwhile.
  it("rejects absent, stale and unknown-laundered refs without creating receipts", () => {
    const ref = { path: `specs/${card}/phases/P12.md`, sha256: sha(source(`specs/${card}/phases/P12.md`)) };
    expect(() => authenticated({ ...ref, path: `specs/${card}/phases/no-such-phase.md` })).toThrow();
    expect(() => authenticated({ ...ref, sha256: "0".repeat(64) })).toThrow();
    const canonical = { path: resolve(taskRoot, "task.json"), sha256: sha(source(resolve(taskRoot, "task.json"))) };
    expect(() => authenticated(canonical)).not.toThrow(); // Real task identity bytes, not a fabricated execution receipt.
    expect(() => authenticated({ ...canonical, path: resolve(taskRoot, "../another-task/task.json") })).toThrow();
    expect(() => authenticated({ ...canonical, path: resolve(taskRoot, "../../other-secret.json") })).toThrow();
    expect(() => authenticated({ ...canonical, sha256: "0".repeat(64) })).toThrow();
    // Pure negative controls on known plan bytes, never presented as an execution receipt.
    for (const actual of [
      { overall_status: "passed", phases: [{ status: "unknown", gate_status: "passed", tasks: [] }] },
      { overall_status: "passed", phases: [{ status: "passed", gate_status: "unknown", tasks: [] }] },
      { overall_status: "passed", phases: [{ status: "passed", gate_status: "passed", tasks: [{ status: "unknown" }] }] },
    ]) expect(() => assertOverall(actual)).toThrow();
  });
});
