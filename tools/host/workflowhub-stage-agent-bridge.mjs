#!/usr/bin/env node

/**
 * Private host boundary for one explicit WorkflowHub Stage Agent run.
 *
 * The current session host submits lifecycle events on stdin. This bridge
 * measures and binds those events to the existing TaskKernel adapter, then
 * prints the immutable outcome reference. The bridge accepts only the narrow
 * session/unavailable handoff; legacy execution input is historical-only. The
 * run identity is explicit and never inferred from host session state. This
 * bridge never starts an agent, resolves a skill, scans sessions, or guesses a
 * source.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import {
  createWorkflowHubSessionRecorder,
  publishUnavailableStageAgentOutcome,
  validateWorkerSummary,
} from "../../runtime/stage/stage-agent-outcome-adapter.mjs";
import { bootstrapStage, prepareMakeDecisionWorkspace } from "../../runtime/stage/stage-context.mjs";
import { authenticateCodeReviewRepairs } from "../../runtime/evidence/freshness.mjs";
import { verifyWorkerBrief } from "../../runtime/task/material-workspace.mjs";
import { buildHostRequirementAuthentication } from "../../runtime/evidence/host-session-transcript.mjs";
import { SHA256_HEX } from "../../runtime/evidence/canonical-utils.mjs";

const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const REQUIREMENT_SOURCE_KINDS = new Set(["host-session"]);

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

const COORDINATION_EVENT_TYPES = new Set(["dispatch", "terminal"]);
const COORDINATION_ROLES = new Set(["main-session", "stage-coordinator", "worker"]);
const MAIN_SESSION_HEAVY_OPERATIONS = new Set(["repository_scan", "test", "review_provider", "provider_review", "full_history_read"]);
const COORDINATION_EVENT_KEYS = new Set([
  "event_type", "worker_id", "producer_role", "operation", "read_only", "task_id", "stage", "usage_ref",
  "brief_ref", "brief_hash", "summary_ref", "summary_hash",
]);
const COORDINATION_USAGE_KEYS = new Set([
  "task_id", "session_id", "root_input_tokens", "worker_input_tokens", "event_type", "producer_role", "timestamp",
]);

function coordinationUnavailable(...errors) {
  return Object.freeze({ ok: false, status: "unavailable", errors: Object.freeze(errors) });
}

function safeTokenCount(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

function safeCoordinationRef(value) {
  return typeof value === "string" && value.trim() !== "" && !value.startsWith("/")
    && !value.includes("\\") && !value.split("/").some((part) => part === "" || part === "." || part === "..");
}

function coordinationUsageError(event, index, { taskId, sessionId }) {
  const usage = event.usage_ref;
  if (!usage || typeof usage !== "object" || Array.isArray(usage)) return `COORDINATION_USAGE_UNAVAILABLE:${index}:usage_ref`;
  const unknown = Object.keys(usage).filter((key) => !COORDINATION_USAGE_KEYS.has(key));
  if (unknown.length) return `COORDINATION_USAGE_INVALID:${index}:${unknown.join(",")}`;
  const required = ["task_id", "session_id", "event_type", "producer_role", "timestamp"];
  if (required.some((key) => typeof usage[key] !== "string" || usage[key].trim() === "")) return `COORDINATION_USAGE_UNAVAILABLE:${index}:identity`;
  if (usage.task_id !== taskId || usage.session_id !== sessionId) return `COORDINATION_USAGE_IDENTITY_MISMATCH:${index}`;
  if (!safeTokenCount(usage.root_input_tokens) || !safeTokenCount(usage.worker_input_tokens)) return `COORDINATION_USAGE_UNAVAILABLE:${index}:tokens`;
  if (usage.event_type !== event.event_type || usage.producer_role !== event.producer_role || Number.isNaN(Date.parse(usage.timestamp))) {
    return `COORDINATION_USAGE_INVALID:${index}:binding`;
  }
  return null;
}

/** Validate bounded host lifecycle facts without inferring history or concurrency. */
export function validateHostCoordinationEvents(events, {
  taskId,
  sessionId,
  stage = null,
  materialRevision = null,
  snapshotTree = null,
  briefs,
  summaries,
  read,
  maxWorkers = 6,
  maxReadConcurrency = 3,
} = {}) {
  if (!Array.isArray(events)) return coordinationUnavailable("COORDINATION_EVENTS_INVALID");
  if (typeof taskId !== "string" || taskId.trim() === "" || typeof sessionId !== "string" || sessionId.trim() === "") {
    return coordinationUnavailable("COORDINATION_IDENTITY_UNAVAILABLE");
  }
  const errors = [];
  const currentMaterialRevision = typeof materialRevision === "string" && /^revision-[a-f0-9]{64}$/.test(materialRevision)
    ? materialRevision.slice("revision-".length)
    : materialRevision;
  if (typeof currentMaterialRevision !== "string" || !SHA256_HEX.test(currentMaterialRevision)
      || typeof snapshotTree !== "string" || snapshotTree.trim() === "") {
    errors.push("COORDINATION_CURRENT_IDENTITY_UNAVAILABLE");
  }
  if (!Array.isArray(briefs)) errors.push("COORDINATION_BRIEFS_INVALID");
  if (!Array.isArray(summaries)) errors.push("COORDINATION_SUMMARIES_INVALID");
  if (Array.isArray(briefs) && Array.isArray(summaries) && briefs.length !== summaries.length) {
    errors.push("COORDINATION_BINDING_COUNT_MISMATCH");
  }
  const briefByHash = new Map();
  for (const [index, brief] of (Array.isArray(briefs) ? briefs : []).entries()) {
    if (brief?.task_id !== taskId || (stage !== null && brief?.stage !== stage)) {
      errors.push(`COORDINATION_BRIEF_IDENTITY_MISMATCH:${index}`);
    }
    if (brief?.material_revision !== currentMaterialRevision) errors.push(`COORDINATION_BRIEF_STALE:${index}:material_revision`);
    if (brief?.snapshot_tree !== snapshotTree) errors.push(`COORDINATION_BRIEF_STALE:${index}:snapshot_tree`);
    const checked = verifyWorkerBrief(brief);
    if (!checked.ok) {
      errors.push(`COORDINATION_BRIEF_INVALID:${index}:${checked.errors.join(",")}`);
      continue;
    }
    if (briefByHash.has(checked.brief_hash)) errors.push(`COORDINATION_BRIEF_DUPLICATE:${index}:${checked.brief_hash}`);
    briefByHash.set(checked.brief_hash, { brief, index });
  }
  const summaryByRef = new Map();
  const summaryHashes = new Set();
  for (const [index, summary] of (Array.isArray(summaries) ? summaries : []).entries()) {
    const checked = validateWorkerSummary(summary, { read });
    if (!checked.ok) {
      errors.push(`COORDINATION_SUMMARY_INVALID:${index}:${checked.errors.join(",")}`);
      continue;
    }
    if (summaryByRef.has(checked.ref)) errors.push(`COORDINATION_SUMMARY_DUPLICATE:${index}:${checked.ref}`);
    if (summaryHashes.has(checked.sha256)) errors.push(`COORDINATION_SUMMARY_HASH_DUPLICATE:${index}:${checked.sha256}`);
    summaryByRef.set(checked.ref, summary);
    summaryHashes.add(checked.sha256);
  }
  const active = new Set();
  const readActive = new Set();
  const workers = new Set();
  const workerBindings = new Map();
  const usedBriefRefs = new Set();
  const usedBriefHashes = new Set();
  const usedSummaryRefs = new Set();
  const usedSummaryHashes = new Set();
  const normalized = [];
  let maxConcurrent = 0;
  let maxRead = 0;
  for (const [index, event] of events.entries()) {
    if (!event || typeof event !== "object" || Array.isArray(event)) {
      errors.push(`COORDINATION_EVENT_INVALID:${index}:shape`);
      continue;
    }
    const unknown = Object.keys(event).filter((key) => !COORDINATION_EVENT_KEYS.has(key));
    if (unknown.length) errors.push(`COORDINATION_EVENT_UNKNOWN_FIELD:${index}:${unknown.join(",")}`);
    if (!COORDINATION_EVENT_TYPES.has(event.event_type)) errors.push(`COORDINATION_EVENT_INVALID:${index}:event_type`);
    for (const key of ["worker_id", "producer_role", "operation", "task_id", "stage"]) {
      if (typeof event[key] !== "string" || event[key].trim() === "") errors.push(`COORDINATION_EVENT_INVALID:${index}:${key}`);
    }
    if (!COORDINATION_ROLES.has(event.producer_role)) errors.push(`COORDINATION_PRODUCER_ROLE_INVALID:${index}`);
    if (event.task_id !== taskId) errors.push(`COORDINATION_IDENTITY_MISMATCH:${index}:task_id`);
    if (stage !== null && event.stage !== stage) errors.push(`COORDINATION_IDENTITY_MISMATCH:${index}:stage`);
    if (typeof event.read_only !== "boolean") errors.push(`COORDINATION_EVENT_INVALID:${index}:read_only`);
    const usageError = coordinationUsageError(event, index, { taskId, sessionId });
    if (usageError) errors.push(usageError);
    if (event.event_type === "status_poll" || event.event_type === "sleep_poll"
        || /(?:^|_)(?:poll|sleep)(?:$|_)/i.test(event.operation ?? "")) {
      errors.push(`POLLING_NOT_ALLOWED:${index}`);
    }
    if (event.producer_role === "main-session" && MAIN_SESSION_HEAVY_OPERATIONS.has(event.operation)) {
      errors.push(`ROLE_BOUNDARY_VIOLATION:${index}:main-session:${event.operation}`);
    }
    if (event.event_type === "dispatch") {
      if (!safeCoordinationRef(event.brief_ref)) errors.push(`COORDINATION_BRIEF_REF_MISSING:${index}`);
      if (!briefByHash.has(event.brief_hash)) errors.push(`COORDINATION_BRIEF_HASH_MISMATCH:${index}`);
      if (usedBriefRefs.has(event.brief_ref)) errors.push(`COORDINATION_BRIEF_REF_DUPLICATE:${index}:${event.brief_ref}`);
      if (usedBriefHashes.has(event.brief_hash)) errors.push(`COORDINATION_BRIEF_HASH_DUPLICATE:${index}:${event.brief_hash}`);
      if (event.summary_ref !== undefined || event.summary_hash !== undefined) errors.push(`COORDINATION_DISPATCH_SUMMARY_FORBIDDEN:${index}`);
      if (workers.has(event.worker_id)) errors.push(`WORKER_DUPLICATE:${index}:${event.worker_id}`);
      workers.add(event.worker_id);
      if (workers.size > maxWorkers) errors.push(`WORKER_LIMIT_EXCEEDED:${index}:${workers.size}`);
      active.add(event.worker_id);
      if (event.read_only === true) readActive.add(event.worker_id);
      workerBindings.set(event.worker_id, {
        brief_ref: event.brief_ref,
        brief_hash: event.brief_hash,
        brief_index: briefByHash.get(event.brief_hash)?.index,
      });
      if (safeCoordinationRef(event.brief_ref)) usedBriefRefs.add(event.brief_ref);
      if (briefByHash.has(event.brief_hash)) usedBriefHashes.add(event.brief_hash);
    } else if (event.event_type === "terminal") {
      if (!safeCoordinationRef(event.brief_ref)) errors.push(`COORDINATION_BRIEF_REF_MISSING:${index}`);
      if (!briefByHash.has(event.brief_hash)) errors.push(`COORDINATION_BRIEF_HASH_MISMATCH:${index}`);
      if (!safeCoordinationRef(event.summary_ref)) errors.push(`COORDINATION_SUMMARY_REF_MISSING:${index}`);
      const summary = summaryByRef.get(event.summary_ref);
      if (!summary || summary.sha256 !== event.summary_hash) errors.push(`COORDINATION_SUMMARY_HASH_MISMATCH:${index}`);
      const dispatchBinding = workerBindings.get(event.worker_id);
      if (!dispatchBinding || dispatchBinding.brief_ref !== event.brief_ref || dispatchBinding.brief_hash !== event.brief_hash) {
        errors.push(`COORDINATION_WORKER_BINDING_MISMATCH:${index}:${event.worker_id}`);
      }
      const expectedSummary = Number.isSafeInteger(dispatchBinding?.brief_index)
        ? summaries[dispatchBinding.brief_index]
        : null;
      if (!expectedSummary || expectedSummary.ref !== event.summary_ref || expectedSummary.sha256 !== event.summary_hash) {
        errors.push(`COORDINATION_WORKER_SUMMARY_MISMATCH:${index}:${event.worker_id}`);
      }
      if (usedSummaryRefs.has(event.summary_ref)) errors.push(`COORDINATION_SUMMARY_REF_DUPLICATE:${index}:${event.summary_ref}`);
      if (usedSummaryHashes.has(event.summary_hash)) errors.push(`COORDINATION_SUMMARY_HASH_DUPLICATE:${index}:${event.summary_hash}`);
      if (!active.has(event.worker_id)) errors.push(`WORKER_TERMINAL_WITHOUT_DISPATCH:${index}:${event.worker_id}`);
      active.delete(event.worker_id);
      readActive.delete(event.worker_id);
      if (safeCoordinationRef(event.summary_ref)) usedSummaryRefs.add(event.summary_ref);
      if (summary && summary.sha256 === event.summary_hash) usedSummaryHashes.add(event.summary_hash);
    }
    maxConcurrent = Math.max(maxConcurrent, active.size);
    maxRead = Math.max(maxRead, readActive.size);
    if (maxConcurrent > maxWorkers) errors.push(`WORKER_CONCURRENCY_LIMIT:${index}:${maxConcurrent}`);
    if (maxRead > maxReadConcurrency) errors.push(`WORKER_READ_CONCURRENCY_LIMIT:${index}:${maxRead}`);
    normalized.push(Object.freeze({ ...event, usage_ref: event.usage_ref && Object.freeze({ ...event.usage_ref }) }));
  }
  if (active.size > 0) errors.push(`WORKER_TERMINAL_MISSING:${[...active].join(",")}`);
  for (const hash of briefByHash.keys()) {
    if (!usedBriefHashes.has(hash)) errors.push(`COORDINATION_BRIEF_ORPHAN:${hash}`);
  }
  for (const ref of summaryByRef.keys()) {
    if (!usedSummaryRefs.has(ref)) errors.push(`COORDINATION_SUMMARY_ORPHAN:${ref}`);
  }
  if (errors.length) return coordinationUnavailable(...errors);
  return Object.freeze({ ok: true, status: "recorded", task_id: taskId, session_id: sessionId, worker_count: workers.size, max_concurrent: maxConcurrent, read_concurrency: maxRead, events: Object.freeze(normalized) });
}

