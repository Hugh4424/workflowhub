const MATERIAL_KEYS = Object.freeze(["decision_log", "spec", "plan", "tasks"]);
const ID_LIST_KEYS = Object.freeze(["requirement_ids", "decision_ids", "fr_ids", "acceptance_ids", "task_ids"]);
const IMPACT_KEYS = Object.freeze([
  "user_flow",
  "data_state",
  "success_failure",
  "implementation",
  "tests",
  "review",
  "delivery",
]);
const RETURN_STAGES = new Set(["build-code", "verify-code"]);
const HASH = /^[a-f0-9]{64}$/;
const MAX_EXCERPT_BYTES = 24 * 1024;
const CONSUMER_KEYS = Object.freeze([
  "decision_log", "spec", "plan", "tasks", "acceptance",
  "implementation", "tests", "review", "delivery",
]);

const text = (value, label) => {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`MATERIAL_INCOMPLETE: scope_revision ${label} is required`);
  return value.trim();
};

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`MATERIAL_INCOMPLETE: scope_revision ${label} must be an object`);
  }
  return value;
}

function stringList(value, label, { allowEmpty = false } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)
      || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new Error(`MATERIAL_INCOMPLETE: scope_revision ${label} must be a non-empty string array`);
  }
  return [...new Set(value.map((item) => item.trim()))];
}

/**
 * Validate the private review material used when a user changes a task while
 * build-code/verify-code is active. This is a review mode on the existing
 * wh-review route, not a public WorkflowHub stage or a new task record.
 */
