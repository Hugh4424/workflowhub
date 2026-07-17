import { assertTaskHandle } from "./task-handle.mjs";
import { assertWorkspace } from "./workspace.mjs";
import { hashCanonical, validateTaskSnapshot } from "./task-snapshot.mjs";
import { validatePhaseEvidence } from "./phase-evidence-contract.mjs";
import { validateBuildPlanReleasePin } from "./release-pin.mjs";

const PHASE = /^[a-z0-9][a-z0-9-]*$/;
const HASH = /^[a-f0-9]{64}$/;
const OID = /^[a-f0-9]{40}$/;
const forbidden = new Set(["cwd", "path", "task_path", "record_path", "commit", "range", "diff", "base_commit", "candidate_commit"]);
const canonicalSubjects = new WeakSet();
function branded(record) { canonicalSubjects.add(record); return Object.freeze(record); }
export function assertCanonicalPhaseSubject(value) { if (!canonicalSubjects.has(value)) throw new TypeError("branded canonical phase subject required"); return value; }

function closed(input, allowed, label) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError(`${label} must be an object`);
  const bad = Object.keys(input).filter((key) => forbidden.has(key) || !allowed.has(key));
  if (bad.length) throw new TypeError(`${label} contains forbidden or unknown fields: ${bad.join(", ")}`);
}
function snapshot(task, descriptor, label) {
  closed(descriptor, new Set(["ref", "hash", "tree_oid"]), label);
  if (!/^evidence\/snapshots\/[a-zA-Z0-9._-]+\.json$/.test(descriptor.ref) || !HASH.test(descriptor.hash) || !OID.test(descriptor.tree_oid)) throw new Error(`${label} identity invalid`);
  const value = JSON.parse(task.readRecord(descriptor.ref));
  validateTaskSnapshot(value, { taskId: task.identity.taskId, ref: descriptor.ref, hash: descriptor.hash });
  if (value.tree_oid !== descriptor.tree_oid) throw new Error(`${label} tree drift`);
  return Object.freeze(structuredClone(descriptor));
}
function release(task, descriptor) {
  closed(descriptor, new Set(["ref", "hash"]), "release pin");
  if (!/^evidence\/releases\/[a-zA-Z0-9._-]+\.json$/.test(descriptor.ref) || !HASH.test(descriptor.hash)) throw new Error("release pin identity invalid");
  const value = JSON.parse(task.readRecord(descriptor.ref));
  validateBuildPlanReleasePin(value, task.identity.taskId);
  if (hashCanonical(value) !== descriptor.hash) throw new Error("canonical pinned release mismatch");
  return Object.freeze(structuredClone(descriptor));
}
export function createPhaseSubject(workspace, taskHandle, input = {}) {
  assertWorkspace(workspace); const task = assertTaskHandle(taskHandle);
  closed(input, new Set(["phase_id", "release", "baseline", "implementation", "allowed_files", "upstream"]), "phase subject input");
  if (!PHASE.test(input.phase_id ?? "")) throw new TypeError("phase_id is invalid");
  if (!Array.isArray(input.allowed_files) || input.allowed_files.some((p) => typeof p !== "string" || p.startsWith("/") || p.split("/").includes(".."))) throw new TypeError("allowed_files must be repo-relative paths");
  const value = {
    schema_version: "1.0.0", phase_id: input.phase_id, task_id: task.identity.taskId,
    release: release(task, input.release), baseline: snapshot(task, input.baseline, "baseline snapshot"),
    implementation: snapshot(task, input.implementation, "implementation snapshot"),
    allowed_files: [...new Set(input.allowed_files)].sort(), upstream: input.upstream === null ? null : structuredClone(input.upstream),
  };
  validatePhaseEvidence("subject", value);
  release(task, value.release);
  return branded({ ref: `evidence/phases/${input.phase_id}/subject.json`, hash: hashCanonical(value), value: Object.freeze(value) });
}
export function readPhaseSubject(taskHandle, phaseId, workspace) {
  const task = assertTaskHandle(taskHandle); if (!PHASE.test(phaseId ?? "")) throw new TypeError("phase_id is invalid");
  const ref = `evidence/phases/${phaseId}/subject.json`; const raw = task.readRecord(ref); const value = JSON.parse(raw);
  if (value.phase_id !== phaseId || value.task_id !== task.identity.taskId || value.schema_version !== "1.0.0") throw new Error("phase subject identity mismatch");
  validatePhaseEvidence("subject", value);
  snapshot(task, value.baseline, "baseline snapshot"); snapshot(task, value.implementation, "implementation snapshot");
  if (workspace) { const root = assertWorkspace(workspace).worktreeRoot; validateTaskSnapshot(JSON.parse(task.readRecord(value.baseline.ref)), { taskId: task.identity.taskId, ref: value.baseline.ref, hash: value.baseline.hash, workspace }); validateTaskSnapshot(JSON.parse(task.readRecord(value.implementation.ref)), { taskId: task.identity.taskId, ref: value.implementation.ref, hash: value.implementation.hash, workspace }); void root; }
  return branded({ ref, hash: hashCanonical(value), value: Object.freeze(value) });
}
