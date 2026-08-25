#!/usr/bin/env node

/**
 * Ephemeral host handoff for the current WorkflowHub session.
 *
 * This is not a facts store and never writes a task record.  Codex project
 * hooks register the exact transcript path here; the normal WorkflowHub
 * session event command appends semantic step/skill boundaries here.  The
 * official stage runtime consumes the one current handoff and writes the
 * canonical outcome through TaskKernel.
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, isAbsolute, resolve, join } from "node:path";
import { realpathSync } from "node:fs";

const SCHEMA_VERSION = "workflowhub-codex-session-handoff.v1";
const STATE_ROOT = join(tmpdir(), "workflowhub-codex-session-handoffs");
// Project/task names already have their own path-segment validator.  The
// handoff layer must not add an arbitrary eight-character gate: valid names
// such as "Demo" and "E2E" are common in clean-runner and local smoke flows.
const SAFE_ID = /^[A-Za-z0-9._:-]{1,160}$/;
const SESSION_LOCATOR_SCHEMA = "workflowhub-codex-session-locator.v1";
const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const SUBJECT_KINDS = new Set(["step", "skill"]);
const TERMINAL_STATUSES = new Set(["completed", "failed", "skipped", "not_applicable", "unknown", "unavailable", "incomplete"]);

function text(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be non-empty`);
  return value.trim();
}

function safeId(value, label) {
  const result = text(value, label);
  if (!SAFE_ID.test(result)) throw new TypeError(`${label} must be an opaque identifier`);
  return result;
}

/**
 * Codex uses session_id for the hook/transcript identity.  Some hosts also
 * expose a thread id, but a sub-agent thread is not necessarily the session
 * that owns this handoff.  Keep the legacy name only as a compatibility
 * fallback for older launchers and tests.
 */
export function currentCodexSessionId(env = process.env) {
  for (const key of ["CODEX_SESSION_ID", "CODEX_THREAD_ID"]) {
    const value = env?.[key];
    if (value === null || value === undefined || String(value).trim() === "") continue;
    return safeId(value, key);
  }
  return null;
}

function nowMs(value = Date.now()) {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError("session timestamp must be a non-negative integer");
  return value;
}

function compareSessionEvents(a, b) {
  return (a.started_at_ms - b.started_at_ms)
    || (b.ended_at_ms - a.ended_at_ms)
    || String(a.subject_kind).localeCompare(String(b.subject_kind))
    || String(a.subject_id).localeCompare(String(b.subject_id));
}

function canonicalCwd(cwd) {
  const path = resolve(text(cwd, "cwd"));
  try { return realpathSync(path); } catch { return path; }
}

function boundTaskPath(taskPath) {
  const value = resolve(text(taskPath, "task_path"));
  if (!isAbsolute(value)) throw new TypeError("task_path must be absolute");
  return realpathSync(value);
}

function stateKey(cwd) {
  const path = canonicalCwd(cwd);
  return createHash("sha256").update(path).digest("hex");
}

export function sessionHandoffPath(cwd) {
  return join(STATE_ROOT, `${stateKey(cwd)}.json`);
}

function sessionLocatorPath(sessionId) {
  const id = safeId(sessionId, "session_id");
  const key = createHash("sha256").update(`session:${id}`).digest("hex");
  return join(STATE_ROOT, `session-${key}.json`);
}

function missingSessionStatePath(sessionId) {
  const id = safeId(sessionId, "session_id");
  const key = createHash("sha256").update(`missing-session:${id}`).digest("hex");
  return join(STATE_ROOT, `session-missing-${key}.json`);
}

function validStatePath(value) {
  if (typeof value !== "string" || !isAbsolute(value)) return false;
  const root = resolve(STATE_ROOT);
  return value === root || value.startsWith(`${root}/`);
}