export function validateScopeRevisionMaterial(value, { stage } = {}) {
  if (!new Set(["build-code", "verify-code"]).has(stage)) {
    throw new Error("MATERIAL_INCOMPLETE: scope_revision is only valid from build-code or verify-code");
  }
  const root = object(value, "root");
  if (root.schema_version !== "workflowhub-scope-revision.v1") throw new Error("MATERIAL_INCOMPLETE: scope_revision schema_version must be workflowhub-scope-revision.v1");
  if (!/^SR-[A-Za-z0-9][A-Za-z0-9._-]*$/.test(text(root.revision_id, "revision_id"))) throw new Error("MATERIAL_INCOMPLETE: scope_revision revision_id must start with SR-");
  if (root.trigger_stage !== stage) throw new Error("MATERIAL_INCOMPLETE: scope_revision trigger_stage must match the current stage");

  const request = object(root.request, "request");
  for (const key of ["original_request", "why_now", "core_goal_relation", "decision", "rationale"]) text(request[key], `request.${key}`);
  stringList(request.risks, "request.risks", { allowEmpty: true });

  if (!RETURN_STAGES.has(text(root.return_stage, "return_stage"))) {
    throw new Error("MATERIAL_INCOMPLETE: scope_revision return_stage must be build-code or verify-code");
  }
  const communication = object(root.communication, "communication");
  if (communication.performed_by !== "main-agent") {
    throw new Error("MATERIAL_INCOMPLETE: scope_revision communication must be performed_by main-agent");
  }
  for (const key of ["talk", "clarify", "grill", "user_response"]) text(communication[key], `communication.${key}`);

  const affected = object(root.affected_ids, "affected_ids");
  for (const key of ID_LIST_KEYS) stringList(affected[key], `affected_ids.${key}`, { allowEmpty: true });
  if (ID_LIST_KEYS.every((key) => affected[key].length === 0)) throw new Error("MATERIAL_INCOMPLETE: scope_revision affected_ids must name at least one existing requirement/design/task ID");

  const impacts = object(root.impacts, "impacts");
  for (const key of IMPACT_KEYS) text(impacts[key], `impacts.${key}`);

  const changes = object(root.material_changes, "material_changes");
  const expectedMaterialFiles = Object.freeze({
    decision_log: "decision-log.md",
    spec: "spec.md",
    plan: "plan.md",
    tasks: "tasks.md",
  });
  for (const key of MATERIAL_KEYS) {
    const change = object(changes[key], `material_changes.${key}`);
    text(change.file, `material_changes.${key}.file`);
    if (change.file !== expectedMaterialFiles[key]) throw new Error(`MATERIAL_INCOMPLETE: material_changes.${key}.file must be ${expectedMaterialFiles[key]}`);
    text(change.change, `material_changes.${key}.change`);
    text(change.reason, `material_changes.${key}.reason`);
  }

  const consumers = object(root.consumer_coverage, "consumer_coverage");
  for (const key of CONSUMER_KEYS) {
    const entry = object(consumers[key], `consumer_coverage.${key}`);
    const status = text(entry.status, `consumer_coverage.${key}.status`);
    if (!new Set(["updated", "unchanged", "deferred", "not_applicable"]).has(status)) {
      throw new Error(`MATERIAL_INCOMPLETE: consumer_coverage.${key}.status is invalid`);
    }
    text(entry.reason, `consumer_coverage.${key}.reason`);
    if (["decision_log", "spec", "plan", "tasks"].includes(key) && status !== "updated") {
      throw new Error(`MATERIAL_INCOMPLETE: consumer_coverage.${key} must be updated for scope_revision`);
    }
  }

  const current = object(root.current_materials, "current_materials");
  const expectedCurrentPaths = Object.freeze({
    decision_log: "decision-log.md",
    spec: "spec.md",
    plan: "plan.md",
    tasks: "tasks.md",
  });
  for (const key of MATERIAL_KEYS) {
    const entry = object(current[key], `current_materials.${key}`);
    if (text(entry.path, `current_materials.${key}.path`) !== expectedCurrentPaths[key]) {
      throw new Error(`MATERIAL_INCOMPLETE: current_materials.${key}.path must be ${expectedCurrentPaths[key]}`);
    }
    if (!HASH.test(text(entry.source_sha256, `current_materials.${key}.source_sha256`))) {
      throw new Error(`MATERIAL_INCOMPLETE: current_materials.${key}.source_sha256 must be sha256`);
    }
    if (!Number.isInteger(entry.source_bytes) || entry.source_bytes <= 0) {
      throw new Error(`MATERIAL_INCOMPLETE: current_materials.${key}.source_bytes must be a positive integer`);
    }
    const excerpt = text(entry.excerpt, `current_materials.${key}.excerpt`);
    if (Buffer.byteLength(excerpt, "utf8") > MAX_EXCERPT_BYTES) {
      throw new Error(`MATERIAL_INCOMPLETE: current_materials.${key}.excerpt exceeds ${MAX_EXCERPT_BYTES} bytes`);
    }
  }
  stringList(root.non_goals_deferred, "non_goals_deferred", { allowEmpty: true });
  stringList(root.constitutional_checks, "constitutional_checks");

  const forbidden = ["provider", "providers", "model", "verdict", "gate", "new_stage", "successor_task", "reopen"];
  const presentForbidden = forbidden.filter((key) => Object.prototype.hasOwnProperty.call(root, key));
  if (presentForbidden.length) throw new Error(`MATERIAL_FORBIDDEN: scope_revision cannot select ${presentForbidden.join(", ")}`);

  return Object.freeze({
    schema_version: root.schema_version,
    revision_id: root.revision_id,
    trigger_stage: root.trigger_stage,
    return_stage: root.return_stage,
    request: Object.freeze({ ...request, risks: Object.freeze(stringList(request.risks, "request.risks", { allowEmpty: true })) }),
    communication: Object.freeze({
      performed_by: communication.performed_by,
      talk: text(communication.talk, "communication.talk"),
      clarify: text(communication.clarify, "communication.clarify"),
      grill: text(communication.grill, "communication.grill"),
      user_response: text(communication.user_response, "communication.user_response"),
    }),
    affected_ids: Object.freeze(Object.fromEntries(ID_LIST_KEYS.map((key) => [key, Object.freeze(stringList(affected[key], `affected_ids.${key}`, { allowEmpty: true }))]))),
    impacts: Object.freeze(Object.fromEntries(IMPACT_KEYS.map((key) => [key, text(impacts[key], `impacts.${key}`)]))),
    material_changes: Object.freeze(Object.fromEntries(MATERIAL_KEYS.map((key) => [key, Object.freeze({
      file: changes[key].file,
      change: text(changes[key].change, `material_changes.${key}.change`),
      reason: text(changes[key].reason, `material_changes.${key}.reason`),
    })]))),
    consumer_coverage: Object.freeze(Object.fromEntries(CONSUMER_KEYS.map((key) => [key, Object.freeze({
      status: text(consumers[key].status, `consumer_coverage.${key}.status`),
      reason: text(consumers[key].reason, `consumer_coverage.${key}.reason`),
    })]))),
    current_materials: Object.freeze(Object.fromEntries(MATERIAL_KEYS.map((key) => [key, Object.freeze({
      path: current[key].path,
      source_sha256: text(current[key].source_sha256, `current_materials.${key}.source_sha256`),
      source_bytes: current[key].source_bytes,
      excerpt: text(current[key].excerpt, `current_materials.${key}.excerpt`),
    })]))),
    non_goals_deferred: Object.freeze(stringList(root.non_goals_deferred, "non_goals_deferred", { allowEmpty: true })),
    constitutional_checks: Object.freeze(stringList(root.constitutional_checks, "constitutional_checks")),
  });
}

export const SCOPE_REVISION_REVIEW_KIND = "scope_revision";
export const SCOPE_REVISION_MATERIAL_KEYS = MATERIAL_KEYS;
export const SCOPE_REVISION_IMPACT_KEYS = IMPACT_KEYS;
