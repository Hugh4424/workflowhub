import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { assertTaskHandle } from "../task/task-handle.mjs";
import { assertTaskKernel } from "../task/task-kernel.mjs";
import {
  appendLessonObservation,
  lessonEntryRef,
  mergeLessonObservation,
} from "../../tools/cli/append-lesson-observation.mjs";
import { isDateTime, validateReflectionValue } from "../../tools/cli/validate-stage-reflection.mjs";
import { acquireProjectLock, assertProjectLockCurrent } from "../evidence/workflow-evolution.mjs";

export { isDateTime };

export const STAGE_REFLECTION_STAGES = Object.freeze([
  "make-decision",
  "build-spec",
  "build-plan",
  "build-code",
  "verify-code",
]);

const STAGES = new Set(STAGE_REFLECTION_STAGES);
const AVAILABILITY_STATES = new Set(["unavailable", "not_scheduled"]);
const AVAILABILITY_REASONS = new Set([
  "executor_absent",
  "preflight_failed",
  "identity_failed",
  "startup_failed",
  "interrupted",
  "not_started",
]);
const AVAILABILITY_REASONS_BY_STATE = Object.freeze({
  unavailable: new Set(["executor_absent"]),
  not_scheduled: new Set(["preflight_failed", "identity_failed", "startup_failed", "interrupted", "not_started"]),
});

export function normalizeStageReflectionAvailability({ state, reasonCode } = {}) {
  if (state !== undefined && !AVAILABILITY_STATES.has(state)) {
    fail("invalid stage reflection availability state", "STAGE_REFLECTION_INPUT_INVALID");
  }
  if (reasonCode !== undefined && !AVAILABILITY_REASONS.has(reasonCode)) {
    fail("invalid stage reflection availability reason", "STAGE_REFLECTION_INPUT_INVALID");
  }
  const derivedState = reasonCode === undefined
    ? null
    : Object.entries(AVAILABILITY_REASONS_BY_STATE).find(([, reasons]) => reasons.has(reasonCode))?.[0] ?? null;
  if (reasonCode !== undefined && derivedState === null) {
    fail("invalid stage reflection availability reason", "STAGE_REFLECTION_INPUT_INVALID");
  }
  if (state !== undefined && derivedState !== null && state !== derivedState) {
    fail("stage reflection availability state and reason do not match", "STAGE_REFLECTION_INPUT_INVALID");
  }
  const normalizedState = state ?? derivedState ?? "unavailable";
  const normalizedReason = reasonCode ?? (normalizedState === "unavailable" ? "executor_absent" : "not_started");
  return Object.freeze({ state: normalizedState, reasonCode: normalizedReason });
}

function hash(raw) {
  return createHash("sha256").update(raw).digest("hex");
}

