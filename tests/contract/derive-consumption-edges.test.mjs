import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(join(fileURLToPath(new URL(".", import.meta.url)), "../.."));
const scriptPath = join(repoRoot, "tools", "cli", "derive-consumption-edges.mjs");
const roots = [];

function hash(raw) {
  return createHash("sha256").update(raw).digest("hex");
}

function writeOutcome(root, stage, taskId, value) {
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const directory = join(root, "Projects", "Demo", "tasks", taskId, "quality", "evidence", "stage-outcomes", stage);
  mkdirSync(directory, { recursive: true });
  const path = join(directory, `${hash(raw)}.json`);
  writeFileSync(path, raw, "utf8");
  return path;
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "stage-reflection-edges-"));
  roots.push(root);
  const produced = "quality/evidence/plan-output.json";
  const orphaned = "quality/evidence/orphan-output.json";
  const planPath = writeOutcome(root, "build-plan", "task-edges", {
    schema_version: "workflowhub-stage-outcomes.v1",
    task_id: "task-edges",
    stage: "build-plan",
    step_outcomes: [
      {
        step_slug: "produce-plan",
        status: "completed",
        result_summary: "plan produced",
        input_refs: [],
        evidence_refs: [{ ref: produced, sha256: "a".repeat(64) }],
      },
      {
        step_slug: "produce-orphan",
        status: "completed",
        result_summary: "orphan produced",
        input_refs: [],
        evidence_refs: [{ ref: orphaned, sha256: "b".repeat(64) }],
      },
    ],
    skill_outcomes: [],
  });
  const codePath = writeOutcome(root, "build-code", "task-edges", {
    schema_version: "workflowhub-stage-outcomes.v1",
    task_id: "task-edges",
    stage: "build-code",
    step_outcomes: [{
      step_slug: "consume-plan",
      status: "completed",
      result_summary: "plan consumed",
      input_refs: [produced],
      evidence_refs: [],
    }],
    skill_outcomes: [],
  });
  return { root, produced, orphaned, planPath, codePath };
}

function run(root) {
  expect(existsSync(scriptPath), `missing CLI: ${scriptPath}`).toBe(true);
  const result = spawnSync(process.execPath, [scriptPath, `--root=${root}`], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
  });
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout);
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("derive-consumption-edges", () => {
  it("derives a later consumer edge from string input_refs and object evidence_refs", () => {
    const f = fixture();
    const output = run(f.root);
    const edge = output.tasks.flatMap((task) => task.edges ?? []).find((entry) => entry.ref === f.produced);
    expect(edge).toMatchObject({
      source: { subject_id: "produce-plan", stage: "build-plan" },
      target: { subject_id: "consume-plan", stage: "build-code" },
    });
  });

  it("marks an unreferenced output unknown instead of declaring it unused", () => {
    const f = fixture();
    const output = run(f.root);
    const item = output.tasks.flatMap((task) => task.outputs ?? []).find((entry) => entry.ref === f.orphaned);
    expect(item).toMatchObject({ consumption_status: "unknown", consumer_count: 0 });
    expect(JSON.stringify(output)).not.toMatch(/unused|无用/i);
  });

  it("keeps an unresolvable output unknown even when all five stage files exist", () => {
    const f = fixture();
    for (const stage of ["make-decision", "build-spec", "verify-code"]) {
      writeOutcome(f.root, stage, "task-edges", {
        schema_version: "workflowhub-stage-outcomes.v1",
        task_id: "task-edges",
        stage,
        step_outcomes: [],
        skill_outcomes: [],
      });
    }
    const output = run(f.root);
    const item = output.tasks.flatMap((task) => task.outputs ?? []).find((entry) => entry.ref === f.orphaned);
    expect(item).toMatchObject({ consumption_status: "unknown", consumer_count: 0 });
    expect(output.tasks.find((task) => task.task_id === "task-edges").scan_status).toBe("partial");
  });

  it("does not call an incomplete subject reference ledger a zero-consumption scan", () => {
    const f = fixture();
    for (const stage of ["make-decision", "build-spec", "verify-code"]) {
      writeOutcome(f.root, stage, "task-edges", {
        schema_version: "workflowhub-stage-outcomes.v1",
        task_id: "task-edges",
        stage,
        step_outcomes: [],
        skill_outcomes: [],
      });
    }
    writeOutcome(f.root, "build-plan", "task-edges", {
      schema_version: "workflowhub-stage-outcomes.v1",
      task_id: "task-edges",
      stage: "build-plan",
      step_outcomes: [{
        step_slug: "incomplete-ledger",
        input_refs: null,
        evidence_refs: [{ ref: f.orphaned, sha256: "b".repeat(64) }],
      }],
      skill_outcomes: [],
    });
    const output = run(f.root);
    const item = output.tasks.flatMap((task) => task.outputs ?? []).find((entry) => entry.ref === f.orphaned);
    expect(item).toMatchObject({ consumption_status: "unknown", consumer_count: 0 });
    expect(output.tasks.find((task) => task.task_id === "task-edges").consumer_scan).toMatchObject({ status: "unknown" });
  });

  it("does not rewrite the source stage outcomes", () => {
    const f = fixture();
    const before = readFileSync(f.planPath, "utf8");
    expect(() => run(f.root)).not.toThrow();
    expect(before).toContain("produce-plan");
    expect(readFileSync(f.planPath, "utf8")).toBe(before);
  });

  it("fails closed when a quality ancestor is a symlink outside storage", () => {
    const root = mkdtempSync(join(tmpdir(), "stage-reflection-edges-"));
    const outside = mkdtempSync(join(tmpdir(), "stage-reflection-edges-outside-"));
    roots.push(root, outside);
    const localTask = join(root, "Projects", "Demo", "tasks", "task-edges");
    mkdirSync(localTask, { recursive: true });
    const outsideQuality = join(outside, "Projects", "Demo", "tasks", "task-edges", "quality");
    mkdirSync(outsideQuality, { recursive: true });
    symlinkSync(outsideQuality, join(localTask, "quality"), "dir");

    const result = spawnSync(process.execPath, [scriptPath, `--root=${root}`], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: "pipe",
    });
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain("contains a symlink");
  });
});
