import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { runStageReflection as runReflectionWriter } from "../../runtime/stage/stage-reflect.mjs";
import { stageRuntimeCliMain } from "../../tools/cli/stage-runtime.mjs";
import { RUNTIME_BEHAVIORS } from "../../runtime/interface/runtime-facade.mjs";

import { canonicalStageMaterials, writeStageOutcomeFixture } from "../helpers/stage-outcome.mjs";
import { authenticateStageOutcomeForProjection } from "../../runtime/stage/stage-runner.mjs";
import { validateReflection } from "../../tools/cli/validate-stage-reflection.mjs";

const repoRoot = resolve(join(import.meta.dirname, "../.."));
const validFixture = JSON.parse(readFileSync(join(repoRoot, "tests/fixtures/stage-reflect/judgment-valid.json"), "utf8"));
const invalidFixture = JSON.parse(readFileSync(join(repoRoot, "tests/fixtures/stage-reflect/judgment-invalid.json"), "utf8"));
const transferMatrix = JSON.parse(readFileSync(join(repoRoot, "tests/fixtures/stage-reflect/transfer-matrix.json"), "utf8"));
const roots = [];
const NOW = "2026-08-31T00:00:00.000Z";

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop(), { recursive: true, force: true });
});

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-stage-reflect-contract-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo, { recursive: true });
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub P2 tests"]);
  git(["config", "user.email", "p2@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "fixture\n");
  git(["add", "."]);
  git(["commit", "-qm", "fixture"]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "StageReflect",
      task_id: "task-reflect",
      created_at: NOW,
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const workspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  for (const [material, content] of Object.entries(canonicalStageMaterials())) artifacts.writeAtomic(material, content);
  const kernel = createTaskKernel(task, { candidateWorkspace: workspace, artifacts, now: () => NOW });
  const context = { stage: "build-spec", task, kernel, identity: task.identity, manifest: task.manifest, workflowRunId: kernel.deriveStageWorkflowRunId("build-spec"), candidateWorkspace: workspace, artifacts, storageRoot: root };
  context.reflectionOutcome = writeStageOutcomeFixture({ task, kernel, artifacts, workspace, stage: "build-spec", attemptId: "reflection-a" });
  return { root, task, kernel, context };
}

function inputFor(context, input) {
  if (!input) return input;
  const outcome = context.reflectionOutcome;
  return {
    ...input, schema_version: "stage-reflection.v2",
    judgments: [{ subject_id: "reflection-source", subject_kind: "step", classification: "keep", severity: "low",
      reason: "Current authenticated stage outcome supports this fixture judgment.", evidence_refs: [outcome.ref],
      confidence: "medium", next_review_trigger: "next execution" }, ...(input.judgments ?? [])],
    identity: { task_id: context.identity.taskId, worktree: context.candidateWorkspace.worktreeRoot,
      branch: context.candidateWorkspace.branch, attempt: outcome.value.attempt_id,
      snapshot_tree: outcome.value.snapshot_tree, material_revision: outcome.value.material_revision },
    executor: input.executor ?? {
      kind: "fixture-reflection-executor", source_id: "fixture/reflection-executor",
      attempt_id: outcome.value.attempt_id, started_at: "2026-08-31T00:00:01.000Z",
      completed_at: "2026-08-31T00:00:02.000Z", output_hash: "a".repeat(64),
    },
    output_hash: input.output_hash ?? "a".repeat(64),
    ...Object.fromEntries(["what_helped", "what_to_improve", "blockers", "intervention_reasons", "what_to_simplify", "simplifiable_now"].map((key) => [key, { state: "none_observed", items: [] }])),
    status_matrix: Object.fromEntries(["code", "verify", "physical_close", "acceptance", "release"].map((key) => [key, { state: "not_applicable", evidence_refs: [] }])),
    source_completeness: { compaction: false, truncation: false, visible_scope: "fixture outcome", unknown_reasons: [] },
  };
}
async function runStageReflection(context, options) {
  const stageOutcome = options.stageOutcome
    ?? authenticateStageOutcomeForProjection(context, context.stage, context.reflectionOutcome.ref);
  const result = await runReflectionWriter(context, {
    ...options,
    input: inputFor(context, options.input),
    stageOutcome,
  });
  if (result.publication) context.lastReflectionRef = result.publication.ref;
  return result;
}
function raw(value) { return `${JSON.stringify(value, null, 2)}\n`; }
function reflectionPath(state) { return join(state.task.taskPath, state.context.lastReflectionRef ?? "quality/stage-reflection/build-spec.json"); }
function lessonPath(state) { return join(state.root, "Projects", "StageReflect", "lessons", "build-spec.jsonl"); }
function availabilityRoot(state) { return join(state.task.taskPath, "quality", "evidence", "stage-reflection-availability"); }
function failureRoot(state) { return join(state.task.taskPath, "quality", "evidence", "stage-reflection-failures"); }

function readRows(state) {
  const path = lessonPath(state);
  return existsSync(path) ? readFileSync(path, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse) : [];
}

describe("stage-reflect contract", () => {
  it("publishes a valid judgment, merges its machine lesson, and is content-addressed", async () => {
    const state = fixture();
    const result = await runStageReflection(state.context, { input: validFixture, observation: "阶段结束，已完成阶段复盘。", now: NOW });
    expect(result).toMatchObject({ status: "completed", publication: { status: "published" }, lesson: { status: "merged" } });
    const publishedRaw = readFileSync(reflectionPath(state), "utf8");
    expect(createHash("sha256").update(publishedRaw).digest("hex")).toBe(result.publication.sha256);
    expect(readRows(state)).toEqual([
      expect.objectContaining({ entry_kind: "raw_observation", merged: true }),
      expect.objectContaining({ entry_kind: "merged_lesson" }),
    ]);
    await expect(runStageReflection(state.context, { input: validFixture, now: NOW })).resolves.toMatchObject({
      status: "completed",
      publication: { status: "idempotent" },
      lesson: { status: "already_merged" },
    });
  });

  it("records malformed lesson recovery as a durable failure instead of escaping", async () => {
    const state = fixture();
    await runStageReflection(state.context, { input: validFixture, now: NOW });
    writeFileSync(lessonPath(state), "not-json\n", "utf8");
    const result = await runStageReflection(state.context, { input: validFixture, now: NOW });
    expect(result).toMatchObject({ status: "degraded", failure: { value: { failure_kind: "lesson_merge" } } });
    expect(readdirSync(failureRoot(state))).toHaveLength(1);
  });

  it("rejects illegal input before writing anything and accepts a corrected retry", async () => {
    const state = fixture();
    await expect(runStageReflection(state.context, { input: invalidFixture, now: NOW })).rejects.toThrow(/unknown|unexpected|additional/i);
    expect(existsSync(reflectionPath(state))).toBe(false);
    expect(readRows(state)).toEqual([]);
    await expect(runStageReflection(state.context, { input: validFixture, now: NOW })).resolves.toMatchObject({ status: "completed" });
  });

  it("reuses semantic A across automatic timestamps and preserves A when judgment B is published", async () => {
    const state = fixture();
    expect(authenticateStageOutcomeForProjection(state.context, "build-spec", state.context.reflectionOutcome.ref)).toMatchObject({ ref: state.context.reflectionOutcome.ref });
    const first = await runStageReflection(state.context, { input: validFixture, now: NOW });
    expect(first.status).toBe("completed");
    expect(first.reflection.status).toBe("ok");
    expect(first.publication.ref).toMatch(/^quality\/stage-reflection\/build-spec\/[a-f0-9]{64}\.json$/);
    const original = state.task.readRecord(first.publication.ref);
    const lessons = readFileSync(lessonPath(state), "utf8");
    const duplicate = await runStageReflection(state.context, { input: { ...validFixture, generated_at: "2026-08-31T01:00:00.000Z" }, now: "2026-08-31T01:00:00.000Z" });
    expect(duplicate.publication).toMatchObject({ ref: first.publication.ref, sha256: first.publication.sha256, status: "idempotent" });
    expect(state.task.readRecord(first.publication.ref)).toBe(original);
    expect(readFileSync(lessonPath(state), "utf8")).toBe(lessons);
    const changed = { ...validFixture, status: "failed", error: { summary: "different judgment" } };
    const second = await runStageReflection(state.context, { input: changed, now: "2026-08-31T02:00:00.000Z" });
    expect(second.publication.ref).not.toBe(first.publication.ref);
    expect(state.task.readRecord(first.publication.ref)).toBe(original);
    expect(JSON.parse(state.task.readRecord(second.publication.ref)).error.summary).toBe("different judgment");
    expect(existsSync(join(state.task.taskPath, "quality/stage-reflection/build-spec.json"))).toBe(false);
  });

  it("reuses A when the same original intervention is normalized by a v3 confirmation", async () => {
    const state = fixture();
    const confirmation = state.kernel.publishHumanConfirmation("build-spec", {
      decision: "accepted", subject_ref: null, step_slug: "stage-reflection",
      reply_text: "Canonical confirmed reply.",
    });
    expect(confirmation.value.schema_version).toBe("human-confirmation.v3");
    const input = { ...validFixture, interventions: [{
      confirmation_ref: confirmation.ref, step_slug: "original-untrusted-step",
      reply_text: "Original nonempty reply before confirmation normalization.", attribution: "human", confidence: "medium",
    }] };
    const originalInput = raw(input);
    const first = await runStageReflection(state.context, { input, now: NOW });
    expect(first).toMatchObject({ status: "completed", reflection: { interventions: [{
      step_slug: "stage-reflection", reply_text: "Canonical confirmed reply.",
    }] } });
    const original = state.task.readRecord(first.publication.ref);
    const firstTime = JSON.parse(original).generated_at;
    const duplicate = await runStageReflection(state.context, { input, now: "2026-08-31T01:00:00.000Z" });
    expect(duplicate.publication).toMatchObject({ ref: first.publication.ref, sha256: first.publication.sha256, status: "idempotent" });
    expect(state.task.readRecord(duplicate.publication.ref)).toBe(original);
    expect(duplicate.reflection.generated_at).toBe(firstTime);
    expect(raw(input)).toBe(originalInput);
  });

  it("keeps a missing authenticated source unavailable even when A already exists", async () => {
    const state = fixture();
    const first = await runStageReflection(state.context, { input: validFixture, now: NOW });
    const original = state.task.readRecord(first.publication.ref);
    const input = inputFor(state.context, validFixture);
    input.judgments[0].evidence_refs = [];
    const result = await runReflectionWriter(state.context, { input, now: NOW });
    expect(result.status).toBe("unavailable");
    expect(result.publication == null).toBe(true);
    expect(state.task.readRecord(first.publication.ref)).toBe(original);
  });

  it("reads explicit historical and content refs without selecting another judgment", async () => {
    const state = fixture();
    const legacyRef = "quality/stage-reflection/build-spec.json";
    state.kernel.publishCanonicalRecord(legacyRef, raw(validFixture));
    const first = await runStageReflection(state.context, { input: validFixture, now: NOW });
    const second = await runStageReflection(state.context, { input: { ...validFixture, status: "failed", error: { summary: "B" } }, now: NOW });
    for (const [ref, status] of [[legacyRef, "ok"], [first.publication.ref, "ok"], [second.publication.ref, "failed"]]) {
      const read = validateReflection({ storageRoot: state.root, taskRoot: state.task.taskPath, project: "StageReflect", taskId: "task-reflect", stage: "build-spec", reflectionRef: ref, now: NOW });
      expect(read.reflection_ref).toBe(ref);
      expect(read.reflection.status).toBe(status);
    }
    expect(state.task.readRecord(legacyRef)).toBe(raw(validFixture));
  });

  it("keeps an unavailable runner path outside the fixed judgment path", async () => {
    const state = fixture();
    const result = await runStageReflection(state.context, { input: null, reasonCode: "executor_absent", now: NOW });
    expect(result).toMatchObject({ status: "unavailable", availability: { state: "unavailable", reason_code: "executor_absent" } });
    expect(existsSync(reflectionPath(state))).toBe(false);
    const files = existsSync(availabilityRoot(state)) ? readdirSync(availabilityRoot(state)) : [];
    expect(files).toHaveLength(1);
  });

  it("rejects malformed timestamps before publishing availability or judgment facts", async () => {
    const state = fixture();
    await expect(runStageReflection(state.context, { input: null, reasonCode: "executor_absent", now: "not-a-timestamp" }))
      .rejects.toMatchObject({ code: "STAGE_REFLECTION_INPUT_INVALID" });
    await expect(runStageReflection(state.context, { input: validFixture, now: "not-a-timestamp" }))
      .rejects.toMatchObject({ code: "STAGE_REFLECTION_INPUT_INVALID" });
    expect(existsSync(reflectionPath(state))).toBe(false);
    expect(existsSync(availabilityRoot(state))).toBe(false);
  });

  it("rejects cross-state availability reason pairs without writing a fact", async () => {
    const state = fixture();
    await expect(runStageReflection(state.context, {
      input: null,
      availabilityState: "unavailable",
      reasonCode: "preflight_failed",
      now: NOW,
    })).rejects.toMatchObject({ code: "STAGE_REFLECTION_INPUT_INVALID" });
    expect(existsSync(reflectionPath(state))).toBe(false);
    expect(existsSync(availabilityRoot(state))).toBe(false);
  });

  it("durably records a lesson merge failure and repairs it on retry", async () => {
    const state = fixture();
    const result = await runStageReflection(state.context, {
      input: validFixture,
      now: NOW,
      testHooks: {
        beforeLessonCommit: () => { throw Object.assign(new Error("simulated lesson merge failure"), { code: "LESSON_COMMIT_FAILED" }); },
      },
    });
    expect(result).toMatchObject({ status: "degraded", failure: { value: { failure_kind: "lesson_merge" } } });
    expect(JSON.parse(readFileSync(reflectionPath(state), "utf8"))).toMatchObject({ status: "degraded", error: null, lessons_added: [] });
    expect(readRows(state)).toEqual([]);
    expect(readdirSync(failureRoot(state))).toHaveLength(1);

    const retry = await runStageReflection(state.context, { input: { ...validFixture, generated_at: "2026-08-31T01:00:00.000Z" }, now: "2026-08-31T01:00:00.000Z" });
    expect(retry).toMatchObject({ status: "recovered", publication: { status: "idempotent" }, lesson: { status: "merged" } });
    expect(readRows(state)).toEqual([
      expect.objectContaining({ entry_kind: "raw_observation", merged: true }),
      expect.objectContaining({ entry_kind: "merged_lesson" }),
    ]);
  });

  it("preserves a failed judgment when lesson commit also fails", async () => {
    const state = fixture();
    const failed = {
      ...validFixture,
      status: "failed",
      error: { summary: "session judgment failed" },
    };
    const result = await runStageReflection(state.context, {
      input: failed,
      now: NOW,
      testHooks: {
        beforeLessonCommit: () => { throw new Error("simulated failed-judgment lesson failure"); },
      },
    });
    expect(result).toMatchObject({ status: "degraded", failure: { value: { failure_kind: "lesson_merge" } } });
    expect(JSON.parse(readFileSync(reflectionPath(state), "utf8"))).toMatchObject({
      status: "failed",
      error: { summary: "session judgment failed" },
      lessons_added: [],
    });
    expect(readRows(state)).toEqual([]);
  });

  it("rolls back a recovery commit when the post-commit boundary fails", async () => {
    const state = fixture();
    await runStageReflection(state.context, {
      input: validFixture,
      now: NOW,
      testHooks: {
        beforeLessonCommit: () => { throw new Error("seed recovery state"); },
      },
    });
    const result = await runStageReflection(state.context, {
      input: validFixture,
      now: NOW,
      testHooks: {
        afterLessonCommit: () => { throw new Error("simulated recovery post-commit failure"); },
      },
    });
    expect(result).toMatchObject({ status: "degraded", failure: { value: { failure_kind: "lesson_merge" } } });
    expect(readRows(state)).toEqual([]);
    expect(readdirSync(failureRoot(state))).toHaveLength(2);

    await expect(runStageReflection(state.context, { input: validFixture, now: NOW })).resolves.toMatchObject({
      status: "recovered",
      lesson: { status: "merged" },
    });
    expect(readRows(state)).toEqual([
      expect.objectContaining({ entry_kind: "raw_observation", merged: true }),
      expect.objectContaining({ entry_kind: "merged_lesson" }),
    ]);
  });

  it("rolls back lessons when immutable publication fails", async () => {
    const state = fixture();
    await expect(runStageReflection(state.context, {
      input: validFixture,
      now: NOW,
      testHooks: {
        beforeReflectionPublish: ({ fixedRef }) => {
          const path = join(state.task.taskPath, fixedRef);
          mkdirSync(join(path, ".."), { recursive: true });
          state.context.lastReflectionRef = fixedRef;
          writeFileSync(path, JSON.stringify({ foreign: true }) + "\n", "utf8");
        },
      },
    })).rejects.toMatchObject({ code: "EEXIST" });
    expect(readRows(state)).toEqual([]);
    expect(JSON.parse(readFileSync(reflectionPath(state), "utf8"))).toEqual({ foreign: true });
    expect(JSON.parse(readFileSync(join(failureRoot(state), readdirSync(failureRoot(state))[0]), "utf8"))).toMatchObject({
      failure_kind: "publication",
      error: { summary: expect.stringMatching(/already exists/) },
    });
  });

  it("freezes the seven public behavior classes while routing run:reflect", async () => {
    const state = fixture();
    const inputPath = join(state.root, "judgment.json");
    writeFileSync(inputPath, JSON.stringify(validFixture), "utf8");
    expect([...RUNTIME_BEHAVIORS]).toEqual(["doctor", "status", "run", "review", "verify", "confirm", "authorize"]);
    const delegate = async (argv) => {
      expect(argv[0]).toBe("reflect");
      const input = JSON.parse(readFileSync(argv.find((argument) => argument.startsWith("--input="))?.slice("--input=".length), "utf8"));
      return runStageReflection(state.context, { input, now: NOW });
    };
    await expect(stageRuntimeCliMain(["run", "--action=reflect", "--stage=build-spec", "--project=StageReflect", "--task=task-reflect", `--input=${inputPath}`], { delegate })).resolves.toMatchObject({ status: "completed", publication: { status: "published" } });
    expect(existsSync(reflectionPath(state))).toBe(true);
  });

  it("keeps the transfer matrix fixture explicit", () => {
    expect(transferMatrix).toHaveLength(5);
    expect(transferMatrix.map((row) => row.id)).toEqual(["judgment-executed", "judgment-invalid", "executor-absent", "not-scheduled", "supplemented"]);
  });
});