function fail(message, code = "STAGE_REFLECTION_FAILED") {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`, "STAGE_REFLECTION_INPUT_INVALID");
  }
  return value;
}

function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function assertTimestamp(value, label) {
  if (!isDateTime(value)) {
    fail(`${label} must be an ISO-compatible timestamp`, "STAGE_REFLECTION_INPUT_INVALID");
  }
  return value;
}

export function stageReflectionRef(stage) {
  if (!STAGES.has(stage)) fail(`unsupported stage: ${stage}`, "STAGE_REFLECTION_INPUT_INVALID");
  return `quality/stage-reflection/${stage}.json`;
}

function contextParts(context) {
  if (!context || typeof context !== "object") {
    fail("authenticated StageContext is required", "STAGE_REFLECTION_CONTEXT_INVALID");
  }
  const task = assertTaskHandle(context.task);
  const kernel = assertTaskKernel(context.kernel);
  if (kernel.task !== task) fail("StageContext TaskHandle/TaskKernel mismatch", "STAGE_REFLECTION_CONTEXT_INVALID");
  const stage = context.stage;
  stageReflectionRef(stage);
  const identity = context.identity ?? task.identity;
  if (identity.projectName !== task.identity.projectName || identity.taskId !== task.identity.taskId) {
    fail("StageContext identity does not match TaskHandle", "STAGE_REFLECTION_CONTEXT_INVALID");
  }
  const root = resolve(task.taskPath, "..", "..", "..", "..");
  if (context.storageRoot !== undefined
      && (typeof context.storageRoot !== "string" || resolve(context.storageRoot) !== root)) {
    fail("StageContext storage root does not match TaskHandle", "STAGE_REFLECTION_CONTEXT_INVALID");
  }
  return {
    context,
    task,
    kernel,
    stage,
    root,
    project: task.identity.projectName,
    taskId: task.identity.taskId,
    worktree: context.candidateWorkspace?.worktreeRoot
      ?? context.workspace?.worktreeRoot
      ?? task.taskPath,
  };
}

function assertInputIdentity(input, { stage, taskId }) {
  assertObject(input, "reflection input");
  if (input.task_id !== taskId || input.stage !== stage) {
    fail("reflection identity does not match the requested task and stage", "STAGE_REFLECTION_INPUT_INVALID");
  }
  if (!(input.stage_status === "completed" || input.stage_status === "failed")) {
    fail("reflection stage_status must be completed or failed", "STAGE_REFLECTION_INPUT_INVALID");
  }
}

function readExisting(task, ref) {
  try {
    return task.readRecord(ref);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

/** Publish through TaskKernel's authenticated create-only primitive. */
function publishImmutable({ task, kernel, ref, raw }) {
  const prior = readExisting(task, ref);
  if (prior !== null) {
    if (prior === raw) {
      return { ref, sha256: hash(raw), status: "idempotent", idempotent: true };
    }
    const error = new Error(`canonical record ${ref} already exists with different bytes`);
    error.code = "EEXIST";
    throw error;
  }
  try {
    const record = kernel.publishCanonicalRecord(ref, raw);
    return {
      ref: record?.ref ?? ref,
      sha256: record?.sha256 ?? hash(raw),
      status: "published",
      idempotent: false,
    };
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    const current = readExisting(task, ref);
    if (current === raw) return { ref, sha256: hash(raw), status: "idempotent", idempotent: true };
    const conflict = new Error(`canonical record ${ref} already exists with different bytes`);
    conflict.code = "EEXIST";
    throw conflict;
  }
}

function identityForAvailability(parts) {
  const workspace = parts.context.candidateWorkspace ?? parts.context.workspace;
  return {
    task_id: parts.taskId,
    worktree: workspace?.worktreeRoot ?? parts.task.taskPath,
    branch: workspace?.branch ?? `task/${parts.project}/${parts.taskId}`,
    attempt: null,
    snapshot_tree: null,
    material_revision: null,
  };
}

function availabilityValue(parts, state, reasonCode, observedAt) {
  if (!AVAILABILITY_STATES.has(state)
      || !AVAILABILITY_REASONS.has(reasonCode)
      || !AVAILABILITY_REASONS_BY_STATE[state]?.has(reasonCode)) {
    fail("invalid stage reflection availability fact", "STAGE_REFLECTION_INPUT_INVALID");
  }
  assertTimestamp(observedAt, "observed_at");
  return {
    schema_version: "stage-reflection-availability.v1",
    record_kind: "availability",
    task_id: parts.taskId,
    stage: parts.stage,
    state,
    reason_code: reasonCode,
    observed_at: observedAt,
    task_identity: identityForAvailability(parts),
  };
}

export function publishStageReflectionAvailability(context, {
  state,
  reasonCode,
  now = new Date().toISOString(),
} = {}) {
  const parts = contextParts(context);
  const value = availabilityValue(parts, state, reasonCode, now);
  const raw = canonicalJson(value);
  const ref = `quality/evidence/stage-reflection-availability/${hash(raw)}.json`;
  const publication = publishImmutable({ task: parts.task, kernel: parts.kernel, ref, raw });
  return Object.freeze({
    ...publication,
    state,
    reason_code: reasonCode,
    value,
  });
}

function lessonText(input, observation, stage) {
  if (typeof observation === "string" && observation.trim() !== "") return observation.trim();
  const count = Array.isArray(input?.judgments) ? input.judgments.length : 0;
  return `stage ${stage} ended with ${count} reflection judgment${count === 1 ? "" : "s"}`;
}

function lessonPath(root, project, stage) {
  return join(root, "Projects", project, "lessons", `${stage}.jsonl`);
}

function snapshotLesson(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function restoreLesson(path, prior) {
  if (prior === null) {
    try {
      unlinkSync(path);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.rollback-${randomUUID()}`;
  try {
    writeFileSync(temporary, prior, { encoding: "utf8", flag: "wx", mode: 0o600 });
    renameSync(temporary, path);
  } finally {
    try {
      unlinkSync(temporary);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
}

function withoutLessons(value) {
  const clone = structuredClone(value);
  clone.lessons_added = [];
  return clone;
}

function sameJudgment(existingRaw, validated) {
  try {
    const normalize = (value) => {
      const comparable = withoutLessons(value);
      // A durable degraded record is the retryable outcome of a lesson
      // commit failure. Its machine-generated status must not turn a retry of
      // the same judgment into a false byte-conflict.
      if (comparable.status === "degraded" && comparable.error === null) comparable.status = "ok";
      return comparable;
    };
    return canonicalJson(normalize(JSON.parse(existingRaw)))
      === canonicalJson(normalize(validated));
  } catch {
    return false;
  }
}

function reflectionSeverity(value) {
  const weights = { low: 1, medium: 2, high: 3 };
  return (value?.judgments ?? [])
    .map((judgment) => judgment?.severity)
    .filter((severity) => Object.hasOwn(weights, severity))
    .sort((left, right) => weights[right] - weights[left])[0] ?? "medium";
}

function stageRoot(parts) {
  const parent = dirname(resolve(parts.root));
  return mkdtempSync(join(parent, ".workflowhub-stage-reflect-"));
}

function lessonEntryIdFromRef(ref, stage) {
  const prefix = `lessons/${stage}.jsonl#`;
  if (typeof ref !== "string" || !ref.startsWith(prefix)) return null;
  const entryId = ref.slice(prefix.length);
  return /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(entryId) ? entryId : null;
}

function stableLessonRef(parts, validated) {
  const identity = canonicalJson({
    task_id: parts.taskId,
    stage: parts.stage,
    stage_status: validated.stage_status,
    generated_at: validated.generated_at,
    judgments: validated.judgments,
    interventions: validated.interventions,
  });
  return lessonEntryRef(parts.stage, `reflection-${hash(identity).slice(0, 32)}`);
}

function lessonRows(raw) {
  if (raw === null) return [];
  return raw.split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line));
}

