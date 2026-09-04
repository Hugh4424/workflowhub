#!/usr/bin/env node

/**
 * Private host boundary for the current WorkflowHub session.
 *
 * The current session host submits lifecycle events on stdin. This bridge
 * measures and binds those events to the existing TaskKernel adapter, then
 * prints the immutable outcome reference. The bridge accepts only the narrow
 * session/unavailable handoff; legacy execution input is historical-only. This bridge never starts an agent, resolves a
 * skill, scans sessions, or guesses a source.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import {
  createWorkflowHubSessionRecorder,
  publishUnavailableStageAgentOutcome,
} from "../../runtime/stage/stage-agent-outcome-adapter.mjs";
import { bootstrapStage, prepareMakeDecisionWorkspace } from "../../runtime/stage/stage-context.mjs";

const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function readInput() {
  const raw = readFileSync(0, "utf8");
  if (!raw.trim()) throw new Error("WorkflowHub host bridge requires a JSON request on stdin");
  const value = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("WorkflowHub host bridge request must be an object");
  return value;
}

function requiredText(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be non-empty`);
  return value;
}

function requiredTimestamp(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${label} must be a non-negative integer`);
  return value;
}

function compareLifecycleEvents(a, b) {
  return (a.started_at_ms - b.started_at_ms)
    || (b.ended_at_ms - a.ended_at_ms)
    || String(a.subject_kind).localeCompare(String(b.subject_kind))
    || String(a.subject_id).localeCompare(String(b.subject_id))
    || (a.index - b.index);
}

function intervalsOverlap(a, b) {
  return a.started_at_ms < b.ended_at_ms && b.started_at_ms < a.ended_at_ms;
}

function intervalContains(a, b) {
  return (a.started_at_ms <= b.started_at_ms && b.ended_at_ms <= a.ended_at_ms)
    || (b.started_at_ms <= a.started_at_ms && a.ended_at_ms <= b.ended_at_ms);
}

function assertLifecycleOrdering(events) {
  const normalized = events.map((event, index) => {
    if (!event || typeof event !== "object" || Array.isArray(event)) throw new TypeError(`session.events[${index}] must be an object`);
    const startedAt = requiredTimestamp(event.started_at_ms, `session.events[${index}].started_at_ms`);
    const endedAt = requiredTimestamp(event.ended_at_ms, `session.events[${index}].ended_at_ms`);
    if (endedAt < startedAt) throw new Error(`BRIDGE_TIME_INVALID: session.events[${index}] ended before it started`);
    return Object.freeze({ event, index, started_at_ms: startedAt, ended_at_ms: endedAt, subject_kind: event.subject_kind, subject_id: event.subject_id });
  }).sort(compareLifecycleEvents);

  for (let index = 0; index < normalized.length; index += 1) {
    const current = normalized[index];
    for (const previous of normalized.slice(0, index)) {
      if (!intervalsOverlap(previous, current)) continue;
      // A step and the skill it invokes are legitimately nested in the same
      // host session. Same-kind overlap or a partial cross-kind overlap is
      // still malformed and must fail before any writer runs.
      const nested = intervalContains(previous, current);
      const crossKind = previous.subject_kind !== current.subject_kind;
      if (!nested || !crossKind) {
        throw new Error(`BRIDGE_TIME_INVALID: session.events[${current.index}] overlaps or moves the lifecycle clock backward`);
      }
    }
  }
  return normalized;
}

function normalizeBridgeError(error) {
  if (error && typeof error.code === "string" && error.code.startsWith("BRIDGE_")) return error;
  const message = String(error?.message ?? error);
  const code = /overlap|ended before|clock backward|timestamp|time/i.test(message)
    ? "BRIDGE_TIME_INVALID"
    : /task|stage|snapshot|material|identity|workspace/i.test(message)
      ? "BRIDGE_IDENTITY_MISMATCH"
      : "BRIDGE_INVALID_INPUT";
  const normalized = new Error(message);
  normalized.code = code;
  normalized.cause = error;
  return normalized;
}

function rejectStaleVerifyCodeReview({ context, stage, session }) {
  if (stage !== "verify-code" || !session.code_review || typeof session.code_review !== "object") return;
  const review = session.code_review;
  const currentSnapshotTree = context.kernel.currentVNextSnapshot().tree;
  const currentMaterialRevision = context.kernel.currentVNextMaterialRevision();
  const reject = (reason) => {
    const error = new Error(`BRIDGE_STALE_STAGE_OUTCOME: ${reason}`);
    error.code = "BRIDGE_STALE_STAGE_OUTCOME";
    throw error;
  };
  if (review.stage !== undefined && review.stage !== stage) {
    reject("session code_review stage does not match verify-code");
  }
  if (review.task_id !== undefined && review.task_id !== context.task.identity.taskId) {
    reject("session code_review task does not match the current task");
  }
  if (review.snapshot_tree !== currentSnapshotTree) {
    reject("session code_review snapshot_tree does not match the current stage snapshot");
  }
  if (review.material_revision !== currentMaterialRevision) {
    reject("session code_review material_revision does not match current stage materials");
  }
  if (review.quality_review_ref === undefined) return;
  let raw;
  try { raw = context.task.readRecord(review.quality_review_ref); }
  catch { reject("session code_review quality review record is unavailable"); }
  if (sha256(raw) !== review.quality_review_hash) {
    reject("session code_review quality review hash does not match its record");
  }
  let result;
  try { result = JSON.parse(raw); }
  catch { reject("session code_review quality review record is not JSON"); }
  if (result?.version !== "wh-review-result.v1"
      || result?.task_id !== context.task.identity.taskId
      || result?.stage !== stage
      || result?.subject_kind !== "worktree"
      || result?.phase_id !== null
      || result?.review_scope !== null) {
    reject("session code_review quality review identity does not match the current task and stage");
  }
  if (result?.snapshot_tree !== review.snapshot_tree) {
    reject("session code_review quality review snapshot_tree does not match the session review");
  }
  if (result?.material_revision !== currentMaterialRevision) {
    reject("session code_review quality review material_revision does not match current stage materials");
  }
}

function publishCurrentWorkflowHubSessionImpl({ context, input, stage, attemptId, requirementAuthentication = null }) {
  const session = input.session;
  if (!session || typeof session !== "object" || Array.isArray(session)) throw new TypeError("session must be an object");
  if (!Array.isArray(session.events)) throw new TypeError("session.events must be an array");
  if (requiredText(session.task_id, "session.task_id") !== context.task.identity.taskId) throw new Error("session.task_id does not match the current WorkflowHub task");
  rejectStaleVerifyCodeReview({ context, stage, session });
  let clock = 0;
  const recorder = createWorkflowHubSessionRecorder({
    task: context.task,
    kernel: context.kernel,
    artifacts: context.artifacts,
    workspace: context.workspace,
    candidateWorkspace: context.candidateWorkspace,
    stage,
    attemptId,
    workflowRunId: context.workflowRunId,
    host: requiredText(session.host, "session.host"),
    sourceId: requiredText(session.source_id, "session.source_id"),
    sourceFamily: requiredText(session.source_family, "session.source_family"),
    sessionId: requiredText(session.session_id, "session.session_id"),
    sourceRef: requiredText(session.source_ref, "session.source_ref"),
    now: () => clock,
    requirementAuthentication,
  });
  const orderedEvents = assertLifecycleOrdering(session.events);
  for (const { event, index, started_at_ms: startedAt, ended_at_ms: endedAt } of orderedEvents) {
    if (!event || typeof event !== "object" || Array.isArray(event)) throw new TypeError(`session.events[${index}] must be an object`);
    const subjectKind = requiredText(event.subject_kind, `session.events[${index}].subject_kind`);
    const subjectId = requiredText(event.subject_id, `session.events[${index}].subject_id`);
    if (requiredText(event.task_id, `session.events[${index}].task_id`) !== context.task.identity.taskId) throw new Error(`session.events[${index}] task_id does not match the current WorkflowHub task`);
    if (requiredText(event.stage, `session.events[${index}].stage`) !== stage) throw new Error(`session.events[${index}] stage does not match the current stage`);
    clock = startedAt;
    const finish = subjectKind === "step" ? recorder.startStep(subjectId) : subjectKind === "skill" ? recorder.startSkill(subjectId) : null;
    if (!finish) throw new Error(`unsupported session subject_kind: ${subjectKind}`);
    clock = endedAt;
    finish(event);
  }
  return recorder.finish({
    status: session.status,
    ...(stage === "verify-code" ? { code_review: session.code_review } : { spec_analyze: session.spec_analyze }),
  });
}

export function publishCurrentWorkflowHubSession(args) {
  try { return publishCurrentWorkflowHubSessionImpl(args); }
  catch (error) { throw normalizeBridgeError(error); }
}

async function runBridge(input) {
  const projectName = requiredText(input.project_name, "project_name");
  const taskId = requiredText(input.task_id, "task_id");
  const stage = requiredText(input.stage, "stage");
  if (!STAGES.has(stage)) throw new Error(`unsupported stage: ${stage}`);
  const taskPath = requiredText(input.task_path, "task_path");
  const attemptId = requiredText(input.attempt_id, "attempt_id");
  const hasExecution = input.execution !== undefined;
  const hasSession = input.session && typeof input.session === "object" && !Array.isArray(input.session);
  const hasUnavailable = input.unavailable && typeof input.unavailable === "object" && !Array.isArray(input.unavailable);
  if (hasExecution) throw new TypeError("bridge accepts only the narrow session or unavailable outcome; execution is historical-only");
  if ([hasSession, hasUnavailable].filter(Boolean).length !== 1) throw new TypeError("session or unavailable host result is required exactly once");
  if (Object.hasOwn(input, "receipts")) throw new TypeError("bridge accepts no quality receipts; stage-runtime owns current quality publication");

  let context = bootstrapStage(stage, {
    mode: "sidecar",
    projectName,
    taskId,
    taskPath,
    readOnly: false,
  });
  if (context.task.identity.taskId !== taskId) {
    throw new Error("bridge task_id does not match the task loaded from task_path");
  }
  if (stage === "make-decision" && !context.candidateWorkspace) {
    context = prepareMakeDecisionWorkspace(context);
  }
  const outcome = hasSession
    ? publishCurrentWorkflowHubSession({ context, input, stage, attemptId })
    : publishUnavailableStageAgentOutcome({
        task: context.task,
        kernel: context.kernel,
        artifacts: context.artifacts,
        workspace: context.workspace,
        candidateWorkspace: context.candidateWorkspace,
        stage,
        attemptId,
        workflowRunId: context.workflowRunId,
        host: requiredText(input.unavailable.host, "unavailable.host"),
        sourceId: requiredText(input.unavailable.source_id, "unavailable.source_id"),
        sourceFamily: requiredText(input.unavailable.source_family, "unavailable.source_family"),
        agentRunId: requiredText(input.unavailable.agent_run_id, "unavailable.agent_run_id"),
        reason: requiredText(input.unavailable.reason, "unavailable.reason"),
      });
  return Object.freeze({
    schema_version: "workflowhub-stage-agent-bridge-result.v1",
    task_id: context.task.identity.taskId,
    stage,
    attempt_id: attemptId,
    outcome_ref: outcome.ref,
    outcome_sha256: outcome.sha256,
    outcome_status: outcome.value.status,
    producer: outcome.value.producer,
  });
}

export async function main(input) {
  try { return await runBridge(input); }
  catch (error) { throw normalizeBridgeError(error); }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main(readInput())
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => {
      process.stderr.write(`${error?.stack ?? error}\n`);
      process.exitCode = 1;
    });
}
