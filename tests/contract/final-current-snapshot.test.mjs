import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  classifyProductionScan,
  deriveActiveAcIds,
  deriveTaskDeclaredAcIds,
  produceFinalCurrentSnapshot,
} from "../../tools/cli/produce-final-current-snapshot.mjs";
import { captureExecutionSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";

const roots = [];

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop(), { recursive: true, force: true });
});

const SPEC = `# Spec

- [ ] **AC-GOV-001**：四能力面串行交付合同。

#### AC-S3-01 单一画像来源
验证：只读一个画像来源。
通过：consumer readback 通过。
失败：出现第二来源。
证据：targeted route receipt。

#### AC-S7-01 唯一权威
验证：只读 canonical authority。
通过：authority scan 通过。
失败：出现第二 writer。
证据：S7 receipt。
`;

const PHASES = ["P1 — S3", "P2 — S4-slicing", "P3 — S4-review-budget", "P4 — S7"];
const FIXTURE_RAW = "fixture raw output\n";
const S3_RAW = "fixture S3 profile output\n";
const PROFILE_RAW = "fixture profile declaration\n";
const hash = (value) => createHash("sha256").update(value).digest("hex");
const PLAN = `# Plan

${PHASES.map((phase) => `## Phase ${phase}\n\n目标。`).join("\n\n")}
`;

function tasks({ declaration = false, status = "pending" } = {}) {
  const declarationLine = declaration
    ? `- **active_ac_ids**：\`["AC-GOV-001","AC-S3-01","AC-S7-01"]\`\n`
    : "";
  return `# Tasks

${PHASES.map((phase) => `## Phase ${phase}\n\n任务。`).join("\n\n")}

#### T013 — FINAL：当前快照 aggregate verification
- **acceptance_role**：acceptance
- **e2e_scope**：not_required
- **gate_cmd**：\`node tools/cli/produce-final-current-snapshot.mjs --task-dir="$TASK_DIR" --output="$TASK_DIR/quality/tests/final/current-snapshot.json"\`
- **oracle**：\`ORACLE-FINAL exactly one assertion per active AC; unknown|unavailable|incomplete|conflict remain non-passing\`
- **acceptance_data**：\`[{"source":"current canonical spec","sample":"all active non-UI AC derived from canonical spec, including AC-GOV-001","scenario":"aggregate","tier":"command","execution":{"command":"node","args":["tools/cli/produce-final-current-snapshot.mjs"]}}]\`
${declarationLine}- **status**：${status}
`;
}

function tasksWithLaterTask() {
  return `${tasks()}\n#### T014 — later task\n- **active_ac_ids**：\`["AC-OTHER-001"]\`\n`;
}

function receipt(value = {}, identity = {}) {
  return {
    schema_version: "workflowhub-test-result.v1",
    task_id: "fixture-task",
    ...identity,
    status: "passed",
    expected_exit: 0,
    observed_exit: 0,
    command: "targeted fixture command",
    evidence: [{ ref: "raw/fixture.log", sha256: hash(FIXTURE_RAW) }],
    provenance: { status: "passed", public_entrypoint: true, bare_cli: true },
    conservation: { status: "passed", assertion_multiset_preserved: true },
    close: { status: "passed", unique_completed: true },
    four_domain: { status: "passed", consistent: true },
    ...value,
  };
}