function rewriteStagedMergedEntry(path, fromId, toId) {
  if (fromId === toId) return;
  const rows = lessonRows(readFileSync(path, "utf8"));
  if (rows.some((row) => row.entry_id === toId && row.entry_id !== fromId)) {
    fail("stable lesson entry id collides with an existing lesson row", "LESSON_COMMIT_CONFLICT");
  }
  const index = rows.findIndex((row) => row.entry_kind === "merged_lesson" && row.entry_id === fromId);
  if (index < 0) fail("merged lesson row is unavailable after merge", "LESSON_COMMIT_FAILED");
  rows[index] = { ...rows[index], entry_id: toId };
  writeFileSync(path, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
}

function lessonRefPresent(parts, ref) {
  const entryId = lessonEntryIdFromRef(ref, parts.stage);
  if (!entryId) return false;
  const raw = snapshotLesson(lessonPath(parts.root, parts.project, parts.stage));
  return lessonRows(raw).some((row) => row.entry_kind === "merged_lesson" && row.entry_id === entryId);
}

function acquireLessonLock(parts) {
  const waitBuffer = new Int32Array(new SharedArrayBuffer(4));
  let last;
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const lock = acquireProjectLock({
      storageRoot: parts.root,
      project: parts.project,
      attemptId: `stage-reflect-${randomUUID()}`,
    });
    if (lock.status === "ok") return lock;
    last = lock;
    if (lock.status !== "conflict") break;
    Atomics.wait(waitBuffer, 0, 0, 10);
  }
  const error = new Error(last?.error?.summary ?? "lesson merge project lock is unavailable");
  error.code = "LESSON_COMMIT_LOCK_UNAVAILABLE";
  throw error;
}

