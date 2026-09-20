import { createHash } from "node:crypto";

import { readTaskTypeFromDecisionLog } from "../stage/stage-content-contracts.mjs";

export { readTaskTypeFromDecisionLog } from "../stage/stage-content-contracts.mjs";

export const TASK_TYPES = Object.freeze(["规划任务", "普通任务"]);
const TASK_TYPE_SET = new Set(TASK_TYPES);

const PLANNING_TOPOLOGY = Object.freeze(["make-decision", "build-prd"]);
const ORDINARY_PRE_TOPOLOGY = Object.freeze([
  "make-decision", "build-spec", "build-plan", "build-code", "verify-code",
]);
const ORDINARY_POST_TOPOLOGY = Object.freeze([
  "make-decision", "build-plan", "build-code", "verify-code",
]);

export const TOPOLOGY_PROJECTIONS = Object.freeze({
  "规划任务": Object.freeze({ pre: PLANNING_TOPOLOGY, post: PLANNING_TOPOLOGY }),
  "普通任务": Object.freeze({ pre: ORDINARY_PRE_TOPOLOGY, post: ORDINARY_POST_TOPOLOGY }),
});

export const TYPE_RELATED_STAGES = Object.freeze([
  "build-prd", "build-spec", "build-plan", "build-code", "verify-code",
]);
const TYPE_RELATED_STAGE_SET = new Set(TYPE_RELATED_STAGES);
const TASK_TYPE_ATTEMPT_KINDS = new Set(["missing", "duplicate", "conflict", "illegal_value"]);
const MARKDOWN_HEADING = /^#{1,3}(?:\s+|$)(.+?)\s*$/;

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function normalizeTaskTypeValue(value) {
  return String(value ?? "")
    .trim()
    .replace(/^\*+|\*+$/g, "")
    .replace(/^`+|`+$/g, "")
    .trim();
}

function identityBody(markdown) {
  const lines = String(markdown ?? "").split(/\r?\n/);
  const headingIndexes = lines
    .map((line, index) => ({ match: line.match(MARKDOWN_HEADING), index }))
    .filter(({ match }) => match && /^(?:任务身份|task identity)$/i.test(match[1]));
  if (headingIndexes.length !== 1) return null;
  const start = headingIndexes[0].index + 1;
  const end = lines.slice(start).findIndex((line) => MARKDOWN_HEADING.test(line));
  return lines.slice(start, end === -1 ? lines.length : start + end).join("\n");
}

function taskTypeDeclarations(markdown) {
  const body = identityBody(markdown);
  if (body === null) return null;
  const declarations = [];
  let fenced = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const bullet = line.match(/^\s*[-*]\s+\*\*任务类型\*\*\s*[:：]\s*(.*?)\s*$/i);
    if (bullet) declarations.push(normalizeTaskTypeValue(bullet[1]));
    if (/^\s*\|/.test(line)) {
      const cells = line.split("|")
        .map((cell) => cell.trim())
        .filter((cell, index, all) => !(index === 0 && cell === "") && !(index === all.length - 1 && cell === ""));
      if (/^任务类型$/i.test(cells[0] ?? "") && cells.length >= 2) declarations.push(normalizeTaskTypeValue(cells[1]));
    }
  }
  return declarations;
}

export function classifyTaskTypeAttempt(decisionLogMarkdown) {
  const declarations = taskTypeDeclarations(decisionLogMarkdown);
  if (declarations === null || declarations.length === 0) return "missing";
  if (declarations.length > 1) {
    return new Set(declarations).size > 1 ? "conflict" : "duplicate";
  }
  return TASK_TYPE_SET.has(declarations[0]) ? null : "illegal_value";
}

export function inspectTaskType(decisionLogMarkdown) {
  const taskType = readTaskTypeFromDecisionLog(decisionLogMarkdown);
  if (TASK_TYPE_SET.has(taskType)) {
    return Object.freeze({ status: "known", task_type: taskType, observed_kind: "valid", reason: null });
  }
  const observedKind = classifyTaskTypeAttempt(decisionLogMarkdown) ?? "illegal_value";
  return Object.freeze({
    status: "unknown",
    task_type: null,
    observed_kind: observedKind,
    reason: `任务类型无法识别：${observedKind}`,
  });
}

export function readActivationCohort(manifest) {
  return manifest?.activation_cohort === "post" ? "post" : "pre";
}

export function resolveTopology({ task_type: taskType, activation_cohort: cohort = "pre" } = {}) {
  const selectedType = taskType;
  const selectedCohort = cohort;
  if (!TASK_TYPE_SET.has(selectedType)) throw new Error(`unknown task type: ${selectedType ?? "missing"}`);
  if (selectedCohort !== "pre" && selectedCohort !== "post") throw new Error(`unknown activation cohort: ${selectedCohort}`);
  return TOPOLOGY_PROJECTIONS[selectedType][selectedCohort];
}

export function validateStageForTopology({ task_type: taskType, activation_cohort: cohort = "pre", stage } = {}) {
  const selectedType = taskType;
  const selectedCohort = cohort;
  let topology;
  try {
    topology = resolveTopology({ task_type: selectedType, activation_cohort: selectedCohort });
  } catch (error) {
    return Object.freeze({ ok: false, stage, expected: [], topology: null, reason: error.message });
  }
  const ok = topology.includes(stage);
  return Object.freeze({
    ok,
    stage,
    expected: topology,
    ...(ok ? {} : { reason: `stage ${stage} is outside the selected task topology` }),
  });
}

export function isTypeRelatedStage(stage) {
  return TYPE_RELATED_STAGE_SET.has(stage);
}

export function assertNoTaskTypeArguments(values = {}) {
  const forbidden = ["type", "task-type", "task_type", "default-type", "default_type"];
  const found = forbidden.find((key) => Object.prototype.hasOwnProperty.call(values, key));
  if (found) throw new TypeError(`entry does not accept task type argument or default: --${found}`);
}

export function recordTypeAttempt({ task, observed_kind: observedKind, observed_summary: summary = "", now = new Date() } = {}) {
  const kind = observedKind;
  if (!task || typeof task !== "object") throw new TypeError("TaskHandle is required to record task type attempt");
  if (!TASK_TYPE_ATTEMPT_KINDS.has(kind)) throw new TypeError(`invalid task type attempt kind: ${kind}`);
  const recordedAt = now instanceof Date ? now.toISOString() : String(now);
  const value = {
    record_kind: "task_type_attempt",
    task_id: task.identity?.taskId ?? null,
    observed_kind: kind,
    observed_summary: String(summary),
    observed_at: recordedAt,
  };
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const digest = sha256(raw);
  const ref = `quality/evidence/task-type-attempts/${digest}.json`;
  if (typeof task.createRecordAtomic === "function") task.createRecordAtomic(ref, raw);
  else if (typeof task.writeRecordAtomic === "function") task.writeRecordAtomic(ref, raw);
  else throw new TypeError("TaskHandle canonical record writer is required");
  return Object.freeze({ status: "recorded", ref, sha256: digest, value: Object.freeze(value) });
}