function fixture({ unavailableS7 = false, declaration = false } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-final-snapshot-")));
  roots.push(root);
  const taskDir = join(root, "task");
  mkdirSync(taskDir, { recursive: true });
  const specPath = join(root, "spec.md");
  const planPath = join(root, "plan.md");
  const tasksPath = join(root, "tasks.md");
  writeFileSync(specPath, SPEC);
  writeFileSync(planPath, PLAN);
  const tasksText = tasks({ declaration });
  writeFileSync(tasksPath, tasksText);
  const materialRevision = `revision-${hash([`spec.md\0${SPEC}`, `plan.md\0${PLAN}`, `tasks.md\0${tasksText}`].join("\0"))}`;
  const snapshot = captureExecutionSnapshot(process.cwd(), "fixture-task");
  const identity = { stage: "build-code", material_revision: materialRevision, snapshot_tree: snapshot.tree };
  mkdirSync(join(taskDir, "raw"), { recursive: true });
  writeFileSync(join(taskDir, "raw/fixture.log"), FIXTURE_RAW);
  writeFileSync(join(taskDir, "raw/s3.log"), S3_RAW);
  writeFileSync(join(taskDir, "raw/profile.json"), PROFILE_RAW);
  writeFileSync(join(taskDir, "raw/inner-manifest.json"), "inner manifest\n");
  writeFileSync(join(taskDir, "raw/medium-manifest.json"), "medium manifest\n");
  const rawHash = hash(FIXTURE_RAW);
  const processRun = (pid) => ({ pid, exit_code: 0, signal: null, cleanup: { status: "completed" }, stdout_ref: "raw/fixture.log", stdout_hash: rawHash, stderr_ref: "raw/fixture.log", stderr_hash: rawHash });
  const fileGroup = { sample_count: 5, runs: [1, 2, 3, 4, 5].map((index) => processRun(100 + index)), result: "pass", threshold_ms: 100, max_ms: 10, p95_ms: 10, independent_processes: true, all_exit_zero: true, cleanup_complete: true };
  const collectionGroup = (startPid, overlap = true) => ({ sample_count: 5, runs: [1, 2, 3, 4, 5].map((index) => ({ ...processRun(startPid + index), actual_workers: 2, worker_ceiling: 2, worker_bound_ok: true, overlap_observed: overlap, members: [processRun(startPid + index)] })), result: "pass", threshold_ms: 100, max_ms: 10, p95_ms: 10, worker_ceiling: 2, actual_workers: 2, worker_bound_ok: true, overlap_observed: overlap, independent_processes: true, all_exit_zero: true, cleanup_complete: true });
  const runs = [{}, {}, {}, {}, {}];
  const files = {
    "quality/tests/S3/green/result.json": receipt({}, identity),
    "quality/evidence/performance-profile/S3.json": {
      schema_version: "workflowhub-performance-profile.v1", task_id: "fixture-task", ...identity, status: "passed", result: "passed",
      profile_source: { ref: "raw/profile.json", sha256: hash(PROFILE_RAW) },
      profiles: { inner: { worker_ceiling: 2 }, medium: { worker_ceiling: 2 } },
      manifests: { inner: { ref: "raw/inner-manifest.json", sha256: hash("inner manifest\n") }, medium: { ref: "raw/medium-manifest.json", sha256: hash("medium manifest\n") } },
      capability_observations: { inner: { status: "observed", counts: { network: 0, db: 0, filesystem: 0, subprocess: 0, environment: 0 }, evidence_ref: "raw/fixture.log", evidence_hash: rawHash }, medium: { status: "observed", counts: { network: 0, db: 0, filesystem: 0, subprocess: 0, environment: 0 }, evidence_ref: "raw/fixture.log", evidence_hash: rawHash } },
      groups: {
        inner_files: { fixture: fileGroup },
        inner_collection: collectionGroup(200),
        medium_collection: collectionGroup(300, false),
      },
      evidence: [{ ref: "raw/s3.log", sha256: hash(S3_RAW) }],
    },
    "quality/tests/S4-slicing/green/result.json": receipt({}, identity),
    "quality/evidence/S4-slicing/current-tasks-self-check.json": { schema_version: "current-plan-task-slicing-self-check.v1", task_id: "fixture-task", ...identity, status: "passed", result: "passed", state: "ready", exit_code: 0, materials: { spec: { sha256: hash(SPEC) }, plan: { sha256: hash(PLAN) }, tasks: { sha256: hash(tasksText) } }, producer_count: 0, zero_cross_phase_producer: true, validator: { ok: true, errors: [] }, slice_advisory: { status: "within_budget", markers: [] } },
    "quality/tests/S4-review-budget/green/result.json": receipt({ provenance: { status: "passed", public_entrypoint: true, bare_cli: true } }, identity),
    "quality/tests/S7/green/result.json": receipt(unavailableS7 ? { status: "unavailable", observed_exit: null, result: "unavailable" } : { close: { status: "passed", unique_completed: true, plan: { plan_hash: "fixture" }, step_records: [], completed: { status: "completed" } }, four_domain: { status: "passed", consistent: true } }, identity),
    "quality/tests/final/plan-acceptance-task-gate.json": receipt({}, identity),
  };
  for (const [ref, value] of Object.entries(files)) {
    const path = join(taskDir, ref);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, `${JSON.stringify(value)}\n`);
  }
  return { root, taskDir, specPath, planPath, tasksPath, outputPath: join(taskDir, "quality/tests/final/current-snapshot.json") };
}