function readSessionLocator(sessionId) {
  const path = sessionLocatorPath(sessionId);
  try {
    const value = JSON.parse(readFileSync(path, "utf8"));
    if (!value || value.schema_version !== SESSION_LOCATOR_SCHEMA
      || value.session_id !== sessionId
      || !validStatePath(value.state_path)
      || typeof value.cwd !== "string") {
      throw new Error("session locator schema is invalid");
    }
    return value;
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function writeSessionLocator(sessionId, statePath, cwd) {
  const path = sessionLocatorPath(sessionId);
  mkdirSync(STATE_ROOT, { recursive: true, mode: 0o700 });
  const temporary = `${path}.tmp-${process.pid}`;
  writeFileSync(temporary, `${JSON.stringify({
    schema_version: SESSION_LOCATOR_SCHEMA,
    session_id: sessionId,
    cwd: canonicalCwd(cwd),
    state_path: statePath,
  }, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, path);
  return path;
}

function optionalSessionId(sessionId = null) {
  const candidate = sessionId ?? null;
  if (candidate === null || candidate === undefined || String(candidate).trim() === "") return null;
  return safeId(candidate, "session_id");
}

function stateTarget(cwd, sessionId = null, { allowCurrentFallback = false } = {}) {
  const currentCwd = canonicalCwd(cwd);
  const currentPath = sessionHandoffPath(currentCwd);
  const id = optionalSessionId(sessionId);
  if (!id) return { path: currentPath, cwd: currentCwd };
  const locator = readSessionLocator(id);
  if (!locator) {
    if (allowCurrentFallback) return { path: currentPath, cwd: currentCwd };
    return { path: missingSessionStatePath(id), cwd: currentCwd };
  }
  if (!existsSync(locator.state_path)) {
    if (allowCurrentFallback) return { path: currentPath, cwd: currentCwd };
    return { path: locator.state_path, cwd: locator.cwd };
  }
  if (allowCurrentFallback && !existsSync(locator.cwd)) {
    return { path: currentPath, cwd: currentCwd };
  }
  return { path: locator.state_path, cwd: locator.cwd };
}

function emptyState(cwd) {
  return {
    schema_version: SCHEMA_VERSION,
    cwd: canonicalCwd(cwd),
    sessions: [],
  };
}

function readState(cwd, { sessionId = null, allowCurrentFallback = false } = {}) {
  const target = stateTarget(cwd, sessionId, { allowCurrentFallback });
  try {
    const value = JSON.parse(readFileSync(target.path, "utf8"));
    if (!value || value.schema_version !== SCHEMA_VERSION || value.cwd !== target.cwd || !Array.isArray(value.sessions)) {
      throw new Error("session handoff schema is invalid");
    }
    return value;
  } catch (error) {
    if (error?.code === "ENOENT") return emptyState(target.cwd);
    throw error;
  }
}

function writeState(cwd, value, { sessionId = null, allowCurrentFallback = false } = {}) {
  const id = optionalSessionId(sessionId);
  const target = stateTarget(cwd, id, { allowCurrentFallback });
  const path = target.path;
  mkdirSync(STATE_ROOT, { recursive: true, mode: 0o700 });
  const temporary = `${path}.tmp-${process.pid}`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, path);
  if (id) writeSessionLocator(id, path, value.cwd ?? target.cwd);
  return path;
}

function safeTranscriptPath(transcriptPath, home = homedir()) {
  if (transcriptPath === null || transcriptPath === undefined) return null;
  const value = resolve(text(transcriptPath, "transcript_path"));
  const sessionsRoot = resolve(home, ".codex", "sessions");
  if (!isAbsolute(value) || !value.startsWith(`${sessionsRoot}/`) || !basename(value).endsWith(".jsonl")) {
    throw new Error("transcript_path must point inside the current Codex sessions directory");
  }
  return value;
}

function rolloutTimestamp(record) {
  const timestamp = record?.timestamp ?? record?.payload?.timestamp ?? record?.payload?.info?.timestamp;
  const parsed = Date.parse(typeof timestamp === "string" ? timestamp : "");
  return Number.isFinite(parsed) ? parsed : null;
}

function codexUserMessageId(outer, payload, lineIndex) {
  const candidate = payload?.id ?? outer?.id ?? `codex-user-${lineIndex + 1}`;
  const normalized = String(candidate).replace(/[^A-Za-z0-9._:-]/g, "_");
  return SAFE_ID.test(normalized) ? normalized : `codex-user-${lineIndex + 1}`;
}

function codexUserInputText(outer) {
  const payload = outer?.payload;
  if (outer?.type !== "response_item" || payload?.type !== "message" || payload?.role !== "user") return null;
  if (!Array.isArray(payload.content)) return null;
  const parts = payload.content
    .filter((part) => part?.type === "input_text" && typeof part.text === "string" && part.text.trim() !== "")
    .map((part) => part.text);
  return parts.length > 0 ? parts.join("\n") : null;
}

/**
 * Freeze only the host-authenticated user-message identities that existed
 * before the task was bound.  The sidecar retains hashes, never raw prompt
 * text; the later registered source rereads the exact transcript and checks
 * those hashes before the make-decision stage may use it.
 */
function snapshotOriginalRequirementMessages(transcriptPath, boundAtMs) {
  if (!transcriptPath || !Number.isSafeInteger(boundAtMs)) return [];
  let raw;
  try { raw = readFileSync(transcriptPath, "utf8"); }
  catch { return []; }
  const messages = [];
  const usedIds = new Set();
  for (const [lineIndex, line] of raw.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    let outer;
    try { outer = JSON.parse(line); } catch { continue; }
    const occurredAt = rolloutTimestamp(outer);
    if (occurredAt === null || occurredAt > boundAtMs) continue;
    const content = codexUserInputText(outer);
    if (content === null) continue;
    let id = codexUserMessageId(outer, outer.payload, lineIndex);
    if (usedIds.has(id)) id = `codex-user-${lineIndex + 1}`;
    usedIds.add(id);
    messages.push(Object.freeze({
      id,
      order: messages.length + 1,
      content_hash: createHash("sha256").update(content).digest("hex"),
    }));
  }
  return messages;
}

function frozenRequirementMessages(value) {
  if (!Array.isArray(value)) return [];
  const messages = [];
  const ids = new Set();
  for (const [index, message] of value.entries()) {
    if (!message || typeof message !== "object" || Array.isArray(message)) return [];
    if (!SAFE_ID.test(message.id ?? "") || ids.has(message.id)
      || message.order !== index + 1 || !/^[a-f0-9]{64}$/.test(message.content_hash ?? "")) return [];
    ids.add(message.id);
    messages.push(Object.freeze({ id: message.id, order: message.order, content_hash: message.content_hash }));
  }
  return messages;
}

export function registerCodexSession({ sessionId, transcriptPath, cwd = process.cwd(), model = null, observedAtMs = Date.now(), home = homedir() } = {}) {
  const currentCwd = canonicalCwd(cwd);
  const id = safeId(sessionId, "session_id");
  const path = safeTranscriptPath(transcriptPath, home);
  const state = readState(currentCwd, { sessionId: id, allowCurrentFallback: true });
  const existing = state.sessions.find((entry) => entry.session_id === id);
  const record = {
    session_id: id,
    transcript_path: path ?? existing?.transcript_path ?? null,
    ...(typeof model === "string" && model.trim() ? { model: model.trim() } : {}),
    started_at_ms: existing?.started_at_ms ?? nowMs(observedAtMs),
    last_seen_at_ms: nowMs(observedAtMs),
    ended_at_ms: null,
    events: Array.isArray(existing?.events) ? existing.events : [],
    spec_analyze: existing?.spec_analyze ?? null,
    spec_analyze_by_task: existing?.spec_analyze_by_task && typeof existing.spec_analyze_by_task === "object" ? existing.spec_analyze_by_task : {},
    spec_analyze_by_task_stage: existing?.spec_analyze_by_task_stage && typeof existing.spec_analyze_by_task_stage === "object" ? existing.spec_analyze_by_task_stage : {},
    task_binding: existing?.task_binding ?? null,
  };
  const sessions = state.sessions.filter((entry) => entry.session_id !== id);
  sessions.push(record);
  const statePath = writeState(currentCwd, { ...state, sessions }, { sessionId: id, allowCurrentFallback: true });
  return Object.freeze({ cwd: currentCwd, session_id: id, transcript_path: path, state_path: statePath });
}

export function bindCodexSessionTask({ projectName, taskId, taskPath, cwd = process.cwd(), boundAtMs = Date.now(), sessionId = null } = {}) {
  const project = safeId(projectName, "project_name");
  const task = safeId(taskId, "task_id");
  const path = boundTaskPath(taskPath);
  const current = sessionForMutation(cwd, sessionId);
  const previous = current.session.task_binding;
  if (previous) {
    if (previous.task_id !== task || previous.project_name !== project) {
      throw new Error("cannot switch the current WorkflowHub task inside one Codex session; start a fresh session for another task");
    }
    if (previous.task_path !== path) throw new Error("current WorkflowHub task binding path does not match the requested task");
    const frozen = frozenRequirementMessages(previous.requirement_messages);
    if (!Array.isArray(previous.requirement_messages)) {
      previous.requirement_messages = snapshotOriginalRequirementMessages(current.session.transcript_path, previous.bound_at_ms);
      const statePath = writeState(cwd, current.state, { sessionId: current.session.session_id });
      return Object.freeze({ session_id: current.session.session_id, status: "already_bound", task_binding: { ...previous }, state_path: statePath });
    }
    if (frozen.length !== previous.requirement_messages.length) throw new Error("current WorkflowHub task requirement snapshot is invalid");
    return Object.freeze({ session_id: current.session.session_id, status: "already_bound", task_binding: { ...previous }, state_path: current.state_path });
  }
  const bound = nowMs(boundAtMs);
  current.session.task_binding = {
    project_name: project,
    task_id: task,
    task_path: path,
    bound_at_ms: bound,
    requirement_messages: snapshotOriginalRequirementMessages(current.session.transcript_path, bound),
  };
  current.session.last_seen_at_ms = current.session.task_binding.bound_at_ms;
  const statePath = writeState(cwd, current.state, { sessionId: current.session.session_id });
  return Object.freeze({ session_id: current.session.session_id, status: "bound", task_binding: { ...current.session.task_binding }, state_path: statePath });
}

export function endCodexSession({ sessionId, cwd = process.cwd(), endedAtMs = Date.now() } = {}) {
  const currentCwd = canonicalCwd(cwd);
  const id = safeId(sessionId, "session_id");
  const state = readState(currentCwd, { sessionId: id });
  const session = state.sessions.find((entry) => entry.session_id === id);
  if (!session) return Object.freeze({ ended: false, state_path: sessionHandoffPath(currentCwd) });
  session.ended_at_ms = nowMs(endedAtMs);
  session.last_seen_at_ms = session.ended_at_ms;
  const statePath = writeState(currentCwd, state, { sessionId: id });
  try { unlinkSync(sessionLocatorPath(id)); } catch (error) { if (error?.code !== "ENOENT") throw error; }
  return Object.freeze({ ended: true, state_path: statePath });
}

function currentSession(cwd, sessionId = null) {
  const id = optionalSessionId(sessionId);
  const state = readState(cwd, { sessionId: id });
  // An exact session lookup must not be blocked by another live session in
  // the same workspace.  Only an unscoped lookup treats multiple active
  // sessions as a conflict; the exact id is the identity boundary.
  const active = state.sessions.filter((entry) => entry.ended_at_ms === null && (!id || entry.session_id === id));
  const state_path = stateTarget(cwd, id).path;
  if (active.length === 0) return { status: "unregistered", state, state_path };
  if (active.length !== 1) return { status: "conflict", state, sessions: active, state_path };
  return { status: "present", state, session: active[0], state_path };
}

export function readCurrentCodexSession({ cwd = process.cwd(), stage = null, sessionId = null } = {}) {
  const id = optionalSessionId(sessionId);
  const result = currentSession(cwd, id);
  if (stage !== null && !STAGES.has(stage)) throw new TypeError(`unsupported stage: ${stage}`);
  if (result.status !== "present") return Object.freeze({ status: result.status, state_path: result.state_path });
  const session = result.session;
  const events = stage === null ? session.events : session.events.filter((entry) => entry.stage === stage);
  return Object.freeze({
    status: "present",
    state_path: result.state_path,
    cwd: result.state.cwd,
    session_id: session.session_id,
    transcript_path: session.transcript_path,
    model: session.model ?? null,
    task_binding: session.task_binding ?? null,
    events: events.map((entry) => Object.freeze({ ...entry })),
    spec_analyze: session.spec_analyze,
    spec_analyze_by_task: session.spec_analyze_by_task ?? {},
    spec_analyze_by_task_stage: session.spec_analyze_by_task_stage ?? {},
  });
}

function tokenUsageBetween(transcriptPath, startedAtMs, endedAtMs) {
  if (!transcriptPath) return null;
  let raw;
  try { raw = readFileSync(transcriptPath, "utf8"); } catch { return null; }
  let inputTokens = 0;
  let outputTokens = 0;
  let observed = 0;
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let outer;
    try { outer = JSON.parse(line); } catch { continue; }
    if (outer?.type !== "event_msg" || outer?.payload?.type !== "token_count") continue;
    const timestamp = Date.parse(typeof outer.timestamp === "string" ? outer.timestamp : "");
    if (!Number.isFinite(timestamp) || timestamp < startedAtMs || timestamp >= endedAtMs) continue;
    const usage = outer.payload.info?.last_token_usage;
    if (!Number.isInteger(usage?.input_tokens) || !Number.isInteger(usage?.output_tokens)
      || usage.input_tokens < 0 || usage.output_tokens < 0) continue;
    inputTokens += usage.input_tokens;
    outputTokens += usage.output_tokens;
    observed += 1;
  }
  return observed > 0 ? { input_tokens: inputTokens, output_tokens: outputTokens, total_tokens: inputTokens + outputTokens } : null;
}

function resolveSessionTaskId(session, taskId, { allowUnbound = false } = {}) {
  const requested = taskId === null || taskId === undefined ? null : safeId(taskId, "task_id");
  const bound = session?.task_binding?.task_id ? safeId(session.task_binding.task_id, "task_binding.task_id") : null;
  if (!bound) {
    if (allowUnbound) return null;
    throw new Error("current WorkflowHub session has no active task binding; bootstrap the task in this session first");
  }
  if (requested && requested !== bound) throw new Error(`requested task_id ${requested} does not match the current WorkflowHub task binding ${bound} for ${session?.cwd ?? "unknown cwd"}`);
  return bound;
}

function eventId(sessionId, taskId, stage, subjectKind, subjectId, startedAtMs, sequence) {
  return `event-${createHash("sha256").update(`${sessionId}:${taskId}:${stage}:${subjectKind}:${subjectId}:${startedAtMs}:${sequence}`).digest("hex").slice(0, 32)}`;
}

function sessionForMutation(cwd, sessionId = null) {
  const id = optionalSessionId(sessionId);
  const result = currentSession(cwd, id);
  if (result.status !== "present") throw new Error(`current WorkflowHub session is ${result.status}`);
  return { state: result.state, session: result.session, state_path: result.state_path };
}

export function startCodexSessionEvent({ taskId = null, stage, subjectKind, subjectId, cwd = process.cwd(), startedAtMs = Date.now(), sessionId = null } = {}) {
  if (!STAGES.has(stage)) throw new TypeError(`unsupported stage: ${stage}`);
  if (!SUBJECT_KINDS.has(subjectKind)) throw new TypeError("subject_kind must be step or skill");
  const id = safeId(subjectId, "subject_id");
  const current = sessionForMutation(cwd, sessionId);
  const task = resolveSessionTaskId(current.session, taskId);
  const started = nowMs(startedAtMs);
  const sequence = current.session.events.length + 1;
  const event = {
    event_id: eventId(current.session.session_id, task, stage, subjectKind, id, started, sequence),
    stage,
    task_id: task,
    subject_kind: subjectKind,
    subject_id: id,
    started_at_ms: started,
    ended_at_ms: null,
    status: "open",
  };
  current.session.events.push(event);
  current.session.last_seen_at_ms = started;
  const statePath = writeState(cwd, current.state, { sessionId: current.session.session_id });
  return Object.freeze({ event_id: event.event_id, session_id: current.session.session_id, state_path: statePath });
}

export function finishCodexSessionEvent({ taskId = null, stage, subjectKind, subjectId, cwd = process.cwd(), endedAtMs = Date.now(), status = "completed", resultSummary = "", reason = null, evidenceRefs = [], trigger = null, executed = null, version = "workflowhub-session", sessionId = null } = {}) {
  if (!STAGES.has(stage)) throw new TypeError(`unsupported stage: ${stage}`);
  if (!SUBJECT_KINDS.has(subjectKind)) throw new TypeError("subject_kind must be step or skill");
  if (!TERMINAL_STATUSES.has(status)) throw new TypeError(`unsupported session event status: ${status}`);
  const id = safeId(subjectId, "subject_id");
  const current = sessionForMutation(cwd, sessionId);
  const task = resolveSessionTaskId(current.session, taskId);
  const candidates = current.session.events.filter((entry) => entry.task_id === task && entry.stage === stage && entry.subject_kind === subjectKind && entry.subject_id === id && entry.status === "open");
  const event = candidates.at(-1);
  if (!event) throw new Error(`no open WorkflowHub session event for ${stage}/${subjectKind}/${id}`);
  const ended = nowMs(endedAtMs);
  if (ended < event.started_at_ms) throw new Error("session event ended before it started");
  const usage = tokenUsageBetween(current.session.transcript_path, event.started_at_ms, ended);
  event.ended_at_ms = ended;
  event.status = status;
  event.result_summary = typeof resultSummary === "string" && resultSummary.trim() ? resultSummary.trim() : `${subjectKind} ${id} finished with status ${status}`;
  if (status !== "completed" && typeof reason === "string" && reason.trim()) event.reason = reason.trim();
  event.evidence = Array.isArray(evidenceRefs) ? evidenceRefs.filter((value) => typeof value === "string" && value.trim()).map((ref) => ({ ref: ref.trim() })) : [];
  if (subjectKind === "skill") {
    event.trigger = typeof trigger === "boolean" ? trigger : true;
    event.executed = typeof executed === "boolean" ? executed : status === "completed";
    event.version = typeof version === "string" && version.trim() ? version.trim() : "workflowhub-session";
  }
  if (usage) event.usage = usage;
  else event.usage_reason = "codex_token_count_unavailable_for_event_window";
  current.session.last_seen_at_ms = ended;
  const statePath = writeState(cwd, current.state, { sessionId: current.session.session_id });
  return Object.freeze({ event_id: event.event_id, session_id: current.session.session_id, usage, state_path: statePath });
}

export function recordCodexSessionSpecAnalyze({ taskId = null, stage, value, cwd = process.cwd(), sessionId = null } = {}) {
  if (!STAGES.has(stage)) throw new TypeError("stage is required for spec-analyze recording");
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("spec_analyze must be an object");
  const current = sessionForMutation(cwd, sessionId);
  const task = resolveSessionTaskId(current.session, taskId);
  current.session.spec_analyze_by_task_stage ??= {};
  current.session.spec_analyze_by_task_stage[task] ??= {};
  current.session.spec_analyze_by_task_stage[task][stage] = structuredClone(value);
  current.session.last_seen_at_ms = Date.now();
  const statePath = writeState(cwd, current.state, { sessionId: current.session.session_id });
  return Object.freeze({ session_id: current.session.session_id, state_path: statePath });
}

export function buildWorkflowHubSessionInput({ taskId, cwd = process.cwd(), stage, sessionId = null } = {}) {
  const current = readCurrentCodexSession({ cwd, stage, sessionId });
  if (current.status !== "present") return current;
  if (taskId && current.task_binding?.task_id && current.task_binding.task_id !== taskId) {
    return Object.freeze({
      status: "unavailable",
      state_path: current.state_path,
      session_id: current.session_id,
      reason: "session_task_binding_mismatch",
    });
  }
  const task = resolveSessionTaskId(current, taskId, { allowUnbound: true });
  if (!task) return Object.freeze({ status: "unbound", state_path: current.state_path, session_id: current.session_id });
  const taskEvents = current.events.filter((entry) => entry.task_id === task);
  // Older hosts could emit the workflow name as if it were a skill.  It is a
  // category error, not a declared skill event.  Preserve it in the private
  // handoff diagnostic but never send it to the strict stage publisher.
  const rejectedEvents = taskEvents.filter((entry) => entry.subject_kind === "skill" && STAGES.has(entry.subject_id));
  const declaredCandidateEvents = taskEvents.filter((entry) => !rejectedEvents.includes(entry));
  const stageCandidateEvents = stage
    ? declaredCandidateEvents.filter((entry) => entry.stage === stage)
    : declaredCandidateEvents;
  // A repaired subject gets a new lifecycle pair in the same session.  The
  // prior terminal event remains in the private sidecar for diagnosis, but a
  // single stage-outcome attempt may receive only the latest state for each
  // declared subject; otherwise its strict recorder rejects the duplicate.
  const currentBySubject = new Map();
  for (const event of stageCandidateEvents) {
    if (event.status === "open") continue;
    const key = `${event.stage}:${event.subject_kind}:${event.subject_id}`;
    const previous = currentBySubject.get(key);
    // The array sequence breaks an exact timestamp tie, so a host that
    // serializes two finishes in the same millisecond still projects the last
    // repair rather than a stale result.
    if (!previous || event.ended_at_ms >= previous.ended_at_ms) currentBySubject.set(key, event);
  }
  const currentEvents = [...currentBySubject.values()].sort(compareSessionEvents);
  const events = currentEvents.filter((entry) => entry.status !== "open").map((entry) => ({
    task_id: task,
    stage: entry.stage,
    subject_kind: entry.subject_kind,
    subject_id: entry.subject_id,
    started_at_ms: entry.started_at_ms,
    ended_at_ms: entry.ended_at_ms,
    status: entry.status,
    result_summary: entry.result_summary,
    ...(entry.reason ? { reason: entry.reason } : {}),
    evidence: entry.evidence ?? [],
    ...(entry.usage ? { usage: entry.usage } : {}),
    ...(entry.subject_kind === "skill" ? {
      trigger: entry.trigger,
      executed: entry.executed,
      version: entry.version,
    } : {}),
  }));
  const open = stageCandidateEvents.some((entry) => entry.status === "open");
  const specAnalyze = stage
    ? current.spec_analyze_by_task_stage?.[task]?.[stage] ?? null
    : current.spec_analyze_by_task?.[task] ?? null;
  const complete = currentEvents.length > 0
    && currentEvents.every((entry) => entry.status === "completed")
    && !open
    && specAnalyze !== null;
  return Object.freeze({
    status: "present",
    host: "codex",
    session_id: current.session_id,
    task_id: task,
    source_ref: `${current.transcript_path ? "codex-rollout" : "codex-session"}-${current.session_id}`,
    status_value: complete ? "completed" : "incomplete",
    events,
    spec_analyze: specAnalyze,
    requirement_messages: frozenRequirementMessages(current.task_binding?.requirement_messages),
    ...(rejectedEvents.length > 0 ? {
      rejected_events: rejectedEvents.map((entry) => ({
        event_id: entry.event_id,
        stage: entry.stage,
        subject_kind: entry.subject_kind,
        subject_id: entry.subject_id,
        reason: "workflow_name_recorded_as_skill",
      })),
    } : {}),
  });
}
