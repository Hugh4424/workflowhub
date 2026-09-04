import { afterEach, describe, expect, it } from "vitest";
import Ajv from "ajv";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(join(fileURLToPath(new URL(".", import.meta.url)), "../.."));
const scriptPath = join(repoRoot, "tools", "cli", "validate-stage-reflection.mjs");
const v1SchemaPath = join(repoRoot, "runtime", "schemas", "stage-reflection.v1.json");
const v2SchemaPath = join(repoRoot, "runtime", "schemas", "stage-reflection.v2.json");
const fixtureRoot = join(repoRoot, "tests", "fixtures", "stage-reflection");
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const roots = [];

function hash(raw) {
  return createHash("sha256").update(raw).digest("hex");
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function isDateTime(value) {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second, zone] = match;
  const monthNumber = Number(month);
  if (monthNumber < 1 || monthNumber > 12 || Number(day) < 1 || Number(day) > new Date(Date.UTC(Number(year), monthNumber, 0)).getUTCDate()
    || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) return false;
  if (zone !== "Z" && (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4, 6)) > 59)) return false;
  return Number.isFinite(Date.parse(value));
}

function compile(path) {
  return new Ajv({ allErrors: true, strict: false, formats: { "date-time": isDateTime } }).compile(loadJson(path));
}

function v1Record(overrides = {}) {
  return {
    schema_version: "stage-reflection.v1",
    record_kind: "judgment",
    task_id: "task-gate",
    stage: "build-code",
    stage_status: "completed",
    generated_at: "2026-08-30T00:00:00.000Z",
    status: "ok",
    error: null,
    judgments: [],
    interventions: [],
    lessons_added: [],
    ...overrides,
  };
}

function writeJson(path, value) {
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, raw, "utf8");
  return { raw, path };
}

function taskPath(root) {
  return join(root, "Projects", "Demo", "tasks", "task-gate");
}

function writeOutcome(root, stage, value) {
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const directory = join(taskPath(root), "quality", "evidence", "stage-outcomes", stage);
  mkdirSync(directory, { recursive: true });
  const path = join(directory, `${hash(raw)}.json`);
  writeFileSync(path, raw, "utf8");
  return path;
}

function writeConfirmation(root, { decision, stepSlug = "unused-step", confirmedAt, nonce = "" }) {
  const value = {
    schema_version: "human-confirmation.v3",
    task_id: "task-gate",
    stage: "build-code",
    decision,
    subject_ref: "quality/stage-reflection/build-code.json",
    material_revision: `revision-${"a".repeat(64)}`,
    snapshot_tree: "b".repeat(40),
    confirmed_at: confirmedAt,
    reply_text: `${decision === "rejected" ? "这个步骤不再保留。" : "继续保留并观察。"}${nonce}`,
    step_slug: stepSlug,
  };
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const directory = join(taskPath(root), "quality", "confirmations");
  mkdirSync(directory, { recursive: true });
  const ref = `quality/confirmations/${hash(raw)}.json`;
  writeFileSync(join(taskPath(root), ref), raw, "utf8");
  return { ref, raw };
}

function writeReflection(root, { evidenceRef, confirmationRefs, generatedAt = "2026-08-30T00:00:00.000Z" }) {
  const value = {
    schema_version: "stage-reflection.v1",
    record_kind: "judgment",
    task_id: "task-gate",
    stage: "build-code",
    stage_status: "completed",
    generated_at: generatedAt,
    status: "ok",
    error: null,
    judgments: [{
      subject_id: "unused-step",
      subject_kind: "step",
      classification: "remove_candidate",
      severity: "high",
      reason: "该步骤在完整记录中长期没有消费且有人工反复否定。",
      evidence_refs: [evidenceRef],
      confidence: "high",
      next_review_trigger: "下一次同类任务出现时重新检查消费边。",
    }],
    interventions: confirmationRefs.map((ref) => ({
      confirmation_ref: ref,
      step_slug: "unused-step",
      reply_text: "这个步骤不再保留。",
      attribution: "人工确认",
      confidence: "high",
    })),
    lessons_added: [],
  };
  return writeJson(join(taskPath(root), "quality", "stage-reflection", "build-code.json"), value);
}