export function assertHostCoordinationEvents(events, options = {}) {
  const result = validateHostCoordinationEvents(events, options);
  if (!result.ok) {
    const code = String(result.errors[0] ?? "COORDINATION_INVALID").split(":")[0];
    const error = new Error(`${code}: ${result.errors.join("; ")}`);
    error.code = code;
    throw error;
  }
  return result;
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
    const hasStarted = event.started_at_ms !== undefined && event.started_at_ms !== null;
    const hasEnded = event.ended_at_ms !== undefined && event.ended_at_ms !== null;
    if (hasStarted !== hasEnded) throw new Error(`BRIDGE_TIME_INVALID: session.events[${index}] must provide both timestamps or neither`);
    const startedAt = hasStarted ? requiredTimestamp(event.started_at_ms, `session.events[${index}].started_at_ms`) : null;
    const endedAt = hasEnded ? requiredTimestamp(event.ended_at_ms, `session.events[${index}].ended_at_ms`) : null;
    if (startedAt !== null && endedAt < startedAt) throw new Error(`BRIDGE_TIME_INVALID: session.events[${index}] ended before it started`);
    return Object.freeze({ event, index, started_at_ms: startedAt, ended_at_ms: endedAt, subject_kind: event.subject_kind, subject_id: event.subject_id });
  });

  // Host events without timing are still real ordered events. Preserve the
  // explicit submission order and do not infer concurrency or duration. Timed
  // events are still checked against one another, even when untimed events
  // are interleaved; only a fully timed set may be reordered for recording.
  const timed = normalized.filter(({ started_at_ms, ended_at_ms }) => started_at_ms !== null && ended_at_ms !== null);
  const orderedTimed = [...timed].sort(compareLifecycleEvents);

  for (let index = 0; index < orderedTimed.length; index += 1) {
    const current = orderedTimed[index];
    for (const previous of orderedTimed.slice(0, index)) {
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
  return timed.length === normalized.length ? orderedTimed : normalized;
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
  const attemptRef = /^quality\/reviews\/attempts\/[A-Za-z0-9][A-Za-z0-9._-]*\/attempt\.json$/.test(review.quality_review_ref);
  if (attemptRef && result?.version === "wh-review-attempt.v1") {
    const mismatches = [
      review.result?.status !== "unavailable" ? "session code_review result is not unavailable" : null,
      result.task_id !== context.task.identity.taskId ? "quality review task mismatch" : null,
      result.stage !== stage ? "quality review stage mismatch" : null,
      result.snapshot_tree !== currentSnapshotTree ? "quality review snapshot_tree mismatch" : null,
      result.material_revision !== currentMaterialRevision ? "quality review material_revision mismatch" : null,
      result.terminal_status !== "unavailable" ? "quality review terminal status is not unavailable" : null,
    ].filter(Boolean);
    if (mismatches.length) reject(mismatches.join(", "));
    return;
  }
  if (result?.version !== "wh-review-result.v1"
      || result?.task_id !== context.task.identity.taskId
      || result?.stage !== stage
      || result?.subject_kind !== "worktree"
      || result?.phase_id !== null
      || result?.review_scope !== null) {
    reject("session code_review quality review identity does not match the current task and stage");
  }
  let resolution;
  try {
    resolution = authenticateCodeReviewRepairs({ review: result, result: review.result,
      taskId: context.task.identity.taskId, snapshotTree: currentSnapshotTree, materialRevision: currentMaterialRevision,
      workspaceRoot: context.candidateWorkspace?.worktreeRoot ?? context.workspace?.worktreeRoot,
      read: context.task.readRecord,
    });
  } catch (error) { reject(error.message); }
  if (result?.snapshot_tree !== review.snapshot_tree && resolution !== "resolved") {
    reject("session code_review quality review snapshot_tree does not match the session review");
  }
  if (result?.material_revision !== currentMaterialRevision) {
    reject("session code_review quality review material_revision does not match current stage materials");
  }
}

function publishCurrentWorkflowHubSessionImpl({ context, input, stage, attemptId, requirementAuthentication = null }) {
  const session = input.session;
  if (!session || typeof session !== "object" || Array.isArray(session)) throw new TypeError("session must be an object");
  const agentRunId = requiredText(input.agent_run_id, "agent_run_id");
  if (!Array.isArray(session.events)) throw new TypeError("session.events must be an array");
  if (requiredText(session.task_id, "session.task_id") !== context.task.identity.taskId) throw new Error("session.task_id does not match the current WorkflowHub task");
  rejectStaleVerifyCodeReview({ context, stage, session });
  let coordination = null;
  if (session.coordination !== undefined) {
    if (!session.coordination || typeof session.coordination !== "object" || Array.isArray(session.coordination)) {
      throw new Error("BRIDGE_COORDINATION_INVALID: session.coordination must be an object");
    }
    const briefs = session.coordination.briefs;
    const summaries = session.coordination.summaries;
    const events = assertHostCoordinationEvents(session.coordination.events, {
      taskId: context.task.identity.taskId,
      sessionId: requiredText(session.session_id, "session.session_id"),
      stage,
      materialRevision: context.kernel.currentVNextMaterialRevision(),
      snapshotTree: context.kernel.currentVNextSnapshot().tree,
      briefs,
      summaries,
      read: context.task.readRecord,
    });
    coordination = { ...events, briefs, summaries };
  }
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
    agentRunId,
    ...(Object.hasOwn(session, "session_id") ? { sessionId: requiredText(session.session_id, "session.session_id") } : {}),
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
    if (startedAt !== null) clock = startedAt;
    const finish = subjectKind === "step" ? recorder.startStep(subjectId) : subjectKind === "skill" ? recorder.startSkill(subjectId) : null;
    if (!finish) throw new Error(`unsupported session subject_kind: ${subjectKind}`);
    if (endedAt !== null) clock = endedAt;
    finish(event);
  }
  return recorder.finish({
    status: session.status,
    ...(coordination === null ? {} : { coordination }),
    ...(stage === "verify-code" ? { code_review: session.code_review } : { spec_analyze: session.spec_analyze }),
  });
}

