import { createHash } from "node:crypto";
export { assertFresh, bindFreshness } from "./freshness.mjs";

const NAME = /^[a-z][a-z0-9-]*$/;
const KEY = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const HASH = /^[a-f0-9]{64}$/;
const TREE = /^[a-f0-9]{40,64}$/;
const RUNTIME_FACTS = new WeakSet();
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function required(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} is required`);
  return value;
}

export function createStageSkillInvocation({
  taskId,
  workflowRunId,
  stage,
  name,
  invocationKey = "default",
  declaredTrigger,
  bundleHash,
  status,
  reason,
  result,
  createdAt = new Date().toISOString(),
}) {
  if (!NAME.test(stage ?? "") || !NAME.test(name ?? "")) throw new TypeError("stage skill invocation identity is invalid");
  if (!KEY.test(invocationKey)) throw new TypeError("stage skill invocation_key is invalid");
  if (!HASH.test(bundleHash ?? "")) throw new TypeError("stage skill invocation bundle_hash is invalid");
  if (!new Set(["executed", "not_invoked", "unavailable"]).has(status)) throw new TypeError("stage skill invocation status is invalid");
  if (status === "executed" && (result === undefined || result === null)) {
    throw new Error(`${stage}/${name}: hostInvoke result/outcome is required`);
  }
  if (status === "executed" && (typeof result !== "object" || Array.isArray(result)
      || typeof result.outcome_ref !== "string" || result.outcome_ref.trim() === ""
      || !HASH.test(result.outcome_hash ?? "") || !TREE.test(result.snapshot_tree ?? ""))) {
    throw new Error(`${stage}/${name}: authenticated outcome_ref/outcome_hash/snapshot_tree result is required`);
  }
  if (status !== "executed" && (typeof reason !== "string" || reason.trim() === "")) {
    throw new Error(`${stage}/${name}: ${status} reason is required`);
  }
  const resultFields = result && typeof result === "object" && !Array.isArray(result) ? result : {};
  const fact = Object.freeze({
    ...resultFields,
    schema_version: "stage-skill-invocation.v1",
    ...(taskId === undefined ? {} : { task_id: required(taskId, "task_id") }),
    ...(workflowRunId === undefined ? {} : { workflow_run_id: required(workflowRunId, "workflow_run_id") }),
    stage,
    name,
    invocation_key: invocationKey,
    declared_trigger: required(declaredTrigger, "declared_trigger"),
    bundle_hash: bundleHash,
    status,
    ...(status === "executed" ? { result_hash: sha256(JSON.stringify(result)) } : { reason }),
    created_at: createdAt,
  });
  RUNTIME_FACTS.add(fact);
  return fact;
}

export function assertRuntimeStageSkillInvocation(fact) {
  if (!fact || typeof fact !== "object" || !RUNTIME_FACTS.has(fact)) {
    throw new Error("runtime-owned stage skill invocation capability required");
  }
  return fact;
}

export function stageSkillInvocationRef(fact) {
  required(fact.task_id, "task_id");
  required(fact.workflow_run_id, "workflow_run_id");
  if (!NAME.test(fact.stage ?? "") || !NAME.test(fact.name ?? "") || !KEY.test(fact.invocation_key ?? "")) {
    throw new TypeError("stage skill invocation ref identity is invalid");
  }
  const identity = sha256(`${fact.task_id}\0${fact.stage}\0${fact.workflow_run_id}`);
  return `evidence/invocations/${identity}/${fact.name}/${fact.invocation_key}.json`;
}

export function serializeStageSkillInvocation(fact) {
  return `${JSON.stringify(fact, null, 2)}\n`;
}
