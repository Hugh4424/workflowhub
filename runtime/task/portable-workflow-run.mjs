import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";

const WORKFLOW = "build-prd";
const TERMINAL_DIRECTORY = "quality/evidence/portable-workflow-outcomes/build-prd/terminal";
const STEP_RESULT_REF = /^quality\/evidence\/portable-workflow-outcomes\/build-prd\/([a-f0-9]{64})\.json$/;
const TERMINAL_STATES = new Set(["not-started", "in-progress", "succeeded", "failed", "unverified", "blocked", "abandoned"]);
const STEP_STATUSES = new Set(["completed", "in-progress", "failed", "unverified", "blocked", "abandoned", "unavailable", "incomplete"]);
const EXPECTED_STEP_SLUGS = Object.freeze([
  "load-parent-decision",
  "draft-outline-and-task-map",
  "confirm-map-and-conditional-design",
  "expand-single-prd",
  "confirm-final-displayed-draft",
  "report-facts-and-handoff",
]);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function validIso(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function nowIso(now) {
  const value = typeof now === "function" ? now() : new Date();
  if (!(value instanceof Date) || Number.isNaN(value.valueOf())) throw new TypeError("portable workflow clock must return a valid Date");
  return value.toISOString();
}

function requirePortableManifest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)
      || value.schema_version !== "2.0.0" || value.stage_slug !== WORKFLOW || !Array.isArray(value.steps)
      || value.steps.length !== 6) {
    throw new Error("portable build-prd steps manifest is invalid");
  }
  const seenIds = new Set();
  const seenSlugs = new Set();
  for (const [index, step] of value.steps.entries()) {
    if (!step || typeof step !== "object" || Array.isArray(step)
        || !Number.isSafeInteger(step.step_id) || step.step_id !== index + 1 || seenIds.has(step.step_id)
        || typeof step.step_slug !== "string" || step.step_slug !== EXPECTED_STEP_SLUGS[index] || seenSlugs.has(step.step_slug)
        || !Number.isSafeInteger(step.order) || step.order !== index + 1
        || !Array.isArray(step.entry_conditions) || !Array.isArray(step.completion_evidence)
        || !Array.isArray(step.depends_on) || typeof step.observable_result !== "string" || !step.observable_result.trim()) {
      throw new Error(`portable build-prd step ${index + 1} is invalid`);
    }
    seenIds.add(step.step_id);
    seenSlugs.add(step.step_slug);
  }
  return Object.freeze({ ...value, steps: Object.freeze(value.steps.map((step) => Object.freeze({ ...step }))) });
}

export function loadPortableWorkflowManifest({ worktreeRoot, read = readFileSync } = {}) {
  if (typeof worktreeRoot !== "string" || !isAbsolute(worktreeRoot)) throw new TypeError("portable workflow worktreeRoot must be absolute");
  const path = resolve(worktreeRoot, "workflows", WORKFLOW, "steps.json");
  if (!path.startsWith(`${resolve(worktreeRoot)}/`)) throw new Error("portable workflow manifest escapes worktree");
  let value;
  try { value = JSON.parse(read(path, "utf8")); }
  catch (error) { throw new Error(`portable build-prd steps manifest is unreadable: ${error.message}`); }
  return requirePortableManifest(value);
}

function terminalRecord({ taskId, state, reason, failedStep, stepResultRefs, startedAt, completedAt }) {
  if (!TERMINAL_STATES.has(state)) throw new TypeError(`portable workflow state is invalid: ${state}`);
  return Object.freeze({
    record_kind: "portable_workflow_terminal",
    task_id: taskId,
    workflow: WORKFLOW,
    state,
    reason,
    failed_step: failedStep,
    step_result_refs: Object.freeze(stepResultRefs),
    started_at: startedAt,
    completed_at: completedAt,
  });
}

function terminalPath(raw) {
  return `${TERMINAL_DIRECTORY}/${sha256(raw)}.json`;
}

function writeTerminal(task, terminal) {
  if (!task || typeof task.createRecordAtomic !== "function") throw new TypeError("TaskHandle canonical record writer is required");
  const raw = `${JSON.stringify(terminal, null, 2)}\n`;
  const ref = terminalPath(raw);
  task.createRecordAtomic(ref, raw);
  return Object.freeze({ ref, sha256: sha256(raw), terminal });
}

function nextCompletionTime(task, candidate) {
  const latest = readLatestPortableTerminal({ task });
  const latestTime = Date.parse(latest?.completed_at ?? "");
  const candidateTime = Date.parse(candidate);
  return Number.isFinite(latestTime) && latestTime >= candidateTime
    ? new Date(latestTime + 1).toISOString()
    : candidate;
}