export function publishCurrentWorkflowHubSession(args) {
  try { return publishCurrentWorkflowHubSessionImpl(args); }
  catch (error) { throw normalizeBridgeError(error); }
}

/**
 * Optional host-authenticated requirement projection.
 *
 * The bridge stays host-agnostic: it accepts an explicit, opt-in transcript
 * descriptor and delegates the whole host-session contract to the evidence
 * module. Without the descriptor nothing changes. When the projection cannot
 * be produced the result is `null`, so the missing fact stays visible instead
 * of being replaced by caller-supplied content.
 */
function buildRequirementAuthentication({ descriptor, context, stage, sessionId, sourceId, sourceRef }) {
  const kind = requiredText(descriptor?.kind, "session.source.kind");
  if (!REQUIREMENT_SOURCE_KINDS.has(kind)) throw new Error(`session.source.kind is unsupported: ${kind}`);
  const unknown = Object.keys(descriptor ?? {}).filter((key) => !new Set(["kind", "transcript_path"]).has(key));
  if (unknown.length) throw new Error(`session.source contains unsupported fields: ${unknown.join(", ")}`);
  // Presence is the opt-in boundary: an explicitly empty path means this
  // descriptor selected no source and must not silently borrow ambient env.
  // Only an omitted field may use the explicitly configured process fallback.
  const transcriptPath = Object.hasOwn(descriptor, "transcript_path")
    ? descriptor.transcript_path
    : process.env.WORKFLOWHUB_HOST_TRANSCRIPT;
  return buildHostRequirementAuthentication({
    transcriptPath,
    taskId: context.task.identity.taskId,
    runId: typeof context.workflowRunId === "string" && context.workflowRunId.trim() !== ""
      ? context.workflowRunId
      : `host-run-${sessionId}`,
    stage,
    sessionId,
    sourceId: requiredText(sourceId, "session.source_id"),
    sourceRef: requiredText(sourceRef, "session.source_ref"),
  });
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
  if ([hasSession, hasUnavailable].filter(Boolean).length !== 1) {
    const error = new Error("Stage Agent result missing or duplicated: submit exactly one session or unavailable host result; session or unavailable exactly once");
    error.code = "BRIDGE_STAGE_AGENT_RESULT_MISSING";
    throw error;
  }
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
  const hasRequirementSource = hasSession && input.session.source !== undefined;
  const requirementAuthentication = hasRequirementSource
    ? buildRequirementAuthentication({
        descriptor: input.session.source,
        context,
        stage,
        sessionId: typeof input.session.session_id === "string" && input.session.session_id.trim() !== ""
          ? input.session.session_id
          : input.session.source_ref,
        sourceId: input.session.source_id,
        sourceRef: input.session.source_ref,
      })
    : null;
  const outcome = hasSession
    ? requirementAuthentication === null && hasRequirementSource
      ? publishUnavailableStageAgentOutcome({
          task: context.task,
          kernel: context.kernel,
          artifacts: context.artifacts,
          workspace: context.workspace,
          candidateWorkspace: context.candidateWorkspace,
          stage,
          attemptId,
          workflowRunId: context.workflowRunId,
          host: requiredText(input.session.host, "session.host"),
          sourceId: requiredText(input.session.source_id, "session.source_id"),
          sourceFamily: requiredText(input.session.source_family, "session.source_family"),
          agentRunId: requiredText(input.agent_run_id, "agent_run_id"),
          reason: "host-session requirement source is unavailable",
        })
      : publishCurrentWorkflowHubSession({ context, input, stage, attemptId, requirementAuthentication })
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
        agentRunId: requiredText(input.agent_run_id, "agent_run_id"),
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
