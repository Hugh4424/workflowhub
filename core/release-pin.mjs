import { createHash } from "node:crypto";
import { assertTaskHandle, createTaskKernel } from "./task-handle.mjs";
import { hashCanonical } from "./task-snapshot.mjs";

const HASH = /^[a-f0-9]{64}$/; const OID = /^[a-f0-9]{40}$/;
function sha(raw) { return createHash("sha256").update(raw).digest("hex"); }
function exact(value, keys, label) { if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some((key) => !keys.has(key)) || [...keys].some((key) => !Object.prototype.hasOwnProperty.call(value, key))) throw new TypeError(`${label} must be a closed object`); }
export function validateBuildPlanReleasePin(value, expectedTaskId) {
  exact(value, new Set(["schema_version", "task_id", "build_plan", "checkpoint"]), "release pin");
  exact(value.build_plan, new Set(["accepted_ref", "accepted_raw_hash", "attempt_ref", "attempt_raw_hash"]), "release pin build_plan");
  exact(value.checkpoint, new Set(["ref", "commit_oid", "tree_oid"]), "release pin checkpoint");
  if (value.schema_version !== "release-pin.v1" || typeof value.task_id !== "string" || (expectedTaskId && value.task_id !== expectedTaskId)) throw new Error("release pin identity invalid");
  if (value.build_plan.accepted_ref !== "results/build-plan/accepted.json" || !/^results\/build-plan\/attempt-[0-9]{4}\.json$/.test(value.build_plan.attempt_ref) || !HASH.test(value.build_plan.accepted_raw_hash) || !HASH.test(value.build_plan.attempt_raw_hash)) throw new Error("release pin build-plan binding invalid");
  if (typeof value.checkpoint.ref !== "string" || !value.checkpoint.ref.startsWith("refs/workflowhub/checkpoints/") || !OID.test(value.checkpoint.commit_oid) || !OID.test(value.checkpoint.tree_oid)) throw new Error("release pin checkpoint invalid");
  return Object.freeze(structuredClone(value));
}
export function createBuildPlanReleasePin(taskHandle) {
  if (arguments.length !== 1) throw new TypeError("createBuildPlanReleasePin accepts only TaskHandle");
  const task = assertTaskHandle(taskHandle); const verified = createTaskKernel(task).readAccepted("build-plan"); const accepted = verified.accepted; const attempt = verified.attempt;
  const acceptedRef = "results/build-plan/accepted.json"; const acceptedRaw = task.readRecord(acceptedRef);
  const attemptRef = `results/build-plan/${accepted.attempt_ref}`; const attemptRaw = task.readRecord(attemptRef);
  const checkpoint = accepted.checkpoint;
  const value = validateBuildPlanReleasePin({ schema_version: "release-pin.v1", task_id: task.identity.taskId,
    build_plan: { accepted_ref: acceptedRef, accepted_raw_hash: sha(acceptedRaw), attempt_ref: attemptRef, attempt_raw_hash: sha(attemptRaw) },
    checkpoint: { ref: checkpoint?.ref, commit_oid: checkpoint?.commit_oid, tree_oid: checkpoint?.tree_oid } }, task.identity.taskId);
  return Object.freeze({ ref: "evidence/releases/build-plan.json", hash: hashCanonical(value), value });
}