function failedTerminal(taskId, reason, startedAt, completedAt, failedStep = null, refs = []) {
  return terminalRecord({ taskId, state: "failed", reason, failedStep, stepResultRefs: refs, startedAt, completedAt });
}

function validateStepResultEvidence(task, result, taskId, step) {
  const match = STEP_RESULT_REF.exec(result.result_ref);
  if (!match) return `portable workflow step result_ref is outside the canonical outcome namespace for ${step.step_slug}`;
  let raw;
  try { raw = task.readRecord(result.result_ref); }
  catch (error) { return `portable workflow step result evidence is unavailable for ${step.step_slug}: ${error.message}`; }
  if (sha256(raw) !== match[1]) return `portable workflow step result evidence hash mismatch for ${step.step_slug}`;
  let value;
  try { value = JSON.parse(raw); }
  catch { return `portable workflow step result evidence is not JSON for ${step.step_slug}`; }
  if (!value || typeof value !== "object" || Array.isArray(value)
      || value.task_id !== taskId || value.workflow !== WORKFLOW || !Array.isArray(value.step_results)) {
    return `portable workflow step result evidence is not bound to ${step.step_slug}`;
  }
  const attestations = value.step_results.filter((item) => item && typeof item === "object" && !Array.isArray(item)
    && item.step_id === step.step_id && item.step_slug === step.step_slug);
  if (attestations.length !== 1) return `portable workflow step result evidence must attest ${step.step_slug} exactly once`;
  return attestations[0].status === result.status
    ? null
    : `portable workflow step result evidence does not attest ${step.step_slug} as ${result.status}`;
}

function validateStepResults(input, taskId, steps, task) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "portable workflow input is invalid" };
  if (input.task_id !== taskId) return { error: "portable workflow input task_id is invalid" };
  if (input.workflow !== WORKFLOW) return { error: "portable workflow input workflow is invalid" };
  if (!Array.isArray(input.step_results)) return { error: "portable workflow input step_results is invalid" };
  const byId = new Map();
  for (const value of input.step_results) {
    if (!value || typeof value !== "object" || Array.isArray(value)
        || !Number.isSafeInteger(value.step_id) || byId.has(value.step_id)) return { error: "portable workflow step result is invalid" };
    byId.set(value.step_id, value);
  }
  const normalized = [];
  for (const step of steps) {
    const result = byId.get(step.step_id);
    if (!result) return { missingStep: step.step_slug, refs: normalized.map(({ result_ref }) => result_ref) };
    if (result.task_id !== taskId || result.workflow !== WORKFLOW || result.step_slug !== step.step_slug
        || !STEP_STATUSES.has(result.status) || typeof result.result_ref !== "string") {
      return { error: `portable workflow step result is invalid for ${step.step_slug}`, failedStep: step.step_slug, refs: normalized.map(({ result_ref }) => result_ref) };
    }
    if (result.status === "blocked" && (typeof result.dependency !== "string" || !result.dependency.trim()
        || typeof result.unblock_condition !== "string" || !result.unblock_condition.trim())) {
      return { error: `portable workflow blocked step is missing dependency facts: ${step.step_slug}`, failedStep: step.step_slug, refs: normalized.map(({ result_ref }) => result_ref) };
    }
    const evidenceError = validateStepResultEvidence(task, result, taskId, step);
    if (evidenceError !== null) {
      return { error: evidenceError, failedStep: step.step_slug, refs: normalized.map(({ result_ref }) => result_ref) };
    }
    normalized.push(result);
  }
  if (byId.size !== steps.length) return { error: "portable workflow step_results contain an unknown step", refs: normalized.map(({ result_ref }) => result_ref) };
  return { results: normalized, refs: normalized.map(({ result_ref }) => result_ref) };
}

function stateForStepResults(results) {
  const first = results.find(({ status }) => status !== "completed");
  if (!first) return { state: "succeeded", failedStep: null, reason: "all six portable step outcomes are completed" };
  if (first.status === "in-progress") return { state: "in-progress", failedStep: first.step_slug, reason: `portable step is in progress: ${first.step_slug}` };
  if (first.status === "unverified") return { state: "unverified", failedStep: first.step_slug, reason: `portable step requires verification: ${first.step_slug}` };
  if (first.status === "blocked") return { state: "blocked", failedStep: first.step_slug, reason: `portable step waits for ${first.dependency}: ${first.unblock_condition}` };
  if (first.status === "abandoned") return { state: "abandoned", failedStep: first.step_slug, reason: `portable workflow was abandoned at ${first.step_slug}` };
  return { state: "failed", failedStep: first.step_slug, reason: `portable step did not complete: ${first.step_slug} (${first.status})` };
}