function stageLessons(parts, validated, observation, now, ref, expectedLessonRef = stableLessonRef(parts, validated)) {
  const root = stageRoot(parts);
  const stagedTask = join(root, relative(parts.root, parts.task.taskPath));
  const stagedLessons = join(root, "Projects", parts.project, "lessons");
  mkdirSync(stagedTask, { recursive: true });
  mkdirSync(stagedLessons, { recursive: true });
  const target = lessonPath(parts.root, parts.project, parts.stage);
  const existing = snapshotLesson(target);
  if (existing !== null) writeFileSync(join(stagedLessons, `${parts.stage}.jsonl`), existing, "utf8");
  const expectedEntryId = lessonEntryIdFromRef(expectedLessonRef, parts.stage);
  try {
    const existingRows = lessonRows(existing);
    const expectedRawEntryId = expectedEntryId === null ? null : `raw-${expectedEntryId}`;
    const existingRaw = existingRows.find((row) => row.entry_kind === "raw_observation" && row.entry_id === expectedRawEntryId);
    const rawEntryId = existingRaw?.entry_id ?? expectedRawEntryId ?? randomUUID();
    const rawPrelude = appendLessonObservation({
      root,
      proj: parts.project,
      stage: parts.stage,
      taskId: parts.taskId,
      text: lessonText(validated, observation, parts.stage),
      reflectionRef: ref,
      now,
      entryId: rawEntryId,
    });
    const rawEntry = existingRaw ?? rawPrelude.entry;
    if (validated.status === "failed") {
      return {
        root,
        path: join(stagedLessons, `${parts.stage}.jsonl`),
        lesson: { status: "appended", entry: rawEntry, ref: null },
        lessonRef: null,
        priorLessons: existing,
        raw: readFileSync(join(stagedLessons, `${parts.stage}.jsonl`), "utf8"),
      };
    }
    const merged = mergeLessonObservation({
      root,
      proj: parts.project,
      stage: parts.stage,
      taskId: parts.taskId,
      rawEntryId: rawEntry.entry_id,
      severity: reflectionSeverity(validated),
      now,
    });
    if (merged.status === "merged" && expectedEntryId !== null) {
      rewriteStagedMergedEntry(join(stagedLessons, `${parts.stage}.jsonl`), merged.entry.entry_id, expectedEntryId);
      merged.entry = { ...merged.entry, entry_id: expectedEntryId };
      merged.ref = lessonEntryRef(parts.stage, expectedEntryId);
    }
    return {
      root,
      path: join(stagedLessons, `${parts.stage}.jsonl`),
      lesson: merged,
      lessonRef: merged.ref ?? lessonEntryRef(parts.stage, merged.entry.entry_id),
      priorLessons: existing,
      raw: readFileSync(join(stagedLessons, `${parts.stage}.jsonl`), "utf8"),
    };
  } catch (error) {
    rmSync(root, { recursive: true, force: true });
    throw error;
  }
}