function fixture({ complete = true, generatedAt = "2026-08-30T00:00:00.000Z", decision = "rejected", confirmationCount = 1, evidenceRef = "quality/evidence/produced.json" } = {}) {
  const root = mkdtempSync(join(tmpdir(), "stage-reflection-gate-"));
  roots.push(root);
  const producedPath = join(taskPath(root), "quality", "evidence", "produced.json");
  writeJson(producedPath, { schema_version: "fixture-evidence.v1", task_id: "task-gate", stage: "build-code" });
  const outcomes = complete ? stages : ["build-code"];
  for (const stage of outcomes) {
    writeOutcome(root, stage, {
      schema_version: "workflowhub-stage-outcomes.v1",
      task_id: "task-gate",
      stage,
      generated_at: generatedAt,
      status: "completed",
      step_outcomes: stage === "build-code" ? [{
        step_slug: "unused-step",
        status: "completed",
        result_summary: "candidate step completed",
        input_refs: [],
        evidence_refs: [{ ref: evidenceRef, sha256: "c".repeat(64) }],
      }] : [],
      skill_outcomes: [],
    });
  }
  const confirmationRefs = [];
  for (let index = 0; index < confirmationCount; index += 1) {
    confirmationRefs.push(writeConfirmation(root, {
      decision,
      confirmedAt: generatedAt,
      nonce: `#${index + 1}`,
    }).ref);
  }
  const reflection = writeReflection(root, { evidenceRef, confirmationRefs, generatedAt });
  return { root, reflection, reflectionPath: reflection.path };
}