/** Validate session-produced build-prd step outcomes and append one terminal record. */
export function runPortableWorkflow({ task, worktreeRoot, input = undefined, now = () => new Date() } = {}) {
  if (!task?.identity?.taskId) throw new TypeError("TaskHandle is required for portable workflow execution");
  const startedAt = nowIso(now);
  const taskId = task.identity.taskId;
  if (input === undefined) return Object.freeze({ state: "not-started", ref: null, terminal: null });
  let manifest;
  try { manifest = loadPortableWorkflowManifest({ worktreeRoot }); }
  catch (error) {
    const terminal = failedTerminal(taskId, error.message, startedAt, nextCompletionTime(task, nowIso(now)));
    return Object.freeze({ state: terminal.state, ...writeTerminal(task, terminal) });
  }
  const validation = validateStepResults(input, taskId, manifest.steps, task);
  if (validation.error) {
    const terminal = failedTerminal(taskId, validation.error, startedAt, nextCompletionTime(task, nowIso(now)), validation.failedStep ?? null, validation.refs ?? []);
    return Object.freeze({ state: terminal.state, ...writeTerminal(task, terminal) });
  }
  if (validation.missingStep) {
    const terminal = failedTerminal(taskId, `missing portable step outcome: ${validation.missingStep}`, startedAt, nextCompletionTime(task, nowIso(now)), validation.missingStep, validation.refs);
    return Object.freeze({ state: terminal.state, ...writeTerminal(task, terminal) });
  }
  const outcome = stateForStepResults(validation.results);
  const terminal = terminalRecord({
    taskId,
    state: outcome.state,
    reason: outcome.reason,
    failedStep: outcome.failedStep,
    stepResultRefs: validation.refs,
    startedAt,
    completedAt: nextCompletionTime(task, nowIso(now)),
  });
  return Object.freeze({ state: terminal.state, ...writeTerminal(task, terminal) });
}

function validTerminal(value, taskId) {
  return value && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).sort().join(",") === "completed_at,failed_step,reason,record_kind,started_at,state,step_result_refs,task_id,workflow"
    && value.record_kind === "portable_workflow_terminal"
    && value.task_id === taskId && value.workflow === WORKFLOW && TERMINAL_STATES.has(value.state)
    && typeof value.reason === "string" && Array.isArray(value.step_result_refs)
    && value.step_result_refs.every((ref) => typeof ref === "string" && ref.startsWith("quality/") && !ref.includes(".."))
    && (value.failed_step === null || typeof value.failed_step === "string")
    && validIso(value.started_at) && validIso(value.completed_at);
}

export function readLatestPortableTerminal({ task } = {}) {
  if (!task?.identity?.taskId || typeof task.readRecord !== "function" || typeof task.taskPath !== "string") throw new TypeError("TaskHandle is required to read portable workflow status");
  const directory = join(task.taskPath, ...TERMINAL_DIRECTORY.split("/"));
  if (!existsSync(directory)) return null;
  const terminals = [];
  for (const name of readdirSync(directory)) {
    if (!/^[a-f0-9]{64}\.json$/.test(name)) continue;
    const ref = `${TERMINAL_DIRECTORY}/${name}`;
    try {
      const raw = task.readRecord(ref);
      if (sha256(raw) !== name.slice(0, -5)) continue;
      const value = JSON.parse(raw);
      if (validTerminal(value, task.identity.taskId)) terminals.push({ ref, sha256: name.slice(0, -5), ...value });
    } catch { /* malformed historical records are not current status */ }
  }
  terminals.sort((left, right) => Date.parse(right.completed_at) - Date.parse(left.completed_at) || right.ref.localeCompare(left.ref));
  return terminals[0] ? Object.freeze(terminals[0]) : null;
}

export function projectPortableWorkflowStatus({ task } = {}) {
  const latest = readLatestPortableTerminal({ task });
  return latest === null
    ? Object.freeze({ workflow: WORKFLOW, state: "not-started", terminal_ref: null, reason: "no portable workflow terminal record" })
    : Object.freeze({ workflow: WORKFLOW, state: latest.state, terminal_ref: latest.ref, reason: latest.reason, failed_step: latest.failed_step });
}