describe("T013 final current snapshot producer", () => {
  it("derives the normative AC set, authenticates receipts, and publishes one immutable assertion per AC", () => {
    const state = fixture();
    expect(deriveActiveAcIds(SPEC)).toEqual(["AC-GOV-001", "AC-S3-01", "AC-S7-01"]);
    expect(deriveTaskDeclaredAcIds(tasks(), deriveActiveAcIds(SPEC))).toEqual(deriveActiveAcIds(SPEC));

    const result = produceFinalCurrentSnapshot({ taskId: "fixture-task", ...state });
    expect(result.aggregate_status).toBe("passed");
    expect(result.assertions).toHaveLength(3);
    expect(new Set(result.assertions.map((entry) => entry.ac_id)).size).toBe(3);
    expect(result.assertions.every((entry) => entry.evidence_refs.length > 0)).toBe(true);
    expect(result.assertions.every((entry) => entry.evidence_refs.every((entry) => /^[a-f0-9]{64}$/.test(entry.sha256)))).toBe(true);
    const raw = readFileSync(state.outputPath, "utf8");
    expect(createHash("sha256").update(raw).digest("hex")).toBe(result.output.sha256);
    expect(() => produceFinalCurrentSnapshot({ taskId: "fixture-task", ...state })).toThrow(/exist|occupied/i);
  });

  it("bounds the T013 declaration at the next task heading", () => {
    expect(deriveTaskDeclaredAcIds(tasksWithLaterTask(), deriveActiveAcIds(SPEC))).toEqual(deriveActiveAcIds(SPEC));
  });

  it("treats a null observed exit as unobserved when the declared route passed", () => {
    const state = fixture();
    const s7Path = join(state.taskDir, "quality/tests/S7/green/result.json");
    const value = JSON.parse(readFileSync(s7Path, "utf8"));
    value.observed_exit = null;
    writeFileSync(s7Path, `${JSON.stringify(value)}\n`);
    const result = produceFinalCurrentSnapshot({ taskId: "fixture-task", ...state });
    expect(result.targeted_routes.S7.status).toBe("passed");
  });

  it("keeps unavailable source facts incomplete instead of promoting them to pass", () => {
    const state = fixture({ unavailableS7: true });
    const result = produceFinalCurrentSnapshot({ taskId: "fixture-task", ...state });
    expect(result.aggregate_status).toBe("incomplete");
    expect(result.assertions.find((entry) => entry.ac_id === "AC-S7-01")).toMatchObject({ status: "incomplete" });
    expect(result.assertions.find((entry) => entry.ac_id === "AC-GOV-001")).toMatchObject({ status: "incomplete" });
  });

  it("keeps contradictory status and exit facts non-passing", () => {
    const state = fixture();
    const s7Path = join(state.taskDir, "quality/tests/S7/green/result.json");
    const value = JSON.parse(readFileSync(s7Path, "utf8"));
    value.status = "unavailable";
    value.result = "passed";
    value.observed_exit = 0;
    writeFileSync(s7Path, `${JSON.stringify(value)}\n`);
    const result = produceFinalCurrentSnapshot({ taskId: "fixture-task", ...state });
    expect(result.aggregate_status).toBe("incomplete");
    expect(result.assertions.find((entry) => entry.ac_id === "AC-S7-01")).toMatchObject({ status: "incomplete" });
    expect(result.targeted_routes.S7.status).toBe("incomplete");
  });

  it("keeps an unverified nested profile/raw reference incomplete", () => {
    const state = fixture();
    const profilePath = join(state.taskDir, "quality/evidence/performance-profile/S3.json");
    const value = JSON.parse(readFileSync(profilePath, "utf8"));
    value.profile_source.sha256 = "0".repeat(64);
    writeFileSync(profilePath, `${JSON.stringify(value)}\n`);
    const result = produceFinalCurrentSnapshot({ taskId: "fixture-task", ...state });
    expect(result.aggregate_status).toBe("incomplete");
    expect(result.s3.profile).toMatchObject({ status: "incomplete" });
    expect(result.s3.evidence_refs).toEqual(expect.arrayContaining([
      expect.objectContaining({ ref: "quality/evidence/performance-profile/S3.json" }),
    ]));
  });

  it("does not authenticate an absolute evidence reference outside the task directory", () => {
    const state = fixture();
    const outsidePath = join(state.root, "outside.log");
    writeFileSync(outsidePath, FIXTURE_RAW);
    const receiptPath = join(state.taskDir, "quality/tests/S3/green/result.json");
    const value = JSON.parse(readFileSync(receiptPath, "utf8"));
    value.evidence = [{ ref: outsidePath, sha256: hash(FIXTURE_RAW) }];
    writeFileSync(receiptPath, `${JSON.stringify(value)}\n`);

    const result = produceFinalCurrentSnapshot({ taskId: "fixture-task", ...state });
    expect(result.aggregate_status).toBe("incomplete");
    expect(result.targeted_routes.S3.status).toBe("incomplete");
    expect(result.assertions.find((entry) => entry.ac_id === "AC-S3-01")).toMatchObject({ status: "incomplete" });
    expect(result.targeted_routes.S3.receipts[0].raw_refs).toEqual(expect.arrayContaining([
      expect.objectContaining({ ref: "quality/tests/S3/green/result.json" }),
    ]));
    expect(JSON.stringify(result)).not.toContain(outsidePath);
  });

  it("rejects a task declaration that omits or adds an active AC", () => {
    const state = fixture({ declaration: true });
    const wrong = readFileSync(state.tasksPath, "utf8").replace("AC-S7-01", "AC-EXTRA-99");
    writeFileSync(state.tasksPath, wrong);
    expect(() => produceFinalCurrentSnapshot({ taskId: "fixture-task", ...state })).toThrow(/active AC declaration|plan acceptance/i);
  });

  it("fails closed for duplicate normative headings and unclassified production references", () => {
    expect(() => deriveActiveAcIds(`${SPEC}\n#### AC-S3-01 duplicate\n`)).toThrow(/duplicate/i);
    const scan = classifyProductionScan([{ path: "runtime/mystery.mjs", line: 4, token: "publishVerifySummary", classification: "unknown" }]);
    expect(scan).toMatchObject({ status: "failed", zero_second_writer: true });
    expect(scan.unknown_entries).toHaveLength(1);
    expect(classifyProductionScan([
      { path: "runtime/a.mjs", line: 1, token: "publishVerifySummary", classification: "current", writer: true },
      { path: "runtime/b.mjs", line: 2, token: "publishVerifySummary", classification: "current", writer: true },
    ])).toMatchObject({ status: "failed", unique_writer_count: 2 });
    expect(classifyProductionScan([], { read_errors: [{ path: "runtime/unreadable.mjs", error: "EACCES" }] })).toMatchObject({ status: "failed", read_errors: [{ path: "runtime/unreadable.mjs" }] });
  });
});