function commitStagedLessons(staged, target, lock) {
  const stagedRaw = readFileSync(staged.path, "utf8");
  assertProjectLockCurrent(lock);
  const current = snapshotLesson(target);
  // A concurrent lesson writer must not be overwritten. The caller reports
  // this as degraded and keeps the immutable judgment path available for the
  // retryable failure record.
  if (current !== staged.priorLessons) {
    const error = new Error("lesson index changed during stage reflection publication");
    error.code = "LESSON_COMMIT_CONFLICT";
    throw error;
  }
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.stage-${randomUUID()}`;
  try {
    writeFileSync(temporary, stagedRaw, { encoding: "utf8", flag: "wx", mode: 0o600 });
    renameSync(temporary, target);
  } finally {
    try {
      unlinkSync(temporary);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  assertProjectLockCurrent(lock);
  return stagedRaw;
}

function restoreLessonIfUnchanged(path, expected, prior, lock) {
  assertProjectLockCurrent(lock);
  if (snapshotLesson(path) !== expected) {
    const error = new Error("lesson index changed before rollback");
    error.code = "LESSON_ROLLBACK_CONFLICT";
    throw error;
  }
  restoreLesson(path, prior);
  assertProjectLockCurrent(lock);
}

function publishReflectionFailure(parts, {
  failureKind,
  error,
  reflectionSha256 = null,
  lessonRef = null,
  now,
}) {
  const value = {
    schema_version: "stage-reflection-failure.v1",
    record_kind: "failure_fact",
    task_id: parts.taskId,
    stage: parts.stage,
    operation: "reflect",
    failure_kind: failureKind,
    reflection_ref: stageReflectionRef(parts.stage),
    reflection_sha256: reflectionSha256,
    lesson_ref: lessonRef,
    observed_at: now,
    task_identity: identityForAvailability(parts),
    error: {
      code: error?.code ?? "STAGE_REFLECTION_FAILED",
      summary: error instanceof Error ? error.message : String(error),
    },
  };
  const raw = canonicalJson(value);
  const ref = `quality/evidence/stage-reflection-failures/${hash(raw)}.json`;
  return Object.freeze({
    ...publishImmutable({ task: parts.task, kernel: parts.kernel, ref, raw }),
    value,
  });
}

function reflectionResult({ publication, lesson, validation, reflection, failure = undefined, status = "completed" }) {
  return Object.freeze({
    status,
    publication,
    lesson,
    validation,
    reflection,
    ...(failure === undefined ? {} : { failure }),
  });
}

function degradedValue(validated) {
  return {
    ...validated,
    status: validated.status === "failed" ? "failed" : "degraded",
    error: validated.status === "failed" ? validated.error : null,
    lessons_added: [],
  };
}

/**
 * Execute a session-produced judgment. Validation has no write side effects;
 * lesson rows are prepared away from task storage, the immutable record is
 * committed, and then the immutable judgment is published. A publication
 * failure rolls the lesson commit back with compare-and-swap.
 */
export async function runStageReflection(context, {
  input,
  judgment,
  observation = null,
  now = new Date().toISOString(),
  availabilityState,
  reasonCode,
  testHooks = null,
} = {}) {
  const parts = contextParts(context);
  const observedAt = assertTimestamp(now, "now");
  const candidate = input ?? judgment;
  if (candidate === null || candidate === undefined) {
    const availabilityInput = normalizeStageReflectionAvailability({ state: availabilityState, reasonCode });
    const availability = publishStageReflectionAvailability(context, {
      state: availabilityInput.state,
      reasonCode: availabilityInput.reasonCode,
      now: observedAt,
    });
    return Object.freeze({
      status: availabilityInput.state,
      step_status: availabilityInput.state,
      reflection_status: availabilityInput.state,
      ref: null,
      sha256: availability.sha256,
      persisted: false,
      availability,
      availability_ref: availability.ref,
      availability_sha256: availability.sha256,
      publication: null,
      lesson: null,
    });
  }

  // This is deliberately before appendLessonObservation: malformed or stale
  // session output must leave no lesson, fixed record, or availability fact.
  assertInputIdentity(candidate, parts);
  const fixedRef = stageReflectionRef(parts.stage);
  const sourceRaw = canonicalJson(candidate);
  const validation = validateReflectionValue({
    storageRoot: parts.root,
    taskRoot: parts.task.taskPath,
    project: parts.project,
    taskId: parts.taskId,
    stage: parts.stage,
    reflectionRef: fixedRef,
    now: observedAt,
    input: candidate,
    raw: sourceRaw,
  });
  const validated = validation.reflection;
  const existingRaw = readExisting(parts.task, fixedRef);
  if (existingRaw !== null) {
    if (existingRaw === sourceRaw || sameJudgment(existingRaw, validated)) {
      const existing = JSON.parse(existingRaw);
      const existingLessons = Array.isArray(existing.lessons_added) ? existing.lessons_added : [];
      if (existing.status !== "failed") {
        let recovery;
        let recoveryLock;
        try {
          const expectedRecoveryRef = existingLessons[0] ?? stableLessonRef(parts, validated);
          const needsLessonRecovery = existingLessons.length === 0
            ? !lessonRefPresent(parts, expectedRecoveryRef)
            : existingLessons.some((ref) => !lessonRefPresent(parts, ref));
          if (!needsLessonRecovery) {
            return reflectionResult({
              publication: {
                ref: fixedRef,
                sha256: hash(existingRaw),
                status: "idempotent",
                idempotent: true,
              },
              lesson: { status: "already_merged" },
              validation: { ...validation, reflection: existing },
              reflection: existing,
            });
          }
          recovery = stageLessons(
            parts,
            validated,
            observation,
            observedAt,
            fixedRef,
            expectedRecoveryRef,
          );
          recoveryLock = acquireLessonLock(parts);
          testHooks?.beforeLessonCommit?.({ fixedRef, target: lessonPath(parts.root, parts.project, parts.stage), staged: recovery });
          commitStagedLessons(recovery, lessonPath(parts.root, parts.project, parts.stage), recoveryLock);
          testHooks?.afterLessonCommit?.({ fixedRef, target: lessonPath(parts.root, parts.project, parts.stage), staged: recovery });
          return reflectionResult({
            status: "recovered",
            publication: {
              ref: fixedRef,
              sha256: hash(existingRaw),
              status: "idempotent",
              idempotent: true,
            },
            lesson: recovery.lesson,
            validation: { ...validation, reflection: existing },
            reflection: existing,
          });
        } catch (error) {
          if (recovery && recoveryLock) {
            const recoveryTarget = lessonPath(parts.root, parts.project, parts.stage);
            let committedRaw;
            try {
              committedRaw = snapshotLesson(recoveryTarget);
            } catch (rollbackReadError) {
              error = new AggregateError([error, rollbackReadError], `${error.message}; ${rollbackReadError.message}`);
            }
            if (committedRaw === recovery.raw) {
              try {
                restoreLessonIfUnchanged(recoveryTarget, committedRaw, recovery.priorLessons, recoveryLock);
              } catch (rollbackError) {
                error = new AggregateError([error, rollbackError], `${error.message}; ${rollbackError.message}`);
              }
            }
          }
          const failure = publishReflectionFailure(parts, {
            failureKind: "lesson_merge",
            error,
            reflectionSha256: hash(existingRaw),
            lessonRef: recovery?.lessonRef ?? existingLessons[0] ?? null,
            now: observedAt,
          });
          return reflectionResult({
            status: "degraded",
            publication: {
              ref: fixedRef,
              sha256: hash(existingRaw),
              status: "idempotent",
              idempotent: true,
            },
            lesson: { status: "failed", error: error.message },
            validation: { ...validation, reflection: existing },
            reflection: existing,
            failure,
          });
        } finally {
          recoveryLock?.release();
          if (recovery) rmSync(recovery.root, { recursive: true, force: true });
        }
      }
      return reflectionResult({
        publication: {
          ref: fixedRef,
          sha256: hash(existingRaw),
          status: "idempotent",
          idempotent: true,
        },
        lesson: { status: "already_merged" },
        validation: { ...validation, reflection: existing },
        reflection: existing,
      });
    }
    const conflict = new Error(`stage reflection ${fixedRef} already exists with different bytes`);
    conflict.code = "EEXIST";
    throw conflict;
  }

  let staged;
  try {
    staged = stageLessons(parts, validated, observation, observedAt, fixedRef);
  } catch (error) {
    const failure = publishReflectionFailure(parts, {
      failureKind: "lesson_merge",
      error,
      now: observedAt,
    });
    // A merge failure is still a truthful durable reflection result. The
    // degraded record is published without touching the real lesson index.
    const degraded = degradedValue(validated);
    const publication = publishImmutable({
      task: parts.task,
      kernel: parts.kernel,
      ref: fixedRef,
      raw: canonicalJson(degraded),
    });
    return reflectionResult({
      status: "degraded",
      publication,
      lesson: { status: "failed", error: error.message },
      validation: { ...validation, reflection: degraded },
      reflection: degraded,
      failure,
    });
  }

  const publishedValue = {
    ...validated,
    lessons_added: staged.lessonRef
      ? [...new Set([...(validated.lessons_added ?? []), staged.lessonRef])]
      : [...(validated.lessons_added ?? [])],
  };
  const publishedRaw = canonicalJson(publishedValue);
  let publication;
  let publicationAttempted = false;
  let lessonLock;
  const target = lessonPath(parts.root, parts.project, parts.stage);
  try {
    // Commit is the last mutable lesson operation before the immutable
    // judgment. If publication fails, compare-and-swap rollback removes the
    // staged lesson without clobbering a concurrent writer.
    lessonLock = acquireLessonLock(parts);
    testHooks?.beforeLessonCommit?.({ fixedRef, target, staged });
    commitStagedLessons(staged, target, lessonLock);
    testHooks?.afterLessonCommit?.({ fixedRef, target, staged });
    testHooks?.beforeReflectionPublish?.({ fixedRef, target, staged });
    publicationAttempted = true;
    publication = publishImmutable({ task: parts.task, kernel: parts.kernel, ref: fixedRef, raw: publishedRaw });
    return reflectionResult({
      publication,
      lesson: staged.lesson,
      validation: { ...validation, reflection: publishedValue },
      reflection: publishedValue,
    });
  } catch (error) {
    const committedRaw = snapshotLesson(target);
    if (committedRaw === staged.raw) {
      try {
        restoreLessonIfUnchanged(target, committedRaw, staged.priorLessons, lessonLock);
      } catch (rollbackError) {
        error = new AggregateError([error, rollbackError], `${error.message}; ${rollbackError.message}`);
      }
    }
    const failure = publishReflectionFailure(parts, {
      failureKind: publicationAttempted ? "publication" : "lesson_merge",
      error,
      reflectionSha256: hash(publishedRaw),
      lessonRef: staged.lessonRef,
      now: observedAt,
    });
    if (publicationAttempted) {
      throw error;
    }
    const degraded = degradedValue(validated);
    const degradedPublication = publishImmutable({
      task: parts.task,
      kernel: parts.kernel,
      ref: fixedRef,
      raw: canonicalJson(degraded),
    });
    return reflectionResult({
      status: "degraded",
      publication: degradedPublication,
      lesson: { status: "failed", error: error.message },
      validation: { ...validation, reflection: degraded },
      reflection: degraded,
      failure,
    });
  } finally {
    lessonLock?.release();
    if (staged) rmSync(staged.root, { recursive: true, force: true });
  }
}

export const reflect = runStageReflection;
