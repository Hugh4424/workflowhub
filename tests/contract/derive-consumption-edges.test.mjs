import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { refreshEvolutionSnapshot } from "../../runtime/evidence/workflow-evolution.mjs";

const repoRoot = resolve(join(fileURLToPath(new URL(".", import.meta.url)), "../.."));
const scriptPath = join(repoRoot, "tools", "cli", "derive-consumption-edges.mjs");
const targetManifestRef = "workflows/build-spec/steps.json";
const targetManifestSha = hash(readFileSync(join(repoRoot, targetManifestRef)));
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

  it("publishes the frozen task-bound consumer scan proof shape", () => {
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
    const task = run(f.root).tasks.find((entry) => entry.task_id === "task-edges");
    expect(task.consumer_scan_proof).toMatchObject({
      schema_version: "consumer-scan-proof.v1",
      project: "Demo",
      task_id: "task-edges",
      coverage_status: "partial",
      expected_stage_set: ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"],
      scanned_stage_set: ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"],
      source_subject: "tools/cli/derive-consumption-edges.mjs",
    });
    expect(task.consumer_scan_proof).not.toHaveProperty("stage_set");
    expect(task.consumer_scan_proof.registered_output_refs.length).toBeGreaterThan(0);
    expect(task.consumer_scan_proof.registered_output_refs[0]).toEqual(expect.objectContaining({ consumer_count: expect.any(Number), freshness: "current" }));
    expect(task.consumer_scan_proof.zero_consumption).toBe(false);
  });

  it("recomputes the scan and rejects caller-forged zero consumption", () => {
    const f = fixture();
    mkdirSync(join(f.root, "Projects/Demo/tasks/task-edges/quality/evidence"), { recursive: true });
    writeFileSync(join(f.root, "Projects/Demo/tasks/task-edges", f.produced), "plan\n");
    writeFileSync(join(f.root, "Projects/Demo/tasks/task-edges", f.orphaned), "orphan\n");
    for (const stage of ["make-decision", "build-spec", "verify-code"]) writeOutcome(f.root, stage, "task-edges", { schema_version: "workflowhub-stage-outcomes.v1", task_id: "task-edges", stage, step_outcomes: [], skill_outcomes: [] });
    const proof = run(f.root).tasks.find((entry) => entry.task_id === "task-edges").consumer_scan_proof;
    expect(proof.coverage_status).toBe("complete");
    expect(proof.zero_consumption).toBe(false);
    const forged = { ...proof, zero_consumption: true, registered_output_refs: proof.registered_output_refs.map((entry) => ({ ...entry, consumer_count: 0 })) };
    const result = refreshEvolutionSnapshot({ storageRoot: f.root, project: "Demo", attemptId: "forged-zero", now: proof.scanned_at, inventory: { observations: [{ task_id: "task-edges", confirmation_ref: "confirmation", confirmation_sha256: "a".repeat(64), occurred_at: proof.scanned_at, intervention_kind: "simplify", intervention_payload: {}, target_ref: { kind: "step", id: "spec-clarify", version: "2.0.0", authority: targetManifestRef, authority_sha256: targetManifestSha } }], consumer_proofs: [forged] } });
    expect(result.records[0]).toMatchObject({ tier: "reference_only", machine_signals: { zero_consumption: "unknown" } });
  });

  it("binds a valid zero proof to one candidate snapshot and rejects reuse", () => {
    const root = mkdtempSync(join(tmpdir(), "stage-reflection-proof-reuse-")); roots.push(root);
    const taskRoot = join(root, "Projects/Demo/tasks/task-zero"); mkdirSync(join(taskRoot, "quality/evidence"), { recursive: true }); writeFileSync(join(taskRoot, "quality/evidence/zero.md"), "zero\n");
    for (const stage of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) writeOutcome(root, stage, "task-zero", { schema_version: "workflowhub-stage-outcomes.v1", task_id: "task-zero", stage, step_outcomes: stage === "build-spec" ? [{ step_slug: "spec-clarify", input_refs: [], output_refs: ["quality/evidence/zero.md"], evidence_refs: [] }] : [], skill_outcomes: [] });
    const proof = run(root).tasks[0].consumer_scan_proof; expect(proof.zero_consumption).toBe(true);
    const item = { task_id: "task-zero", confirmation_ref: "confirmation", confirmation_sha256: "a".repeat(64), occurred_at: proof.scanned_at, intervention_kind: "simplify", intervention_payload: {}, target_ref: { kind: "step", id: "spec-clarify", version: "2.0.0", authority: targetManifestRef, authority_sha256: targetManifestSha } };
    const first = refreshEvolutionSnapshot({ storageRoot: root, project: "Demo", attemptId: "proof-one", now: proof.scanned_at, inventory: { observations: [item], consumer_proofs: [proof] } });
    const disguisedReuse = { ...proof, status: "unknown", scope: "all-current-stage-outcome-files", stage_count: 999, outcome_file_count: 999, subject_count: 999 };
    const second = refreshEvolutionSnapshot({ storageRoot: root, project: "Demo", attemptId: "proof-two", now: proof.scanned_at, inventory: { observations: [item], consumer_proofs: [disguisedReuse] } });
    expect(first.records[0]).toMatchObject({ tier: "action_suggested", machine_signals: { zero_consumption: true } });
    expect(second.records[0]).toMatchObject({ tier: "reference_only", machine_signals: { zero_consumption: "unknown" } });
  });

  it("rejects a proof after a hash-named stage outcome is replaced by a forged schema", () => {
    const root = mkdtempSync(join(tmpdir(), "stage-reflection-proof-schema-")); roots.push(root);
    const taskRoot = join(root, "Projects/Demo/tasks/task-schema"); mkdirSync(join(taskRoot, "quality/evidence"), { recursive: true }); writeFileSync(join(taskRoot, "quality/evidence/zero.md"), "zero\n");
    for (const stage of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) writeOutcome(root, stage, "task-schema", { schema_version: "workflowhub-stage-outcomes.v1", task_id: "task-schema", stage, step_outcomes: stage === "build-spec" ? [{ step_slug: "spec-clarify", input_refs: [], output_refs: ["quality/evidence/zero.md"], evidence_refs: [] }] : [], skill_outcomes: [] });
    const proof = run(root).tasks[0].consumer_scan_proof; expect(proof.zero_consumption).toBe(true);
    const forgedDir = join(taskRoot, "quality/evidence/stage-outcomes/build-code");
    for (const file of readdirSync(forgedDir)) rmSync(join(forgedDir, file));
    writeOutcome(root, "build-code", "task-schema", { schema_version: "forged-stage-outcome.v0", task_id: "task-schema", stage: "build-code", step_outcomes: [], skill_outcomes: [] });
    const sourceRefs = proof.source_refs.map((ref) => ref.includes("/build-code/") ? `quality/evidence/stage-outcomes/build-code/${readdirSync(forgedDir)[0]}` : ref).sort();
    const forgedProof = { ...proof, source_refs: sourceRefs, scope_revision: hash(sourceRefs.map((ref) => ref.slice("quality/evidence/stage-outcomes/".length)).join("\n")) };
    const item = { task_id: "task-schema", confirmation_ref: "confirmation", confirmation_sha256: "a".repeat(64), occurred_at: proof.scanned_at, intervention_kind: "simplify", intervention_payload: {}, target_ref: { kind: "step", id: "spec-clarify", version: "2.0.0", authority: targetManifestRef, authority_sha256: targetManifestSha } };
    const result = refreshEvolutionSnapshot({ storageRoot: root, project: "Demo", attemptId: "proof-schema", now: proof.scanned_at, inventory: { observations: [item], consumer_proofs: [forgedProof] } });
    expect(result.records[0]).toMatchObject({ tier: "reference_only", machine_signals: { zero_consumption: "unknown" } });
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
