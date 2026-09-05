import { afterEach, describe, expect, it } from "vitest";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import vm from "node:vm";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { validateHumanConfirmation } from "../../runtime/evidence/canonical-evidence-validators.mjs";
import { runStageEndReflection } from "../../runtime/stage/stage-runner.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";

const repoRoot = resolve(join(import.meta.dirname, "../.."));
const pageCli = join(repoRoot, "tools/cli/build-reflection-page.mjs");
const deriveCli = join(repoRoot, "tools/cli/derive-consumption-edges.mjs");
const validateCli = join(repoRoot, "tools/cli/validate-stage-reflection.mjs");
const appendLessonCli = join(repoRoot, "tools/cli/append-lesson-observation.mjs");
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const fixedNow = "2026-08-31T00:00:00.000Z";
const roots = [];

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop(), { recursive: true, force: true });
});

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function git(repo, args) {
  return execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function writeJson(path, value) {
  mkdirSync(join(path, ".."), { recursive: true });
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  writeFileSync(path, raw, "utf8");
  return raw;
}

function runnerFixture(taskId) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-stage-reflection-e2e-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub constructed test"]);
  git(repo, ["config", "user.email", "constructed@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "constructed fixture\n", "utf8");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "fixture"]);

  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "ReflectionE2E",
      task_id: taskId,
      created_at: "2026-08-30T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const candidateWorkspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
  for (const material of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) {
    artifacts.writeAtomic(material, `# ${material}\n`);
  }
  const kernel = createTaskKernel(task, {
    candidateWorkspace,
    artifacts,
    now: () => "2026-08-30T12:00:00.000Z",
  });
  const context = {
    stage: "build-spec",
    task,
    kernel,
    identity: task.identity,
    workflowRunId: kernel.deriveStageWorkflowRunId("build-spec"),
    manifest: task.manifest,
    candidateWorkspace,
    artifacts,
    storageRoot: root,
  };
  return { root, task, kernel, context };
}

function reflectionValue(taskId, stageStatus, overrides = {}) {
  return {
    schema_version: "stage-reflection.v1",
    record_kind: "judgment",
    task_id: taskId,
    stage: "build-spec",
    stage_status: stageStatus,
    generated_at: "2026-08-30T12:00:00.000Z",
    status: "ok",
    error: null,
    judgments: [],
    interventions: [],
    lessons_added: [],
    ...overrides,
  };
}

function reflectionPath(taskRoot, stage = "build-spec") {
  return join(taskRoot, "quality", "stage-reflection", `${stage}.json`);
}

function lessonPath(root, project = "ReflectionE2E", stage = "build-spec") {
  return join(root, "Projects", project, "lessons", `${stage}.jsonl`);
}

function taskRoot(root, taskId, project = "ReflectionE2E") {
  return join(root, "Projects", project, "tasks", taskId);
}

function writeOutcome(root, taskId, stage, { inputRefs = [], outputRefs = [], stepSlug = `${stage}-step` } = {}, project = "ReflectionE2E") {
  const value = {
    schema_version: "workflowhub-stage-outcomes.v1",
    task_id: taskId,
    stage,
    generated_at: "2026-08-30T12:00:00.000Z",
    step_outcomes: outputRefs.length > 0 || inputRefs.length > 0 ? [{
      step_slug: stepSlug,
      status: "completed",
      result_summary: "constructed stage outcome",
      input_refs: inputRefs,
      evidence_refs: outputRefs.map((ref) => ({ ref, sha256: "a".repeat(64) })),
    }] : [],
    skill_outcomes: [],
  };
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const directory = join(root, "Projects", project, "tasks", taskId, "quality", "evidence", "stage-outcomes", stage);
  mkdirSync(directory, { recursive: true });
  const path = join(directory, `${hash(raw)}.json`);
  writeFileSync(path, raw, "utf8");
  return path;
}

function runJsonCli(script, args) {
  return JSON.parse(execFileSync(process.execPath, [script, ...args], { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
}

function writeConfirmation(root, taskId, { decision = "accepted", stepSlug = "remove-me", nonce = "" } = {}) {
  const value = {
    schema_version: "human-confirmation.v3",
    task_id: taskId,
    stage: "build-code",
    decision,
    subject_ref: "quality/stage-reflection/build-code.json",
    material_revision: `revision-${"b".repeat(64)}`,
    snapshot_tree: "c".repeat(40),
    confirmed_at: "2026-08-30T12:00:00.000Z",
    reply_text: `构造确认 ${nonce}`,
    step_slug: stepSlug,
  };
  const raw = writeJson(join(taskRoot(root, taskId), "quality", "confirmations", `${hash(`${JSON.stringify(value, null, 2)}\n`)}.json`), value);
  return `quality/confirmations/${hash(raw)}.json`;
}

function writeRemoveReflection(root, taskId, confirmationRefs) {
  return writeJson(join(taskRoot(root, taskId), "quality", "stage-reflection", "build-code.json"), {
    schema_version: "stage-reflection.v1",
    record_kind: "judgment",
    task_id: taskId,
    stage: "build-code",
    stage_status: "completed",
    generated_at: "2026-08-30T12:00:00.000Z",
    status: "ok",
    error: null,
    judgments: [{
      subject_id: "remove-me",
      subject_kind: "step",
      classification: "remove_candidate",
      severity: "high",
      reason: "构造对象没有后续消费，且存在人工介入记录。",
      evidence_refs: ["quality/evidence/remove-me.md"],
      confidence: "high",
      next_review_trigger: "下一次同类任务出现时重新检查。",
    }],
    interventions: confirmationRefs.map((ref) => ({
      confirmation_ref: ref,
      step_slug: "remove-me",
      reply_text: "构造确认",
      attribution: "人工确认",
      confidence: "high",
    })),
    lessons_added: [],
  });
}

function readProjectedData(path) {
  const context = {};
  vm.runInNewContext(readFileSync(path, "utf8"), context);
  return context.__WH_MONITOR_DATA__;
}

describe("stage-reflection constructed end-to-end contract", () => {
  it("writes completed and failed reflections, preserves raw lessons, and reads confirmation versions", async () => {
    const completed = runnerFixture("constructed-completed");
    const completedResult = await runStageEndReflection(completed.context, {
      stageStatus: "completed",
      now: "2026-08-30T12:00:00.000Z",
      generatedAt: "2026-08-30T12:00:00.000Z",
      execute: async ({ taskId, stageStatus }) => reflectionValue(taskId, stageStatus),
    });
    expect(completedResult).toMatchObject({ status: "completed", step_status: "completed" });
    expect(JSON.parse(completed.task.readRecord("quality/stage-reflection/build-spec.json"))).toMatchObject({
      stage_status: "completed",
      status: "ok",
      lessons_added: [expect.stringMatching(/^lessons\/build-spec\.jsonl#[A-Za-z0-9][A-Za-z0-9._-]*$/)],
    });
    const completedLessons = readFileSync(lessonPath(completed.root), "utf8").trim().split("\n").map((line) => JSON.parse(line));
    expect(completedLessons).toEqual([
      expect.objectContaining({ entry_kind: "raw_observation", merged: true }),
      expect.objectContaining({ entry_kind: "merged_lesson", occurrence_count: 1, source_refs: [expect.objectContaining({ task_id: completed.task.identity.taskId })] }),
    ]);

    const failed = runnerFixture("constructed-failed");
    const failedResult = await runStageEndReflection(failed.context, {
      stageStatus: "failed",
      now: "2026-08-30T12:00:00.000Z",
      generatedAt: "2026-08-30T12:00:00.000Z",
      execute: async () => { throw new Error("constructed reflection failure"); },
    });
    expect(failedResult).toMatchObject({ status: "failed", step_status: "failed" });
    expect(JSON.parse(failed.task.readRecord("quality/stage-reflection/build-spec.json"))).toMatchObject({
      stage_status: "failed",
      status: "failed",
      error: { summary: "constructed reflection failure" },
    });
    const rawLessons = readFileSync(lessonPath(failed.root), "utf8").trim().split("\n").map((line) => JSON.parse(line));
    expect(rawLessons).toHaveLength(1);
    expect(rawLessons[0]).toMatchObject({ entry_kind: "raw_observation", merged: false });
    expect(rawLessons.some((entry) => entry.entry_kind === "merged_lesson")).toBe(false);

    const confirmation = runnerFixture("constructed-confirmation");
    const record = confirmation.kernel.publishHumanConfirmation("build-code", {
      decision: "accepted",
      subject_ref: "quality/stage-reflection/build-code.json",
      reply_text: "我确认继续构造场景。",
      step_slug: "confirm-stage-reflection",
    });
    expect(record.value).toMatchObject({
      schema_version: "human-confirmation.v3",
      reply_text: "我确认继续构造场景。",
      step_slug: "confirm-stage-reflection",
    });
    expect(() => validateHumanConfirmation(record.value, {
      taskId: confirmation.task.identity.taskId,
      stage: "build-code",
      subject: "quality/stage-reflection/build-code.json",
      requireAccepted: true,
      requireSubjectRef: true,
    })).not.toThrow();

    const v1 = {
      schema_version: "human-confirmation.v1",
      task_id: confirmation.task.identity.taskId,
      stage: "build-code",
      decision: "accepted",
      confirmed_at: "2026-08-30T12:00:00.000Z",
      attempt_ref: "quality/reviews/attempts/constructed.json",
    };
    const v2 = {
      schema_version: "human-confirmation.v2",
      task_id: confirmation.task.identity.taskId,
      stage: "build-code",
      decision: "accepted",
      subject_ref: "quality/reviews/attempts/constructed.json",
      material_revision: `revision-${"d".repeat(64)}`,
      snapshot_tree: "e".repeat(40),
      confirmed_at: "2026-08-30T12:00:00.000Z",
    };
    const oldBytes = [JSON.stringify(v1), JSON.stringify(v2)];
    expect(() => validateHumanConfirmation(v1, {
      taskId: confirmation.task.identity.taskId,
      stage: "build-code",
      subject: v1.attempt_ref,
      requireAccepted: true,
    })).not.toThrow();
    expect(() => validateHumanConfirmation(v2, {
      taskId: confirmation.task.identity.taskId,
      stage: "build-code",
      subject: v2.subject_ref,
      requireAccepted: true,
      requireSubjectRef: true,
    })).not.toThrow();
    expect([JSON.stringify(v1), JSON.stringify(v2)]).toEqual(oldBytes);
  });

  it("proves the remove gate requires zero consumption plus a hard intervention signal", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-remove-gate-e2e-")));
    roots.push(root);
    const taskId = "constructed-remove-gate";
    const outputRef = "quality/evidence/remove-me.md";
    mkdirSync(join(taskRoot(root, taskId), "quality/evidence"), { recursive: true });
    writeFileSync(join(taskRoot(root, taskId), outputRef), "machine output\n", "utf8");
    for (const stage of stages) {
      writeOutcome(root, taskId, stage, stage === "build-code" ? { outputRefs: [outputRef], stepSlug: "remove-me" } : {});
    }
    const first = writeConfirmation(root, taskId, { nonce: "#1" });
    writeRemoveReflection(root, taskId, [first]);
    const withoutHardSignal = runJsonCli(validateCli, [
      `--root=${root}`,
      "--proj=ReflectionE2E",
      `--task-id=${taskId}`,
      "--stage=build-code",
      "--reflection-ref=quality/stage-reflection/build-code.json",
      `--now=${fixedNow}`,
    ]);
    expect(withoutHardSignal.reflection.judgments[0].classification).toBe("needs_evidence");
    expect(withoutHardSignal.downgrades[0]).toMatchObject({ downgraded_from: "remove_candidate" });

    const second = writeConfirmation(root, taskId, { nonce: "#2" });
    writeRemoveReflection(root, taskId, [first, second]);
    const withHardSignal = runJsonCli(validateCli, [
      `--root=${root}`,
      "--proj=ReflectionE2E",
      `--task-id=${taskId}`,
      "--stage=build-code",
      "--reflection-ref=quality/stage-reflection/build-code.json",
      `--now=${fixedNow}`,
    ]);
    expect(withHardSignal.reflection.judgments[0].classification).toBe("remove_candidate");
    expect(withHardSignal.downgrades).toEqual([]);
  });

  it("derives referenced edges, keeps unresolved consumption unknown, runs the page with zero AI, and leaves history read-only", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-page-e2e-")));
    roots.push(root);
    const project = "ReflectionE2E";
    const taskId = "constructed-page";
    const task = taskRoot(root, taskId, project);
    const consumed = "quality/evidence/consumed.txt";
    const orphan = "quality/evidence/orphan.txt";
    mkdirSync(join(task, "quality/evidence"), { recursive: true });
    writeFileSync(join(task, consumed), "consumed\n", "utf8");
    writeJson(join(task, "quality/stage-reflection/build-spec.json"), reflectionValue(taskId, "completed", {
      judgments: [{
        subject_id: "page-step",
        subject_kind: "step",
        classification: "simplify",
        severity: "medium",
        reason: "构造页面判断。",
        evidence_refs: [consumed],
        confidence: "medium",
        next_review_trigger: "下一次构造页面时",
      }],
      lessons_added: ["quality/stage-reflection/build-spec.json"],
    }));
    for (const stage of stages) {
      writeOutcome(root, taskId, stage, stage === "build-plan"
        ? { outputRefs: [consumed, orphan] }
        : stage === "build-code" ? { inputRefs: [consumed] } : {}, project);
    }
    const lessonsRoot = join(root, "Projects", project, "lessons");
    execFileSync(process.execPath, [
      appendLessonCli,
      `--root=${root}`,
      `--proj=${project}`,
      "--stage=build-spec",
      `--task-id=${taskId}`,
      "--text=constructed raw lesson",
      "--reflection-ref=quality/stage-reflection/build-spec.json",
    ], { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    appendFileSync(join(lessonsRoot, "build-spec.jsonl"), `${JSON.stringify({
      entry_kind: "merged_lesson",
      entry_id: "constructed-lesson",
      merged_at: "2026-08-30T12:01:00.000Z",
      stage: "build-spec",
      lesson: "构造 lesson",
      severity: "medium",
      occurrence_count: 1,
      source_refs: [{ task_id: taskId, raw_entry_id: "constructed-raw" }],
      supersedes: [],
    })}\n`, "utf8");
    const legacy = join(root, "m15-retirement", "history.json");
    writeJson(legacy, { immutable: true, source: "constructed history" });
    const historyBefore = hash(readFileSync(legacy, "utf8"));

    const derived = runJsonCli(deriveCli, [`--root=${root}`]);
    const derivedTask = derived.tasks.find((entry) => entry.task_id === taskId);
    expect(derivedTask.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({ ref: consumed, target: expect.objectContaining({ stage: "build-code" }) }),
    ]));
    expect(derivedTask.outputs.find((entry) => entry.ref === orphan)).toMatchObject({ consumption_status: "unknown" });

    const out = join(root, "page");
    runJsonCli(pageCli, [
      `--root=${root}`,
      `--tasks-root=${join(root, "Projects", project, "tasks")}`,
      `--out=${out}`,
      `--now=${fixedNow}`,
    ]);
    const data = readProjectedData(join(out, "data.js"));
    expect(data.source.ai_used).toBe(false);
    expect(data.tasks.find((entry) => entry.task_id === taskId).lessons).toHaveLength(2);
    expect(data.consumption_edges).toEqual(expect.arrayContaining([
      expect.objectContaining({ ref: consumed, task_id: taskId }),
    ]));
    expect(hash(readFileSync(legacy, "utf8"))).toBe(historyBefore);
  });

  it("requires every AC mapping row to point at an existing evidence path", () => {
    const mapping = readFileSync(join(repoRoot, "tests/fixtures/stage-reflection/ac-mapping.md"), "utf8");
    const rows = mapping.split(/\r?\n/).filter((line) => line.startsWith("| AC-"));
    expect(rows).toHaveLength(12);
    expect(rows.find((line) => line.startsWith("| AC-001"))).toContain("deferred_to_next_real_task");
    for (const row of rows) {
      const columns = row.split("|").map((part) => part.trim());
      expect(existsSync(join(repoRoot, columns[2])), row).toBe(true);
    }
    expect(readFileSync(join(repoRoot, "docs/standard-workflow.md"), "utf8")).toContain("specs/<task-id>");
    expect(readFileSync(join(repoRoot, "workflows/build-spec/SKILL.md"), "utf8")).toContain("specs/<task-id>");
    expect(readFileSync(join(repoRoot, "workflows/build-plan/SKILL.md"), "utf8")).toContain("specs/<task-id>");
    expect(readFileSync(join(repoRoot, "AGENTS.md"), "utf8")).toContain("specs/<task-id>");
    expect(readFileSync(join(repoRoot, "CONTEXT.md"), "utf8")).toContain("判断层（judgment）vs 事实层（fact）");
    expect(readFileSync(join(repoRoot, "specs/archive/workflowhub-stage-reflection-20260830/tasks.md"), "utf8")).toContain("m15-retirement");
  });
});