function cliResult(root) {
  expect(existsSync(scriptPath), `missing CLI: ${scriptPath}`).toBe(true);
  return spawnSync(process.execPath, [
    scriptPath,
    `--root=${root}`,
    "--proj=Demo",
    "--task-id=task-gate",
    "--stage=build-code",
    "--reflection-ref=quality/stage-reflection/build-code.json",
  ], { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
}

function run(root) {
  const result = cliResult(root);
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout);
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("validate-stage-reflection", () => {
  it("preserves remove_candidate only when zero consumption and rejected confirmation both exist", () => {
    const f = fixture();
    const before = readFileSync(f.reflectionPath, "utf8");
    const output = run(f.root);
    expect(output.reflection.judgments[0].classification).toBe("remove_candidate");
    expect(output.downgrades).toEqual([]);
    expect(output.reflection.interventions[0].reply_text).toBe("这个步骤不再保留。#1");
    expect(readFileSync(f.reflectionPath, "utf8")).toBe(before);
  });

  it.each([
    ["missing rejected signal", { decision: "accepted" }],
    ["unknown consumption", { complete: false, decision: "rejected" }],
    ["outside thirty day window", { generatedAt: "2026-07-30T00:00:00.000Z", decision: "rejected" }],
  ])("downgrades remove_candidate when %s", (_label, options) => {
    const f = fixture(options);
    const output = run(f.root);
    expect(output.reflection.judgments[0].classification).toBe("needs_evidence");
    expect(output.downgrades[0]).toMatchObject({ downgraded_from: "remove_candidate", subject_id: "unused-step" });
  });

  it("accepts repeated same-step interventions as the second hard signal", () => {
    const f = fixture({ decision: "accepted", confirmationCount: 2 });
    const output = run(f.root);
    expect(output.reflection.judgments[0].classification).toBe("remove_candidate");
  });

  it("rejects a malformed generated_at instead of ignoring the date-time format", () => {
    const f = fixture({ generatedAt: "not-a-timestamp" });
    const result = cliResult(f.root);
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain("generated_at");
    expect(`${result.stdout}${result.stderr}`).toContain("schema is invalid");
  });

  it("forces non-high confidence and degraded status for a dangling evidence ref", () => {
    const f = fixture({ evidenceRef: "quality/evidence/missing.json", decision: "rejected" });
    const output = run(f.root);
    expect(output.status).toBe("degraded");
    expect(output.reflection.judgments[0].confidence).not.toBe("high");
    expect(output.missing_evidence_refs).toContain("quality/evidence/missing.json");
  });

  it("does not trust an intervention confirmation with a mismatched task identity", () => {
    const f = fixture();
    const forged = {
      schema_version: "human-confirmation.v3",
      task_id: "other-task",
      stage: "build-code",
      decision: "rejected",
      subject_ref: "quality/stage-reflection/build-code.json",
      material_revision: `revision-${"a".repeat(64)}`,
      snapshot_tree: "b".repeat(40),
      confirmed_at: "2026-08-30T00:00:00.000Z",
      reply_text: "伪造回复",
      step_slug: "unused-step",
    };
    const raw = `${JSON.stringify(forged, null, 2)}\n`;
    const ref = `quality/confirmations/${hash(raw)}.json`;
    writeFileSync(join(taskPath(f.root), ref), raw, "utf8");
    const reflection = JSON.parse(readFileSync(f.reflectionPath, "utf8"));
    reflection.interventions[0].confirmation_ref = ref;
    writeJson(f.reflectionPath, reflection);

    const output = run(f.root);
    expect(output.status).toBe("degraded");
    expect(output.missing_confirmation_refs).toContain(ref);
    expect(output.reflection.interventions[0]).toMatchObject({ reply_text: null, confidence: "medium" });
  });

  it("rejects a symlinked project ancestor before reading or writing reflection data", () => {
    const root = mkdtempSync(join(tmpdir(), "stage-reflection-gate-"));
    const outside = mkdtempSync(join(tmpdir(), "stage-reflection-gate-outside-"));
    roots.push(root, outside);
    mkdirSync(join(root, "Projects"), { recursive: true });
    symlinkSync(outside, join(root, "Projects", "Demo"), "dir");

    const result = spawnSync(process.execPath, [
      scriptPath,
      `--root=${root}`,
      "--proj=Demo",
      "--task-id=task-gate",
      "--stage=build-code",
      "--reflection-ref=quality/stage-reflection/build-code.json",
    ], { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain("contains a symlink");
    expect(existsSync(join(outside, "tasks"))).toBe(false);
  });

  it("accepts the extended v1 status vocabulary without changing the legacy envelope", () => {
    const validate = compile(v1SchemaPath);
    for (const status of ["ok", "degraded", "failed", "unavailable", "not_scheduled"]) {
      const value = v1Record({ status, error: status === "failed" ? { summary: "stage reflection failed" } : null });
      expect(validate(value), `${status}: ${JSON.stringify(validate.errors)}`).toBe(true);
    }
    expect(validate(loadJson(join(fixtureRoot, "v1-legacy-record.json")))).toBe(true);
  });

  it("defines an availability fact with only the supported state and reason values", () => {
    const schema = loadJson(v1SchemaPath);
    const validate = new Ajv({ allErrors: true, strict: false, formats: { "date-time": isDateTime } }).compile({
      $schema: schema.$schema,
      $defs: schema.$defs,
      $ref: "#/$defs/availability_fact",
    });
    const valid = {
      stage: "build-code",
      state: "unavailable",
      reason_code: "executor_absent",
      observed_at: "2026-08-30T00:00:00.000Z",
      task_identity: { task_id: "task-gate", worktree: "/tmp", branch: "task/gate" },
    };
    expect(validate(valid), JSON.stringify(validate.errors)).toBe(true);
    expect(validate({ ...valid, state: "ok" })).toBe(false);
    expect(validate({ ...valid, reason_code: "made_up" })).toBe(false);
    expect(validate({ ...valid, task_identity: { task_id: "", worktree: "/tmp", branch: "task/gate" } })).toBe(false);
    expect(validate({ ...valid, task_identity: { ...valid.task_identity, extra: true } })).toBe(false);
  });

  it("accepts the v2 fact trio and six explicit question blocks", () => {
    const validate = compile(v2SchemaPath);
    const value = loadJson(join(fixtureRoot, "v2-valid.json"));
    expect(validate(value), JSON.stringify(validate.errors)).toBe(true);
  });

  it("annotates v2 records that omit the required fact trio", () => {
    const validate = compile(v2SchemaPath);
    const value = loadJson(join(fixtureRoot, "v2-invalid-missing-trio.json"));
    expect(validate(value)).toBe(true);

    const f = fixture();
    const reflection = loadJson(join(fixtureRoot, "v2-invalid-missing-trio.json"));
    writeJson(f.reflectionPath, reflection);
    const result = cliResult(f.root);
    expect(result.status).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.annotations).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "missing_fact_projection", ref: "status_matrix" }),
      expect.objectContaining({ code: "missing_fact_projection", ref: "identity" }),
      expect.objectContaining({ code: "missing_fact_projection", ref: "source_completeness" }),
    ]));
  });

  it("returns explicit completeness annotations for missing or unknown v2 blocks", () => {
    const f = fixture();
    const value = loadJson(join(fixtureRoot, "v2-valid.json"));
    delete value.what_helped;
    delete value.status_matrix;
    value.blockers.state = "unknown";
    value.blockers.unknown_reason = "当前阶段没有可用的阻塞记录投影。";
    writeJson(f.reflectionPath, value);
    const result = cliResult(f.root);
    expect(result.status).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.annotations).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "missing_quality_block", ref: "what_helped" }),
      expect.objectContaining({ code: "missing_fact_projection", ref: "status_matrix" }),
      expect.objectContaining({ code: "unknown_quality_block", ref: "blockers" }),
    ]));
    expect(output.status).toBe("degraded");
  });

  it("validates v2 nested evidence refs and identity snapshots", () => {
    const f = fixture();
    const value = loadJson(join(fixtureRoot, "v2-valid.json"));
    value.what_helped.items[0].evidence_refs = ["quality/evidence/missing-block.json"];
    value.status_matrix.code.evidence_refs = ["quality/evidence/missing-status.json"];
    writeJson(f.reflectionPath, value);
    const output = run(f.root);
    expect(output.status).toBe("degraded");
    expect(output.missing_evidence_refs).toEqual(expect.arrayContaining([
      "quality/evidence/missing-block.json",
      "quality/evidence/missing-status.json",
    ]));

    value.identity.task_id = "other-task";
    writeJson(f.reflectionPath, value);
    const invalid = cliResult(f.root);
    expect(invalid.status).not.toBe(0);
    expect(invalid.stdout).toContain("identity snapshot");
  });

  it("does not annotate optional v2 blocks or null projections for unavailable records", () => {
    const f = fixture();
    const value = {
      schema_version: "stage-reflection.v2",
      record_kind: "judgment",
      task_id: "task-gate",
      stage: "build-code",
      stage_status: "completed",
      generated_at: "2026-08-30T00:00:00.000Z",
      status: "unavailable",
      error: null,
      judgments: [],
      interventions: [],
      lessons_added: [],
      availability_fact: {
        stage: "build-code",
        state: "unavailable",
        reason_code: "executor_absent",
        observed_at: "2026-08-30T00:00:00.000Z",
        task_identity: {
          task_id: "task-gate",
          worktree: "/tmp/workflowhub-task-gate",
          branch: "task/workflowhub/task-gate",
        },
      },
      status_matrix: null,
      identity: {
        task_id: "task-gate",
        worktree: "/tmp/workflowhub-task-gate",
        branch: "task/workflowhub/task-gate",
      },
      source_completeness: null,
    };
    writeJson(f.reflectionPath, value);
    const output = run(f.root);
    expect(output.status).toBe("unavailable");
    expect(output.annotations).toEqual([]);
  });
});
